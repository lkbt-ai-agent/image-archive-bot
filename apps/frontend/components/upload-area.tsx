"use client";

import { useLayoutEffect, useRef, useState } from "react";

import type { ArchivedImage } from "@/lib/types";
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
  "Find similar images",
  "Compare selected",
  "Generate variants",
];

type UploadAreaProps = {
  images: ArchivedImage[];
  selectedIds: string[];
  onSelectedImagesChange: (ids: string[]) => void;
  disabled?: boolean;
  uploadDisabled?: boolean;
  onSubmit: (prompt: string) => Promise<void> | void;
  onUpload: (file: File) => Promise<void> | void;
};

export function UploadArea({
  images,
  selectedIds,
  onSelectedImagesChange,
  disabled = false,
  uploadDisabled = false,
  onSubmit,
  onUpload,
}: UploadAreaProps) {
  const [prompt, setPrompt] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useLayoutEffect(() => {
    const textarea = textareaRef.current;

    if (!textarea) {
      return;
    }

    textarea.style.height = "0px";
    textarea.style.height = `${textarea.scrollHeight}px`;
  }, [prompt]);

  async function submitPrompt() {
    const value = prompt.trim();

    if (!value || disabled) {
      return;
    }

    setPrompt("");
    await onSubmit(value);
  }

  async function uploadFile(file: File | undefined) {
    if (!file || uploadDisabled) {
      return;
    }

    await onUpload(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-2">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => uploadFile(event.target.files?.[0])}
      />
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {commandSuggestions.map((command) => (
          <Button
            key={command}
            type="button"
            variant="outline"
            size="sm"
            className="shrink-0 rounded-full bg-background shadow-xs"
            onClick={() => setPrompt(command)}
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
          disabled={uploadDisabled}
          onClick={() => fileInputRef.current?.click()}
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
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              submitPrompt();
            }
          }}
          className="max-h-40 min-h-[40px] overflow-y-auto border-0 bg-transparent px-2 py-2 leading-6"
        />
        <InputGroupAddon align="block-end" className="justify-between px-0 pb-0">
          <div className="flex items-center gap-1">
            <InputGroupButton
              size="icon-sm"
              aria-label="Attach image"
              disabled={uploadDisabled}
              onClick={() => fileInputRef.current?.click()}
            >
              <Paperclip className="size-4" />
            </InputGroupButton>
            <InputGroupButton
              size="icon-sm"
              aria-label="Add image reference"
              disabled={uploadDisabled}
              onClick={() => fileInputRef.current?.click()}
            >
              <ImagePlus className="size-4" />
            </InputGroupButton>
          </div>
          <InputGroupButton
            variant="default"
            size="icon-sm"
            className="rounded-full"
            aria-label="Send message"
            disabled={!prompt.trim() || disabled}
            onClick={submitPrompt}
          >
            <Send className="size-4" />
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
    </div>
  );
}
