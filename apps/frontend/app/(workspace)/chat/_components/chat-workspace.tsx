"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { ChatMessage } from "@/components/chat-message";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { UploadArea } from "@/components/upload-area";
import { api } from "@/lib/api-client";
import type {
  ArchivedImage,
  ChatMessage as ChatMessageType,
  ChatSession,
} from "@/lib/types";

const welcomeMessage: ChatMessageType = {
  id: "welcome",
  session_id: "local",
  role: "assistant",
  content:
    "Send images to archive them, or describe a new image to generate. Generated results are saved back into the archive.",
  openai_response_id: null,
  created_at: new Date().toISOString(),
};

function wantsGeneration(prompt: string) {
  return /\b(generate|generation|create|draw|image)\b/i.test(prompt);
}

function mapImagesByMessage(messages: ChatMessageType[]) {
  return messages.reduce<Record<string, ArchivedImage[]>>((current, message) => {
    if (message.images?.length) {
      current[message.id] = message.images;
    }

    return current;
  }, {});
}

type ChatWorkspaceProps = {
  sessionId?: string;
};

export function ChatWorkspace({ sessionId }: ChatWorkspaceProps) {
  const router = useRouter();
  const [session, setSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessageType[]>([welcomeMessage]);
  const [messageImages, setMessageImages] = useState<Record<string, ArchivedImage[]>>({});
  const [selectableImages, setSelectableImages] = useState<ArchivedImage[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hydratedMessages = useMemo(
    () =>
      messages.map((message) => ({
        ...message,
        images: message.images ?? messageImages[message.id],
      })),
    [messageImages, messages]
  );

  useEffect(() => {
    let active = true;

    async function initialize() {
      setLoading(true);
      setError(null);
      setSelectedIds([]);

      try {
        const imagesPromise = api.listImages({ limit: 24 });
        const detail = sessionId
          ? await api.getSession(sessionId)
          : await (async () => {
              const sessions = await api.listSessions();
              const currentSession =
                sessions[0] ?? (await api.createSession("Image workspace"));
              router.replace(`/chat/${currentSession.id}`);
              return api.getSession(currentSession.id);
            })();
        const imagePayload = await imagesPromise;

        if (!active) {
          return;
        }

        setSession({
          id: detail.id,
          title: detail.title,
          created_at: detail.created_at,
          updated_at: detail.updated_at,
        });
        setMessages(detail.messages.length ? detail.messages : [welcomeMessage]);
        setMessageImages(mapImagesByMessage(detail.messages));
        setSelectableImages(imagePayload.items);
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : "Unable to start chat.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    initialize();

    return () => {
      active = false;
    };
  }, [router, sessionId]);

  async function sendMessage(prompt: string) {
    if (!session || sending) {
      return;
    }

    const attachedImages = selectableImages.filter((image) =>
      selectedIds.includes(image.id)
    );
    const attachedImageIds = selectedIds;

    setSending(true);
    setError(null);

    try {
      const response = await api.postMessage(session.id, {
        content: prompt,
        image_ids: attachedImageIds,
        generation: wantsGeneration(prompt)
          ? { size: "1024x1024", save_to_archive: true }
          : undefined,
      });

      setMessages((current) => [
        ...current,
        response.user_message,
        response.assistant_message,
      ]);

      if (attachedImages.length && !response.user_message.images?.length) {
        setMessageImages((current) => ({
          ...current,
          [response.user_message.id]: attachedImages,
        }));
      }

      const generatedImage = response.image;

      if (generatedImage && !response.assistant_message.images?.length) {
        setMessageImages((current) => ({
          ...current,
          [response.assistant_message.id]: [generatedImage],
        }));
      }

      if (generatedImage) {
        setSelectableImages((current) => [generatedImage, ...current]);
      }

      window.dispatchEvent(new Event("chat-sessions-changed"));
      setSelectedIds([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to send message.");
    } finally {
      setSending(false);
    }
  }

  async function uploadImage(file: File) {
    setUploading(true);
    setError(null);

    try {
      const image = await api.uploadImage(file);
      setSelectableImages((current) => [image, ...current]);
      setSelectedIds((current) => [image.id, ...current]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to upload image.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <ScrollArea className="min-h-0 flex-1">
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-4 px-3 py-3 sm:px-4">
          {error ? (
            <div className="rounded-[8px] border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
              {error}
            </div>
          ) : null}

          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-16 w-3/4 rounded-[8px]" />
              <Skeleton className="ml-auto h-16 w-2/3 rounded-[8px]" />
            </div>
          ) : (
            hydratedMessages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))
          )}

          {sending ? (
            <div className="flex gap-3">
              <Skeleton className="size-8 rounded-[8px]" />
              <Skeleton className="h-14 w-2/3 rounded-[8px]" />
            </div>
          ) : null}
        </div>
      </ScrollArea>

      <div className="shrink-0 px-2 py-2">
        <UploadArea
          images={selectableImages}
          selectedIds={selectedIds}
          onSelectedImagesChange={setSelectedIds}
          disabled={!session || sending || loading}
          uploadDisabled={uploading}
          onSubmit={sendMessage}
          onUpload={uploadImage}
        />
      </div>
    </div>
  );
}
