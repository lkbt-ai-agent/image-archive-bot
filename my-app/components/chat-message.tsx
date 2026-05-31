import type { ChatMessage as ChatMessageType } from "@/lib/mock-data";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ImageCard } from "@/components/image-card";
import { cn } from "@/lib/utils";
import { Bot, User } from "lucide-react";

type ChatMessageProps = {
  message: ChatMessageType;
};

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <div className={cn("flex gap-3", isUser && "justify-end")}>
      {!isUser ? (
        <Avatar className="mt-1 size-8 rounded-[8px] bg-emerald-100">
          <AvatarFallback className="rounded-[8px] bg-emerald-100 text-emerald-700">
            <Bot className="size-4" />
          </AvatarFallback>
        </Avatar>
      ) : null}
      <div
        className={cn(
          "max-w-[760px] space-y-3",
          isUser && "flex flex-col items-end"
        )}
      >
        <div
          className={cn(
            "rounded-[8px] px-4 py-3 text-sm leading-6 shadow-xs",
            isUser
              ? "bg-foreground text-background"
              : "border border-border bg-white text-foreground"
          )}
        >
          {message.text}
        </div>
        {message.images?.length ? (
          <div className="grid w-full gap-3 sm:grid-cols-2">
            {message.images.map((image) => (
              <ImageCard key={image.id} image={image} compact />
            ))}
          </div>
        ) : null}
      </div>
      {isUser ? (
        <Avatar className="mt-1 size-8 rounded-[8px] bg-sky-100">
          <AvatarFallback className="rounded-[8px] bg-sky-100 text-sky-700">
            <User className="size-4" />
          </AvatarFallback>
        </Avatar>
      ) : null}
    </div>
  );
}
