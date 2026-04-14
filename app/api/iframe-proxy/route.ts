import { NextRequest } from 'next/server';

const BROWSER_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

const STRIP_HEADERS = new Set([
  'x-frame-options',
  'content-security-policy',
  'content-security-policy-report-only',
]);

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');
  if (!url) return new Response('Missing url parameter', { status: 400 });

  try {
    const upstream = await fetch(url, {
      headers: { 'User-Agent': BROWSER_UA },
      redirect: 'follow',
    });

    if (!upstream.ok) {
      return new Response(`Upstream error: ${upstream.status}`, { status: upstream.status });
    }

    const contentType = upstream.headers.get('content-type') || '';
    const isHtml = contentType.includes('text/html');

    // Build response headers — strip framing restrictions
    const responseHeaders = new Headers();
    upstream.headers.forEach((value, key) => {
      if (!STRIP_HEADERS.has(key.toLowerCase())) {
        responseHeaders.set(key, value);
      }
    });
    responseHeaders.set('Content-Type', contentType || 'text/html; charset=utf-8');
    responseHeaders.set('X-Frame-Options', 'ALLOWALL');

    // For HTML responses: inject <base href="..."> so all relative URLs
    // (CSS, JS, images, links) resolve against the original domain, not localhost.
    if (isHtml) {
      const html = await upstream.text();
      const origin = new URL(url).origin;

      // Inject <base> right after <head> (or at the very start if no <head>)
      const patched = html.includes('<head')
        ? html.replace(/(<head[^>]*>)/i, `$1<base href="${origin}/">`)
        : `<base href="${origin}/">\n` + html;

      responseHeaders.set('Content-Length', Buffer.byteLength(patched, 'utf-8').toString());
      return new Response(patched, { status: upstream.status, headers: responseHeaders });
    }

    // Non-HTML (images, CSS, JS, fonts) — stream as-is
    return new Response(upstream.body, { status: upstream.status, headers: responseHeaders });

  } catch (err: any) {
    return new Response(`Proxy error: ${err.message}`, { status: 500 });
  }
}
