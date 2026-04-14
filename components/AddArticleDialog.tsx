"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Article } from "@/components/ArticleCard";
import { useLibrary } from "@/components/LibraryContext";

interface AddArticleDialogProps {
  onAdd: (article: Article) => void;
}

export function AddArticleDialog({ onAdd }: AddArticleDialogProps) {
  const { prefetchArticle } = useLibrary();
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [collection, setCollection] = useState<'reading-list' | 'library'>('reading-list');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;

    let finalUrl = url;
    if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
       finalUrl = 'https://' + finalUrl;
    }

    setIsLoading(true);

    try {
      const res = await fetch(`/api/extract?url=${encodeURIComponent(finalUrl)}`);
      
      let title = "Unknown Title";
      let author = "Unknown Author";
      let source = "Web";
      let category = "Uncategorized";

      if (res.ok) {
        const data = await res.json();
        if (data.title) title = data.title;
        if (data.byline) author = data.byline;
        if (data.siteName) source = data.siteName;
      } else {
        try {
          source = new URL(finalUrl).hostname.replace('www.', '');
          title = finalUrl;
        } catch {}
      }

      const newArticle: Article = {
        id: crypto.randomUUID(),
        title,
        author,
        category,
        coverImage: "", 
        source,
        url: finalUrl,
        isRead: false,
        collection,
        dateAdded: new Date().toISOString(),
      };

      onAdd(newArticle);
      prefetchArticle(newArticle);
      
      setUrl("");
      setOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="h-12 px-5 bg-white dark:bg-[#1c1c1e] shadow-[0_8px_30px_rgb(0,0,0,0.12)] rounded-full flex items-center justify-center gap-2 border border-slate-200/50 dark:border-white/10 hover:shadow-[0_12px_40px_rgb(0,0,0,0.16)] hover:scale-[1.02] active:scale-95 transition-all text-slate-800 dark:text-slate-100 font-medium">
         <Plus className="w-5 h-5 stroke-[2]" />
         <span>Add to Shelf</span>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-[#fdfdfd] dark:bg-[#1c1c1e] border border-[#e5e5ea] dark:border-white/10 rounded-2xl shadow-2xl p-6">
        <DialogHeader>
          <DialogTitle className="text-xl font-medium tracking-tight text-slate-900 dark:text-slate-100 font-serif">Add to library</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-3 pb-3 border-b border-slate-100 dark:border-white/5">
            <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Save Destination</Label>
            <div className="grid grid-cols-2 gap-2">
              <button 
                type="button"
                onClick={() => setCollection('reading-list')}
                className={`py-2 px-3 rounded-xl border text-sm font-medium transition-all ${collection === 'reading-list' ? 'bg-slate-900 border-slate-900 text-white dark:bg-slate-100 dark:border-slate-100 dark:text-slate-900 shadow-md' : 'bg-white dark:bg-black/50 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900/50'}`}
              >
                Reading List
              </button>
              <button 
                type="button"
                onClick={() => setCollection('library')}
                className={`py-2 px-3 rounded-xl border text-sm font-medium transition-all ${collection === 'library' ? 'bg-slate-900 border-slate-900 text-white dark:bg-slate-100 dark:border-slate-100 dark:text-slate-900 shadow-md' : 'bg-white dark:bg-black/50 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900/50'}`}
              >
                Bookshelf
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="url" className="text-xs font-semibold text-slate-500 uppercase tracking-wider">URL</Label>
            <Input 
              id="url" 
              placeholder="https://..." 
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="bg-white dark:bg-black/50 border-slate-200 dark:border-slate-800 focus-visible:ring-1 focus-visible:ring-slate-400 rounded-lg shadow-sm"
            />
          </div>
          
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-white/5 mt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="rounded-xl px-6 border-slate-200 shadow-sm text-slate-700" disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="rounded-xl px-6 bg-slate-900 border border-slate-900 shadow-sm hover:bg-slate-800 text-white flex-1 disabled:opacity-75">
              {isLoading ? 'Extracting...' : 'Save to shelf'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
