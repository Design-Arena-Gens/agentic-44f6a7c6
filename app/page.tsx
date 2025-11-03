"use client";

import { useState } from 'react';

type ScrapeResponse = {
  items: string[];
  meta: {
    url: string;
    selector: string;
    attribute?: string | null;
    count: number;
  }
}

export default function HomePage() {
  const [url, setUrl] = useState<string>('https://example.com');
  const [selector, setSelector] = useState<string>('h1, title');
  const [mode, setMode] = useState<'text' | 'html' | 'attr'>('text');
  const [attribute, setAttribute] = useState<string>('href');
  const [maxResults, setMaxResults] = useState<number>(10);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<string[]>([]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResults([]);
    try {
      const res = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url,
          selector,
          mode,
          attribute: mode === 'attr' ? attribute : undefined,
          maxResults
        })
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Request failed with ${res.status}`);
      }
      const data: ScrapeResponse = await res.json();
      setResults(data.items);
    } catch (err: any) {
      setError(err?.message || 'Unexpected error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card">
      <form className="form" onSubmit={onSubmit}>
        <div className="field">
          <label className="label">Target URL</label>
          <input className="input" type="url" required placeholder="https://..." value={url} onChange={e => setUrl(e.target.value)} />
          <div className="hint">Example: https://news.ycombinator.com</div>
        </div>
        <div className="field">
          <label className="label">CSS Selector</label>
          <input className="input" type="text" required placeholder=".item a.title" value={selector} onChange={e => setSelector(e.target.value)} />
          <div className="hint">Use any valid CSS selector. Example: a.storylink</div>
        </div>
        <div className="field">
          <label className="label">Extraction Mode</label>
          <select className="select" value={mode} onChange={e => setMode(e.target.value as any)}>
            <option value="text">Text</option>
            <option value="html">HTML</option>
            <option value="attr">Attribute</option>
          </select>
          {mode === 'attr' && (
            <input className="input" type="text" placeholder="attribute name (e.g., href, src)" value={attribute} onChange={e => setAttribute(e.target.value)} />
          )}
        </div>
        <div className="field">
          <label className="label">Max Results</label>
          <input className="input" type="number" min={1} max={200} value={maxResults} onChange={e => setMaxResults(Number(e.target.value))} />
        </div>
        <div>
          <button className="button" type="submit" disabled={loading}>{loading ? 'Scraping?' : 'Scrape'}</button>
        </div>
      </form>

      {error && (
        <div className="result" style={{ borderColor: '#fecaca', background: '#fef2f2' }}>
          {error}
        </div>
      )}

      {results.length > 0 && (
        <div className="results">
          {results.map((r, i) => (
            <div key={i} className="result">{r}</div>
          ))}
        </div>
      )}
    </div>
  );
}
