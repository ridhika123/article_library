import { NextRequest, NextResponse } from 'next/server';

const BROWSER_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
  }

  try {
    const oembedUrl = `https://publish.twitter.com/oembed?url=${encodeURIComponent(url)}&omit_script=true`;
    const res = await fetch(oembedUrl, {
      headers: { 'User-Agent': BROWSER_UA },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `oEmbed fetch failed: ${res.status}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json({
      authorName: data.author_name ?? null,
      authorUrl: data.author_url ?? null,
      html: data.html ?? null,
      url: data.url ?? url,
      providerName: data.provider_name ?? 'X',
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
