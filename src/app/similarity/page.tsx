import type { Metadata } from "next";
import SimilaritySearch from "./SimilaritySearch";

export const metadata: Metadata = {
  title: "Similarity | LeagueScout",
  description: "Find similar players across leagues using Cross-League Comparison",
};

export default function SimilarityPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-text-heading">Cross-League Similarity</h1>
          <p className="text-text-muted mt-1">
            Find players with similar profiles across different leagues and regions.
          </p>
        </div>
        <SimilaritySearch />
      </div>
    </div>
  );
}
