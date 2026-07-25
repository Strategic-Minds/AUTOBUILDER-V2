"use client";

import * as React from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, lastAssistantMessageIsCompleteWithToolCalls } from "ai";

import {
  Sparkles, ArrowUp, Square, Bot, User, Wrench, LayoutDashboard,
  Target, GitBranch, Zap, FileText, CircleCheck, PencilLine, Trash2, Gauge,
} from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { useEditor, type MetricKey, type ViewType } from "@/components/editor/editor-store";

const toolMeta: Record<string, { icon: React.ComponentType<{ className?: string }>; label: string }> = {
  openView: { icon: LayoutDashboard, label: "Open view" },
  highlightMetric: { icon: Target, label: "Highlight metric" },
  addLead: { icon: GitBranch, label: "Add lead" },
  updateLead: { icon: PencilLine, label: "Update lead" },
  removeLead: { icon: Trash2, label: "Remove lead" },
  updateMetric: { icon: Gauge, label: "Update metric" },
  runWorkflow: { icon: Zap, label: "Run workflow" },
  createNote: { icon: FileText, label: "Create note" },
};

const SUGGESTIONS = [
  "Show me the revenue metric",
  "Add a lead: Priya Shah at Cascade AI, ~$25k",
  "Run the lead enrichment workflow",
  "Draft a follow-up email plan",
];

const viewTitles: Record<string, string> = {
  dashboard: "Dashboard",
  leads: "Lead Pipeline",
  workflows: "Workflow Activity",
  analytics: "Analytics",
};

