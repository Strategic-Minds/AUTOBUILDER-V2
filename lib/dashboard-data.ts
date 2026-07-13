export const stats = {
  totalLeads: 1284,
  totalRevenue: 486200,
  totalRuns: 9427,
  totalAgents: 18,
  activeWorkflows: 7,
};

export const chartData = [
  { month: "Jan", leads: 62, revenue: 24000 },
  { month: "Feb", leads: 74, revenue: 31500 },
  { month: "Mar", leads: 88, revenue: 40200 },
  { month: "Apr", leads: 96, revenue: 45800 },
  { month: "May", leads: 112, revenue: 52300 },
  { month: "Jun", leads: 108, revenue: 49900 },
  { month: "Jul", leads: 134, revenue: 61400 },
  { month: "Aug", leads: 149, revenue: 68700 },
  { month: "Sep", leads: 161, revenue: 74100 },
  { month: "Oct", leads: 178, revenue: 82600 },
  { month: "Nov", leads: 193, revenue: 91300 },
  { month: "Dec", leads: 214, revenue: 102800 },
];

export const sparklines: Record<string, number[]> = {
  leads:   [30, 42, 38, 55, 61, 58, 72, 80, 76, 91, 88, 104],
  revenue: [20, 28, 35, 33, 46, 52, 49, 61, 68, 74, 82, 96],
  runs:    [120, 180, 160, 240, 300, 280, 360, 420, 400, 480, 520, 610],
  agents:  [4, 6, 6, 9, 11, 10, 13, 14, 14, 16, 17, 18],
};

export type FunnelStage = { label: string; key: string; count: number; color: string };
export const funnel: FunnelStage[] = [
  { label: "New",       key: "new",       count: 420, color: "bg-[rgba(34,200,255,0.25)]" },
  { label: "Contacted", key: "contacted", count: 312, color: "bg-[rgba(34,200,255,0.45)]" },
  { label: "Qualified", key: "qualified", count: 198, color: "bg-[rgba(10,132,255,0.7)]" },
  { label: "Proposal",  key: "proposal",  count: 96,  color: "bg-[rgba(10,132,255,0.9)]" },
  { label: "Won",       key: "won",       count: 58,  color: "bg-green-500" },
];

export type Run = { id: string; label: string; status: "success" | "running" | "failed"; ago: string; duration?: number };
export const recentRuns: Run[] = [
  { id: "r1", label: "Lead Enrichment Pipeline", status: "success", ago: "2m ago", duration: 12 },
  { id: "r2", label: "Cold Outreach Sequence",   status: "running", ago: "4m ago" },
  { id: "r3", label: "Website SEO Audit",        status: "success", ago: "11m ago", duration: 34 },
  { id: "r4", label: "Content Generation Batch", status: "failed",  ago: "18m ago", duration: 8 },
  { id: "r5", label: "CRM Sync · HubSpot",       status: "success", ago: "26m ago", duration: 5 },
];

export type Agent = { id: string; name: string; status: "active" | "idle" | "error"; runs: number };
export const activeAgents: Agent[] = [
  { id: "a1", name: "Atlas Research", status: "active", runs: 2841 },
  { id: "a2", name: "Nova Outreach",  status: "active", runs: 1930 },
  { id: "a3", name: "Orion Builder",  status: "idle",   runs: 1204 },
  { id: "a4", name: "Echo Support",   status: "active", runs: 987 },
  { id: "a5", name: "Vertex Analyst", status: "error",  runs: 642 },
];

export type Svc = { name: string; status: "operational" | "degraded" | "outage" };
export const serviceStatuses: Svc[] = [
  { name: "AI Gateway",      status: "operational" },
  { name: "Supabase DB",     status: "operational" },
  { name: "Workflow Engine", status: "operational" },
  { name: "Knowledge Index", status: "degraded" },
  { name: "Vector Store",    status: "operational" },
  { name: "Email Relay",     status: "operational" },
];

export type Lead = {
  id: string; name: string; initials: string; company: string;
  status: string; value: number; score: number; source: string; updated: string;
  isNew?: boolean;
};
export const recentLeads: Lead[] = [
  { id: "l1", name: "Marcus Webb",   initials: "MW", company: "Nimbus Labs",     status: "won",         value: 42000, score: 92, source: "referral", updated: "1h ago" },
  { id: "l2", name: "Sara Okafor",   initials: "SO", company: "Vela Dynamics",   status: "proposal",    value: 28500, score: 81, source: "organic",  updated: "3h ago" },
  { id: "l3", name: "Devon Pierce",  initials: "DP", company: "Halcyon Group",   status: "qualified",   value: 19200, score: 74, source: "ads",      updated: "5h ago" },
  { id: "l4", name: "Amara Cole",    initials: "AC", company: "Northwind Co",    status: "negotiation", value: 36400, score: 88, source: "referral", updated: "8h ago" },
  { id: "l5", name: "Kenji Tanaka",  initials: "KT", company: "Sable & Rowe",    status: "new",         value: 0,     score: 51, source: "cold",     updated: "1d ago" },
];
