"use client";

import * as React from "react";
import {
  Send, ShieldCheck, ShieldAlert, ShieldX, Cpu, CircleCheck, CircleDashed,
  FileText, Users, Radio, Bot, User, GitBranch, ChevronRight, Lock, Gauge,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  SWARM, AGENT_BY_ID, RISK_META, LIFECYCLE, AGENT_TYPE_META,
  type SwarmAgent, type AgentStatus, type RiskClass, type LifecycleState,
} from "@/lib/xtreme-builder";
import { useEditor } from "@/components/editor/editor-store";

/* ── Types for the persistent ledger ───────────────── */
interface AgentReply {
  agentId: string;
  message: string;
  artifact?: { title: string; body: string } | null;
}
interface Validation {
  validatorId: string;
  verdict: "pass" | "concerns" | "blocked";
  score: number;
  notes: string;
}
interface LedgerMessage {
  id: string;
  role: "operator" | "orchestrator" | "system";
  content: string;
  time: string;
  // Orchestrator turn payload
  intent?: string;
  risk?: RiskClass;
  capabilities?: string[];
  routedAgentIds?: string[];
  replies?: AgentReply[];
  validation?: Validation;
  approvalRequired?: boolean;
  lifecycle?: LifecycleState;
}

function now() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
function uid() {
  return Math.random().toString(36).slice(2, 9);
}

const SUGGESTIONS = [
  "Draft the Supabase schema for the persistent chat ledger",
  "Design the MCP tool scopes for the ChatGPT connector",
  "Deploy the new dashboard to production",
  "Plan a durable 24/7 workflow with a 5-minute heartbeat",
];

