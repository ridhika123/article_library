import { NextRequest, NextResponse } from 'next/server';
import xss from 'xss';

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
const FETCH_OPTS = (ms = 8000) => ({ headers: { 'User-Agent': UA }, redirect: 'follow' as const, signal: AbortSignal.timeout(ms) });

// ── XML helpers ──────────────────────────────────────────────────────────────

function grabTag(xml: string, tag: string): string {
  // Handles CDATA and plain text, multiple namespace variants
  const escaped = tag.replace(':', '\\:');
  const cdata = new RegExp(`<${escaped}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${escaped}>`, 'i').exec(xml);
  if (cdata) return cdata[1].trim();
  const plain = new RegExp(`<${escaped}[^>]*>([\\s\\S]*?)<\\/${escaped}>`, 'i').exec(xml);
  return plain ? plain[1].trim() : '';
}

function grabAttr(xml: string, tag: string, attr: string): string {
  const re = new RegExp(`<${tag}[^>]+${attr}=["']([^"']+)["']`, 'i').exec(xml);
  return re ? re[1] : '';
}

// ── Parse RSS / Atom entries ─────────────────────────────────────────────────

interface RssItem {
  title: string;
  link: string;
  guid: string;
  content: string;   // full HTML body
  excerpt: string;   // short description
  author: string;
}

function parseEntries(xml: string, feedUrl: string): RssItem[] {
  const isAtom = /<feed[\s>]/i.test(xml);
  const entryTag = isAtom ? 'entry' : 'item';
  const re = new RegExp(`<${entryTag}[\\s>]([\\s\\S]*?)<\\/${entryTag}>`, 'gi');
  const items: RssItem[] = [];
  let m: RegExpExecArray | null;

  while ((m = re.exec(xml)) !== null) {
    const raw = m[1];

    // Link: Atom uses <link href="..."/>, RSS uses <link>...</link>
    const link = isAtom
      ? (grabAttr(raw, 'link', 'href') || grabTag(raw, 'link'))
      : grabTag(raw, 'link');

    // Content: prefer full HTML
    const content =
      grabTag(raw, 'content:encoded') ||
      grabTag(raw, 'content') ||
      grabTag(raw, 'description') ||
      '';

    items.push({
      title: grabTag(raw, 'title'),
      link: link.trim(),
      guid: grabTag(raw, 'guid'),
      content,
      excerpt: grabTag(raw, 'description') || grabTag(raw, 'summary') || '',
      author: grabTag(raw, 'dc:creator') || grabTag(raw, 'author') || '',
    });
  }
  return items;
}

// ── Match an item to the requested URL ───────────────────────────────────────

function matchItem(items: RssItem[], targetUrl: string): RssItem | null {
  try {
    const target = new URL(targetUrl);
    const targetPath = target.pathname.toLowerCase();

    // Normalise: the URL hash at the end of Medium slugs (last hyphenated segment)
    const slugHash = targetPath.split('-').pop() ?? '';

    for (const item of items) {
      const itemUrl = item.link || item.guid;
      if (!itemUrl) continue;

      try {
        const iu = new URL(itemUrl);

        // Exact pathname match
        if (iu.pathname.toLowerCase() === targetPath) return item;

        // Medium: match the unique trailing hash in the slug
        if (slugHash.length >= 8 && iu.pathname.toLowerCase().includes(slugHash)) return item;

        // Fuzzy: last path segment overlap (excluding query/hash)
        const targetSlug = targetPath.split('/').filter(Boolean).pop() ?? '';
        const itemSlug = iu.pathname.split('/').filter(Boolean).pop() ?? '';
        if (targetSlug && itemSlug && targetSlug.includes(itemSlug.slice(0, 20))) return item;
      } catch { /* invalid URL in item */ }
    }
  } catch { /* invalid targetUrl */ }
  return null;
}

// ── Discover the feed URL for a page ─────────────────────────────────────────

