"use client";

import { useState } from "react";
import { Search, Sparkles } from "lucide-react";

import { ImageCard } from "@/components/image-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api-client";
import type { SearchResult } from "@/lib/types";

type SearchMode = "keyword" | "semantic";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<SearchMode>("keyword");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function runSearch() {
    const value = query.trim();

    if (!value) {
      setResults([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const payload =
        mode === "semantic"
          ? await api.semanticSearch(value)
          : await api.searchImages(value);
      setResults(payload.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to search images.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollArea className="min-h-0 flex-1">
      <div className="mx-auto w-full max-w-6xl px-4 py-6 pt-0 sm:px-6">
        <div className="mb-5 flex flex-col gap-4">
          <div className="flex items-start gap-3">
            <div className="flex size-10 items-center justify-center rounded-[8px] bg-sky-100 text-sky-700">
              {mode === "semantic" ? (
                <Sparkles className="size-5" />
              ) : (
                <Search className="size-5" />
              )}
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-semibold">Search Images</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Search archive metadata by keyword or embedding similarity.
              </p>
            </div>
          </div>

          <form
            className="grid gap-2 md:grid-cols-[180px_minmax(0,1fr)_auto]"
            onSubmit={(event) => {
              event.preventDefault();
              runSearch();
            }}
          >
            <select
              value={mode}
              aria-label="Search mode"
              className="h-9 rounded-md border border-input bg-background px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              onChange={(event) => setMode(event.target.value as SearchMode)}
            >
              <option value="keyword">Keyword</option>
              <option value="semantic">Semantic</option>
            </select>
            <Input
              value={query}
              placeholder="red cyberpunk street scene at night"
              onChange={(event) => setQuery(event.target.value)}
            />
            <Button type="submit" disabled={loading || !query.trim()}>
              Search
            </Button>
          </form>
        </div>

        {error ? (
          <div className="rounded-[8px] border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="aspect-4/5 rounded-xl" />
            ))}
          </div>
        ) : null}

        {!loading && !error && results.length === 0 ? (
          <div className="rounded-[8px] border border-dashed p-8 text-center text-sm text-muted-foreground">
            Enter a query to search archived and generated images.
          </div>
        ) : null}

        {!loading && results.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((result) => (
              <div key={result.image.id} className="space-y-2">
                <ImageCard image={result.image} />
                {typeof result.score === "number" ? (
                  <p className="text-xs text-muted-foreground">
                    Score {result.score.toFixed(3)}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </ScrollArea>
  );
}
