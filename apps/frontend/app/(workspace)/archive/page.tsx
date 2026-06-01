"use client";

import { useEffect, useState } from "react";
import { Archive, RefreshCw } from "lucide-react";

import { ImageCard } from "@/components/image-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api-client";
import type { ArchivedImage } from "@/lib/types";

export default function ArchivePage() {
  const [images, setImages] = useState<ArchivedImage[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadImages() {
    setLoading(true);
    setError(null);

    try {
      if (query.trim()) {
        const results = await api.searchImages(query.trim());
        setImages(results.items.map((item) => item.image));
      } else {
        const payload = await api.listImages({ sourceType: "upload", limit: 48 });
        setImages(payload.items);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load archive.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void Promise.resolve().then(loadImages);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <ScrollArea className="min-h-0 flex-1">
      <div className="mx-auto w-full max-w-6xl px-4 py-6 pt-0 sm:px-6">
        <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex size-10 items-center justify-center rounded-[8px] bg-rose-100 text-rose-700">
              <Archive className="size-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-semibold">Archived Images</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Uploaded references and saved source images from the backend.
              </p>
            </div>
          </div>
          <form
            className="flex w-full gap-2 md:w-[360px]"
            onSubmit={(event) => {
              event.preventDefault();
              loadImages();
            }}
          >
            <Input
              value={query}
              placeholder="Search archive"
              onChange={(event) => setQuery(event.target.value)}
            />
            <Button type="submit">Search</Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="Refresh archive"
              onClick={loadImages}
            >
              <RefreshCw className="size-4" />
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

        {!loading && !error && images.length === 0 ? (
          <div className="rounded-[8px] border border-dashed p-8 text-center text-sm text-muted-foreground">
            No archived images found.
          </div>
        ) : null}

        {!loading && images.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {images.map((image, index) => (
              <ImageCard key={image.id} image={image} selected={index === 0} />
            ))}
          </div>
        ) : null}
      </div>
    </ScrollArea>
  );
}
