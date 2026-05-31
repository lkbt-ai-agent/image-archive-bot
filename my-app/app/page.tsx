"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { ChatMessage } from "@/components/chat-message";
import { ImageCard } from "@/components/image-card";
import { ImageSelection } from "@/components/image-selection";
import { Button } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
} from "@/components/ui/input-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { UploadArea } from "@/components/upload-area";
import {
  archivedImages,
  chatMessages,
  generatedImages,
  navItems,
  type ImageItem,
  type NavKey,
} from "@/lib/mock-data";
import { Archive, Images, Paperclip, Send, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";

export default function Home() {
  const [activeView, setActiveView] = useState<NavKey>("chat");
  const [selectedIds, setSelectedIds] = useState<string[]>(["arch-3"]);

  const selectableImages = useMemo(
    () => [...archivedImages, ...generatedImages.slice(0, 2)],
    []
  );

  return (
    <SidebarProvider className="h-dvh min-h-0 overflow-hidden bg-slate-50 text-foreground">
      <AppSidebar
        activeView={activeView}
        navItems={navItems}
        onViewChange={setActiveView}
      />

      <SidebarInset className="min-w-0 bg-gradient-to-b from-white via-slate-50 to-rose-50/30">
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-white/85 px-3 backdrop-blur md:px-5">
          <div className="flex min-w-0 items-center gap-2">
            <SidebarTrigger className="md:hidden" aria-label="Open menu" />
            <div className="min-w-0">
              <h1 className="truncate text-base font-semibold">
                {navItems.find((item) => item.key === activeView)?.label}
              </h1>
            </div>
          </div>
          <Button variant="outline" size="sm" className="hidden sm:inline-flex">
            <Sparkles className="size-4" />
            Generate
          </Button>
        </header>

        {activeView === "chat" ? (
          <ChatView
            selectableImages={selectableImages}
            selectedIds={selectedIds}
            onSelectedImagesChange={setSelectedIds}
          />
        ) : (
          <GalleryView
            title={
              activeView === "archived" ? "Archived Images" : "Generated Images"
            }
            description={
              activeView === "archived"
                ? "Reference files, imported assets, and saved source images."
                : "Mock generation results ready for review and reuse."
            }
            images={activeView === "archived" ? archivedImages : generatedImages}
            icon={activeView === "archived" ? Archive : Images}
          />
        )}
      </SidebarInset>
    </SidebarProvider>
  );
}

type ChatViewProps = {
  selectableImages: ImageItem[];
  selectedIds: string[];
  onSelectedImagesChange: (ids: string[]) => void;
};

function ChatView({
  selectableImages,
  selectedIds,
  onSelectedImagesChange,
}: ChatViewProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <ScrollArea className="min-h-0 flex-1">
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-5 px-4 py-6 sm:px-6">
          {chatMessages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))}
        </div>
      </ScrollArea>

      <div className="shrink-0 border-t border-border bg-white/90 p-3 backdrop-blur">
        <div className="mx-auto w-full max-w-4xl space-y-3">
          <UploadArea />
          <ImageSelection
            images={selectableImages}
            selectedIds={selectedIds}
            onChange={onSelectedImagesChange}
          />
          <InputGroup className="rounded-[8px] bg-white">
            <InputGroupTextarea
              placeholder="Ask to archive, compare, or generate images..."
              className="max-h-40 min-h-20"
            />
            <InputGroupAddon align="block-end" className="justify-between">
              <InputGroupButton size="icon-sm" aria-label="Attach image">
                <Paperclip className="size-4" />
              </InputGroupButton>
              <InputGroupButton
                variant="default"
                size="icon-sm"
                aria-label="Send message"
              >
                <Send className="size-4" />
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
        </div>
      </div>
    </div>
  );
}

type GalleryViewProps = {
  title: string;
  description: string;
  images: ImageItem[];
  icon: typeof Archive;
};

function GalleryView({
  title,
  description,
  images,
  icon: Icon,
}: GalleryViewProps) {
  return (
    <ScrollArea className="min-h-0 flex-1">
      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
        <div className="mb-5 flex items-start gap-3">
          <div className="flex size-10 items-center justify-center rounded-[8px] bg-rose-100 text-rose-700">
            <Icon className="size-5" />
          </div>
          <div className="min-w-0">
            <h2 className="text-base font-semibold">{title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {images.map((image, index) => (
            <ImageCard
              key={image.id}
              image={image}
              selected={index === 0}
            />
          ))}
        </div>
      </div>
    </ScrollArea>
  );
}
