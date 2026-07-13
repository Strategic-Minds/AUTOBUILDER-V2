"use client";

import * as React from "react";
import { recentLeads, recentRuns, stats, type Lead } from "@/lib/dashboard-data";

export type ViewType = "dashboard" | "leads" | "workflows" | "analytics" | "swarm" | "note";
export type MetricKey = "leads" | "revenue" | "runs" | "agents";

export interface DashboardMetric {
  key: MetricKey;
  label: string;
  value: number;
  format: "number" | "currency";
  icon: "dollar" | "users" | "zap" | "bot";
  change: number;
  trend: "up" | "down";
}

const initialMetrics: DashboardMetric[] = [
  { key: "leads",   label: "Total Leads",   value: stats.totalLeads,   format: "number",   icon: "users",  change: 8,  trend: "up" },
  { key: "revenue", label: "Won Revenue",   value: stats.totalRevenue, format: "currency", icon: "dollar", change: 12, trend: "up" },
  { key: "runs",    label: "Workflow Runs", value: stats.totalRuns,    format: "number",   icon: "zap",    change: 23, trend: "up" },
  { key: "agents",  label: "Active Agents", value: stats.totalAgents,  format: "number",   icon: "bot",    change: 5,  trend: "up" },
];

export interface EditorTab {
  id: string;
  title: string;
  view: ViewType;
  closeable: boolean;
  dirty?: boolean;
  note?: { content: string };
}

export interface ActivityEntry {
  id: string;
  tool: string;
  label: string;
  detail?: string;
  status: "running" | "done" | "error";
  time: string;
}

export interface WorkflowRun {
  id: string;
  label: string;
  status: "running" | "success" | "failed";
  ago: string;
  duration?: number;
}

interface EditorState {
  tabs: EditorTab[];
  activeTabId: string;
  leads: Lead[];
  runs: WorkflowRun[];
  metrics: DashboardMetric[];
  activity: ActivityEntry[];
  highlightedMetric: MetricKey | null;
  agentBusy: boolean;
  consoleOpen: boolean;
}

interface EditorActions {
  setActiveTab: (id: string) => void;
  closeTab: (id: string) => void;
  openView: (view: ViewType, title: string, note?: { content: string }) => string;
  highlightMetric: (metric: MetricKey | null) => void;
  addLead: (lead: Omit<Lead, "id" | "initials"> & { initials?: string }) => void;
  updateLead: (name: string, patch: Partial<Omit<Lead, "id" | "initials">>) => Lead | null;
  removeLead: (name: string) => Lead | null;
  updateMetric: (key: MetricKey, patch: Partial<Pick<DashboardMetric, "value" | "change" | "trend">>) => void;
  runWorkflow: (name: string) => void;
  pushActivity: (entry: Omit<ActivityEntry, "id" | "time">) => string;
  setAgentBusy: (busy: boolean) => void;
  toggleConsole: () => void;
}

const EditorContext = React.createContext<(EditorState & EditorActions) | null>(null);

function now() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}

const initialTabs: EditorTab[] = [
  { id: "tab-dashboard", title: "Dashboard", view: "dashboard", closeable: false },
];

