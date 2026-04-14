"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { Article } from "@/components/ArticleCard";
import { XPostCard } from "@/components/reader/XPostCard";
import { X, ExternalLink, RotateCw } from "lucide-react";

interface ReaderSheetProps {
  article: Article | null;
  onClose: () => void;
}

export function ReaderSheet({ article, onClose }: ReaderSheetProps) {
  const [loading, setLoading] = useState(true);
  const [blocked, setBlocked] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isOpen = !!article;

  const domain = (() => {
    try { return new URL(article?.url ?? '').hostname.replace(/^www\./, ''); }
    catch { return ''; }
  })();

  // Reset on new article
  useEffect(() => {
    if (article) {
      setLoading(true);
      setBlocked(false);
      setReloadKey(k => k + 1);
    }
  }, [article?.id]);

  // Body scroll lock
  useEffect(() => {
    document.body.style.overflow = article ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [article]);

  // Escape key
  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', fn);
    return () => document.removeEventListener('keydown', fn);
  }, [onClose]);

  // Safety timeout — only triggers if iframe never fires onLoad or onError
  useEffect(() => {
    if (!loading) return;
    timeoutRef.current = setTimeout(() => {
      // After 30s with no response at all, just clear the spinner
      setLoading(false);
    }, 30000);
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
  }, [loading, reloadKey]);

  const handleLoad = () => {
    // Just clear the loading spinner — show whatever the iframe rendered.
    // We cannot reliably detect X-Frame-Options blocking via contentDocument in
    // Chrome (it returns null for cross-origin, not throws), so we don't try.
    // The ↗ button in the toolbar is the always-available escape hatch.
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setLoading(false);
  };

  const handleError = () => {
    // Genuine network error (DNS fail, connection refused, etc.)
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setLoading(false);
    setBlocked(true);
  };

  const reload = () => {
    setLoading(true);
    setBlocked(false);
    setReloadKey(k => k + 1);
  };

  // Chrome-less popup — closest web equivalent to an in-app browser overlay
  const openPopup = useCallback(() => {
    if (!article?.url) return;
    window.open(
      article.url,
      `rs_${article.id}`,
      `width=${Math.min(1100, window.screen.width - 100)},height=${Math.min(800, window.screen.height - 100)},left=50,top=50,menubar=no,toolbar=no,location=no,status=no,scrollbars=yes,resizable=yes`
    );
  }, [article?.url, article?.id]);

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        aria-hidden
        className={`fixed inset-0 z-40 bg-black/25 backdrop-blur-[2px] transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      />

      {/* Sheet — slides up from bottom, library stays visible behind */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={article?.title}
        className="fixed inset-x-0 bottom-0 z-50 flex flex-col bg-white dark:bg-[#0f0f0f] rounded-t-2xl shadow-2xl overflow-hidden transition-transform duration-300 ease-out"
        style={{
          height: 'calc(100dvh - 48px)',
          transform: isOpen ? 'translateY(0)' : 'translateY(100%)',
        }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 rounded-full bg-slate-200 dark:bg-white/10" />
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-100 dark:border-white/[0.06] flex-shrink-0">
          <button onClick={onClose} title="Close"
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors flex-shrink-0">
            <X className="w-4 h-4" />
          </button>

          <div className="flex-1 flex items-center gap-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-1.5 min-w-0 overflow-hidden">
            {domain && (
              <img src={`https://www.google.com/s2/favicons?domain=${domain}&sz=16`} alt=""
                className="w-4 h-4 flex-shrink-0 rounded-sm"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            )}
            <span className="text-[12px] text-slate-400 dark:text-slate-500 font-mono truncate">
              {article?.url || domain}
            </span>
          </div>

          <button onClick={reload} title="Reload"
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors flex-shrink-0">
            <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {article?.url && (
            <button onClick={openPopup} title="Open in browser window"
              className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors flex-shrink-0">
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 relative min-h-0 overflow-hidden">

          {/* X Post */}
          {article?.tier === 'xpost' && (
            <div className="absolute inset-0 overflow-y-auto">
              <XPostCard article={article} oembed={article.cachedOEmbed} />
            </div>
          )}

          {article?.tier !== 'xpost' && (
            <>
              {/* Loading */}
              {loading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-white dark:bg-[#0f0f0f] z-20 pointer-events-none">
                  <div className="w-5 h-5 border-2 border-slate-200 dark:border-white/10 border-t-blue-500 rounded-full animate-spin" />
                  <span className="text-[12px] text-slate-400">{domain}</span>
                </div>
              )}

              {/* Network error (DNS fail, etc.) */}
              {blocked && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 p-8 bg-white dark:bg-[#0f0f0f] z-10">
                  <div className="text-center max-w-sm">
                    <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-white/8 flex items-center justify-center mx-auto mb-4">
                      {domain && (
                        <img src={`https://www.google.com/s2/favicons?domain=${domain}&sz=32`} alt=""
                          className="w-7 h-7 rounded"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                      )}
                    </div>
                    <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-[17px] leading-snug mb-2">
                      {article?.title}
                    </h3>
                    <p className="text-[13px] text-slate-400">{domain}</p>
                    <p className="text-[12px] text-slate-300 dark:text-slate-600 mt-1">
                      Couldn't load this page.
                    </p>
                  </div>
                  <div className="w-full max-w-[260px] space-y-3">
                    <button onClick={openPopup}
                      className="w-full py-3 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[14px] font-semibold hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors flex items-center justify-center gap-2">
                      <ExternalLink className="w-4 h-4" />
                      Open {domain}
                    </button>
                    <p className="text-center text-[11px] text-slate-400 dark:text-slate-600">
                      Opens a popup — close it to return here
                    </p>
                  </div>
                </div>
              )}

              {/* Iframe — always show after load; ↗ button is the escape hatch for blocked sites */}
              {article?.url && (
                <iframe
                  key={reloadKey}
                  ref={iframeRef}
                  src={article.url}
                  onLoad={handleLoad}
                  onError={handleError}
                  sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-downloads"
                  allow="fullscreen autoplay"
                  title={article.title}
                  className={`absolute inset-0 w-full h-full border-0 transition-opacity duration-300 ${!loading ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                />
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
