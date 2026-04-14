"use client";

import { Clock, CheckCircle2, Bookmark, Flame, Infinity, Database, Briefcase, User, Settings, Layers, Library, Hash } from "lucide-react";
import Link from "next/link";
import { useLibrary } from "./LibraryContext";
import { AddArticleDialog } from "./AddArticleDialog";

export function Sidebar({ className }: { className?: string }) {
  const { addArticle, sources, filterState, setFilterState } = useLibrary();

  const toggleSource = (source: string) => {
    setFilterState(prev => {
      const isSelected = prev.sources.includes(source);
      if (isSelected) {
        return { ...prev, sources: prev.sources.filter(s => s !== source) };
      } else {
        return { ...prev, sources: [...prev.sources, source] };
      }
    });
  };

  // Pick a distinct color based on the source string length/hash for the dot
  const getColor = (str: string) => {
    const colors = ["bg-blue-400", "bg-pink-400", "bg-emerald-400", "bg-amber-400", "bg-purple-400", "bg-rose-400", "bg-indigo-400"];
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const dummyTags = ["design", "technology", "psychology", "startups", "productivity"];

  return (
    <aside className={`flex flex-col py-6 px-4 ${className || ""}`}>
      {/* Add Button */}
      <div className="mb-8 w-full flex justify-center px-2">
        <div className="w-full">
          <AddArticleDialog onAdd={addArticle} />
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <input 
          type="text" 
          placeholder="Search Articles" 
          className="w-full bg-[#e5e5ea]/50 dark:bg-slate-800/50 backdrop-blur-md rounded-xl px-4 py-2 text-sm outline-none border border-[#d1d1d6]/50 dark:border-slate-700/50 focus:ring-2 focus:ring-blue-500/50 transition-all font-medium text-slate-800 dark:text-slate-100"
        />
      </div>

      <nav className="flex-1 space-y-8 overflow-y-auto pr-2 pb-10">
        
        {/* Categories / Sources */}
        <div>
          <h3 className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 px-3">By Source</h3>
          <ul className="space-y-0.5">
            {sources.length === 0 && (
              <li className="px-3 py-2 text-[13px] text-slate-400 italic">No sources</li>
            )}
            {sources.map(source => {
              const displaySource = source.replace(' (formerly Twitter)', '');
              return (
                <li key={source}>
                  <button 
                    onClick={() => toggleSource(source)} 
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 text-[13px] rounded-[6px] transition-all duration-200 ${filterState.sources.includes(source) ? 'bg-black/[0.04] dark:bg-white/[0.08] text-slate-900 dark:text-white font-semibold' : 'hover:bg-black/[0.03] dark:hover:bg-white/[0.04] text-slate-600 dark:text-slate-400 font-medium'}`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <span className={`w-2 h-2 rounded-full block shrink-0 ${getColor(displaySource)} shadow-sm`}></span>
                      <span className="truncate">{displaySource}</span>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Tags Placeholder */}
        <div>
          <h3 className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 px-3">Tags</h3>
          <div className="flex flex-wrap gap-2 px-3">
            {dummyTags.map(tag => (
              <button key={tag} className="px-3 py-1.5 text-[10px] uppercase tracking-[0.1em] font-semibold rounded-full bg-slate-100/80 border border-slate-200/60 shadow-sm dark:border-slate-700/50 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-700/80 text-slate-600 dark:text-slate-300 transition-all">
                {tag}
              </button>
            ))}
            <button className="px-3 py-1.5 text-[10px] uppercase tracking-[0.1em] font-semibold rounded-full border border-dashed border-slate-300 dark:border-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
              + New
            </button>
          </div>
        </div>
        
      </nav>

      <div className="mt-4 pt-4 border-t border-[#e5e5ea]/80 dark:border-slate-800">
        <Link href="#" className="flex items-center gap-3 px-3 py-2 text-[14px] font-medium rounded-lg hover:bg-[#e5e5ea]/50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300 transition-colors">
          <Settings className="w-4 h-4" />
          Settings
        </Link>
      </div>
    </aside>
  );
}
