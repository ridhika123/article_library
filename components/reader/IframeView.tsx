"use client";
import { useRef, useState } from "react";
import { Article } from "@/components/ArticleCard";
import { MetadataCard } from "@/components/reader/MetadataCard";
import { RotateCw, ExternalLink } from "lucide-react";

interface IframeViewProps {
  article: Article;
}

type LoadState = 'loading' | 'loaded' | 'failed';
type Strategy = 'direct' | 'proxy' | 'failed';

export function IframeView({ article }: IframeViewProps) {
  const [strategy, setStrategy] = useState<Strategy>('direct');
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [reloadKey, setReloadKey] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const proxyUrl = article.url
    ? `/api/iframe-proxy?url=${encodeURIComponent(article.url)}`
    : null;
  const directUrl = article.url ?? null;

  const currentSrc = strategy === 'direct' ? directUrl : strategy === 'proxy' ? proxyUrl : null;

  const domain = article.url
    ? (() => { try { return new URL(article.url!).hostname.replace(/^www\./, ''); } catch { return article.url!; } })()
    : '';

  const handleLoad = () => {
    if (strategy === 'direct') {
      // Check if the page actually loaded content, or was silently blocked.
      // Cross-origin access throws — that means REAL content loaded (success).
      // Same-origin empty doc = frame was busted or blocked silently.
      try {
        const doc = iframeRef.current?.contentDocument;
        const isEmpty = !doc || (doc.body && doc.body.innerHTML.trim() === '');
        if (isEmpty) {
          // Silent block — try proxy
          setStrategy('proxy');
          setLoadState('loading');
          return;
        }
      } catch {
        // Cross-origin exception = real content loaded successfully
      }
    }
    setLoadState('loaded');
  };

  const handleError = () => {
    if (strategy === 'direct') {
      // Direct blocked — try proxy
      setStrategy('proxy');
      setLoadState('loading');
    } else {
      // Proxy also failed
      setStrategy('failed');
      setLoadState('failed');
    }
  };

  const reload = () => {
    setStrategy('direct');
    setLoadState('loading');
    setReloadKey(k => k + 1);
  };

  if (strategy === 'failed') {
    return (
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 dark:bg-amber-950/20 border-b border-amber-200 dark:border-amber-800/30 flex-shrink-0">
          <span className="text-[13px] text-amber-700 dark:text-amber-400 flex-1">
            <strong>{domain}</strong> can't be embedded.
          </span>
          <button onClick={reload} className="w-7 h-7 rounded-md flex items-center justify-center text-amber-600 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors" title="Try again">
            <RotateCw className="w-3.5 h-3.5" />
          </button>
          {article.url && (
            <a href={article.url} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/50 bg-blue-50 dark:bg-blue-950/30 hover:bg-blue-100 transition-colors">
              <ExternalLink className="w-3 h-3" />
              Open in browser
            </a>
          )}
        </div>
        <div className="flex-1 overflow-y-auto flex items-center justify-center p-8">
          <MetadataCard article={article} embedded />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Browser chrome */}
      <div className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 dark:bg-[#111] border-b border-slate-200 dark:border-white/5 flex-shrink-0">
        <div className="flex-1 flex items-center gap-2 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-1.5 min-w-0">
          {domain && (
            <img
              src={`https://www.google.com/s2/favicons?domain=${domain}&sz=16`}
              alt="" className="w-4 h-4 flex-shrink-0 rounded-sm"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          )}
          <span className="text-[12px] text-slate-500 dark:text-slate-400 font-mono truncate">
            {article.url || domain}
          </span>
        </div>

        <button onClick={reload}
          className="w-7 h-7 rounded-md flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors flex-shrink-0"
          title="Reload">
          <RotateCw className={`w-3.5 h-3.5 ${loadState === 'loading' ? 'animate-spin' : ''}`} />
        </button>

        {article.url && (
          <a href={article.url} target="_blank" rel="noopener noreferrer"
            title="Open in browser"
            className="w-7 h-7 rounded-md flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors flex-shrink-0">
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
      </div>

      {/* Iframe */}
      <div className="flex-1 relative min-h-0">
        {loadState === 'loading' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-white dark:bg-[#0a0a0a] z-10 pointer-events-none">
            <div className="w-5 h-5 border-2 border-slate-200 dark:border-slate-700 border-t-blue-500 rounded-full animate-spin" />
            <span className="text-[12px] text-slate-400">{strategy === 'proxy' ? 'Trying alternate method…' : domain}</span>
          </div>
        )}

        {currentSrc && (
          <iframe
            key={`${reloadKey}-${strategy}`}
            ref={iframeRef}
            src={currentSrc}
            className="absolute inset-0 w-full h-full border-0"
            onLoad={handleLoad}
            onError={handleError}
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
            title={article.title}
            allow="fullscreen"
          />
        )}
      </div>
    </div>
  );
}
