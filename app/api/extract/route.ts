import { NextRequest, NextResponse } from 'next/server';
import { JSDOM } from 'jsdom';
import { Readability } from '@mozilla/readability';
import xss, { getDefaultWhiteList } from 'xss';

const BROWSER_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

/**
 * Rewrite relative URLs in extracted HTML to absolute so images/links
 * resolve correctly when rendered outside the original domain.
 */
function makeUrlsAbsolute(html: string, baseUrl: string): string {
  const base = new URL(baseUrl);
  return html
    // src="..." — covers img, video, audio, source
    .replace(/(\ssrc=")(?!https?:\/\/|data:|\/\/|#)([^"]*")/gi, (_, attr, rest) => {
      try { return `${attr}${new URL(rest.slice(0, -1), base).href}"`; } catch { return _ ; }
    })
    // srcset="..." — covers responsive images
    .replace(/(\ssrcset=")([^"]+)(")/gi, (_, open, srcset, close) => {
      const rewritten = srcset.replace(/(https?:\/\/[^\s,]+|[^\s,]+)/g, (part: string) => {
        if (/^https?:\/\//.test(part) || /^data:/.test(part)) return part;
        try { return new URL(part, base).href; } catch { return part; }
      });
      return `${open}${rewritten}${close}`;
    })
    // href="..." — make internal links absolute so they open correctly
    .replace(/(\shref=")(?!https?:\/\/|data:|\/\/|#|mailto:)([^"]*")/gi, (_, attr, rest) => {
      try { return `${attr}${new URL(rest.slice(0, -1), base).href}"`; } catch { return _; }
    });
}

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 });
  }

  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': BROWSER_UA },
      redirect: 'follow',
    });

    if (!response.ok) {
      return NextResponse.json({ error: `Failed to fetch URL: ${response.statusText}` }, { status: response.status });
    }

    const html = await response.text();

    // Scrape OG tags
    const ogImageMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)
      || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
    const ogDescMatch = html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i)
      || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:description["']/i);
    const ogImage = ogImageMatch?.[1] ?? null;
    const ogDescription = ogDescMatch?.[1] ?? null;

    // Parse with Readability
    const doc = new JSDOM(html, { url });
    const reader = new Readability(doc.window.document);
    const article = reader.parse();

    if (!article?.content) {
      return NextResponse.json({ error: 'Could not parse article from this page', ogImage, ogDescription }, { status: 422 });
    }

    // Rewrite relative URLs → absolute before sanitising
    const absoluteHtml = makeUrlsAbsolute(article.content, url);

    // Sanitise — permissive whitelist that preserves rich reading content
    const cleanHtml = xss(absoluteHtml, {
      whiteList: {
        ...getDefaultWhiteList(),
        // Text structure
        p: ['class', 'style', 'dir'],
        div: ['class', 'style'],
        span: ['class', 'style'],
        section: ['class'],
        article: ['class'],
        // Headings
        h1: ['class', 'id'], h2: ['class', 'id'], h3: ['class', 'id'],
        h4: ['class', 'id'], h5: ['class', 'id'], h6: ['class', 'id'],
        // Lists
        ul: ['class'], ol: ['class', 'start'], li: ['class'],
        // Inline
        strong: [], b: [], em: [], i: [], u: [], s: [], mark: [],
        abbr: ['title'], cite: [], time: ['datetime'],
        sup: ['class'], sub: ['class'],
        // Media
        img: ['src', 'srcset', 'sizes', 'alt', 'title', 'width', 'height', 'loading', 'decoding', 'class'],
        picture: [],
        source: ['src', 'srcset', 'sizes', 'type', 'media'],
        figure: ['class'],
        figcaption: ['class'],
        // Links
        a: ['href', 'title', 'target', 'rel', 'class'],
        // Code
        code: ['class'], pre: ['class'],
        // Quotes
        blockquote: ['class', 'cite'],
        // Tables
        table: ['class'], thead: [], tbody: [], tfoot: [],
        tr: [], th: ['class', 'colspan', 'rowspan', 'scope'],
        td: ['class', 'colspan', 'rowspan'],
        caption: [],
        // Layout
        br: [], hr: ['class'],
        // Details
        details: [], summary: [],
      },
    });

    return NextResponse.json({
      title: article.title,
      byline: article.byline,
      dir: article.dir,
      content: cleanHtml,
      textContent: article.textContent,
      length: article.length,
      excerpt: article.excerpt,
      siteName: article.siteName,
      ogImage,
      ogDescription,
    });

  } catch (error: any) {
    console.error('Extraction error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error during extraction' }, { status: 500 });
  }
}
