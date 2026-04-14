import { Badge } from "@/components/ui/badge";
import { Check, Trash2, Clock, RotateCcw, Play, Edit2 } from "lucide-react";
import { useLibrary } from "./LibraryContext";
import { useState } from "react";
import { EditArticleDialog } from "./EditArticleDialog";

export type ArticleTier = 'tier1' | 'tier2' | 'tier3' | 'xpost';

export interface ExtractedArticle {
  title?: string;
  byline?: string;
  content?: string;
  excerpt?: string;
  siteName?: string;
  length?: number;
}

export interface XOEmbedData {
  authorName?: string;
  authorUrl?: string;
  html?: string;
  url?: string;
}

export interface Article {
  id: string;
  title: string;
  author: string;
  coverImage: string;
  isRead: boolean;
  category: string;
  progress?: number;
  relevance?: 'time-sensitive' | 'evergreen';
  source?: string;
  url?: string;
  collection?: 'reading-list' | 'library';
  dateAdded?: string;
  // Smart reader fields
  tier?: ArticleTier;
  cachedContent?: ExtractedArticle;
  cachedOEmbed?: XOEmbedData;
  ogImage?: string;
  ogDescription?: string;
  tags?: string[];
}

const getCoverTheme = (str: string) => {
  if (!str) return "bg-[#e2e2e2] text-slate-800 dark:bg-[#1a1a1a] dark:text-slate-300";
  
  const exactThemes: Record<string, string> = {
    "X": "bg-[#1C2024] text-[#E1E8ED]",
    "Medium": "bg-[#F3F6F3] text-[#1A1A1A]",
    "Wikipedia": "bg-[#F5F5F5] text-[#202122]",
    "YouTube": "bg-[#FDF2F2] text-[#282828]",
    "Towards Data Science": "bg-[#29323C] text-[#E8E8E8]",
    "Anchor Hosting": "bg-[#F0F4F8] text-[#1D3557]",
  };

  if (exactThemes[str]) return exactThemes[str];
  
  // Refined, more muted/book-like color palettes fallback
  const themes = [
    "bg-[#3A4E60] text-[#F4F4F4]", // Slate Blue
    "bg-[#5A3B3B] text-[#F3EFEF]", // Deep Crimson
    "bg-[#2F4F41] text-[#E8F1EC]", // Forest Green
    "bg-[#D9A05B] text-[#332514]", // Ocher / Gold
    "bg-[#4D3F59] text-[#EFEAF4]", // Muted Purple
    "bg-[#B47C80] text-[#FFFFFF]", // Dusty Rose
    "bg-[#27404A] text-[#E2EDF4]", // Deep Cyan
    "bg-[#EFECE6] text-[#393C42]", // Off-White Paper
  ];
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return themes[Math.abs(hash) % themes.length];
};

