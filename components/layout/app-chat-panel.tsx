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
  const [input, setInput] = React.useState("");
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  const chatOptions = React.useMemo(() => ({
    transport: new DefaultChatTransport({
      api: "/api/chat",  // Use the existing /api/chat endpoint
    }),
  }), []);

  const { messages, sendMessage, status } = useChat(chatOptions);

  const isStreaming = status === "streaming" || status === "submitted";

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (input.trim()) {
      sendMessage({ text: input.trim() });
      setInput("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col w-[380px] shrink-0 border-r border-[var(--color-border)] bg-[var(--color-surface-1)]">
      {/* Chat Header */}
      <div className="flex items-center gap-2 px-3 py-3 border-b border-[var(--color-border)] shrink-0">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-md bg-indigo-500/15">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          </div>
          <span className="text-[12px] font-semibold text-[var(--color-foreground)]">AI Assistant</span>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 px-3 py-3">
        {messages.length === 0 ? (
          <div className="space-y-3 pt-2">
            <p className="text-[11px] text-[var(--color-muted-foreground)] px-1">How can I help you today?</p>
          </div>
        ) : (
          <div className="space-y-4 pb-2">
            {messages.map((msg) => {
              const isUser = msg.role === "user";
              
              // Handle tool calls
              const toolCalls = msg.parts?.filter((p) => p.type === "tool-use") ?? [];
              const toolResults = msg.parts?.filter((p) => p.type === "tool-result") ?? [];
              
              // Handle text content
              const textParts = msg.parts
                ?.filter((p) => p.type === "text")
                .map((p) => p.text ?? "")
                .join("") ?? "";

              if (!isUser) {
                const hasCode = /```|~~~|import\s+|export\s+|const\s+\w+\s*=|function\s+\w+|className=|<[A-Z]\w+|return\s+|=>/.test(textParts);
                if (hasCode && !textParts.trim()) return null;
              }

              // Only render if there's text or tool calls/results
              if (!textParts?.trim() && toolCalls.length === 0 && toolResults.length === 0) return null;

              return (
                <div key={msg.id} className="space-y-2">
                  {/* Tool Calls */}
                  {toolCalls.map((tc: any, idx) => (
                    <div key={`tool-${msg.id}-${idx}`} className="flex gap-2.5">
                      <div className="w-6 h-6 rounded-md shrink-0 flex items-center justify-center text-[10px] font-bold border mt-0.5 bg-amber-500/20 border-amber-500/30">⚙</div>
                      <div className="flex-1 min-w-0">
                        <div className="rounded-lg px-3 py-2 text-[12px] leading-relaxed bg-amber-500/10 border border-amber-500/20 text-[var(--color-foreground)]">
                          <div className="font-semibold text-amber-300">→ {tc.toolName}</div>
                          {tc.args && <div className="text-[11px] mt-1 opacity-75">{JSON.stringify(tc.args).substring(0, 100)}...</div>}
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Tool Results */}
                  {toolResults.map((tr: any, idx) => (
                    <div key={`result-${msg.id}-${idx}`} className="flex gap-2.5">
                      <div className="w-6 h-6 rounded-md shrink-0 flex items-center justify-center text-[10px] font-bold border mt-0.5 bg-green-500/20 border-green-500/30">✓</div>
                      <div className="flex-1 min-w-0">
                        <div className="rounded-lg px-3 py-2 text-[12px] leading-relaxed bg-green-500/10 border border-green-500/20 text-[var(--color-foreground)]">
                          <div className="text-[11px]">{typeof tr.content === 'string' ? tr.content : JSON.stringify(tr.content).substring(0, 80)}</div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Text Response */}
                  {textParts?.trim() && (
                    <div className={cn("flex gap-2.5", isUser && "flex-row-reverse")}>
                      <div
                        className={cn(
                          "w-6 h-6 rounded-md shrink-0 flex items-center justify-center text-[10px] font-bold border mt-0.5",
                          isUser
                            ? "bg-indigo-500/20 border-indigo-500/30 text-indigo-300"
                            : "bg-[var(--color-surface-4)] border-[var(--color-border)]"
                        )}
                      >
                        {isUser ? "U" : <Sparkles className="w-3 h-3 text-indigo-400" />}
                      </div>

                      <div className={cn("flex-1 min-w-0", isUser && "items-end flex flex-col")}>
                        <div
                          className={cn(
                            "rounded-lg px-3 py-2 text-[12px] leading-relaxed max-w-xs",
                            isUser
                              ? "bg-indigo-600/20 border border-indigo-500/20 text-[var(--color-foreground)]"
                              : "bg-[var(--color-surface-2)] border border-[var(--color-border)] text-[var(--color-foreground)]"
                          )}
                        >
                          {textParts}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </ScrollArea>

      {/* Input */}
      <div className="border-t border-[var(--color-border)] bg-[var(--color-surface-1)] p-3 shrink-0">
        <div className="relative">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask me anything..."
            disabled={isStreaming}
            className="resize-none rounded-lg border bg-[var(--color-surface-2)] p-2.5 text-[12px] placeholder-[var(--color-muted-foreground)] focus-visible:outline-none disabled:opacity-50"
            rows={3}
          />
          <div className="absolute bottom-2 right-2">
            {isStreaming ? (
              <Button size="sm" variant="ghost" className="h-7 gap-1 text-[11px]" disabled>
                <Loader2 className="w-3 h-3 animate-spin" />
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={handleSend}
                disabled={!input.trim()}
                className="h-7 gap-1 text-[11px]"
              >
                <Send className="w-3 h-3" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
