"use client";

import type { ImageItem } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { ImageIcon, X } from "lucide-react";

type ImageSelectionProps = {
  images: ImageItem[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
};

export function ImageSelection({
  images,
  selectedIds,
  onChange,
}: ImageSelectionProps) {
  const selectedImages = selectedIds
    .map((id) => images.find((image) => image.id === id))
    .filter((image): image is ImageItem => Boolean(image));

  if (!selectedImages.length) {
    return null;
  }

  function removeImage(id: string) {
    onChange(selectedIds.filter((selectedId) => selectedId !== id));
  }

  return (
    <ScrollArea className="w-full">
      <div className="flex w-max gap-2 pb-2">
        {selectedImages.map((image) => (
          <div
            key={image.id}
            className="relative size-[54px] shrink-0 overflow-hidden rounded-lg border border-border bg-muted shadow-xs sm:size-28 sm:rounded-xl"
          >
            <div
              className={cn(
                "flex size-full items-center justify-center bg-linear-to-br",
                image.gradient
              )}
            >
              <ImageIcon className="size-5 text-foreground/35 sm:size-8" />
            </div>
            <Button
              type="button"
              variant="outline"
              size="icon-xs"
              className="absolute right-1 top-1 size-5 rounded-full bg-background shadow-sm sm:right-1.5 sm:top-1.5 sm:size-6"
              aria-label={`Remove ${image.title}`}
              onClick={() => removeImage(image.id)}
            >
              <X className="size-3 sm:size-3.5" />
            </Button>
          </div>
        ))}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}