export function EditorProvider({ children }: { children: React.ReactNode }) {
  const [tabs, setTabs] = React.useState<EditorTab[]>(initialTabs);
  const [activeTabId, setActiveTabId] = React.useState("tab-dashboard");
  const [leads, setLeads] = React.useState<Lead[]>(recentLeads);
  const [runs, setRuns] = React.useState<WorkflowRun[]>(recentRuns as WorkflowRun[]);
  const [metrics, setMetrics] = React.useState<DashboardMetric[]>(initialMetrics);
  const [activity, setActivity] = React.useState<ActivityEntry[]>([]);
  const [highlightedMetric, setHighlightedMetric] = React.useState<MetricKey | null>(null);
  const [agentBusy, setAgentBusy] = React.useState(false);
  const [consoleOpen, setConsoleOpen] = React.useState(true);

  // Seed the console on the client only, so timestamps never cause SSR hydration mismatches.
  React.useEffect(() => {
    setActivity([
      { id: "seed", tool: "system", label: "Workspace ready", detail: "Agent connected to editor", status: "done", time: now() },
    ]);
  }, []);

  const pushActivity = React.useCallback((entry: Omit<ActivityEntry, "id" | "time">) => {
    const id = uid("act");
    setActivity((prev) => [...prev, { ...entry, id, time: now() }]);
    return id;
  }, []);

  const setActiveTab = React.useCallback((id: string) => setActiveTabId(id), []);

  const closeTab = React.useCallback((id: string) => {
    setTabs((prev) => {
      const idx = prev.findIndex((t) => t.id === id);
      const next = prev.filter((t) => t.id !== id);
      setActiveTabId((cur) => {
        if (cur !== id) return cur;
        const fallback = next[Math.max(0, idx - 1)] ?? next[0];
        return fallback?.id ?? "tab-dashboard";
      });
      return next.length ? next : initialTabs;
    });
  }, []);

  const openView = React.useCallback((view: ViewType, title: string, note?: { content: string }) => {
    let resultId = "";
    setTabs((prev) => {
      // Reuse an existing tab: non-note views match by view, notes match by title
      const existing =
        view !== "note"
          ? prev.find((t) => t.view === view)
          : prev.find((t) => t.view === "note" && t.title === title);
      if (existing) {
        resultId = existing.id;
        return prev;
      }
      const id = uid("tab");
      resultId = id;
      return [...prev, { id, title, view, closeable: true, note }];
    });
    setActiveTabId(resultId);
    return resultId;
  }, []);

  const highlightMetric = React.useCallback((metric: MetricKey | null) => {
    setHighlightedMetric(metric);
    setActiveTabId("tab-dashboard");
    if (metric) {
      window.setTimeout(() => setHighlightedMetric((cur) => (cur === metric ? null : cur)), 4000);
    }
  }, []);

  const addLead = React.useCallback(
    (lead: Omit<Lead, "id" | "initials"> & { initials?: string }) => {
      const initials =
        lead.initials ??
        lead.name
          .split(" ")
          .map((w) => w[0])
          .join("")
          .slice(0, 2)
          .toUpperCase();
      const newLead: Lead = { ...lead, id: uid("lead"), initials, isNew: true } as Lead;
      setLeads((prev) => [newLead, ...prev]);
      // open the leads view so the action is visible in the editor
      setTabs((prev) => {
        const existing = prev.find((t) => t.view === "leads");
        if (existing) {
          setActiveTabId(existing.id);
          return prev;
        }
        const id = uid("tab");
        setActiveTabId(id);
        return [...prev, { id, title: "Lead Pipeline", view: "leads", closeable: true }];
      });
    },
    [],
  );

  const findLeadIndex = (list: Lead[], name: string) => {
    const q = name.trim().toLowerCase();
    let idx = list.findIndex((l) => l.name.toLowerCase() === q);
    if (idx === -1) idx = list.findIndex((l) => l.name.toLowerCase().includes(q));
    return idx;
  };

  const focusLeads = React.useCallback(() => {
    setTabs((prev) => {
      const existing = prev.find((t) => t.view === "leads");
      if (existing) {
        setActiveTabId(existing.id);
        return prev;
      }
      const id = uid("tab");
      setActiveTabId(id);
      return [...prev, { id, title: "Lead Pipeline", view: "leads", closeable: true }];
    });
  }, []);

  const updateLead = React.useCallback(
    (name: string, patch: Partial<Omit<Lead, "id" | "initials">>) => {
      let updated: Lead | null = null;
      setLeads((prev) => {
        const idx = findLeadIndex(prev, name);
        if (idx === -1) return prev;
        const next = [...prev];
        updated = { ...next[idx], ...patch, updated: "just now", isNew: true };
        next[idx] = updated;
        return next;
      });
      if (updated) focusLeads();
      return updated;
    },
    [focusLeads],
  );

  const removeLead = React.useCallback((name: string) => {
    let removed: Lead | null = null;
    setLeads((prev) => {
      const idx = findLeadIndex(prev, name);
      if (idx === -1) return prev;
      removed = prev[idx];
      return prev.filter((_, i) => i !== idx);
    });
    if (removed) focusLeads();
    return removed;
  }, [focusLeads]);

  const updateMetric = React.useCallback(
    (key: MetricKey, patch: Partial<Pick<DashboardMetric, "value" | "change" | "trend">>) => {
      setMetrics((prev) =>
        prev.map((m) => {
          if (m.key !== key) return m;
          const merged = { ...m, ...patch };
          // Derive trend from change if trend wasn't explicitly provided
          if (patch.change != null && patch.trend == null) {
            merged.trend = patch.change >= 0 ? "up" : "down";
          }
          return merged;
        }),
      );
      setActiveTabId("tab-dashboard");
      setHighlightedMetric(key);
      window.setTimeout(() => setHighlightedMetric((cur) => (cur === key ? null : cur)), 4000);
    },
    [],
  );

  const runWorkflow = React.useCallback((name: string) => {
    const id = uid("run");
    const newRun: WorkflowRun = { id, label: name, status: "running", ago: "just now" };
    setRuns((prev) => [newRun, ...prev].slice(0, 8));
    window.setTimeout(() => {
      setRuns((prev) =>
        prev.map((r) =>
          r.id === id ? { ...r, status: "success", duration: Math.round(4 + Math.random() * 40) } : r,
        ),
      );
    }, 2600);
  }, []);

  const value = React.useMemo(
    () => ({
      tabs,
      activeTabId,
      leads,
      runs,
      metrics,
      activity,
      highlightedMetric,
      agentBusy,
      consoleOpen,
      setActiveTab,
      closeTab,
      openView,
      highlightMetric,
      addLead,
      updateLead,
      removeLead,
      updateMetric,
      runWorkflow,
      pushActivity,
      setAgentBusy,
      toggleConsole: () => setConsoleOpen((v) => !v),
    }),
    [
      tabs, activeTabId, leads, runs, metrics, activity, highlightedMetric, agentBusy, consoleOpen,
      setActiveTab, closeTab, openView, highlightMetric, addLead, updateLead, removeLead,
      updateMetric, runWorkflow, pushActivity,
    ],
  );

  return <EditorContext.Provider value={value}>{children}</EditorContext.Provider>;
}

export function useEditor() {
  const ctx = React.useContext(EditorContext);
  if (!ctx) throw new Error("useEditor must be used within EditorProvider");
  return ctx;
}
