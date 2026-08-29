"use client";

import { useCallback, useRef, useState } from "react";

export interface StreamListing {
  listing_id: string;
  title: string;
  rent_per_day: number;
  deposit_amount: number;
  size: string;
  condition: string;
  lister_name: string;
  is_verified: boolean;
  lister_rating: number;
}

export interface StreamMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  listings?: StreamListing[];
  streaming?: boolean;
}

export function useStreamChat(sessionId: string, userId?: string) {
  const [messages, setMessages] = useState<StreamMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const send = useCallback(
    async (message: string) => {
      const userText = message.trim();
      if (!userText || isStreaming) return;

      abortRef.current?.abort();
      abortRef.current = new AbortController();

      const userMessage: StreamMessage = {
        id: crypto.randomUUID(),
        role: "user",
        text: userText,
      };

      const aiId = crypto.randomUUID();
      setMessages((prev) => [
        ...prev,
        userMessage,
        { id: aiId, role: "assistant", text: "", listings: [], streaming: true },
      ]);
      setIsStreaming(true);

      try {
        const res = await fetch("/api/chat/stream", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: userText, sessionId, userId }),
          signal: abortRef.current.signal,
        });

        if (!res.ok) {
          const payload = await res.json().catch(() => ({}));
          throw new Error(payload?.error || "Streaming request failed");
        }
        if (!res.body) throw new Error("Streaming request failed");

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const chunks = buffer.split("\n\n");
          buffer = chunks.pop() ?? "";

          for (const chunk of chunks) {
            if (!chunk.startsWith("data: ")) continue;
            const event = JSON.parse(chunk.slice(6));

            if (event.type === "listings") {
              setMessages((prev) =>
                prev.map((m) => (m.id === aiId ? { ...m, listings: event.data } : m))
              );
              continue;
            }

            if (event.type === "token") {
              setMessages((prev) =>
                prev.map((m) => (m.id === aiId ? { ...m, text: m.text + event.data } : m))
              );
              continue;
            }

            if (event.type === "done") {
              setMessages((prev) =>
                prev.map((m) => (m.id === aiId ? { ...m, streaming: false } : m))
              );
              continue;
            }

            if (event.type === "error") {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === aiId
                    ? {
                        ...m,
                        streaming: false,
                        text:
                          event.data ||
                          "Wren is busy right now. Please try again in a moment, or browse outfits directly.",
                      }
                    : m
                )
              );
            }
          }
        }
      } catch (error: any) {
        if (error?.name !== "AbortError") {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === aiId
                ? {
                    ...m,
                    streaming: false,
                    text:
                      error?.message ||
                      "Wren is busy right now. Please try again in a moment, or browse outfits directly.",
                  }
                : m
            )
          );
        }
      } finally {
        setIsStreaming(false);
      }
    },
    [isStreaming, sessionId, userId]
  );

  const stop = useCallback(() => {
    abortRef.current?.abort();
    setIsStreaming(false);
    setMessages((prev) => prev.map((m) => (m.streaming ? { ...m, streaming: false } : m)));
  }, []);

  return { messages, isStreaming, send, stop, setMessages };
}
