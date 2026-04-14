"use client";

import { use, useEffect } from "react";
import Link from "next/link";
import { useLibrary } from "@/components/LibraryContext";
import { ArticleTier } from "@/components/ArticleCard";
import { ReaderNav } from "@/components/reader/ReaderNav";
import { IframeView } from "@/components/reader/IframeView";
import { XPostCard } from "@/components/reader/XPostCard";

export default function ReaderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { articles, updateArticle } = useLibrary();
  const article = articles.find((a) => a.id === id);

  // Background: fetch oEmbed for X posts if not already cached
  useEffect(() => {
    if (!article?.url || article.tier) return;

    const isXUrl = /^https?:\/\/(www\.)?(x\.com|twitter\.com)\//i.test(article.url);
    if (!isXUrl) return;

    fetch(`/api/detect?url=${encodeURIComponent(article.url)}`)
      .then(r => r.json())
      .then(data => {
        updateArticle(article.id, {
          tier: data.tier as ArticleTier,
          cachedOEmbed: data.oembed,
        });
      })
      .catch(console.error);
  }, [article?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Not found ─────────────────────────────────────────────────────────────
  if (!article) {
    return (
      <div className="flex flex-col min-h-screen bg-[#fcfcfc] dark:bg-[#0a0a0a] items-center justify-center gap-4">
        <p className="text-slate-500 font-medium">Article not found in your library.</p>
        <Link href="/" className="text-blue-500 font-semibold hover:underline">
          Return to Library
        </Link>
      </div>
    );
  }

  // ── No URL saved ─────────────────────────────────────────────────────────
  if (!article.url) {
    return (
      <div className="flex flex-col absolute inset-0 z-50 bg-[#fcfcfc] dark:bg-[#0a0a0a]">
        <ReaderNav article={article} />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-slate-400 text-sm">No URL saved for this article.</p>
        </div>
      </div>
    );
  }

  // ── X Post ─────────────────────────────────────────────────────────────────
  if (article.tier === 'xpost') {
    return (
      <div className="flex flex-col absolute inset-0 z-50 bg-[#0f0f0f]">
        <ReaderNav article={article} />
        <XPostCard article={article} oembed={article.cachedOEmbed} />
      </div>
    );
  }

  // ── Default: In-App Browser (Tier 2) ──────────────────────────────────────
  // Render the iframe immediately — no prefetch, no detection wait.
  // IframeView handles its own loading state and falls back to MetadataCard
  // automatically if the site blocks embedding.
  return (
    <div className="flex flex-col absolute inset-0 z-50 bg-white dark:bg-[#0a0a0a]">
      <ReaderNav article={{ ...article, tier: article.tier ?? 'tier2' }} />
      <IframeView article={article} />
    </div>
  );
}
