"use client";
import { useEffect, useRef } from "react";
import { Article, XOEmbedData } from "@/components/ArticleCard";
import { ExternalLink } from "lucide-react";

declare global {
  interface Window {
    twttr?: {
      widgets: {
        load: (el?: HTMLElement) => void;
      };
    };
  }
}

interface XPostCardProps {
  article: Article;
  oembed?: XOEmbedData | null;
}

export function XPostCard({ article, oembed }: XPostCardProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load Twitter widgets.js once, then hydrate blockquotes into real embeds
    const hydrate = () => {
      if (window.twttr?.widgets && containerRef.current) {
        window.twttr.widgets.load(containerRef.current);
      }
    };

    if (window.twttr) {
      hydrate();
    } else {
      const existing = document.getElementById("twitter-widgets-js");
      if (!existing) {
        const script = document.createElement("script");
        script.id = "twitter-widgets-js";
        script.src = "https://platform.twitter.com/widgets.js";
        script.async = true;
        script.onload = hydrate;
        document.body.appendChild(script);
      } else {
        // Script already loading — wait for it
        existing.addEventListener("load", hydrate);
      }
    }
  }, [oembed]);

  return (
    <main className="flex-1 overflow-y-auto bg-[#f7f7f7] dark:bg-[#0f0f0f] flex flex-col items-center justify-start px-6 pt-8 pb-12 gap-4">
      {/* The actual oEmbed HTML — widgets.js turns the blockquote into the real tweet */}
      <div
        ref={containerRef}
        className="w-full max-w-[550px]"
        dangerouslySetInnerHTML={{ __html: oembed?.html ?? '' }}
      />

      {/* Fallback if no oEmbed HTML came back */}
      {!oembed?.html && (
        <div className="w-full max-w-[550px] rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1c1c1e] p-6 text-center space-y-4">
          <p className="text-slate-500 text-sm">Could not load post preview.</p>
          {article.url && (
            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-[14px] font-semibold text-blue-600 dark:text-blue-400 hover:underline"
            >
              <ExternalLink className="w-4 h-4" />
              View on X
            </a>
          )}
        </div>
      )}
    </main>
  );
}
