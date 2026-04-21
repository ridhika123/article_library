import { Folder } from "lucide-react";

interface BookCardProps {
  tag: string;
  count: number;
  onClick: () => void;
}

const getBookTheme = (str: string) => {
  if (!str) return "bg-[#e2e2e2] text-slate-800 dark:bg-[#1a1a1a] dark:text-slate-300";
  
  const themes = [
    "bg-[#3A4E60] text-[#F4F4F4]", // Slate Blue
    "bg-[#5A3B3B] text-[#F3EFEF]", // Deep Crimson
    "bg-[#2F4F41] text-[#E8F1EC]", // Forest Green
    "bg-[#D9A05B] text-[#332514]", // Ocher / Gold
    "bg-[#4D3F59] text-[#EFEAF4]", // Muted Purple
    "bg-[#B47C80] text-[#FFFFFF]", // Dusty Rose
    "bg-[#27404A] text-[#E2EDF4]", // Deep Cyan
  ];
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return themes[Math.abs(hash) % themes.length];
};

export function BookCard({ tag, count, onClick }: BookCardProps) {
  const coverTheme = getBookTheme(tag);
  const isUntagged = tag === "Untagged";

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      className="group relative aspect-[2.5/3.6] w-full perspective-[2000px] cursor-pointer outline-none @container"
    >
      <div className={`w-full h-full relative overflow-hidden rounded-r-xl rounded-l-[4px] transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] group-hover:scale-[1.04] group-hover:-translate-y-2 shadow-[2px_4px_12px_rgb(0,0,0,0.08)] group-hover:shadow-[12px_20px_40px_rgb(0,0,0,0.15)] flex flex-col ${isUntagged ? 'bg-[#EFECE6] text-[#393C42] dark:bg-[#2C2C2E] dark:text-[#E5E5EA]' : coverTheme} border-y border-r border-[#00000020] dark:border-[#ffffff15]`}>
        
        {/* Paper Texture Overlay */}
        <div className="absolute inset-0 z-0 bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')] opacity-20 mix-blend-multiply pointer-events-none" />

        {/* Book Spine */}
        <div className="absolute left-0 top-0 bottom-0 w-[10cqw] max-w-[24px] bg-gradient-to-r from-black/30 via-black/5 to-transparent dark:from-black/40 dark:via-black/10 z-10 border-r border-black/15 dark:border-white/10"></div>
        {/* Spine Crease Inner Shadow */}
        <div className="absolute left-[10cqw] sm:left-[24px] top-0 bottom-0 w-[8px] bg-gradient-to-r from-black/15 to-transparent z-10 pointer-events-none" />
        
        {/* 3D Lighting Highlight */}
        <div className="absolute inset-0 z-10 bg-gradient-to-tr from-transparent via-white/5 to-white/20 dark:to-white/10 pointer-events-none" />

        {/* Content - Restoring Folder and Pillow */}
        <div className="flex-1 flex flex-col items-center justify-center p-[5cqw] pl-[12cqw] z-20 transition-transform duration-300 relative text-center h-full">
            <div className="w-[10cqw] h-[10cqw] min-w-[32px] min-h-[32px] max-w-[48px] max-h-[48px] rounded-full bg-white/10 dark:bg-black/20 flex items-center justify-center mb-[4cqw] backdrop-blur-sm border border-white/20 dark:border-white/5 shadow-sm">
               <Folder className="w-1/2 h-1/2 opacity-80" />
            </div>

           <h4 className="text-[clamp(16px,8cqw,24px)] font-serif font-semibold leading-[1.2] line-clamp-3 tracking-tight drop-shadow-md px-2 w-full flex-1 flex items-center justify-center">
             {tag}
           </h4>

           <div className="mt-[4cqw] flex flex-col items-center justify-end gap-1 w-full pb-[4cqw]">
             <span className="text-[clamp(8px,3.5cqw,11px)] uppercase tracking-widest opacity-80 font-bold bg-black/10 dark:bg-black/30 px-3 py-1.5 rounded-full backdrop-blur-sm border border-black/5 dark:border-white/5 whitespace-nowrap">
               {count} {count === 1 ? 'Article' : 'Articles'}
             </span>
           </div>
        </div>

      </div>
    </div>
  );
}
