import { Archive } from "lucide-react";

import { ImageCard } from "@/components/image-card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { archivedImages } from "@/lib/mock-data";

export default function ArchivePage() {
  return (
    <ScrollArea className="min-h-0 flex-1">
      <div className="mx-auto w-full max-w-6xl px-4 py-6 pt-0 sm:px-6">
        <div className="mb-5 flex items-start gap-3">
          <div className="flex size-10 items-center justify-center rounded-[8px] bg-rose-100 text-rose-700">
            <Archive className="size-5" />
          </div>
          <div className="min-w-0">
            <h2 className="text-base font-semibold">Archived Images</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Reference files, imported assets, and saved source images.
            </p>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {archivedImages.map((image, index) => (
            <ImageCard key={image.id} image={image} selected={index === 0} />
          ))}
        </div>
      </div>
    </ScrollArea>
  );
}
