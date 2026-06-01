import { Images } from "lucide-react";

import { ImageCard } from "@/components/image-card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { generatedImages } from "@/lib/mock-data";

export default function GeneratedPage() {
  return (
    <ScrollArea className="min-h-0 flex-1">
      <div className="mx-auto w-full max-w-6xl px-4 py-6 pt-0 sm:px-6">
        <div className="mb-5 flex items-start gap-3">
          <div className="flex size-10 items-center justify-center rounded-[8px] bg-rose-100 text-rose-700">
            <Images className="size-5" />
          </div>
          <div className="min-w-0">
            <h2 className="text-base font-semibold">Generated Images</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Mock generation results ready for review and reuse.
            </p>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {generatedImages.map((image, index) => (
            <ImageCard key={image.id} image={image} selected={index === 0} />
          ))}
        </div>
      </div>
    </ScrollArea>
  );
}
