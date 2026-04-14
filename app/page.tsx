"use client";

import { useState, useRef, useEffect } from "react";
import { ArticleGrid } from "@/components/ArticleGrid";
import { useLibrary } from "@/components/LibraryContext";
import { ReaderSheet } from "@/components/reader/ReaderSheet";
import { Article } from "@/components/ArticleCard";
import { Filter, ChevronDown, Check, Calendar } from "lucide-react";

export default function Home() {
  const { articles, filterState, setFilterState } = useLibrary();
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [activeTab, setActiveTab] = useState<'queue' | 'bookshelf'>('queue');
  const [isStatusMenuOpen, setIsStatusMenuOpen] = useState(false);
  const [isDateMenuOpen, setIsDateMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const dateMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsStatusMenuOpen(false);
      }
      if (dateMenuRef.current && !dateMenuRef.current.contains(event.target as Node)) {
        setIsDateMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuRef, dateMenuRef]);

  const toggleStatus = (status: 'unread' | 'in-progress' | 'finished') => {
    setFilterState(prev => {
      const isSelected = prev.statuses.includes(status);
      if (isSelected) {
        return { ...prev, statuses: prev.statuses.filter(s => s !== status) };
      } else {
        return { ...prev, statuses: [...prev.statuses, status] };
      }
    });
  };

  const setDateRange = (range: 'all' | 'week' | 'month' | 'year') => {
    setFilterState(prev => ({ ...prev, dateRange: range }));
    setIsDateMenuOpen(false);
  };

  const passesFilters = (a: any) => {
    let passStatus = false;
    if (filterState.statuses.length === 0) {
      passStatus = true;
    } else {
      if (filterState.statuses.includes('unread') && !a.isRead && a.progress === undefined) passStatus = true;
      if (filterState.statuses.includes('in-progress') && !a.isRead && a.progress !== undefined) passStatus = true;
      if (filterState.statuses.includes('finished') && a.isRead) passStatus = true;
    }
    
    let passSource = false;
    if (filterState.sources.length === 0) {
      passSource = true;
    } else {
      if (a.source && filterState.sources.includes(a.source)) passSource = true;
    }

    let passTags = false;
    if (filterState.tags.length === 0) {
      passTags = true;
    } else {
      if (a.tags && filterState.tags.some((tag: string) => a.tags.includes(tag))) passTags = true;
    }

    let passDate = true;
    if (filterState.dateRange !== 'all' && a.dateAdded) {
      const added = new Date(a.dateAdded);
      const now = new Date();
      if (filterState.dateRange === 'week' && (now.getTime() - added.getTime() > 7 * 24 * 60 * 60 * 1000)) passDate = false;
      if (filterState.dateRange === 'month' && (now.getTime() - added.getTime() > 30 * 24 * 60 * 60 * 1000)) passDate = false;
      if (filterState.dateRange === 'year' && (now.getTime() - added.getTime() > 365 * 24 * 60 * 60 * 1000)) passDate = false;
    }

    return passStatus && passSource && passTags && passDate;
  };

  const displayedArticles = articles.filter(a => {
    // Determine which collection it belongs to
    const isQueue = a.collection === 'reading-list' || (!a.collection && !a.isRead);
    const isBookshelf = a.collection === 'library' || (!a.collection && a.isRead);
    
    if (activeTab === 'queue' && !isQueue) return false;
    if (activeTab === 'bookshelf' && !isBookshelf) return false;
    
    return passesFilters(a);
  });

  return (
    <div className="flex flex-col flex-1 h-full font-sans pb-12 relative min-h-screen">
      <header className="sticky top-0 z-40 bg-[#f2f2f7]/80 dark:bg-[#0a0a0a]/80 backdrop-blur-2xl border-b border-[#e5e5ea]/80 dark:border-white/10 transition-all">
        {/* Top Header Row */}
        <div className="flex justify-between items-center px-8 pt-8 pb-3">
          <h1 className="text-[28px] font-semibold tracking-tight text-slate-800 dark:text-slate-100 font-serif">
            {activeTab === 'queue' ? 'Queue' : 'Bookshelf'}
          </h1>
          
          <div className="flex items-center gap-3">
            <div className="relative" ref={dateMenuRef}>
              <button 
                onClick={() => setIsDateMenuOpen(!isDateMenuOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-black/50 shadow-sm text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
              >
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <span className="capitalize">{filterState.dateRange === 'all' ? 'Any Time' : `Past ${filterState.dateRange}`}</span>
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </button>

              {isDateMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-[#1c1c1e] rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 p-1 z-50">
                   <button onClick={() => setDateRange('all')} className="w-full flex items-center justify-between px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                     Any Time {filterState.dateRange === 'all' && <Check className="w-4 h-4 text-blue-500" />}
                   </button>
                   <button onClick={() => setDateRange('week')} className="w-full flex items-center justify-between px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                     Past Week {filterState.dateRange === 'week' && <Check className="w-4 h-4 text-blue-500" />}
                   </button>
                   <button onClick={() => setDateRange('month')} className="w-full flex items-center justify-between px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                     Past Month {filterState.dateRange === 'month' && <Check className="w-4 h-4 text-blue-500" />}
                   </button>
                   <button onClick={() => setDateRange('year')} className="w-full flex items-center justify-between px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                     Past Year {filterState.dateRange === 'year' && <Check className="w-4 h-4 text-blue-500" />}
                   </button>
                </div>
              )}
            </div>

            <div className="relative" ref={menuRef}>
              <button 
                onClick={() => setIsStatusMenuOpen(!isStatusMenuOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-black/50 shadow-sm text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
              >
                <Filter className="w-3.5 h-3.5 text-slate-500" />
                <span>Status Filter {filterState.statuses.length > 0 && `(${filterState.statuses.length})`}</span>
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </button>

              {isStatusMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-[#1c1c1e] rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 p-1 z-50">
                   <button onClick={() => toggleStatus('unread')} className="w-full flex items-center justify-between px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                     New
                     {filterState.statuses.includes('unread') && <Check className="w-4 h-4 text-blue-500" />}
                   </button>
                   <button onClick={() => toggleStatus('in-progress')} className="w-full flex items-center justify-between px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                     In Progress
                     {filterState.statuses.includes('in-progress') && <Check className="w-4 h-4 text-orange-500" />}
                   </button>
                   <button onClick={() => toggleStatus('finished')} className="w-full flex items-center justify-between px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                     Finished
                     {filterState.statuses.includes('finished') && <Check className="w-4 h-4 text-green-500" />}
                   </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tab Row */}
        <div className="flex gap-6 px-8">
          <button 
            onClick={() => setActiveTab('queue')}
            className={`pb-3 text-sm font-semibold transition-colors border-b-2 ${activeTab === 'queue' ? 'border-slate-900 text-slate-900 dark:border-white dark:text-white' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            Queue
          </button>
          <button 
            onClick={() => setActiveTab('bookshelf')}
            className={`pb-3 text-sm font-semibold transition-colors border-b-2 ${activeTab === 'bookshelf' ? 'border-slate-900 text-slate-900 dark:border-white dark:text-white' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            Bookshelf
          </button>
        </div>
      </header>

      <main className="flex-1 w-full px-8 py-8">
        {displayedArticles.length > 0 ? (
          <ArticleGrid articles={displayedArticles} onSelect={setSelectedArticle} />
        ) : (
          <div className="text-center py-20 text-slate-500 border border-dashed rounded-2xl border-slate-300 dark:border-slate-700">
            <p>Nothing found here.</p>
          </div>
        )}
      </main>

      {/* In-app browser sheet — slides up over the library, no navigation */}
      <ReaderSheet
        article={selectedArticle}
        onClose={() => setSelectedArticle(null)}
      />
    </div>
  );
}
