"use client";

import type { ImageItem } from "@/lib/mock-data";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { Check, ImageIcon, MoreVertical } from "lucide-react";

type ImageCardProps = {
  image: ImageItem;
  selected?: boolean;
  compact?: boolean;
};

function getTags(image: ImageItem) {
  const promptTags = image.prompt
    .split(/[\s,]+/)
    .map((word) => word.replace(/[^a-zA-Z]/g, ""))
    .filter((word) => word.length > 5)
    .slice(0, 3);

  return [image.status, ...promptTags];
}

function ImagePreview({
  image,
  className,
  iconClassName,
}: {
  image: ImageItem;
  className?: string;
  iconClassName?: string;
}) {
  return (
    <div
      className={cn(
        "flex size-full items-center justify-center bg-linear-to-br",
        image.gradient,
        className
      )}
    >
      <ImageIcon className={cn("text-foreground/35", iconClassName)} />
    </div>
  );
}

export function ImageCard({
  image,
  selected = false,
  compact = false,
}: ImageCardProps) {
  const tags = getTags(image);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className={cn(
            "group relative block w-full overflow-hidden rounded-xl text-left shadow-sm outline-none ring-1 ring-border transition-all hover:shadow-md focus-visible:ring-3 focus-visible:ring-ring/50",
            selected && "ring-2 ring-emerald-300"
          )}
          aria-label={`Open ${image.title}`}
        >
          <AspectRatio ratio={compact ? 16 / 9 : 4 / 5}>
            <ImagePreview
              image={image}
              iconClassName="size-10"
              className="transition-transform duration-500 ease-out group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-black/5" />
            <div className="absolute left-3 top-3 flex items-center gap-2">
              <Badge className="rounded-full bg-black/40 text-white backdrop-blur-sm">
                {image.status}
              </Badge>
              {selected ? (
                <span className="flex size-6 items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm">
                  <Check className="size-3.5" />
                </span>
              ) : null}
            </div>
            <MoreVertical className="absolute right-3 top-3 size-5 text-white drop-shadow" />
          </AspectRatio>
        </button>
      </DialogTrigger>
      <DialogContent className="max-h-[calc(100dvh-1rem)] gap-0 overflow-hidden p-0 sm:max-w-5xl">
        <div className="grid min-h-0 md:grid-cols-[minmax(0,1.45fr)_minmax(280px,0.55fr)]">
          <div className="min-h-0 bg-muted">
            <AspectRatio ratio={4 / 5} className="h-full max-h-[70dvh] md:max-h-[calc(100dvh-2rem)]">
              <ImagePreview image={image} iconClassName="size-16 md:size-20" />
            </AspectRatio>
          </div>
          <div className="min-h-0 overflow-y-auto p-4 md:p-5">
            <DialogHeader className="pr-9">
              <DialogTitle className="text-xl">{image.title}</DialogTitle>
              <DialogDescription className="leading-6">
                {image.prompt}
              </DialogDescription>
            </DialogHeader>

            <div className="mt-5 space-y-5">
              <div>
                <p className="mb-2 text-xs font-medium uppercase text-muted-foreground">
                  Tags
                </p>
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>

              <dl className="grid gap-3 text-sm">
                <div className="flex items-center justify-between gap-4 border-b border-border pb-3">
                  <dt className="text-muted-foreground">File size</dt>
                  <dd className="font-medium">{image.size}</dd>
                </div>
                <div className="flex items-center justify-between gap-4 border-b border-border pb-3">
                  <dt className="text-muted-foreground">Created</dt>
                  <dd className="font-medium">{image.date}</dd>
                </div>
                <div className="flex items-center justify-between gap-4 border-b border-border pb-3">
                  <dt className="text-muted-foreground">Status</dt>
                  <dd className="font-medium">{image.status}</dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-muted-foreground">Asset ID</dt>
                  <dd className="font-mono text-xs">{image.id}</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
