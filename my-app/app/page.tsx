"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { ChatMessage } from "@/components/chat-message";
import { ImageCard } from "@/components/image-card";
import { ImageSelection } from "@/components/image-selection";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { UploadArea } from "@/components/upload-area";
import {
  archivedImages,
  chatMessages,
  generatedImages,
  navItems,
  type ImageItem,
  type NavKey,
} from "@/lib/mock-data";
import { Archive, Images, Menu, Paperclip, Send, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";

export default function Home() {
  const [activeView, setActiveView] = useState<NavKey>("chat");
  const [selectedIds, setSelectedIds] = useState<string[]>(["arch-3"]);

  const selectableImages = useMemo(
    () => [...archivedImages, ...generatedImages.slice(0, 2)],
    []
  );

  function toggleImage(id: string) {
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((selectedId) => selectedId !== id)
        : [...current, id]
    );
  }

  return (
    <main className="flex h-dvh overflow-hidden bg-slate-50 text-foreground">
      <AppSidebar
        activeView={activeView}
        navItems={navItems}
        onViewChange={setActiveView}
      />

      <section className="flex min-w-0 flex-1 flex-col bg-gradient-to-b from-white via-slate-50 to-rose-50/30">
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-white/85 px-3 backdrop-blur md:px-5">
          <div className="flex min-w-0 items-center gap-2">
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="md:hidden"
                  aria-label="Open menu"
                >
                  <Menu className="size-5" />
                </Button>
              </SheetTrigger>
              <SheetContent
                side="left"
                className="w-[300px] max-w-[86vw] p-0"
                showCloseButton={false}
              >
                <SheetHeader className="sr-only">
                  <SheetTitle>Navigation</SheetTitle>
                </SheetHeader>
                <AppSidebar
                  activeView={activeView}
                  navItems={navItems}
                  onViewChange={setActiveView}
                  compact
                />
              </SheetContent>
            </Sheet>
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
            onToggleImage={toggleImage}
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
      </section>
    </main>
  );
}

type ChatViewProps = {
  selectableImages: ImageItem[];
  selectedIds: string[];
  onToggleImage: (id: string) => void;
};

function ChatView({
  selectableImages,
  selectedIds,
  onToggleImage,
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
            onToggle={onToggleImage}
          />
          <div className="rounded-[8px] border border-border bg-white p-2 shadow-sm">
            <Textarea
              placeholder="Ask to archive, compare, or generate images..."
              className="max-h-40 min-h-20 resize-none border-0 bg-transparent shadow-none focus-visible:ring-0"
            />
            <div className="flex items-center justify-between pt-2">
              <Button variant="ghost" size="icon-sm" aria-label="Attach image">
                <Paperclip className="size-4" />
              </Button>
              <Button size="icon-sm" aria-label="Send message">
                <Send className="size-4" />
              </Button>
            </div>
          </div>
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
