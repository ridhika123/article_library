import { NextRequest, NextResponse } from 'next/server';

const BROWSER_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

function isXUrl(url: string): boolean {
  try {
    const { hostname } = new URL(url);
    return hostname === 'x.com' || hostname === 'twitter.com' ||
           hostname === 'www.x.com' || hostname === 'www.twitter.com';
  } catch { return false; }
}

async function fetchOEmbed(url: string) {
  const oembedUrl = `https://publish.twitter.com/oembed?url=${encodeURIComponent(url)}&omit_script=true`;
  const res = await fetch(oembedUrl, { headers: { 'User-Agent': BROWSER_UA } });
  if (!res.ok) return null;
  const data = await res.json();
  return {
    authorName: data.author_name,
    authorUrl: data.author_url,
    html: data.html,
    url: data.url,
  };
}

function scrapeOgTags(html: string) {
  const ogImageMatch =
    html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ||
    html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
  const ogDescMatch =
    html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i) ||
    html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:description["']/i);
  return {
    ogImage: ogImageMatch?.[1] ?? null,
    ogDescription: ogDescMatch?.[1] ?? null,
  };
}

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');
  if (!url) {
    return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 });
  }

  // ── X / Twitter posts: fetch oEmbed ──────────────────────────────────────
  if (isXUrl(url)) {
    try {
      const oembed = await fetchOEmbed(url);
      return NextResponse.json({ tier: 'xpost', oembed });
    } catch {
      return NextResponse.json({ tier: 'xpost', oembed: null });
    }
  }

  // ── Everything else: Tier 2 (in-app browser) ─────────────────────────────
  // Scrape OG tags as fallback info in case the iframe fails at runtime.
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': BROWSER_UA },
      redirect: 'follow',
    });
    if (res.ok) {
      const html = await res.text();
      const { ogImage, ogDescription } = scrapeOgTags(html);
      return NextResponse.json({ tier: 'tier2', ogImage, ogDescription });
    }
  } catch {
    // If we can't even fetch, still try tier2 — the iframe proxy might succeed
  }

  return NextResponse.json({ tier: 'tier2', ogImage: null, ogDescription: null });
}