export function AgentChat() {
  const editor = useEditor();
  const [input, setInput] = React.useState("");
  const scrollRef = React.useRef<HTMLDivElement>(null);

  const { messages, sendMessage, addToolOutput, status, stop } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
    async onToolCall({ toolCall }) {
      if (toolCall.dynamic) return;

      switch (toolCall.toolName) {
        case "openView": {
          const { view, title } = toolCall.input as { view: ViewType; title?: string };
          editor.openView(view, title || viewTitles[view] || "View");
          editor.pushActivity({ tool: "openView", label: `Opened ${viewTitles[view] ?? view}`, status: "done" });
          addToolOutput({ tool: "openView", toolCallId: toolCall.toolCallId, output: `Opened the ${view} view.` });
          break;
        }
        case "highlightMetric": {
          const { metric } = toolCall.input as { metric: MetricKey };
          editor.highlightMetric(metric);
          editor.pushActivity({ tool: "highlightMetric", label: `Highlighted "${metric}" on dashboard`, status: "done" });
          addToolOutput({ tool: "highlightMetric", toolCallId: toolCall.toolCallId, output: `Highlighted the ${metric} metric.` });
          break;
        }
        case "addLead": {
          const lead = toolCall.input as {
            name: string; company: string; value: number; score: number; status: string; source: string;
          };
          editor.addLead({
            name: lead.name, company: lead.company, value: lead.value,
            score: lead.score, status: lead.status, source: lead.source, updated: "just now",
          });
          editor.pushActivity({
            tool: "addLead",
            label: `Added lead ${lead.name}`,
            detail: `${lead.company} · ${formatCurrency(lead.value)} · score ${lead.score}`,
            status: "done",
          });
          addToolOutput({ tool: "addLead", toolCallId: toolCall.toolCallId, output: `Added ${lead.name} (${lead.company}) to the pipeline.` });
          break;
        }
        case "updateLead": {
          const { name, ...patch } = toolCall.input as {
            name: string; status?: string; value?: number; score?: number; company?: string;
          };
          const updated = editor.updateLead(name, patch);
          if (updated) {
            const changes = Object.entries(patch)
              .map(([k, v]) => `${k}: ${k === "value" ? formatCurrency(v as number) : v}`)
              .join(", ");
            editor.pushActivity({ tool: "updateLead", label: `Updated lead ${updated.name}`, detail: changes || undefined, status: "done" });
            addToolOutput({ tool: "updateLead", toolCallId: toolCall.toolCallId, output: `Updated ${updated.name} (${changes || "no changes"}).` });
          } else {
            editor.pushActivity({ tool: "updateLead", label: `No lead found matching "${name}"`, status: "error" });
            addToolOutput({ tool: "updateLead", toolCallId: toolCall.toolCallId, output: `No lead matching "${name}" was found.` });
          }
          break;
        }
        case "removeLead": {
          const { name } = toolCall.input as { name: string };
          const removed = editor.removeLead(name);
          if (removed) {
            editor.pushActivity({ tool: "removeLead", label: `Removed lead ${removed.name}`, detail: removed.company, status: "done" });
            addToolOutput({ tool: "removeLead", toolCallId: toolCall.toolCallId, output: `Removed ${removed.name} from the pipeline.` });
          } else {
            editor.pushActivity({ tool: "removeLead", label: `No lead found matching "${name}"`, status: "error" });
            addToolOutput({ tool: "removeLead", toolCallId: toolCall.toolCallId, output: `No lead matching "${name}" was found.` });
          }
          break;
        }
        case "updateMetric": {
          const { metric, value, change } = toolCall.input as { metric: MetricKey; value?: number; change?: number };
          editor.updateMetric(metric, { value, change });
          const parts: string[] = [];
          if (value != null) parts.push(`value → ${metric === "revenue" ? formatCurrency(value) : value.toLocaleString()}`);
          if (change != null) parts.push(`change → ${change}%`);
          editor.pushActivity({ tool: "updateMetric", label: `Updated ${metric} metric`, detail: parts.join(", ") || undefined, status: "done" });
          addToolOutput({ tool: "updateMetric", toolCallId: toolCall.toolCallId, output: `Updated the ${metric} metric on the dashboard.` });
          break;
        }
        case "runWorkflow": {
          const { name } = toolCall.input as { name: string };
          editor.runWorkflow(name);
          editor.openView("workflows", "Workflow Activity");
          editor.pushActivity({ tool: "runWorkflow", label: `Running "${name}"`, status: "running" });
          window.setTimeout(
            () => editor.pushActivity({ tool: "runWorkflow", label: `Completed "${name}"`, status: "done" }),
            2600,
          );
          addToolOutput({ tool: "runWorkflow", toolCallId: toolCall.toolCallId, output: `Started the "${name}" workflow.` });
          break;
        }
        case "createNote": {
          const { title, content } = toolCall.input as { title: string; content: string };
          editor.openView("note", title, { content });
          editor.pushActivity({ tool: "createNote", label: `Created note "${title}"`, status: "done" });
          addToolOutput({ tool: "createNote", toolCallId: toolCall.toolCallId, output: `Created the note "${title}" in the editor.` });
          break;
        }
      }
    },
  });

  const busy = status === "submitted" || status === "streaming";

  React.useEffect(() => {
    editor.setAgentBusy(busy);
  }, [busy, editor]);

  React.useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, status]);

  function submit(text: string) {
    const value = text.trim();
    if (!value || busy) return;
    sendMessage({ text: value });
    setInput("");
  }

  return (
    <div className="flex flex-col h-full w-full bg-black/40 backdrop-blur-xl">
      {/* Header */}
      <div className="flex items-center gap-2.5 h-11 shrink-0 px-3.5 border-b border-[var(--color-border)]">
        <div className="relative shrink-0">
          <div className="w-6 h-6 rounded-md bg-[var(--color-primary)] flex items-center justify-center shadow-md shadow-[rgba(10,132,255,0.5)]">
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </div>
          <span className={cn(
            "absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-black",
            busy ? "bg-[var(--color-electric)] animate-pulse" : "bg-green-400",
          )} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[12px] font-semibold text-[var(--color-foreground)] leading-none">XPS Agent</div>
          <div className="text-[10px] text-[var(--color-muted-foreground)] mt-0.5 leading-none">
            {busy ? "Working in the editor…" : "Ready · acts on the canvas"}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center text-center px-4 pt-6">
            <div className="w-11 h-11 rounded-xl bg-[var(--color-surface-3)] border border-[var(--color-border)] flex items-center justify-center mb-3">
              <Bot className="w-5 h-5 text-[var(--color-electric)]" />
            </div>
            <h3 className="text-[13px] font-semibold text-[var(--color-foreground)]">Ask the agent to act</h3>
            <p className="text-[11px] text-[var(--color-muted-foreground)] mt-1 leading-relaxed text-pretty">
              Every action runs inside the editor canvas and is logged in the agent console below.
            </p>
            <div className="mt-4 w-full space-y-1.5">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => submit(s)}
                  className="w-full text-left text-[11px] px-2.5 py-2 rounded-lg bg-[var(--color-surface-2)] border border-[var(--color-border)] text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] hover:border-[var(--color-border-hover)] transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((message) => (
          <div key={message.id} className={cn("flex gap-2.5", message.role === "user" && "flex-row-reverse")}>
            <div className={cn(
              "w-6 h-6 rounded-md flex items-center justify-center shrink-0 mt-0.5",
              message.role === "user"
                ? "bg-[var(--color-surface-4)] border border-[var(--color-border)]"
                : "bg-[rgba(10,132,255,0.15)] border border-[rgba(10,132,255,0.3)]",
            )}>
              {message.role === "user"
                ? <User className="w-3 h-3 text-[var(--color-muted-foreground)]" />
                : <Sparkles className="w-3 h-3 text-[var(--color-electric)]" />}
            </div>
            <div className={cn("flex-1 min-w-0 space-y-1.5", message.role === "user" && "flex flex-col items-end")}>
              {message.parts.map((part, i) => {
                if (part.type === "text") {
                  return (
                    <div
                      key={i}
                      className={cn(
                        "inline-block text-[12px] leading-relaxed rounded-xl px-3 py-2 max-w-full whitespace-pre-wrap break-words",
                        message.role === "user"
                          ? "bg-[var(--color-primary)] text-white"
                          : "bg-[var(--color-surface-2)] border border-[var(--color-border)] text-[var(--color-foreground)]",
                      )}
                    >
                      {part.text}
                    </div>
                  );
                }
                if (part.type.startsWith("tool-")) {
                  const toolName = part.type.replace("tool-", "");
                  const meta = toolMeta[toolName] ?? { icon: Wrench, label: toolName };
                  const Icon = meta.icon;
                  // @ts-expect-error - state exists on tool parts
                  const done = part.state === "output-available";
                  return (
                    <div
                      key={i}
                      className="flex items-center gap-2 text-[11px] rounded-lg px-2.5 py-1.5 bg-[rgba(10,132,255,0.08)] border border-[rgba(10,132,255,0.2)] text-[#9fd4ff]"
                    >
                      <Icon className="w-3 h-3 shrink-0" />
                      <span className="font-medium">{meta.label}</span>
                      {done
                        ? <CircleCheck className="w-3 h-3 text-green-400 ml-auto shrink-0" />
                        : <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[var(--color-electric)] animate-pulse shrink-0" />}
                    </div>
                  );
                }
                return null;
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Composer */}
      <div className="shrink-0 p-3 border-t border-[var(--color-border)]">
        <form
          onSubmit={(e) => { e.preventDefault(); submit(input); }}
          className="relative flex items-end gap-2 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)] focus-within:border-[var(--color-border-hover)] transition-colors px-3 py-2"
        >
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing && e.keyCode !== 229) {
                e.preventDefault();
                submit(input);
              }
            }}
            rows={1}
            placeholder="Tell the agent what to do…"
            className="flex-1 resize-none bg-transparent text-[12px] text-[var(--color-foreground)] placeholder:text-[var(--color-muted-foreground)] outline-none max-h-28 py-0.5 leading-relaxed"
          />
          {busy ? (
            <button
              type="button"
              onClick={() => stop()}
              className="shrink-0 w-7 h-7 rounded-lg bg-[var(--color-surface-4)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-foreground)] hover:bg-[var(--color-surface-5)] transition-colors"
              aria-label="Stop"
            >
              <Square className="w-3 h-3 fill-current" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={!input.trim()}
              className="shrink-0 w-7 h-7 rounded-lg bg-[var(--color-primary)] flex items-center justify-center text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[var(--color-primary-hover)] transition-colors"
              aria-label="Send"
            >
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
