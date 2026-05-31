"use client";

import { useLayoutEffect, useRef, useState } from "react";

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
  const [prompt, setPrompt] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useLayoutEffect(() => {
    const textarea = textareaRef.current;

    if (!textarea) {
      return;
    }

    textarea.style.height = "0px";
    textarea.style.height = `${textarea.scrollHeight}px`;
  }, [prompt]);

  return (
    <div className="mx-auto w-full max-w-4xl space-y-2">
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {commandSuggestions.map((command) => (
          <Button
            key={command}
            type="button"
            variant="outline"
            size="sm"
            className="shrink-0 rounded-full bg-background shadow-xs"
          >
            <Sparkles className="size-3.5" />
            {command}
          </Button>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="shrink-0 rounded-full bg-background shadow-xs"
        >
          <UploadCloud className="size-3.5" />
          Upload image
        </Button>
      </div>

      <InputGroup className="rounded-2xl border border-border bg-background p-2 shadow-xs">
        <ImageSelection
          images={images}
          selectedIds={selectedIds}
          onChange={onSelectedImagesChange}
        />
        <InputGroupTextarea
          ref={textareaRef}
          value={prompt}
          placeholder="Ask to archive, compare, or generate images..."
          rows={1}
          onChange={(event) => setPrompt(event.target.value)}
          className="max-h-40 min-h-[40px] overflow-y-auto border-0 bg-transparent px-2 py-2 leading-6"
        />
        <InputGroupAddon align="block-end" className="justify-between px-0 pb-0">
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
