import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export const runtime = 'nodejs';

function isValidHttpUrl(input: string): boolean {
  try {
    const u = new URL(input);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const url: string | undefined = body.url;
    const selector: string | undefined = body.selector;
    const mode: 'text' | 'html' | 'attr' = body.mode ?? 'text';
    const attribute: string | undefined = body.attribute;
    const maxResults: number = Math.max(1, Math.min(Number(body.maxResults ?? 10), 200));

    if (!url || !isValidHttpUrl(url)) {
      return NextResponse.json({ error: 'Invalid or missing url' }, { status: 400 });
    }
    if (!selector || typeof selector !== 'string' || selector.trim().length === 0) {
      return NextResponse.json({ error: 'Invalid or missing selector' }, { status: 400 });
    }
    if (mode === 'attr' && (!attribute || attribute.trim().length === 0)) {
      return NextResponse.json({ error: 'Attribute name required for attr mode' }, { status: 400 });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; MinimalScraper/1.0; +https://vercel.app)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9'
      },
      signal: controller.signal,
      redirect: 'follow',
      cache: 'no-store',
    }).catch((err) => {
      clearTimeout(timeout);
      throw err;
    });

    clearTimeout(timeout);

    if (!res.ok) {
      return NextResponse.json({ error: `Upstream responded ${res.status}` }, { status: 502 });
    }

    const html = await res.text();
    const $ = cheerio.load(html);

    const items: string[] = [];
    $(selector).each((i, el) => {
      if (items.length >= maxResults) return false;
      if (mode === 'html') {
        items.push($(el).html() ?? '');
      } else if (mode === 'attr') {
        items.push($(el).attr(attribute!) ?? '');
      } else {
        const text = $(el).text().trim().replace(/\s+/g, ' ');
        items.push(text);
      }
    });

    return NextResponse.json({
      items,
      meta: { url, selector, attribute: mode === 'attr' ? attribute ?? null : null, count: items.length }
    });
  } catch (err: any) {
    const message = err?.name === 'AbortError' ? 'Request timed out' : (err?.message || 'Unknown server error');
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
