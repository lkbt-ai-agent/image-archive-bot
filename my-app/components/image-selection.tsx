"use client";

import type { ImageItem } from "@/lib/mock-data";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";
import { ImageIcon } from "lucide-react";

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
  return (
    <ScrollArea className="w-full pb-1">
      <ToggleGroup
        type="multiple"
        value={selectedIds}
        onValueChange={onChange}
        variant="outline"
        size="sm"
        className="w-max"
      >
        {images.map((image) => (
          <ToggleGroupItem
            key={image.id}
            value={image.id}
            aria-label={`Select ${image.title}`}
            className="h-10 rounded-[8px] px-2.5 data-[state=on]:border-emerald-200 data-[state=on]:bg-emerald-50 data-[state=on]:text-emerald-800"
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
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}
