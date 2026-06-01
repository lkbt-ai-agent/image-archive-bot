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
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <ScrollArea className="min-h-0 flex-1">
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-4 px-3 py-3 sm:px-4">
          {chatMessages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))}
        </div>
      </ScrollArea>

      <div className="shrink-0 px-2 py-2">
        <UploadArea
          images={selectableImages}
          selectedIds={selectedIds}
          onSelectedImagesChange={setSelectedIds}
        />
      </div>
    </div>
  );
}
