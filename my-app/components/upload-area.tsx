"use client";

import type { ImageItem } from "@/lib/mock-data";
import { ImageSelection } from "@/components/image-selection";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
} from "@/components/ui/input-group";
import { Button } from "@/components/ui/button";
import { ImagePlus, Paperclip, Send, Sparkles, UploadCloud } from "lucide-react";

const commandSuggestions = [
  "Archive references",
  "Compare selected",
  "Generate variants",
];

type UploadAreaProps = {
  images: ImageItem[];
  selectedIds: string[];
  onSelectedImagesChange: (ids: string[]) => void;
};

export function UploadArea({
  images,
  selectedIds,
  onSelectedImagesChange,
}: UploadAreaProps) {
  return (
    <div className="mx-auto w-full max-w-4xl space-y-3">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {commandSuggestions.map((command) => (
          <Button
            key={command}
            type="button"
            variant="outline"
            size="sm"
            className="shrink-0 rounded-full bg-white/95 shadow-xs"
          >
            <Sparkles className="size-3.5" />
            {command}
          </Button>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="shrink-0 rounded-full bg-white/95 shadow-xs"
        >
          <UploadCloud className="size-3.5" />
          Upload image
        </Button>
      </div>

      <ImageSelection
        images={images}
        selectedIds={selectedIds}
        onChange={onSelectedImagesChange}
      />

      <InputGroup className="rounded-[18px] bg-white shadow-lg shadow-slate-200/70">
        <InputGroupTextarea
          placeholder="Ask to archive, compare, or generate images..."
          className="max-h-40 min-h-20 px-3 pt-3"
        />
        <InputGroupAddon align="block-end" className="justify-between px-3">
          <div className="flex items-center gap-1">
            <InputGroupButton size="icon-sm" aria-label="Attach image">
              <Paperclip className="size-4" />
            </InputGroupButton>
            <InputGroupButton size="icon-sm" aria-label="Add image reference">
              <ImagePlus className="size-4" />
            </InputGroupButton>
          </div>
          <InputGroupButton
            variant="default"
            size="icon-sm"
            className="rounded-full"
            aria-label="Send message"
          >
            <Send className="size-4" />
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
    </div>
  );
}