export function SwarmView() {
  const editor = useEditor();
  const [messages, setMessages] = React.useState<LedgerMessage[]>([]);
  const [presence, setPresence] = React.useState<Record<string, AgentStatus>>({});
  const [input, setInput] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [activeStage, setActiveStage] = React.useState<number>(0);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  // Seed the ledger + presence on the client only (avoids SSR time mismatch).
  React.useEffect(() => {
    setMessages([
      {
        id: "seed",
        role: "system",
        content:
          "Xtreme Builder persistent ledger initialized. 24 specialist agents online under the Master Orchestrator. Production remains locked — all protected actions require operator approval.",
        time: now(),
        lifecycle: "Resolved",
      },
    ]);
    const seeded: Record<string, AgentStatus> = {};
    SWARM.forEach((a, i) => {
      seeded[a.id] = a.id === "AG-001" ? "online" : i % 7 === 0 ? "idle" : "online";
    });
    setPresence(seeded);
  }, []);

  React.useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  async function send(text: string) {
    const content = text.trim();
    if (!content || busy) return;
    setInput("");
    setBusy(true);

    const opMsg: LedgerMessage = { id: uid(), role: "operator", content, time: now(), lifecycle: "Accepted" };
    setMessages((prev) => [...prev, opMsg]);

    // Walk the lifecycle indicator while the orchestrator works.
    setActiveStage(1);
    const walk = window.setInterval(() => setActiveStage((s) => (s < 6 ? s + 1 : s)), 550);

    try {
      const history = messages
        .filter((m) => m.role !== "system")
        .map((m) => ({ role: m.role === "operator" ? "user" : "assistant", agentId: "AG-001", content: m.content }));

      const res = await fetch("/api/swarm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: content, history }),
      });
      if (!res.ok) throw new Error("swarm route failed");
      const turn = await res.json();

      // Mark routed agents busy briefly to simulate the lease/heartbeat.
      const routed: string[] = turn.routedAgentIds ?? [];
      setPresence((prev) => {
        const next = { ...prev };
        routed.forEach((id) => { if (next[id] != null) next[id] = "busy"; });
        return next;
      });

      const orchMsg: LedgerMessage = {
        id: uid(),
        role: "orchestrator",
        content: turn.plan ?? "",
        time: now(),
        intent: turn.classification?.intent,
        risk: turn.classification?.risk,
        capabilities: turn.classification?.capabilities ?? [],
        routedAgentIds: routed,
        replies: turn.agentResponses ?? [],
        validation: turn.validation,
        approvalRequired: !!turn.approvalRequired,
        lifecycle: turn.approvalRequired ? "Routed" : "Resolved",
      };
      setMessages((prev) => [...prev, orchMsg]);

      // Log to the shared Agent Console + emit a receipt.
      editor.pushActivity({
        tool: "orchestrator",
        label: `Routed to ${routed.length} agent${routed.length === 1 ? "" : "s"}`,
        detail: `${RISK_META[turn.classification?.risk as RiskClass]?.label ?? "?"} · validator ${turn.validation?.verdict ?? "?"} ${turn.validation?.score ?? ""}`,
        status: turn.approvalRequired ? "error" : "done",
      });

      window.setTimeout(() => {
        setPresence((prev) => {
          const next = { ...prev };
          routed.forEach((id) => { if (next[id] != null) next[id] = "online"; });
          return next;
        });
      }, 1800);
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: uid(), role: "system", content: "The orchestrator could not complete this turn. The workflow heartbeat will retry from the last checkpoint.", time: now(), lifecycle: "Recovered" },
      ]);
    } finally {
      window.clearInterval(walk);
      setActiveStage(0);
      setBusy(false);
    }
  }

  const onlineCount = Object.values(presence).filter((s) => s === "online" || s === "busy").length;

  return (
    <div className="flex h-full min-h-0">
      {/* Conversation ledger */}
      <div className="flex-1 min-w-0 flex flex-col">
        <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-3">
          {messages.map((m) => <LedgerRow key={m.id} m={m} onOpenArtifact={(t, b) => editor.openView("note", t, { content: b })} />)}
          {busy && <LifecycleTicker activeStage={activeStage} />}
        </div>

        {/* Composer */}
        <div className="shrink-0 border-t border-[var(--color-border)] bg-black/30 p-3">
          {messages.length <= 1 && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="text-[11px] px-2.5 py-1 rounded-full border border-[var(--color-border)] text-[var(--color-muted-foreground)] hover:border-[var(--color-electric)] hover:text-[var(--color-foreground)] transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
          <div className="flex items-end gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing && e.keyCode !== 229) {
                  e.preventDefault();
                  send(input);
                }
              }}
              rows={1}
              placeholder="Message the swarm — the orchestrator will classify, route, and validate…"
              className="flex-1 resize-none bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-[13px] text-[var(--color-foreground)] placeholder:text-[var(--color-muted-foreground)]/60 focus:outline-none focus:border-[var(--color-electric)] max-h-32"
            />
            <button
              onClick={() => send(input)}
              disabled={busy || !input.trim()}
              aria-label="Send"
              className="shrink-0 w-9 h-9 rounded-lg bg-[var(--color-primary)] text-white flex items-center justify-center disabled:opacity-40 hover:brightness-110 transition-all"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Presence roster */}
      <aside className="hidden xl:flex w-64 shrink-0 flex-col border-l border-[var(--color-border)] bg-black/20">
        <div className="shrink-0 px-3 h-10 flex items-center gap-2 border-b border-[var(--color-border)]">
          <Users className="w-3.5 h-3.5 text-[var(--color-electric)]" />
          <span className="text-[12px] font-semibold text-[var(--color-foreground)]">Agent Swarm</span>
          <span className="ml-auto flex items-center gap-1 text-[10px] text-green-400">
            <Radio className="w-3 h-3" /> {onlineCount}/24
          </span>
        </div>
        <div className="flex-1 overflow-y-auto py-1">
          {SWARM.map((a) => <RosterRow key={a.id} agent={a} status={presence[a.id] ?? "online"} />)}
        </div>
      </aside>
    </div>
  );
}

