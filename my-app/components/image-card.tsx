import type { ImageItem } from "@/lib/mock-data";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Check, ImageIcon } from "lucide-react";

type ImageCardProps = {
  image: ImageItem;
  selected?: boolean;
  compact?: boolean;
};

export function ImageCard({ image, selected = false, compact = false }: ImageCardProps) {
  return (
    <Card
      className={cn(
        "overflow-hidden rounded-[8px] border-border bg-white shadow-xs transition-colors",
        selected && "border-emerald-300 ring-2 ring-emerald-100"
      )}
    >
      <CardContent className="p-0">
        <div
          className={cn(
            "relative flex items-center justify-center bg-gradient-to-br",
            image.gradient,
            compact ? "h-24" : "h-40"
          )}
        >
          <ImageIcon className="size-8 text-foreground/35" />
          {selected ? (
            <div className="absolute right-3 top-3 flex size-7 items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm">
              <Check className="size-4" />
            </div>
          ) : null}
        </div>
        <div className="space-y-3 p-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="truncate text-sm font-semibold">{image.title}</h3>
              <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">
                {image.prompt}
              </p>
            </div>
            <Badge className={cn("shrink-0 rounded-[6px]", image.tone)}>
              {image.status}
            </Badge>
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{image.date}</span>
            <span>{image.size}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
