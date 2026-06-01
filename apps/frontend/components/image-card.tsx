"use client";

import type { ArchivedImage } from "@/lib/types";
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
import { resolveAssetUrl } from "@/lib/api-client";

type ImageCardProps = {
  image: ArchivedImage;
  selected?: boolean;
  compact?: boolean;
};

function getImageTitle(image: ArchivedImage) {
  return image.metadata?.title ?? image.original_filename ?? "Untitled image";
}

function getImageDescription(image: ArchivedImage) {
  return (
    image.metadata?.description ??
    image.original_filename ??
    `${image.source_type} image`
  );
}

function getImageStatus(image: ArchivedImage) {
  return image.source_type === "generated" ? "Generated" : "Archived";
}

function getImageDate(image: ArchivedImage) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
  }).format(new Date(image.created_at));
}

function getImageSize(image: ArchivedImage) {
  if (image.width && image.height) {
    return `${image.width} x ${image.height}`;
  }

  if (image.size_bytes) {
    return `${Math.round(image.size_bytes / 1024)} KB`;
  }

  return "Unknown";
}

function getTags(image: ArchivedImage) {
  const status = getImageStatus(image);
  const metadataTags = image.metadata?.tags ?? [];

  return [status, ...metadataTags].slice(0, 4);
}

function ImagePreview({
  image,
  className,
  iconClassName,
  original = false,
}: {
  image: ArchivedImage;
  className?: string;
  iconClassName?: string;
  original?: boolean;
}) {
  const src = resolveAssetUrl(original ? image.file_url : image.thumbnail_url ?? image.file_url);

  return (
    <div
      className={cn(
        "flex size-full items-center justify-center bg-muted",
        className
      )}
    >
      {src ? (
        // Backend-served files are user uploads or generated outputs, so use
        // a plain img to avoid remotePatterns requirements during local setup.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={getImageTitle(image)}
          className={cn("size-full", original ? "object-contain" : "object-cover")}
          loading="lazy"
        />
      ) : (
        <ImageIcon className={cn("text-foreground/35", iconClassName)} />
      )}
    </div>
  );
}

export function ImageCard({
  image,
  selected = false,
  compact = false,
}: ImageCardProps) {
  const tags = getTags(image);
  const title = getImageTitle(image);
  const description = getImageDescription(image);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className={cn(
            "group relative block w-full overflow-hidden rounded-xl text-left shadow-sm outline-none ring-1 ring-border transition-all hover:shadow-md focus-visible:ring-3 focus-visible:ring-ring/50",
            selected && "ring-2 ring-emerald-300"
          )}
          aria-label={`Open ${title}`}
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
                {getImageStatus(image)}
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
              <ImagePreview image={image} iconClassName="size-16 md:size-20" original />
            </AspectRatio>
          </div>
          <div className="min-h-0 overflow-y-auto p-4 md:p-5">
            <DialogHeader className="pr-9">
              <DialogTitle className="text-xl">{title}</DialogTitle>
              <DialogDescription className="leading-6">
                {description}
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
                  <dd className="font-medium">{getImageSize(image)}</dd>
                </div>
                <div className="flex items-center justify-between gap-4 border-b border-border pb-3">
                  <dt className="text-muted-foreground">Created</dt>
                  <dd className="font-medium">{getImageDate(image)}</dd>
                </div>
                <div className="flex items-center justify-between gap-4 border-b border-border pb-3">
                  <dt className="text-muted-foreground">Status</dt>
                  <dd className="font-medium">{getImageStatus(image)}</dd>
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
