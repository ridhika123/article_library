"use client";
import Link from "next/link";
import { ChevronLeft, Bookmark, Share2 } from "lucide-react";
import { Article, ArticleTier } from "@/components/ArticleCard";

const TIER_LABELS: Record<ArticleTier, { label: string; color: string }> = {
  tier1:  { label: "Reader View",    color: "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300" },
  tier2:  { label: "In-App Browser", color: "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300" },
  tier3:  { label: "Preview",        color: "bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300" },
  xpost:  { label: "X Post",         color: "bg-sky-50 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300" },
};

interface ReaderNavProps {
  article: Article;
}

export function ReaderNav({ article }: ReaderNavProps) {
  const tierInfo = article.tier ? TIER_LABELS[article.tier] : null;

  return (
    <header className="sticky top-0 z-40 bg-white/90 dark:bg-[#0a0a0a]/90 backdrop-blur-md px-5 py-3 flex items-center justify-between border-b border-slate-100 dark:border-white/5 flex-shrink-0">
      <Link
        href="/"
        className="flex items-center gap-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 transition-colors px-2 py-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/30"
      >
        <ChevronLeft className="w-4 h-4" />
        Library
      </Link>

      {tierInfo && (
        <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${tierInfo.color}`}>
          {tierInfo.label}
        </span>
      )}

      <div className="flex items-center gap-1">
        <button
          title="Bookmark"
          className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
        >
          <Bookmark className="w-4 h-4" />
        </button>
        {article.url && (
          <button
            title="Share"
            onClick={() => navigator.share?.({ url: article.url!, title: article.title }).catch(() => {})}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
          >
            <Share2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </header>
  );
}
