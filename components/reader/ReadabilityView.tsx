"use client";
import { Article, ExtractedArticle } from "@/components/ArticleCard";

interface ReadabilityViewProps {
  article: Article;
  content: ExtractedArticle;
}

export function ReadabilityView({ article, content }: ReadabilityViewProps) {
  const title = content.title || article.title;
  const byline = content.byline || article.author;
  const source = content.siteName || article.source;
  const wordCount = content.length ? Math.round(content.length / 5) : null;
  const readTime = wordCount ? `${Math.max(1, Math.round(wordCount / 200))} min read` : null;

  return (
    <main className="flex-1 w-full overflow-y-auto bg-white dark:bg-[#0a0a0a]">
      <div className="max-w-[720px] mx-auto px-6 py-12 md:py-16">

        {/* Article header */}
        <header className="mb-10 text-center">
          {source && (
            <p className="text-[11px] font-bold tracking-widest uppercase text-slate-400 dark:text-slate-500 mb-4 font-sans">
              {source}
            </p>
          )}
          <h1
            className="font-serif text-[32px] md:text-[38px] font-semibold leading-[1.15] tracking-tight text-slate-900 dark:text-slate-50 mb-5"
            style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
          >
            {title}
          </h1>
          <div className="flex items-center justify-center gap-3 text-sm text-slate-400 dark:text-slate-500 font-medium font-sans">
            {byline && <span>{byline}</span>}
            {byline && readTime && <span>·</span>}
            {readTime && <span>{readTime}</span>}
          </div>
        </header>

        <div className="w-10 h-0.5 bg-slate-200 dark:bg-white/10 mx-auto mb-10 rounded-full" />

        {/* Article body — styled entirely via .article-content in globals.css */}
        {content.content && (
          <div
            className="article-content"
            dangerouslySetInnerHTML={{ __html: content.content }}
          />
        )}
      </div>
    </main>
  );
}
