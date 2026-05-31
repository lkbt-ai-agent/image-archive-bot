import { Button } from "@/components/ui/button";
import { UploadCloud } from "lucide-react";

export function UploadArea() {
  return (
    <div className="rounded-[8px] border border-dashed border-border bg-slate-50/70 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-[8px] bg-sky-100 text-sky-700">
            <UploadCloud className="size-5" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium">Upload image references</p>
            <p className="text-xs text-muted-foreground">
              PNG, JPG, or WebP mock upload area
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" className="self-start sm:self-auto">
          Browse
        </Button>
      </div>
    </div>
  );
}