/* ── Presence roster row ─────────────────────── */
function RosterRow({ agent, status }: { agent: SwarmAgent; status: AgentStatus }) {
  const dot =
    status === "busy" ? "bg-[var(--color-electric)] animate-pulse"
    : status === "online" ? "bg-green-400"
    : status === "stalled" ? "bg-red-400" : "bg-[var(--color-muted-foreground)]/50";
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 hover:bg-[var(--color-surface-2)] transition-colors">
      <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", dot)} />
      <div className="min-w-0 flex-1">
        <div className="text-[11px] font-medium text-[var(--color-foreground)] truncate leading-tight">{agent.short}</div>
        <div className="text-[9px] text-[var(--color-muted-foreground)] truncate leading-tight">{agent.id} · {AGENT_TYPE_META[agent.type].label}</div>
      </div>
    </div>
  );
}

/* ── Lifecycle progress ticker ───────────────── */
function LifecycleTicker({ activeStage }: { activeStage: number }) {
  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)]/60 p-3">
      <div className="flex items-center gap-2 mb-2 text-[11px] font-semibold text-[var(--color-electric)]">
        <Cpu className="w-3.5 h-3.5 animate-pulse" /> Master Orchestrator working…
      </div>
      <div className="flex flex-wrap gap-1.5">
        {LIFECYCLE.slice(0, 8).map((l) => {
          const done = l.stage < activeStage;
          const active = l.stage === activeStage;
          return (
            <span
              key={l.stage}
              className={cn(
                "flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded",
                done && "text-green-400",
                active && "text-[var(--color-electric)] bg-[rgba(34,200,255,0.1)]",
                !done && !active && "text-[var(--color-muted-foreground)]/50",
              )}
            >
              {done ? <CircleCheck className="w-2.5 h-2.5" /> : <CircleDashed className={cn("w-2.5 h-2.5", active && "animate-spin")} />}
              {l.state}
            </span>
          );
        })}
      </div>
    </div>
  );
}

