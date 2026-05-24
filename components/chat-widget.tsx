"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { MessageCircle, Mic, Send, Square, X } from "lucide-react";
import { useStreamChat } from "@/hooks/useStreamChat";
import { useVoiceInput } from "@/hooks/useVoiceInput";

const QUICK_PROMPTS = [
  "Find me a wedding lehenga",
  "Show men's formal outfit options",
  "Explain deposit and refunds",
];

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [language, setLanguage] = useState<"en-IN" | "hi-IN">("en-IN");
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const sessionId = useMemo(() => {
    if (typeof window === "undefined") return "wearshare-default";
    const key = "wearshare_chat_session_id";
    const existing = localStorage.getItem(key);
    if (existing) return existing;
    const id = crypto.randomUUID();
    localStorage.setItem(key, id);
    return id;
  }, []);

  const { messages, isStreaming, send, stop, setMessages } = useStreamChat(sessionId);

  const { supported, listening, startListening } = useVoiceInput({
    language,
    onResult: (transcript) => {
      setInput(transcript);
      void send(transcript);
    },
  });

  useEffect(() => {
    if (messages.length > 0) return;
    setMessages([
      {
        id: "intro",
        role: "assistant",
        text: "Hey, I'm Wren. I can help you find outfits, compare prices, and explain deposits and returns.",
      },
    ]);
  }, [messages.length, setMessages]);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, isStreaming]);

  const sendMessage = async (event: React.FormEvent) => {
    event.preventDefault();
    const message = input.trim();
    if (!message || isStreaming) return;

    setInput("");
    await send(message);
  };

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {open && (
        <div className="mb-3 w-[min(360px,calc(100vw-2rem))] overflow-hidden rounded-lg border border-border bg-card shadow-2xl">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-ink">Wren - WearShare assistant</p>
              <p className="text-xs text-muted-foreground">Gemini + RAG listing search</p>
            </div>
            <button
              type="button"
              aria-label="Close chat"
              onClick={() => setOpen(false)}
              className="rounded-md p-2 text-muted-foreground hover:bg-secondary hover:text-ink"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div ref={scrollRef} className="max-h-80 space-y-3 overflow-y-auto px-4 py-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`rounded-lg px-3 py-2 text-sm ${
                  message.role === "user"
                    ? "ml-8 bg-ink text-cream"
                    : "mr-8 bg-secondary text-ink"
                }`}
              >
                {message.text}
                {message.listings && message.listings.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {message.listings.slice(0, 3).map((listing) => (
                      <div key={listing.listing_id} className="rounded-md border border-border bg-card p-2 text-xs">
                        <p className="font-medium text-ink">{listing.title}</p>
                        <p className="text-muted-foreground">
                          ₹{Math.round(listing.rent_per_day)}/day • Size {listing.size} • Deposit ₹{Math.round(listing.deposit_amount)}
                        </p>
                        <p className="text-muted-foreground">
                          {listing.lister_name} {listing.is_verified ? "• Verified" : ""}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {messages.length <= 1 && (
              <div className="flex flex-wrap gap-2">
                {QUICK_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => void send(prompt)}
                    className="rounded-full border border-border bg-background px-3 py-1 text-xs text-muted-foreground hover:border-primary hover:text-ink"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            )}
            {isStreaming && <p className="text-xs text-muted-foreground">Wren is typing...</p>}
          </div>
          <form onSubmit={sendMessage} className="flex gap-2 border-t border-border p-3">
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask about sizing or bookings"
              disabled={isStreaming}
              className="form-input min-w-0 flex-1"
            />
            {supported && (
              <button
                type="button"
                aria-label="Voice input"
                onClick={startListening}
                className={`inline-flex h-10 w-10 items-center justify-center rounded-md ${
                  listening ? "bg-primary text-white" : "bg-secondary text-ink"
                }`}
                title={language === "en-IN" ? "Voice (English India)" : "Voice (Hindi)"}
              >
                <Mic className="h-4 w-4" />
              </button>
            )}
            <button
              type="button"
              onClick={() => setLanguage((prev) => (prev === "en-IN" ? "hi-IN" : "en-IN"))}
              className="inline-flex h-10 items-center justify-center rounded-md bg-secondary px-2 text-[10px] text-ink"
              title="Toggle voice language"
            >
              {language}
            </button>
            {isStreaming && (
              <button
                type="button"
                aria-label="Stop response"
                onClick={stop}
                className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-secondary text-ink"
              >
                <Square className="h-4 w-4" />
              </button>
            )}
            <button
              type="submit"
              aria-label="Send message"
              disabled={isStreaming || !input.trim()}
              className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-primary text-white disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}
      <button
        type="button"
        aria-label="Open chat"
        onClick={() => setOpen((value) => !value)}
        className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-ink text-cream shadow-xl hover:bg-primary"
      >
        <MessageCircle className="h-6 w-6" />
      </button>
    </div>
  );
}
