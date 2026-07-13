"use client";

import * as React from "react";
import {
  X, LayoutDashboard, GitBranch, Workflow, BarChart2, FileText,
  ChevronRight, Terminal, ChevronDown, Circle, Download, Share2,
  Play, CheckCircle2, AlertCircle, Clock, Sparkles, Dot, Network,
} from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dashboard } from "@/components/dashboard/dashboard";
import { SwarmView } from "@/components/swarm/swarm-view";
import { useEditor, type EditorTab, type ViewType } from "@/components/editor/editor-store";

const viewIcons: Record<ViewType, React.ComponentType<{ className?: string }>> = {
  dashboard: LayoutDashboard,
  leads: GitBranch,
  workflows: Workflow,
  analytics: BarChart2,
  swarm: Network,
  note: FileText,
};

export function EditorCanvas() {
  const { tabs, activeTabId, setActiveTab, closeTab, consoleOpen, toggleConsole, agentBusy } = useEditor();
  const activeTab = tabs.find((t) => t.id === activeTabId) ?? tabs[0];

  return (
    <div className="flex flex-col h-full min-w-0 bg-[rgba(6,8,13,0.5)]">
      {/* Tab strip */}
      <div className="flex items-center h-9 shrink-0 border-b border-[var(--color-border)] bg-black/30 overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = viewIcons[tab.view];
          const isActive = tab.id === activeTabId;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "group relative flex items-center gap-1.5 h-full pl-3 pr-2 border-r border-[var(--color-border)] text-[12px] whitespace-nowrap transition-colors",
                isActive
                  ? "bg-[rgba(10,14,22,0.9)] text-[var(--color-foreground)]"
                  : "text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-surface-2)]",
              )}
            >
              {isActive && <span className="absolute top-0 left-0 right-0 h-0.5 bg-[var(--color-electric)]" />}
              <Icon className={cn("w-3.5 h-3.5 shrink-0", isActive ? "text-[var(--color-electric)]" : "opacity-70")} />
              <span className="max-w-[160px] truncate">{tab.title}</span>
              {tab.closeable ? (
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => { e.stopPropagation(); closeTab(tab.id); }}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.stopPropagation(); closeTab(tab.id); } }}
                  className="ml-1 w-4 h-4 rounded flex items-center justify-center hover:bg-[var(--color-surface-4)] opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label={`Close ${tab.title}`}
                >
                  <X className="w-3 h-3" />
                </span>
              ) : (
                <span className="ml-1 w-4 h-4" />
              )}
            </button>
          );
        })}
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2 h-11 shrink-0 px-4 border-b border-[var(--color-border)] bg-black/20">
        <div className="flex items-center gap-1 flex-1 min-w-0 text-[12px]">
          <span className="text-[var(--color-muted-foreground)] hidden sm:inline">Enhanced</span>
          <ChevronRight className="w-3 h-3 text-[var(--color-muted-foreground)]/40 hidden sm:inline" />
          <span className="font-semibold text-[var(--color-foreground)] truncate">{activeTab?.title}</span>
          {agentBusy && (
            <span className="ml-2 flex items-center gap-1 text-[10px] text-[var(--color-electric)]">
              <Sparkles className="w-3 h-3 animate-pulse" /> agent editing
            </span>
          )}
        </div>
        <Button variant="outline" size="sm" className="h-7 gap-1.5 text-[12px]">
          <Download className="w-3 h-3" /> Export
        </Button>
        <Button variant="outline" size="sm" className="h-7 gap-1.5 text-[12px] hidden sm:flex">
          <Share2 className="w-3 h-3" /> Share
        </Button>
        <Button
          variant={consoleOpen ? "secondary" : "ghost"}
          size="sm"
          onClick={toggleConsole}
          className="h-7 gap-1.5 text-[12px]"
        >
          <Terminal className="w-3 h-3" /> Console
        </Button>
      </div>

      {/* Canvas */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {activeTab && <ViewRenderer tab={activeTab} />}
      </div>

      {/* Agent console */}
      <AgentConsole />
    </div>
  );
}