async function discoverFeed(pageUrl: string, html: string): Promise<string | null> {
  const base = new URL(pageUrl);

  // 1. <link rel="alternate" type="application/...+xml" href="..."> in HTML
  const alternates = [...html.matchAll(/<link[^>]+rel=["']alternate["'][^>]*>/gi)];
  for (const a of alternates) {
    if (/application\/(rss|atom)\+xml/i.test(a[0])) {
      const href = /href=["']([^"']+)["']/i.exec(a[0])?.[1];
      if (href) { try { return new URL(href, base).href; } catch {} }
    }
  }

  // 2. Publication-specific patterns
  const candidates: string[] = [];

  if (/medium\.com|towardsdatascience\.com|betterhumans\.pub/i.test(base.hostname)) {
    // Medium-style: /feed/@author or /feed/publication-name
    const pathParts = base.pathname.split('/').filter(Boolean);
    if (pathParts[0]?.startsWith('@')) {
      candidates.push(`https://medium.com/feed/${pathParts[0]}`);
    } else {
      candidates.push(`https://medium.com/feed/${base.hostname.split('.')[0]}`);
      candidates.push(`https://${base.hostname}/feed`);
    }
  } else if (base.hostname.endsWith('.substack.com')) {
    candidates.push(`https://${base.hostname}/feed`);
  } else {
    // Generic: try common paths
    candidates.push(
      new URL('/feed', base).href,
      new URL('/feed.xml', base).href,
      new URL('/rss.xml', base).href,
      new URL('/atom.xml', base).href,
      new URL('/rss', base).href,
    );
  }

  for (const url of candidates) {
    try {
      const r = await fetch(url, FETCH_OPTS(5000));
      if (!r.ok) continue;
      const text = await r.text();
      if (/<(rss|feed|channel)\b/i.test(text)) return url;
    } catch { /* try next */ }
  }

  return null;
}

// ── Rewrite relative URLs (same helper as extract route) ─────────────────────

function makeAbsolute(html: string, base: string): string {
  const baseUrl = new URL(base);
  return html
    .replace(/(\ssrc=")(?!https?:\/\/|data:|\/\/)([^"]+)(")/gi, (_, a, p, c) => {
      try { return `${a}${new URL(p, baseUrl).href}${c}`; } catch { return _; }
    })
    .replace(/(\shref=")(?!https?:\/\/|data:|\/\/|#|mailto:)([^"]+)(")/gi, (_, a, p, c) => {
      try { return `${a}${new URL(p, baseUrl).href}${c}`; } catch { return _; }
    });
}

// ── Main handler ─────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url');
  if (!url) return NextResponse.json({ found: false, error: 'Missing url' }, { status: 400 });

  try {
    // Fetch the page to discover its feed link
    const pageRes = await fetch(url, FETCH_OPTS());
    if (!pageRes.ok) return NextResponse.json({ found: false, error: `Page fetch failed: ${pageRes.status}` });
    const html = await pageRes.text();

    const feedUrl = await discoverFeed(url, html);
    if (!feedUrl) return NextResponse.json({ found: false, error: 'No RSS/Atom feed found' });

    // Fetch and parse the feed
    const feedRes = await fetch(feedUrl, FETCH_OPTS());
    if (!feedRes.ok) return NextResponse.json({ found: false, error: 'Feed fetch failed' });
    const feedXml = await feedRes.text();

    const items = parseEntries(feedXml, feedUrl);
    const item = matchItem(items, url);

    if (!item?.content || item.content.trim().length < 200) {
      return NextResponse.json({ found: false, error: 'Article not found or content too short', feedUrl });
    }

    // Sanitise and make URLs absolute
    const cleanContent = xss(makeAbsolute(item.content, url), {
      whiteList: {
        p: ['class'], div: ['class'], span: ['class'],
        h1: ['id'], h2: ['id'], h3: ['id'], h4: ['id'], h5: ['id'], h6: ['id'],
        ul: [], ol: ['start'], li: [],
        strong: [], b: [], em: [], i: [], u: [], s: [], mark: [],
        img: ['src', 'srcset', 'alt', 'title', 'width', 'height'],
        figure: [], figcaption: [],
        a: ['href', 'title', 'target', 'rel'],
        blockquote: ['cite'], code: ['class'], pre: ['class'],
        table: [], thead: [], tbody: [], tr: [], th: ['colspan', 'rowspan'], td: ['colspan', 'rowspan'],
        br: [], hr: [],
      },
    });

    return NextResponse.json({
      found: true,
      feedUrl,
      title: item.title,
      content: cleanContent,
      author: item.author,
      excerpt: item.excerpt,
    });

  } catch (e: any) {
    return NextResponse.json({ found: false, error: e.message }, { status: 500 });
  }
}
