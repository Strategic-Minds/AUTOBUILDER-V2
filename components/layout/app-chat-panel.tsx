"use client";

import * as React from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { Send, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

export function AppChatPanel() {
  const [inputValue, setInputValue] = React.useState("");
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  });
  const isLoading = status === "submitted" || status === "streaming";

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    const text = inputValue.trim();
    if (text && !isLoading) {
      sendMessage({ text });
      setInputValue("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col w-[320px] shrink-0 border-r border-[var(--color-border)] bg-[var(--color-surface-1)]">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-3 border-b border-[var(--color-border)] shrink-0">
        <div className="p-1 rounded-md bg-indigo-500/15">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
        </div>
        <span className="text-[12px] font-semibold text-[var(--color-foreground)]">AI Assistant</span>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 px-3 py-3">
        {messages.length === 0 ? (
          <p className="text-[11px] text-[var(--color-muted-foreground)] px-1 pt-2">How can I help you today?</p>
        ) : (
          <div className="space-y-4 pb-2">
            {messages.map((msg) => {
              const isUser = msg.role === "user";
              const text = msg.parts
                .filter((part) => part.type === "text")
                .map((part) => part.text)
                .join("\n");
              if (!text.trim()) return null;
              return (
                <div key={msg.id} className={cn("flex gap-2.5", isUser && "flex-row-reverse")}>
                  <div className={cn(
                    "w-6 h-6 rounded-md shrink-0 flex items-center justify-center text-[10px] font-bold border mt-0.5",
                    isUser
                      ? "bg-indigo-500/20 border-indigo-500/30 text-indigo-300"
                      : "bg-[var(--color-surface-4)] border-[var(--color-border)]"
                  )}>
                    {isUser ? "U" : <Sparkles className="w-3 h-3 text-indigo-400" />}
                  </div>
                  <div className={cn("flex-1 min-w-0", isUser && "items-end flex flex-col")}>
                    <div className={cn(
                      "rounded-lg px-3 py-2 text-[12px] leading-relaxed max-w-[220px] whitespace-pre-wrap",
                      isUser
                        ? "bg-indigo-600/20 border border-indigo-500/20 text-[var(--color-foreground)]"
                        : "bg-[var(--color-surface-2)] border border-[var(--color-border)] text-[var(--color-foreground)]"
                    )}>
                      {text}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </ScrollArea>

      {/* Input */}
      <div className="border-t border-[var(--color-border)] p-3 shrink-0">
        <div className="relative">
          <Textarea
            ref={textareaRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask me anything..."
            disabled={isLoading}
            className="resize-none rounded-lg border bg-[var(--color-surface-2)] p-2.5 pr-10 text-[12px] placeholder-[var(--color-muted-foreground)] focus-visible:outline-none disabled:opacity-50"
            rows={3}
          />
          <div className="absolute bottom-2 right-2">
            {isLoading ? (
              <Button size="sm" variant="ghost" className="h-7" disabled>
                <Loader2 className="w-3 h-3 animate-spin" />
              </Button>
            ) : (
              <Button size="sm" onClick={handleSend} disabled={!inputValue.trim()} className="h-7">
                <Send className="w-3 h-3" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
