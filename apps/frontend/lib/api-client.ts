import type {
  ArchivedImage,
  ChatMessageResponse,
  ChatSession,
  ChatSessionDetail,
  GenerationList,
  ImageList,
  SearchResults,
} from "@/lib/types";

const DEFAULT_BACKEND_URL = "http://localhost:8000";

function getBackendUrl() {
  return (
    process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/$/, "") ??
    DEFAULT_BACKEND_URL
  );
}

export function resolveAssetUrl(path: string | null | undefined) {
  if (!path) {
    return null;
  }

  if (/^https?:\/\//.test(path)) {
    return path;
  }

  return `${getBackendUrl()}${path.startsWith("/") ? path : `/${path}`}`;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${getBackendUrl()}${path}`, {
    ...init,
    headers:
      init?.body instanceof FormData
        ? init.headers
        : {
            "Content-Type": "application/json",
            ...init?.headers,
          },
  });

  if (!response.ok) {
    let message = `Request failed with ${response.status}`;

    try {
      const payload = (await response.json()) as { detail?: unknown };
      if (typeof payload.detail === "string") {
        message = payload.detail;
      }
    } catch {
      // Keep the status-based fallback when the backend returns a non-JSON error.
    }

    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export const api = {
  listImages(params: { sourceType?: string; q?: string; limit?: number } = {}) {
    const searchParams = new URLSearchParams();

    if (params.sourceType) {
      searchParams.set("source_type", params.sourceType);
    }

    if (params.limit) {
      searchParams.set("limit", String(params.limit));
    }

    const query = searchParams.toString();
    return request<ImageList>(`/api/archive/images${query ? `?${query}` : ""}`);
  },

  uploadImage(file: File) {
    const formData = new FormData();
    formData.set("file", file);

    return request<ArchivedImage>("/api/archive/images", {
      method: "POST",
      body: formData,
    });
  },

  searchImages(query: string) {
    const searchParams = new URLSearchParams({ q: query, limit: "24" });
    return request<SearchResults>(`/api/search?${searchParams.toString()}`);
  },

  semanticSearch(query: string) {
    return request<SearchResults>("/api/search/semantic", {
      method: "POST",
      body: JSON.stringify({ query, limit: 24 }),
    });
  },

  listSessions() {
    return request<ChatSession[]>("/api/chat/sessions");
  },

  createSession(title = "Image workspace") {
    return request<ChatSession>("/api/chat/sessions", {
      method: "POST",
      body: JSON.stringify({ title }),
    });
  },

  getSession(sessionId: string) {
    return request<ChatSessionDetail>(`/api/chat/sessions/${sessionId}`);
  },

  postMessage(
    sessionId: string,
    payload: {
      content: string;
      generation?: { size: string; save_to_archive: boolean };
      image_ids?: string[];
    }
  ) {
    return request<ChatMessageResponse>(`/api/chat/sessions/${sessionId}/messages`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  listGenerations() {
    return request<GenerationList>("/api/generation?limit=24");
  },
};