function ViewRenderer({ tab }: { tab: EditorTab }) {
  switch (tab.view) {
    case "dashboard": return <Dashboard />;
    case "leads": return <LeadsView />;
    case "workflows": return <WorkflowsView />;
    case "analytics": return <AnalyticsView />;
    case "swarm": return <SwarmView />;
    case "note": return <NoteView title={tab.title} content={tab.note?.content ?? ""} />;
    default: return null;
  }
}

/* ── Leads view ─────────────────────────────── */
function LeadsView() {
  const { leads } = useEditor();
  return (
    <div className="p-5">
      <Card>
        <CardHeader className="pb-2 px-5 pt-4">
          <CardTitle className="text-[13px] flex items-center gap-2">
            <GitBranch className="w-3.5 h-3.5 text-[var(--color-electric)]" /> Lead Pipeline
          </CardTitle>
          <CardDescription className="text-[11px]">{leads.length} leads · agent additions appear at the top</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="border-b border-[var(--color-border)]">
                  {["Lead", "Company", "Status", "Value", "Score", "Source", "Updated"].map((h) => (
                    <th key={h} className="text-left text-[10px] font-semibold text-[var(--color-muted-foreground)] uppercase tracking-[0.06em] px-5 py-2.5 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => (
                  <tr key={lead.id} className={cn(
                    "border-b border-[var(--color-border)]/60 hover:bg-[var(--color-surface-2)] transition-colors last:border-0",
                    lead.isNew && "bg-[rgba(10,132,255,0.07)]",
                  )}>
                    <td className="px-5 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-[rgba(10,132,255,0.15)] text-[#7cc4ff] text-[9px] font-bold flex items-center justify-center">{lead.initials}</div>
                        <span className="font-medium text-[var(--color-foreground)]">{lead.name}</span>
                        {lead.isNew && <Badge variant="primary">new</Badge>}
                      </div>
                    </td>
                    <td className="px-5 py-2.5 text-[var(--color-muted-foreground)]">{lead.company}</td>
                    <td className="px-5 py-2.5">
                      <Badge variant={
                        lead.status === "won" ? "success" :
                        lead.status === "negotiation" ? "warning" :
                        (lead.status === "qualified" || lead.status === "proposal") ? "primary" : "muted"
                      }>{lead.status}</Badge>
                    </td>
                    <td className="px-5 py-2.5 font-medium text-[var(--color-foreground)] tabular-nums">{lead.value ? formatCurrency(lead.value) : "—"}</td>
                    <td className="px-5 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-12 h-1.5 rounded-full bg-[var(--color-surface-3)] overflow-hidden">
                          <div className={cn("h-full rounded-full", lead.score >= 80 ? "bg-green-500" : lead.score >= 60 ? "bg-amber-500" : "bg-red-500")} style={{ width: `${lead.score}%` }} />
                        </div>
                        <span className="font-semibold text-[var(--color-foreground)] tabular-nums">{lead.score}</span>
                      </div>
                    </td>
                    <td className="px-5 py-2.5 text-[var(--color-muted-foreground)] capitalize">{lead.source}</td>
                    <td className="px-5 py-2.5 text-[var(--color-muted-foreground)]">{lead.updated}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ── Workflows view ─────────────────────────── */
function WorkflowsView() {
  const { runs } = useEditor();
  return (
    <div className="p-5">
      <Card>
        <CardHeader className="pb-2 px-5 pt-4">
          <CardTitle className="text-[13px] flex items-center gap-2">
            <Workflow className="w-3.5 h-3.5 text-[var(--color-electric)]" /> Workflow Activity
          </CardTitle>
          <CardDescription className="text-[11px]">Live runs triggered in the workspace</CardDescription>
        </CardHeader>
        <CardContent className="px-3 pb-3 space-y-0.5">
          {runs.map((run) => (
            <div key={run.id} className="flex items-center gap-2.5 px-2 py-2.5 rounded-lg hover:bg-[var(--color-surface-3)] transition-colors">
              <div className={cn(
                "w-6 h-6 rounded-md flex items-center justify-center shrink-0",
                run.status === "success" && "bg-green-500/10",
                run.status === "running" && "bg-[rgba(10,132,255,0.12)]",
                run.status === "failed" && "bg-red-500/10",
              )}>
                {run.status === "success" && <CheckCircle2 className="w-3 h-3 text-green-400" />}
                {run.status === "running" && <Play className="w-3 h-3 text-[#7cc4ff] animate-pulse" />}
                {run.status === "failed" && <AlertCircle className="w-3 h-3 text-red-400" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[12px] font-medium text-[var(--color-foreground)] truncate">{run.label}</div>
                <div className="text-[10px] text-[var(--color-muted-foreground)]">{run.ago}</div>
              </div>
              {run.duration != null && (
                <span className="text-[10px] text-[var(--color-muted-foreground)] flex items-center gap-0.5 tabular-nums">
                  <Clock className="w-2.5 h-2.5" />{run.duration}s
                </span>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

/* ── Analytics view ─────────────────────────── */
function AnalyticsView() {
  return (
    <div className="p-5">
      <Card>
        <CardHeader className="pb-2 px-5 pt-4">
          <CardTitle className="text-[13px]">Analytics</CardTitle>
          <CardDescription className="text-[11px]">Deeper breakdowns for the current workspace</CardDescription>
        </CardHeader>
        <CardContent className="px-5 pb-5">
          <Dashboard />
        </CardContent>
      </Card>
    </div>
  );
}

/* ── Note view ──────────────────────────────── */
function NoteView({ title, content }: { title: string; content: string }) {
  return (
    <div className="p-5">
      <Card>
        <CardHeader className="pb-2 px-5 pt-4">
          <CardTitle className="text-[13px] flex items-center gap-2">
            <FileText className="w-3.5 h-3.5 text-[var(--color-electric)]" /> {title}
          </CardTitle>
          <CardDescription className="text-[11px]">Generated by the agent</CardDescription>
        </CardHeader>
        <CardContent className="px-5 pb-5">
          <pre className="whitespace-pre-wrap break-words font-sans text-[13px] leading-relaxed text-[var(--color-foreground)]">
            {content}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}

/* ── Agent console (bottom panel) ───────────── */
function AgentConsole() {
  const { activity, consoleOpen, toggleConsole } = useEditor();
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    ref.current?.scrollTo({ top: ref.current.scrollHeight, behavior: "smooth" });
  }, [activity]);

  return (
    <div className="shrink-0 border-t border-[var(--color-border)] bg-black/40">
      <button
        onClick={toggleConsole}
        className="flex items-center gap-2 w-full px-4 h-8 text-[11px] font-semibold text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] transition-colors uppercase tracking-[0.06em]"
      >
        <Terminal className="w-3.5 h-3.5 text-[var(--color-electric)]" />
        Agent Console
        <span className="text-[10px] font-normal normal-case text-[var(--color-muted-foreground)]/70">
          {activity.length} events
        </span>
        {consoleOpen ? <ChevronDown className="w-3.5 h-3.5 ml-auto" /> : <ChevronRight className="w-3.5 h-3.5 ml-auto" />}
      </button>
      {consoleOpen && (
        <div ref={ref} className="h-40 overflow-y-auto px-4 pb-3 font-mono text-[11px] space-y-1">
          {activity.map((entry) => (
            <div key={entry.id} className="flex items-start gap-2 leading-relaxed">
              <span className="text-[var(--color-muted-foreground)]/60 shrink-0 tabular-nums">{entry.time}</span>
              {entry.status === "running"
                ? <Circle className="w-2 h-2 mt-1 shrink-0 text-[var(--color-electric)] animate-pulse fill-current" />
                : entry.status === "error"
                  ? <Dot className="w-3 h-3 mt-0.5 shrink-0 text-red-400" />
                  : <CheckCircle2 className="w-3 h-3 mt-0.5 shrink-0 text-green-400" />}
              <span className="text-[var(--color-electric)]/80 shrink-0">{entry.tool}</span>
              <span className="text-[var(--color-foreground)] break-words">
                {entry.label}
                {entry.detail && <span className="text-[var(--color-muted-foreground)]"> — {entry.detail}</span>}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
