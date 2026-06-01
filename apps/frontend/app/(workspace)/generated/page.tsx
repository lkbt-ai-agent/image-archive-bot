"use client";

import { useEffect, useState } from "react";
import { Images, RefreshCw } from "lucide-react";

import { ImageCard } from "@/components/image-card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api-client";
import type { ArchivedImage, Generation } from "@/lib/types";

export default function GeneratedPage() {
  const [images, setImages] = useState<ArchivedImage[]>([]);
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadGenerated() {
    setLoading(true);
    setError(null);

    try {
      const [archivePayload, generationPayload] = await Promise.all([
        api.listImages({ sourceType: "generated", limit: 48 }),
        api.listGenerations(),
      ]);
      setImages(archivePayload.items);
      setGenerations(generationPayload.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load generated images.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void Promise.resolve().then(loadGenerated);
  }, []);

  return (
    <ScrollArea className="min-h-0 flex-1">
      <div className="mx-auto w-full max-w-6xl px-4 py-6 pt-0 sm:px-6">
        <div className="mb-5 flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="flex size-10 items-center justify-center rounded-[8px] bg-rose-100 text-rose-700">
              <Images className="size-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-semibold">Generated Images</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Image generation results saved by chat workflows.
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="Refresh generated images"
            onClick={loadGenerated}
          >
            <RefreshCw className="size-4" />
          </Button>
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
            No generated images found.
          </div>
        ) : null}

        {!loading && images.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {images.map((image, index) => (
              <ImageCard key={image.id} image={image} selected={index === 0} />
            ))}
          </div>
        ) : null}

        {!loading && generations.length > 0 ? (
          <div className="mt-8">
            <h3 className="mb-3 text-sm font-medium">Recent generation jobs</h3>
            <div className="divide-y rounded-[8px] border text-sm">
              {generations.slice(0, 6).map((generation) => (
                <div key={generation.id} className="grid gap-1 p-3 sm:grid-cols-[1fr_auto]">
                  <p className="truncate">{generation.prompt}</p>
                  <span className="text-muted-foreground">{generation.status}</span>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </ScrollArea>
  );
}