/* ── Ledger row renderer ─────────────────────── */
function LedgerRow({ m, onOpenArtifact }: { m: LedgerMessage; onOpenArtifact: (title: string, body: string) => void }) {
  if (m.role === "operator") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] flex items-start gap-2">
          <div className="rounded-2xl rounded-tr-sm bg-[var(--color-primary)] text-white px-3.5 py-2 text-[13px] leading-relaxed">
            {m.content}
            <div className="text-[9px] text-white/60 mt-1">{m.time}</div>
          </div>
          <div className="w-7 h-7 rounded-full bg-[var(--color-surface-4)] flex items-center justify-center shrink-0">
            <User className="w-3.5 h-3.5 text-[var(--color-foreground)]" />
          </div>
        </div>
      </div>
    );
  }

  if (m.role === "system") {
    return (
      <div className="flex justify-center">
        <div className="max-w-[90%] text-center text-[11px] text-[var(--color-muted-foreground)] bg-[var(--color-surface-2)]/50 border border-[var(--color-border)] rounded-lg px-3 py-1.5">
          {m.content}
        </div>
      </div>
    );
  }

  // Orchestrator turn
  return (
    <div className="space-y-2">
      {/* Classification banner */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="w-7 h-7 rounded-full bg-[rgba(34,200,255,0.15)] flex items-center justify-center shrink-0">
          <Cpu className="w-3.5 h-3.5 text-[var(--color-electric)]" />
        </div>
        <span className="text-[12px] font-semibold text-[var(--color-foreground)]">Master Orchestrator</span>
        {m.risk && <RiskBadge risk={m.risk} />}
        {m.capabilities?.slice(0, 4).map((c) => (
          <span key={c} className="text-[9px] px-1.5 py-0.5 rounded bg-[var(--color-surface-3)] text-[var(--color-muted-foreground)]">{c}</span>
        ))}
        <span className="text-[9px] text-[var(--color-muted-foreground)]/60 ml-auto">{m.time}</span>
      </div>

      {m.intent && (
        <div className="ml-9 text-[11px] text-[var(--color-muted-foreground)]">
          <span className="text-[var(--color-foreground)] font-medium">Intent:</span> {m.intent}
        </div>
      )}
      {m.content && <div className="ml-9 text-[13px] text-[var(--color-foreground)] leading-relaxed">{m.content}</div>}

      {/* Approval gate */}
      {m.approvalRequired && (
        <div className="ml-9 flex items-start gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2">
          <Lock className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
          <div className="text-[11px] text-amber-200">
            <span className="font-semibold">Protected action gated.</span> This turn requires operator approval before any protected step runs. Only safe planning and drafts were executed.
            <div className="mt-1.5 flex gap-1.5">
              <button className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-100 border border-amber-500/40 hover:bg-amber-500/30 transition-colors">Approve (operator)</button>
              <button className="text-[10px] px-2 py-0.5 rounded bg-[var(--color-surface-3)] text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] transition-colors">Reject</button>
            </div>
          </div>
        </div>
      )}

      {/* Routed agent replies */}
      <div className="ml-9 space-y-2">
        {m.replies?.map((r, i) => {
          const agent = AGENT_BY_ID[r.agentId];
          if (!agent) return null;
          return (
            <div key={i} className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)]/50 p-2.5">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-5 h-5 rounded-md bg-[var(--color-surface-4)] flex items-center justify-center shrink-0">
                  <Bot className="w-3 h-3 text-[var(--color-electric)]" />
                </div>
                <span className="text-[11px] font-semibold text-[var(--color-foreground)]">{agent.name}</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-[var(--color-surface-3)] text-[var(--color-muted-foreground)]">{agent.id} · {AGENT_TYPE_META[agent.type].label}</span>
              </div>
              <div className="text-[12px] text-[var(--color-foreground)]/90 leading-relaxed">{r.message}</div>
              {r.artifact && (
                <button
                  onClick={() => onOpenArtifact(r.artifact!.title, r.artifact!.body)}
                  className="mt-2 flex items-center gap-1.5 text-[11px] text-[var(--color-electric)] hover:underline"
                >
                  <FileText className="w-3 h-3" /> {r.artifact.title}
                  <ChevronRight className="w-3 h-3" />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Validation receipt */}
      {m.validation && <ValidationReceipt v={m.validation} />}
    </div>
  );
}

function RiskBadge({ risk }: { risk: RiskClass }) {
  const meta = RISK_META[risk];
  const Icon = risk === "safe" ? ShieldCheck : risk === "review" ? ShieldAlert : ShieldX;
  const tone =
    risk === "safe" ? "text-green-400 border-green-500/40 bg-green-500/10"
    : risk === "review" ? "text-amber-300 border-amber-500/40 bg-amber-500/10"
    : "text-red-300 border-red-500/40 bg-red-500/10";
  return (
    <span className={cn("flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded border font-medium", tone)}>
      <Icon className="w-2.5 h-2.5" /> {meta.label}
    </span>
  );
}

function ValidationReceipt({ v }: { v: Validation }) {
  const agent = AGENT_BY_ID[v.validatorId];
  const tone =
    v.verdict === "pass" ? "text-green-400" : v.verdict === "concerns" ? "text-amber-300" : "text-red-300";
  return (
    <div className="ml-9 flex items-center gap-2 rounded-lg border border-[var(--color-border)] bg-black/30 px-3 py-2">
      <Gauge className={cn("w-3.5 h-3.5 shrink-0", tone)} />
      <div className="flex-1 min-w-0">
        <div className="text-[10px] font-semibold text-[var(--color-foreground)]">
          Independent validation · {agent?.short ?? v.validatorId}
          <span className={cn("ml-1.5 uppercase", tone)}>{v.verdict}</span>
          <span className="ml-1.5 text-[var(--color-muted-foreground)] tabular-nums">score {v.score}/100</span>
        </div>
        <div className="text-[10px] text-[var(--color-muted-foreground)] truncate">{v.notes}</div>
      </div>
      <CircleCheck className={cn("w-3.5 h-3.5 shrink-0", tone)} />
    </div>
  );
}
