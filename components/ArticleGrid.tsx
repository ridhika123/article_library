import { Article, ArticleCard } from "./ArticleCard";

interface ArticleGridProps {
  articles: Article[];
  onSelect?: (article: Article) => void;
}

export function ArticleGrid({ articles, onSelect }: ArticleGridProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-6 gap-y-10">
      {articles.map((article) => (
        <ArticleCard key={article.id} article={article} onSelect={onSelect} />
      ))}
    </div>
  );
}
