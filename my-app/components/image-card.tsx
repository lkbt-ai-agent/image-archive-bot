import type { ImageItem } from "@/lib/mock-data";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
        <AspectRatio
          ratio={compact ? 16 / 7 : 16 / 9}
          className={cn(
            "relative flex items-center justify-center bg-linear-to-br",
            image.gradient
          )}
        >
          <ImageIcon className="size-8 text-foreground/35" />
          {selected ? (
            <div className="absolute right-3 top-3 flex size-7 items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm">
              <Check className="size-4" />
            </div>
          ) : null}
        </AspectRatio>
      </CardContent>
      <CardHeader className="gap-1 px-3">
        <CardTitle className="truncate text-sm">{image.title}</CardTitle>
        <CardDescription className="line-clamp-2 text-xs leading-5">
          {image.prompt}
        </CardDescription>
        <CardAction>
          <Badge className={cn("shrink-0 rounded-[6px]", image.tone)}>
            {image.status}
          </Badge>
        </CardAction>
      </CardHeader>
      <CardFooter className="justify-between px-3 text-xs text-muted-foreground">
        <span>{image.date}</span>
        <span>{image.size}</span>
      </CardFooter>
    </Card>
  );
}
