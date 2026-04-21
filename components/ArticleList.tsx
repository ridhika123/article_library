import { Article } from "./ArticleCard";
import { Check, CheckCircle2, Circle, Edit2, Play, Trash2 } from "lucide-react";
import { useLibrary } from "./LibraryContext";
import { useState } from "react";
import { EditArticleDialog } from "./EditArticleDialog";

interface ArticleListProps {
  articles: Article[];
  onSelect?: (article: Article) => void;
}

export function ArticleList({ articles, onSelect }: ArticleListProps) {
  const { updateArticle, deleteArticle } = useLibrary();
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);

  const handleToggleRead = (e: React.MouseEvent, article: Article) => {
    e.preventDefault();
    e.stopPropagation();
    if (article.isRead) {
      updateArticle(article.id, { isRead: false, progress: undefined, collection: 'reading-list' });
    } else {
      updateArticle(article.id, { isRead: true, progress: undefined, collection: 'library' });
    }
  };

  const handleMarkAsInProgress = (e: React.MouseEvent, article: Article) => {
    e.preventDefault();
    e.stopPropagation();
    updateArticle(article.id, { isRead: false, progress: 5 });
  };

  const handleDelete = (e: React.MouseEvent, article: Article) => {
    e.preventDefault();
    e.stopPropagation();
    deleteArticle(article.id);
  };

  return (
    <>
    <div className="w-full flex flex-col gap-2">
      {/* Header Row */}
      <div className="flex items-center px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
         <div className="w-10"></div>{/* Status Icon */}
         <div className="flex-1">Title & Author</div>
         <div className="w-[120px] hidden sm:block">Source</div>
         <div className="w-[100px] hidden md:block">Added</div>
         <div className="w-[140px] text-right">Status</div>
      </div>

      {/* List Rows */}
      {articles.map((article) => {
        const isQueue = article.collection === 'reading-list';
        const isInProgress = article.progress !== undefined && !article.isRead;
        const addedDateStr = article.dateAdded 
          ? new Date(article.dateAdded).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
          : '';

        let displayTitle = article.title;
        if (article.cachedOEmbed?.html && (displayTitle === "Unknown Title" || displayTitle.startsWith('http'))) {
            const match = article.cachedOEmbed.html.match(/<p[^>]*>(.*?)<\/p>/);
            if (match && match[1]) {
                const cleanText = match[1].replace(/<[^>]+>/g, '').replace(/&mdash;/g, '—').replace(/&amp;/g, '&');
                displayTitle = '"' + cleanText + '"';
            } else {
                displayTitle = "Social Post";
            }
        }

        return (
            <div 
              key={article.id}
              role={article.url ? 'button' : undefined}
              tabIndex={article.url ? 0 : undefined}
              onClick={() => article.url && onSelect && onSelect(article)}
              onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && article.url && onSelect) onSelect(article); }}
              className={`flex items-center px-4 py-3 bg-white dark:bg-[#1c1c1e] rounded-xl border border-transparent shadow-sm hover:border-slate-200 dark:hover:border-slate-700 hover:shadow-md transition-all group ${article.url ? 'cursor-pointer' : ''}`}
            >
               {/* Read Status Icon */}
               <div className="w-10 flex shrink-0">
                  {!article.isRead && isInProgress ? (
                      <div className="w-2.5 h-2.5 rounded-full bg-orange-400 mt-1 shadow-[0_0_8px_rgba(251,146,60,0.6)]" title="Reading" />
                  ) : !article.isRead ? (
                      <div className="w-2.5 h-2.5 rounded-full bg-blue-500 mt-1 shadow-[0_0_8px_rgba(59,130,246,0.6)]" title="Unread" />
                  ) : (
                      <div className="w-2.5 h-2.5 mt-1" /> /* Empty space for read items so Blue dot means Unread explicitly */
                  )}
               </div>

               {/* Title & Author */}
               <div className="flex-1 min-w-0 pr-4">
                  <h4 className="text-[15px] font-serif font-medium text-slate-900 dark:text-slate-100 truncate">
                    {displayTitle}
                  </h4>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[11px] text-slate-500 truncate">
                      {article.author !== "Unknown Author" ? article.author : "Unknown Author"}
                    </span>

                  </div>
               </div>

               {/* Source */}
               <div className="w-[120px] hidden sm:block shrink-0 pr-4">
                 <span className="text-[11px] uppercase tracking-wider font-semibold opacity-70 truncate block">
                   {article.source?.replace(' (formerly Twitter)', '') || 'Web'}
                 </span>
               </div>

               {/* Added Date */}
               <div className="w-[100px] hidden md:block shrink-0 pr-4 text-[12px] text-slate-500">
                 {addedDateStr}
               </div>

               {/* Status / Actions */}
               <div className="w-auto md:w-[140px] shrink-0 flex items-center justify-end relative h-10 md:h-8">
                  {/* Status Text (Visible normally on desktop, hidden on mobile) */}
                  <div className="hidden md:flex absolute right-0 items-center justify-end text-[12px] font-medium text-slate-500 opacity-100 group-hover:opacity-0 transition-opacity whitespace-nowrap pointer-events-none">
                    {article.isRead ? 'Finished' : (isInProgress ? 'Reading' : (isQueue ? 'In Queue' : 'Unread'))}
                  </div>
                  
                  {/* Actions (Always visible on mobile, visible on row hover on desktop) */}
                  <div className="flex md:absolute right-0 items-center justify-end gap-1 sm:gap-1.5 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity bg-transparent md:bg-white md:dark:bg-[#1c1c1e] pl-2 z-10">
                    <button 
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); setEditingArticle(article); }}
                      className="w-8 h-8 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:hover:text-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="Edit"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={(e) => handleMarkAsInProgress(e, article)}
                      className="w-8 h-8 rounded-full flex items-center justify-center text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                      title="Start Reading"
                    >
                      <Play className="w-3.5 h-3.5 translate-x-[1px]" />
                    </button>
                    <button 
                      onClick={(e) => handleToggleRead(e, article)}
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${article.isRead ? 'text-green-600 bg-green-50 dark:bg-green-900/30' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:hover:text-slate-100 dark:hover:bg-slate-800'}`}
                      title={article.isRead ? "Mark as Unread" : "Mark as Finished"}
                    >
                      <Check className="w-4 h-4 stroke-[3]" />
                    </button>
                    <button 
                      onClick={(e) => handleDelete(e, article)}
                      className="w-8 h-8 rounded-full flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
               </div>
            </div>
        );
      })}
    </div>
    {editingArticle && <EditArticleDialog article={editingArticle} onClose={() => setEditingArticle(null)} />}
    </>
  );
}