export function ArticleCard({ article, onSelect }: { article: Article; onSelect?: (article: Article) => void }) {
  const { updateArticle, deleteArticle } = useLibrary();
  const [isEditing, setIsEditing] = useState(false);

  const isInProgress = article.progress !== undefined && !article.isRead;
  const isUnread = !article.isRead && article.progress === undefined;
  
  const displaySource = article.source?.replace(' (formerly Twitter)', '');
  const coverTheme = getCoverTheme(displaySource || article.title);

  const handleMarkAsRead = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    updateArticle(article.id, { isRead: true, progress: undefined, collection: 'library' });
  };

  const handleMarkAsInProgress = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    updateArticle(article.id, { isRead: false, progress: 5 });
  };

  const handleMarkAsUnread = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    updateArticle(article.id, { isRead: false, progress: undefined, collection: 'reading-list' });
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    deleteArticle(article.id);
  };

  let displayTitle = article.title;
  let displayAuthor = article.author;
  
  const isSocial = displaySource === 'X' || displaySource?.includes('Twitter') || displaySource?.includes('Instagram') || displaySource?.includes('TikTok') || displaySource?.includes('Facebook') || displaySource?.includes('LinkedIn');

  if (isSocial && article.cachedOEmbed) {
    if (article.cachedOEmbed.html && (displayTitle === "Unknown Title" || displayTitle.startsWith('http'))) {
      const match = article.cachedOEmbed.html.match(/<p[^>]*>(.*?)<\/p>/);
      if (match && match[1]) {
        // Decode HTML entities and strip tags
        const cleanText = match[1].replace(/<[^>]+>/g, '').replace(/&mdash;/g, '—').replace(/&amp;/g, '&');
        displayTitle = '"' + cleanText + '"';
      } else {
        displayTitle = "Social Post";
      }
    }
    if (article.cachedOEmbed.authorName) {
      displayAuthor = article.cachedOEmbed.authorName;
    }
  }

  // Restrict all titles to roughly 10 words
  const titleWords = displayTitle.split(/\s+/);
  if (titleWords.length > 10) {
    displayTitle = titleWords.slice(0, 10).join(' ') + '...';
    // Clean up trailing quotes if we chopped the string mid-quote
    if (displayTitle.startsWith('"') && !displayTitle.endsWith('"')) {
       displayTitle += '"';
    }
  }

  const addedDateStr = article.dateAdded 
    ? new Date(article.dateAdded).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
    : undefined;

  const CardInner = (
    <div className="relative aspect-[2.5/3.6] w-full perspective-[2000px] hover:z-10 group @container">
      <div className={`w-full h-full relative overflow-hidden rounded-r-xl rounded-l-[4px] transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] group-hover:scale-[1.04] group-hover:-translate-y-2 shadow-[2px_4px_12px_rgb(0,0,0,0.08)] group-hover:shadow-[12px_20px_40px_rgb(0,0,0,0.15)] flex flex-col ${coverTheme} border-y border-r border-[#00000020] dark:border-[#ffffff15]`}>
        
        {/* Book Cover Image Overlay */}
        {article.ogImage && (
          <div className="absolute inset-0 z-0 mix-blend-overlay opacity-30 group-hover:opacity-40 transition-opacity">
            <img src={article.ogImage} alt="" className="w-full h-full object-cover grayscale" />
          </div>
        )}

        {/* Paper Texture Overlay */}
        <div className="absolute inset-0 z-0 bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')] opacity-20 mix-blend-multiply pointer-events-none" />

        {/* Book Spine */}
        <div className="absolute left-0 top-0 bottom-0 w-[10cqw] max-w-[24px] bg-gradient-to-r from-black/30 via-black/5 to-transparent dark:from-black/40 dark:via-black/10 z-10 border-r border-black/15 dark:border-white/10"></div>
        {/* Spine Crease Inner Shadow */}
        <div className="absolute left-[10cqw] sm:left-[24px] top-0 bottom-0 w-[8px] bg-gradient-to-r from-black/15 to-transparent z-10 pointer-events-none" />
        
        {/* 3D Lighting Highlight */}
        <div className="absolute inset-0 z-10 bg-gradient-to-tr from-transparent via-white/5 to-white/20 dark:to-white/10 pointer-events-none" />

        {/* Content */}
        <div className="flex-1 flex flex-col items-center justify-center p-[5cqw] pl-[12cqw] z-20 transition-transform duration-300 relative text-center h-full">
           {displaySource && (
             <span className="text-[clamp(8px,4cqw,11px)] uppercase tracking-[0.25em] opacity-80 font-bold mb-5 line-clamp-1 block w-full px-2">
               {displaySource}
             </span>
           )}
           
           <h4 className="text-[clamp(16px,9.5cqw,26px)] font-serif font-medium leading-[1.3] line-clamp-4 tracking-tight drop-shadow-md px-1 w-full flex-1 flex items-center justify-center">
             {displayTitle}
           </h4>

           {displayAuthor && displayAuthor !== "Unknown Author" && (
             <div className="mt-5 flex flex-col items-center justify-end gap-1 w-full">
               {addedDateStr && (
                 <span className="text-[clamp(7px,3.5cqw,9px)] uppercase tracking-wider opacity-60 font-medium">
                   {addedDateStr}
                 </span>
               )}
               <span className="text-[clamp(9px,4.5cqw,12px)] uppercase tracking-widest opacity-70 font-bold pb-2 line-clamp-1 block w-full">
                 {displayAuthor}
               </span>
             </div>
           )}

           {article.tags && article.tags.length > 0 && (
             <div className="flex flex-wrap items-center justify-center gap-1.5 mt-3 w-full">
               {article.tags.slice(0,2).map(tag => (
                 <span key={tag} className="text-[7px] sm:text-[9px] uppercase tracking-wider bg-black/10 dark:bg-black/20 border border-black/10 dark:border-white/10 px-1.5 py-0.5 rounded-sm backdrop-blur-sm truncate max-w-full font-bold">
                   {tag}
                 </span>
               ))}
               {article.tags.length > 2 && <span className="text-[8px] opacity-60">+{article.tags.length - 2}</span>}
             </div>
           )}
        </div>

        {/* Status Indicators */}
        <div className="absolute top-3 right-3 flex flex-col gap-2 z-20">
          {isUnread && (
            <span className="w-2.5 h-2.5 bg-blue-400 rounded-full shadow-[0_0_8px_rgba(96,165,250,0.6)] mt-1 mr-1 block border border-white/20 border-solid" />
          )}
        </div>

        {/* Progress bar inside book bottom */}
        {isInProgress && (
          <div className="absolute bottom-0 left-[24px] right-0 h-[4px] bg-black/10 dark:bg-white/10 z-20">
             <div 
               className="h-full bg-current opacity-80 transition-all duration-500 ease-in-out relative" 
               style={{ width: `${article.progress}%` }} 
             />
          </div>
        )}

        {/* Hover Actions */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-30 pointer-events-none rounded-xl overflow-hidden">
          <div className="absolute inset-0 bg-black/50 dark:bg-black/70" />
          
          <div className="absolute bottom-5 left-[clamp(20px,8cqw,32px)] z-40 flex flex-col justify-start items-start gap-0.5 pointer-events-auto">
            <span className="text-[9px] uppercase tracking-widest text-white/60 font-bold">Status</span>
            <span className="text-white text-[13px] font-medium tracking-wide drop-shadow-sm">
              {article.isRead ? 'Finished' : (isInProgress ? 'Currently Reading' : 'In Queue')}
            </span>
          </div>

          <div className="absolute top-3 right-3 z-40 flex flex-col items-center gap-2.5 pointer-events-auto">
            
            {!article.isRead && (
              <button 
                onClick={handleMarkAsRead}
                className="w-8 h-8 rounded-full bg-white text-slate-900 flex items-center justify-center shadow-lg hover:bg-slate-100 hover:scale-110 transition-transform font-medium"
                title="Finish & Save to Bookshelf"
              >
                <Check className="w-4 h-4 text-green-600 stroke-[3]" />
              </button>
            )}

            {isUnread && (
               <button 
                onClick={handleMarkAsInProgress}
                className="w-8 h-8 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/30 hover:scale-110 transition-transform border border-white/20 backdrop-blur-sm shadow-sm"
                title="Start Reading"
              >
                <Play className="w-3.5 h-3.5 translate-x-[1px]" />
              </button>
            )}

            {article.isRead && (
               <button 
                onClick={handleMarkAsUnread}
                className="w-8 h-8 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/30 hover:scale-110 transition-transform border border-white/20 backdrop-blur-sm shadow-sm"
                title="Mark as Unread"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}

            <button 
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsEditing(true); }}
              className="w-8 h-8 rounded-full bg-slate-800/80 text-white flex items-center justify-center shadow-sm hover:bg-slate-900 hover:scale-110 transition-transform border border-slate-700/20 backdrop-blur-sm"
              title="Edit Article"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button 
              onClick={handleDelete}
              className="w-8 h-8 rounded-full bg-red-500/80 text-white flex items-center justify-center shadow-sm hover:bg-red-600 hover:scale-110 transition-transform border border-red-500/20 backdrop-blur-sm"
              title="Delete Article"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const handleCardClick = () => {
    if (onSelect) onSelect(article);
  };

  return (
    <>
    <div
      role={article.url ? 'button' : undefined}
      tabIndex={article.url ? 0 : undefined}
      onClick={article.url ? handleCardClick : undefined}
      onKeyDown={article.url ? (e) => { if (e.key === 'Enter' || e.key === ' ') handleCardClick(); } : undefined}
      className={`flex flex-col gap-3 outline-none w-full ${article.url ? 'cursor-pointer' : ''}`}
    >
      {CardInner}
    </div>
    {isEditing && <EditArticleDialog article={article} onClose={() => setIsEditing(false)} />}
    </>
  );
}
