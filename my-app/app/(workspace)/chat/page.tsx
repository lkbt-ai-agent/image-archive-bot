"use client";

import { useMemo, useState } from "react";

import { ChatMessage } from "@/components/chat-message";
import { ScrollArea } from "@/components/ui/scroll-area";
import { UploadArea } from "@/components/upload-area";
import {
  archivedImages,
  chatMessages,
  generatedImages,
} from "@/lib/mock-data";

export default function ChatPage() {
  const [selectedIds, setSelectedIds] = useState<string[]>(["arch-3"]);

  const selectableImages = useMemo(
    () => [...archivedImages, ...generatedImages.slice(0, 2)],
    []
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <ScrollArea className="min-h-0 flex-1">
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-5 px-4 py-6 pb-8 sm:px-6">
          {chatMessages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))}
        </div>
      </ScrollArea>

      <div className="sticky bottom-0 z-10 shrink-0 border-t border-border bg-gradient-to-t from-white via-white/95 to-white/80 px-3 py-3 backdrop-blur">
        <UploadArea
          images={selectableImages}
          selectedIds={selectedIds}
          onSelectedImagesChange={setSelectedIds}
        />
      </div>
    </div>
  );
}
