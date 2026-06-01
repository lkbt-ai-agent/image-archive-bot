export type ImageMetadata = {
  title: string | null;
  description: string | null;
  tags: string[];
  objects: string[];
  colors: string[];
  people_count: number | null;
  location_hint: string | null;
};

export type ArchivedImage = {
  id: string;
  source_type: "upload" | "generated" | string;
  original_filename: string | null;
  mime_type: string;
  file_url: string;
  thumbnail_url: string | null;
  width: number | null;
  height: number | null;
  size_bytes: number | null;
  sha256: string;
  created_at: string;
  metadata: ImageMetadata | null;
};

export type ImageList = {
  items: ArchivedImage[];
  limit: number;
  offset: number;
  total: number;
};

export type SearchResult = {
  image: ArchivedImage;
  score: number | null;
};

export type SearchResults = {
  items: SearchResult[];
};

export type ChatSession = {
  id: string;
  title: string | null;
  created_at: string;
  updated_at: string;
};

export type ChatMessage = {
  id: string;
  session_id: string;
  role: "assistant" | "user" | "system" | string;
  content: string;
  openai_response_id: string | null;
  created_at: string;
  images?: ArchivedImage[];
};

export type ChatSessionDetail = ChatSession & {
  messages: ChatMessage[];
};

export type ChatMessageResponse = {
  user_message: ChatMessage;
  assistant_message: ChatMessage;
  generation_id: string | null;
  image_id: string | null;
  image: ArchivedImage | null;
};

export type Generation = {
  id: string;
  session_id: string | null;
  trigger_message_id: string | null;
  assistant_message_id: string | null;
  prompt: string;
  revised_prompt: string | null;
  image_id: string | null;
  image: ArchivedImage | null;
  status: "queued" | "running" | "succeeded" | "failed" | string;
  error: string | null;
  model: string | null;
  created_at: string;
  completed_at: string | null;
};

export type GenerationList = {
  items: Generation[];
  limit: number;
  offset: number;
  total: number;
};
