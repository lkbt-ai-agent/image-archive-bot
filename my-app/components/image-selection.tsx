"use client";

import type { ImageItem } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ImageIcon } from "lucide-react";

type ImageSelectionProps = {
  images: ImageItem[];
  selectedIds: string[];
  onToggle: (id: string) => void;
};

export function ImageSelection({
  images,
  selectedIds,
  onToggle,
}: ImageSelectionProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {images.map((image) => {
        const selected = selectedIds.includes(image.id);

        return (
          <Button
            key={image.id}
            type="button"
            variant={selected ? "secondary" : "outline"}
            className={cn(
              "h-10 shrink-0 rounded-[8px] px-2.5",
              selected && "border-emerald-200 bg-emerald-50 text-emerald-800"
            )}
            onClick={() => onToggle(image.id)}
          >
            <span
              className={cn(
                "flex size-6 items-center justify-center rounded-[6px] bg-gradient-to-br",
                image.gradient
              )}
            >
              <ImageIcon className="size-3 text-foreground/45" />
            </span>
            <span className="max-w-32 truncate text-xs">{image.title}</span>
          </Button>
        );
      })}
    </div>
  );
}
