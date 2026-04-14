"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { Article, ArticleTier, ExtractedArticle, XOEmbedData } from '@/components/ArticleCard';
import { supabase } from '@/lib/supabaseClient';

export interface FilterState {
  collections: ('reading-list' | 'library')[];
  statuses: ('unread' | 'in-progress' | 'finished')[];
  sources: string[];
  tags: string[];
  dateRange: 'all' | 'week' | 'month' | 'year';
}

interface LibraryContextProps {
  articles: Article[];
  addArticle: (article: Article) => void;
  updateArticle: (id: string, patch: Partial<Article>) => void;
  deleteArticle: (id: string) => void;
  prefetchArticle: (article: Article) => void;
  sources: string[];
  uniqueTags: string[];
  isLoaded: boolean;
  filterState: FilterState;
  setFilterState: React.Dispatch<React.SetStateAction<FilterState>>;
}

const LibraryContext = createContext<LibraryContextProps | undefined>(undefined);

export function LibraryProvider({ children }: { children: ReactNode }) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [filterState, setFilterState] = useState<FilterState>({
    collections: ['reading-list', 'library'],
    statuses: [],
    sources: [],
    tags: [],
    dateRange: 'all',
  });

  // Load from Supabase on initial mount
  useEffect(() => {
    const fetchArticles = async () => {
      try {
        const { data, error } = await supabase
          .from('articles')
          .select('*')
          .order('dateAdded', { ascending: false });

        if (error) {
          console.error("Error fetching articles from Supabase:", error);
          // Fallback to local storage if network fails
          const savedData = localStorage.getItem("articleShelfData");
          if (savedData) {
            setArticles(JSON.parse(savedData));
          }
        } else if (data) {
          setArticles(data as Article[]);
          // Optional: still sync to localStorage as a backup
          localStorage.setItem("articleShelfData", JSON.stringify(data));
        }
      } catch (err) {
        console.error("Could not fetch articles", err);
      } finally {
        setIsLoaded(true);
      }
    };
    fetchArticles();
  }, []);

  const addArticle = async (article: Article) => {
    // Optimistic UI update
    setArticles((prev) => [article, ...prev]);
    
    // Sync to Supabase
    const { error } = await supabase.from('articles').insert(article);
    if (error) {
      console.error("Error inserting article:", error);
    }
  };

  const updateArticle = useCallback(async (id: string, patch: Partial<Article>) => {
    let finalUpdatedArticle: Article | null = null;

    setArticles((prev) =>
      prev.map((a) => {
        if (a.id === id) {
          const updated = { ...a, ...patch };
          // Automatically move to library if marked as read
          if (patch.isRead === true) {
            updated.collection = 'library';
          }
          finalUpdatedArticle = updated;
          return updated;
        }
        return a;
      })
    );

    if (finalUpdatedArticle) {
      // Create a mutable copy to manipulate before sending to Supabase
      const updatePayload = { ...(finalUpdatedArticle as Article) };
      delete (updatePayload as any).id; // avoid updating primary key
      
      const { error } = await supabase.from('articles').update(updatePayload).eq('id', id);
      if (error) {
        console.error("Error updating article:", error);
      }
    }
  }, []);

  const deleteArticle = useCallback(async (id: string) => {
    // Optimistic UI update
    setArticles((prev) => prev.filter(a => a.id !== id));

    const { error } = await supabase.from('articles').delete().eq('id', id);
    if (error) {
      console.error("Error deleting article:", error);
    }
  }, []);

  /**
   * Background prefetch: detects the tier for a URL and caches the result
   * into the article record. Called immediately after addArticle so that
   * by the time the user clicks the card, everything is ready.
   */
  const prefetchArticle = useCallback(async (article: Article) => {
    if (!article.url) return;

    const isXUrl = /^https?:\/\/(www\.)?(x\.com|twitter\.com)\//i.test(article.url);

    if (isXUrl) {
      // Fetch oEmbed data for X posts
      try {
        const res = await fetch(`/api/detect?url=${encodeURIComponent(article.url)}`);
        if (!res.ok) return;
        const data = await res.json();
        updateArticle(article.id, {
          tier: data.tier as ArticleTier,
          cachedOEmbed: data.oembed ?? undefined,
        });
      } catch (err) {
        console.error('X oEmbed prefetch failed:', err);
      }
    } else {
      // Everything else is tier2 — set immediately, no network call needed
      updateArticle(article.id, { tier: 'tier2' });
    }
  }, [updateArticle]);

  // Derive unique sources from articles
  const sources = Array.from(new Set(articles.map(a => a.source).filter(Boolean))) as string[];

  // Derive unique tags from articles
  const uniqueTags = Array.from(new Set(articles.flatMap(a => a.tags || []))).filter(Boolean) as string[];

  return (
    <LibraryContext.Provider value={{ articles, addArticle, updateArticle, deleteArticle, prefetchArticle, sources, uniqueTags, isLoaded, filterState, setFilterState }}>
      {isLoaded ? children : <div className="h-screen w-full flex items-center justify-center text-slate-400">Loading library...</div>}
    </LibraryContext.Provider>
  );
}

export function useLibrary() {
  const context = useContext(LibraryContext);
  if (!context) {
    throw new Error("useLibrary must be used within a LibraryProvider");
  }
  return context;
}
