import { ChatWorkspace } from "@/app/(workspace)/chat/_components/chat-workspace";

type ChatSessionPageProps = {
  params: Promise<{
    sessionId: string;
  }>;
};

export default async function ChatSessionPage({ params }: ChatSessionPageProps) {
  const { sessionId } = await params;

  return <ChatWorkspace sessionId={sessionId} />;
}
