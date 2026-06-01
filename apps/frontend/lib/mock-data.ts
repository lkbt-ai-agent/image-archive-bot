import type { LucideIcon } from "lucide-react";
import { Archive, Images, MessageSquare } from "lucide-react";

export type NavKey = "chat" | "archived" | "generated";

export type NavItem = {
  key: NavKey;
  label: string;
  icon: LucideIcon;
  count?: number;
};

export type ChatMessage = {
  id: string;
  role: "assistant" | "user";
  text: string;
  images?: ImageItem[];
};

export type ImageItem = {
  id: string;
  title: string;
  prompt: string;
  status: "Archived" | "Generated" | "Selected";
  tone: string;
  date: string;
  size: string;
  gradient: string;
};

export const navItems: NavItem[] = [
  { key: "chat", label: "Chat", icon: MessageSquare },
  { key: "archived", label: "Archived Images", icon: Archive, count: 24 },
  { key: "generated", label: "Generated Images", icon: Images, count: 12 },
];

export const archivedImages: ImageItem[] = [
  {
    id: "arch-1",
    title: "Soft product study",
    prompt: "Studio archive of ceramic product shots with mint accents",
    status: "Archived",
    tone: "bg-emerald-50 text-emerald-700",
    date: "May 29",
    size: "2048 x 2048",
    gradient: "from-emerald-100 via-sky-100 to-white",
  },
  {
    id: "arch-2",
    title: "Editorial desk set",
    prompt: "Reference board for quiet workspace photography",
    status: "Archived",
    tone: "bg-amber-50 text-amber-700",
    date: "May 27",
    size: "1600 x 1200",
    gradient: "from-amber-100 via-rose-100 to-white",
  },
  {
    id: "arch-3",
    title: "Botanical textures",
    prompt: "Pastel botanical material studies for image generation",
    status: "Archived",
    tone: "bg-teal-50 text-teal-700",
    date: "May 24",
    size: "1920 x 1280",
    gradient: "from-teal-100 via-lime-100 to-white",
  },
];

export const generatedImages: ImageItem[] = [
  {
    id: "gen-1",
    title: "Glassmorphism gallery",
    prompt: "Clean image archive dashboard with airy pastel controls",
    status: "Generated",
    tone: "bg-violet-50 text-violet-700",
    date: "Today",
    size: "1024 x 1024",
    gradient: "from-violet-100 via-fuchsia-100 to-white",
  },
  {
    id: "gen-2",
    title: "Coastal archive set",
    prompt: "Minimal coastal image cards for a generation history",
    status: "Generated",
    tone: "bg-cyan-50 text-cyan-700",
    date: "Today",
    size: "1536 x 1024",
    gradient: "from-cyan-100 via-blue-100 to-white",
  },
  {
    id: "gen-3",
    title: "Warm portrait board",
    prompt: "Soft portrait references with peach light and neutral UI",
    status: "Generated",
    tone: "bg-orange-50 text-orange-700",
    date: "Yesterday",
    size: "1024 x 1536",
    gradient: "from-orange-100 via-pink-100 to-white",
  },
];

export const chatMessages: ChatMessage[] = [
  {
    id: "msg-1",
    role: "assistant",
    text: "Send images to archive them, or describe a new image set to generate. I can keep references attached to the prompt while you work.",
  },
  {
    id: "msg-2",
    role: "user",
    text: "Use the latest botanical references and generate a soft product image direction.",
    images: [archivedImages[2]],
  },
  {
    id: "msg-3",
    role: "assistant",
    text: "I drafted three image directions and saved the strongest option in Generated Images.",
    images: [generatedImages[0], generatedImages[2]],
  },
];
