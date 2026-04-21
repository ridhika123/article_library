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
  username: string | null;
  logout: () => void;
  activeBook: string | null;
  setActiveBook: React.Dispatch<React.SetStateAction<string | null>>;
}

const LibraryContext = createContext<LibraryContextProps | undefined>(undefined);

export function LibraryProvider({ children }: { children: ReactNode }) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [activeBook, setActiveBook] = useState<string | null>(null);
  const [filterState, setFilterState] = useState<FilterState>({
    collections: ['reading-list', 'library'],
    statuses: [],
    sources: [],
    tags: [],
    dateRange: 'all',
  });

  // Check auth first
  useEffect(() => {
    const saved = localStorage.getItem('articleshelf_auth');
    if (saved) {
      setUsername(saved);
    } else {
      setIsLoaded(true); // ready to show login screen
    }
  }, []);

  // Load from Supabase when username is available
  useEffect(() => {
    if (!username) return;

    const fetchArticles = async () => {
      setIsLoaded(false);
      try {
        const { data, error } = await supabase
          .from('articles')
          .select('*')
          .eq('user_id', username)
          .order('dateAdded', { ascending: false });

        if (error) {
          console.error("Error fetching articles from Supabase:", error);
          // Fallback to local storage if network fails
          const savedData = localStorage.getItem(`articleShelfData_${username}`);
          if (savedData) {
            setArticles(JSON.parse(savedData));
          }
        } else if (data) {
          setArticles(data as Article[]);
          // Optional: still sync to localStorage as a backup
          localStorage.setItem(`articleShelfData_${username}`, JSON.stringify(data));
        }
      } catch (err) {
        console.error("Could not fetch articles", err);
      } finally {
        setIsLoaded(true);
      }
    };
    fetchArticles();
  }, [username]);

  const addArticle = async (article: Article) => {
    // Optimistic UI update
    setArticles((prev) => [article, ...prev]);
    
    // Sync to Supabase
    const { error } = await supabase.from('articles').insert({ ...article, user_id: username });
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
      const { id: _ignore, ...updatePayload } = finalUpdatedArticle as Article;
      
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

  const logout = useCallback(() => {
    localStorage.removeItem('articleshelf_auth');
    setUsername(null);
    setArticles([]);
  }, []);

  const handleLogin = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const user = fd.get('username') as string;
    if (user.trim()) {
      localStorage.setItem('articleshelf_auth', user.trim());
      setUsername(user.trim());
    }
  };

  if (!username) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-[#f2f2f7] dark:bg-[#0a0a0a] text-slate-900 dark:text-slate-100 font-sans p-6">
        <div className="bg-white dark:bg-[#1c1c1e] p-8 rounded-3xl shadow-xl w-full max-w-sm border border-slate-200 dark:border-white/10">
           <h2 className="text-2xl font-serif font-semibold mb-6 text-center tracking-tight">Welcome to ArticleShelf</h2>
           <form onSubmit={handleLogin} className="flex flex-col gap-4">
             <div className="space-y-2">
               <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Storage Username</label>
               <input 
                 name="username" 
                 type="text" 
                 required 
                 autoComplete="off"
                 placeholder="e.g. ridhika" 
                 className="w-full bg-slate-50 dark:bg-black/50 border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-slate-400 rounded-xl px-4 py-3 outline-none transition-all shadow-inner font-medium"
               />
             </div>
             <button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-xl px-4 py-3 shadow-[0_4px_14px_rgba(0,0,0,0.15)] transition-transform active:scale-95 mt-2">
               Enter Library
             </button>
           </form>
        </div>
      </div>
    );
  }

  return (
    <LibraryContext.Provider value={{ articles, addArticle, updateArticle, deleteArticle, prefetchArticle, sources, uniqueTags, isLoaded, filterState, setFilterState, username, logout, activeBook, setActiveBook }}>
      {isLoaded ? children : <div className="h-screen w-full flex flex-col items-center justify-center bg-[#f2f2f7] dark:bg-[#0a0a0a]">
        <div className="w-8 h-8 rounded-full border-2 border-slate-300 dark:border-slate-700 border-t-slate-800 dark:border-t-slate-300 animate-spin"></div>
        <p className="text-slate-400 mt-4 text-sm font-medium animate-pulse">Loading library...</p>
      </div>}
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
