"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { X, Folder as FolderIcon, PlusCircle } from "lucide-react";
import { Article } from "@/components/ArticleCard";
import { useLibrary } from "@/components/LibraryContext";

interface EditArticleDialogProps {
  article: Article | null;
  onClose: () => void;
}

export function EditArticleDialog({ article, onClose }: EditArticleDialogProps) {
  const { updateArticle, uniqueTags } = useLibrary();

  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [source, setSource] = useState("");
  const [url, setUrl] = useState("");
  const [dateAdded, setDateAdded] = useState("");

  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (article) {
      setTitle(article.title || "");
      setAuthor(article.author || "");
      setSource(article.source || "");
      setUrl(article.url || "");
      setDateAdded(article.dateAdded ? new Date(article.dateAdded).toISOString().split('T')[0] : "");
      setTags(article.tags || []);
      setTagInput("");
    }
  }, [article]);

  const handleAddTag = (e: React.KeyboardEvent | React.FocusEvent) => {
    if (("key" in e && e.key === "Enter") || e.type === "blur") {
      e.preventDefault();
      const val = tagInput.trim().toLowerCase();
      if (val && !tags.includes(val)) {
        setTags([...tags, val]);
      }
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!article) return;
    setIsLoading(true);

    // Convert local date string back to ISO timestamp if changed, preserving time if possible or just setting midnight
    let finalDate = article.dateAdded;
    if (dateAdded) {
      const [year, month, day] = dateAdded.split('-').map(Number);
      const newDate = new Date(year, month - 1, day);
      if (!isNaN(newDate.getTime())) {
        finalDate = newDate.toISOString();
      }
    }

    try {
      updateArticle(article.id, {
        title,
        author,
        source,
        url,
        dateAdded: finalDate,
        tags
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={!!article} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-[#fdfdfd] dark:bg-[#1c1c1e] border border-[#e5e5ea] dark:border-white/10 rounded-2xl shadow-2xl p-6">
        <DialogHeader>
          <DialogTitle className="text-xl font-medium tracking-tight text-slate-900 dark:text-slate-100 font-serif">Edit Article</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4 max-h-[70vh] overflow-y-auto px-1 pb-2 scrollbar-hide">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Title</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} className="bg-white dark:bg-black/50 border-slate-200 dark:border-slate-800 focus-visible:ring-1 focus-visible:ring-slate-400 rounded-lg shadow-sm" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="author" className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Author</Label>
            <Input id="author" value={author} onChange={(e) => setAuthor(e.target.value)} className="bg-white dark:bg-black/50 border-slate-200 dark:border-slate-800 focus-visible:ring-1 focus-visible:ring-slate-400 rounded-lg shadow-sm" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="source" className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Source</Label>
            <Input id="source" value={source} onChange={(e) => setSource(e.target.value)} className="bg-white dark:bg-black/50 border-slate-200 dark:border-slate-800 focus-visible:ring-1 focus-visible:ring-slate-400 rounded-lg shadow-sm" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dateAdded" className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Date Added</Label>
            <Input type="date" id="dateAdded" value={dateAdded} onChange={(e) => setDateAdded(e.target.value)} className="bg-white dark:bg-black/50 border-slate-200 dark:border-slate-800 focus-visible:ring-1 focus-visible:ring-slate-400 rounded-lg shadow-sm" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="url" className="text-xs font-semibold text-slate-500 uppercase tracking-wider">URL</Label>
            <Input id="url" value={url} onChange={(e) => setUrl(e.target.value)} className="bg-white dark:bg-black/50 border-slate-200 dark:border-slate-800 focus-visible:ring-1 focus-visible:ring-slate-400 rounded-lg shadow-sm text-blue-500" />
          </div>

          <div className="space-y-3 pb-2">
            <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1"><FolderIcon className="w-3.5 h-3.5" /> Folders</Label>
            
            {/* Selected Folders Input Area */}
            <div className="p-2 bg-white dark:bg-black/50 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm flex flex-wrap gap-2 items-center min-h-[48px] focus-within:ring-2 focus-within:ring-slate-400 transition-all">
              {tags.map(tag => (
                <span key={tag} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#e5e5ea]/50 dark:bg-white/10 text-slate-800 dark:text-slate-100 text-[13px] rounded-lg shadow-[0_2px_8px_rgba(0,0,0,0.04)] font-medium border border-[#d1d1d6]/50 dark:border-white/5">
                  <FolderIcon className="w-3.5 h-3.5 opacity-70" />
                  {tag}
                  <button type="button" onClick={() => removeTag(tag)} className="hover:text-red-500 transition-colors opacity-50 hover:opacity-100 ml-1"><X className="w-3.5 h-3.5" /></button>
                </span>
              ))}
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleAddTag}
                onBlur={handleAddTag}
                placeholder={tags.length === 0 ? "Type new folder name..." : ""}
                className="flex-1 bg-transparent border-none outline-none text-[13px] min-w-[120px] px-2 h-8"
                onKeyDownCapture={(e) => {
                  if (e.key === 'Enter') e.preventDefault();
                }}
              />
            </div>
            
            {/* Existing Folders Suggestions */}
            {uniqueTags && uniqueTags.filter(t => !tags.includes(t)).length > 0 && (
               <div className="mt-3">
                 <p className="text-[10px] uppercase font-bold text-slate-400 mb-2">Or select existing:</p>
                 <div className="flex flex-wrap gap-2">
                    {uniqueTags.filter(t => !tags.includes(t)).map(tag => (
                       <button 
                         key={tag} 
                         type="button" 
                         onClick={() => setTags([...tags, tag])}
                         className="flex items-center gap-1.5 px-3 py-1.5 bg-transparent border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 text-[12px] rounded-lg transition-colors font-medium"
                       >
                         <PlusCircle className="w-3.5 h-3.5 opacity-60" />
                         {tag}
                       </button>
                    ))}
                 </div>
               </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-white/5 mt-4">
            <Button type="button" variant="outline" onClick={onClose} className="rounded-xl px-6 border-slate-200 shadow-sm text-slate-700">
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="rounded-xl px-6 bg-slate-900 border border-slate-900 shadow-sm hover:bg-slate-800 text-white flex-1 relative">
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
