"use client";
import { Article } from "@/components/ArticleCard";
import { ExternalLink } from "lucide-react";

interface MetadataCardProps {
  article: Article;
  embedded?: boolean; // true when rendered inside IframeView fallback
}

export function MetadataCard({ article, embedded = false }: MetadataCardProps) {
  const description = article.ogDescription || article.title;
  const source = article.source || (article.url ? (() => {
    try { return new URL(article.url!).hostname.replace(/^www\./, ''); } catch { return ''; }
  })() : '');

  return (
    <div className={`w-full max-w-[520px] rounded-2xl overflow-hidden border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1c1c1e] shadow-xl ${embedded ? '' : 'mx-auto'}`}>
      {/* OG Image or placeholder */}
      <div className="relative w-full h-44 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 overflow-hidden">
        {article.ogImage ? (
          <img
            src={article.ogImage}
            alt={article.title}
            className="w-full h-full object-cover"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-5xl font-black text-slate-300 dark:text-slate-600 tracking-tighter font-serif opacity-60">
              {(article.source || article.title).slice(0, 2).toUpperCase()}
            </span>
          </div>
        )}
        {source && (
          <div className="absolute top-3 left-3 bg-white/90 dark:bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full text-[11px] font-bold text-slate-600 dark:text-slate-300">
            {source}
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-6">
        <h2 className="font-serif text-[20px] font-semibold leading-[1.3] text-slate-900 dark:text-slate-50 mb-3">
          {article.title}
        </h2>
        {description && description !== article.title && (
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-5 line-clamp-3">
            {description}
          </p>
        )}

        <div className="flex items-center gap-2 mb-5 flex-wrap">
          {article.category && (
            <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-white/5">
              {article.category}
            </span>
          )}
          {article.relevance === 'time-sensitive' && (
            <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-red-50 dark:bg-red-950/30 text-red-500 border border-red-100 dark:border-red-900/30">
              News
            </span>
          )}
        </div>

        {/* Open in browser — intentional, labelled CTA */}
        {article.url && (
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-[14px] font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
          >
            <ExternalLink className="w-4 h-4 opacity-60" />
            Read on {source || 'original site'}
          </a>
        )}

        <p className="text-center text-[11px] text-slate-400 dark:text-slate-600 mt-3">
          Full text unavailable in-app for this source
        </p>
      </div>
    </div>
  );
}
