"use client";

import * as React from "react";
import {
  TrendingUp, TrendingDown, DollarSign, Users, Zap, Bot,
  ArrowUpRight, Activity, Clock, CheckCircle2, AlertCircle,
  Play, MoreHorizontal, ExternalLink, ChevronRight, GitBranch,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn, formatCurrency } from "@/lib/utils";
import {
  stats, chartData, sparklines, funnel,
  activeAgents, serviceStatuses,
} from "@/lib/dashboard-data";
import { useEditor } from "@/components/editor/editor-store";

const metricIcons = { dollar: DollarSign, users: Users, zap: Zap, bot: Bot };

function CustomTooltip({
  active, payload, label,
}: {
  active?: boolean;
  payload?: { value: number; name: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[rgba(8,10,16,0.95)] border border-[var(--color-border-hover)] rounded-lg p-3 shadow-2xl shadow-black/60 text-[11px] backdrop-blur-xl">
      <p className="text-[var(--color-muted-foreground)] mb-2 font-medium">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="font-semibold text-[var(--color-foreground)]">
            {p.name === "revenue" ? formatCurrency(p.value) : p.value.toLocaleString()}
          </span>
          <span className="text-[var(--color-muted-foreground)] capitalize">{p.name}</span>
        </div>
      ))}
    </div>
  );
}

export function Dashboard() {
  const { leads: recentLeads, runs: recentRuns, metrics: dashboardMetrics, highlightedMetric } = useEditor();
  return (
    <div className="p-5 space-y-5">
      {/* ── Page header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[18px] font-bold text-[var(--color-foreground)] tracking-tight text-balance">
            Good morning
          </h1>
          <p className="text-[13px] text-[var(--color-muted-foreground)] mt-0.5">
            Here&apos;s your organization at a glance — {stats.totalAgents} agents, {stats.activeWorkflows} active workflows.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--color-surface-2)] border border-[var(--color-border)] text-[11px]">
            <span className="status-dot online" />
            <span className="text-[var(--color-muted-foreground)]">All systems operational</span>
          </div>
          <Button variant="outline" size="sm" className="text-[12px] h-7 gap-1.5">
            <ExternalLink className="w-3 h-3" />
            Export
          </Button>
        </div>
      </div>

      {/* ── KPI cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {dashboardMetrics.map((metric, idx) => {
          const Icon = metricIcons[metric.icon as keyof typeof metricIcons];
          const isUp = metric.trend === "up";
          const spark = sparklines[metric.key];
          const isHighlighted = highlightedMetric === metric.key;
          const displayValue =
            metric.format === "currency" ? formatCurrency(metric.value) : metric.value.toLocaleString();
          return (
            <Card
              key={metric.label}
              className={cn(
                "cursor-pointer transition-shadow",
                isHighlighted && "!border-[var(--color-electric)] shadow-[0_0_28px_-4px_rgba(34,200,255,0.7)]",
              )}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="p-1.5 rounded-lg bg-[var(--color-surface-4)] border border-[var(--color-border)]">
                    <Icon className="w-3.5 h-3.5 text-[var(--color-electric)]" />
                  </div>
                  <span className={cn(
                    "flex items-center gap-0.5 text-[11px] font-semibold tabular-nums",
                    isUp ? "text-green-400" : "text-red-400",
                  )}>
                    {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {Math.abs(metric.change)}%
                  </span>
                </div>
                <div className="text-[22px] font-bold text-[var(--color-foreground)] tracking-tight leading-none tabular-nums">
                  {displayValue}
                </div>
                <div className="text-[11px] text-[var(--color-muted-foreground)] mt-1 mb-3">{metric.label}</div>
                <div className="h-8 -mx-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={spark.map((v, i) => ({ v, i }))} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id={`sg${idx}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor="#22c8ff" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#22c8ff" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <Area type="monotone" dataKey="v" stroke="#22c8ff" strokeWidth={1.5} fill={`url(#sg${idx})`} dot={false} isAnimationActive={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* ── Charts row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2 px-5 pt-4">
            <CardTitle className="text-[13px]">Revenue &amp; Leads</CardTitle>
            <CardDescription className="text-[11px]">Month-over-month activity</CardDescription>
          </CardHeader>
          <CardContent className="px-5 pb-4">
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={chartData} margin={{ top: 0, right: 0, left: -24, bottom: 0 }}>
                <defs>
                  <linearGradient id="gRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#0a84ff" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#0a84ff" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gLead" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#22c8ff" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#22c8ff" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: "#7e8598", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#7e8598", fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="revenue" stroke="#0a84ff" strokeWidth={2} fill="url(#gRev)" isAnimationActive={false} />
                <Area type="monotone" dataKey="leads" stroke="#22c8ff" strokeWidth={1.5} fill="url(#gLead)" isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Funnel */}
        <Card>
          <CardHeader className="pb-3 px-5 pt-4">
            <CardTitle className="text-[13px]">Lead Funnel</CardTitle>
            <CardDescription className="text-[11px]">Conversion stages</CardDescription>
          </CardHeader>
          <CardContent className="px-5 pb-4 space-y-3">
            {(() => {
              const maxCount = Math.max(...funnel.map((s) => s.count), 1);
              const total = funnel.reduce((a, s) => a + s.count, 0);
              const won = funnel.find((s) => s.key === "won")?.count ?? 0;
              const convRate = ((won / total) * 100).toFixed(1);
              return (
                <>
                  {funnel.map((stage) => (
                    <div key={stage.label} className="space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-[var(--color-muted-foreground)]">{stage.label}</span>
                        <span className="font-semibold text-[var(--color-foreground)] tabular-nums">{stage.count}</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-[var(--color-surface-3)] overflow-hidden">
                        <div className={cn("h-full rounded-full transition-all", stage.color)} style={{ width: `${(stage.count / maxCount) * 100}%` }} />
                      </div>
                    </div>
                  ))}
                  <div className="h-px bg-[var(--color-border)] my-1" />
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-[var(--color-muted-foreground)]">Overall conversion</span>
                    <span className="font-bold text-green-400">{convRate}%</span>
                  </div>
                </>
              );
            })()}
          </CardContent>
        </Card>
      </div>

      {/* ── Bottom widgets ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Workflow activity */}
        <Card>
          <CardHeader className="pb-2 px-5 pt-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-[13px]">Workflow Activity</CardTitle>
              <Button variant="ghost" size="icon-sm"><MoreHorizontal className="w-4 h-4" /></Button>
            </div>
          </CardHeader>
          <CardContent className="px-3 pb-3 space-y-0.5">
            {recentRuns.map((run) => (
              <div key={run.id} className="flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-[var(--color-surface-3)] transition-colors cursor-pointer">
                <div className={cn(
                  "w-6 h-6 rounded-md flex items-center justify-center shrink-0",
                  run.status === "success" && "bg-green-500/10",
                  run.status === "running" && "bg-[rgba(10,132,255,0.12)]",
                  run.status === "failed"  && "bg-red-500/10",
                )}>
                  {run.status === "success" && <CheckCircle2 className="w-3 h-3 text-green-400" />}
                  {run.status === "running" && <Play className="w-3 h-3 text-[#7cc4ff] animate-pulse" />}
                  {run.status === "failed"  && <AlertCircle className="w-3 h-3 text-red-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] font-medium text-[var(--color-foreground)] truncate">{run.label}</div>
                  <div className="text-[10px] text-[var(--color-muted-foreground)]">{run.ago}</div>
                </div>
                {run.duration && (
                  <span className="text-[10px] text-[var(--color-muted-foreground)] flex items-center gap-0.5 tabular-nums">
                    <Clock className="w-2.5 h-2.5" />{run.duration}s
                  </span>
                )}
              </div>
            ))}
            <Button variant="ghost" size="sm" className="w-full mt-1 text-[11px] gap-1">
              View all runs <ChevronRight className="w-3 h-3" />
            </Button>
          </CardContent>
        </Card>

        {/* Active agents */}
        <Card>
          <CardHeader className="pb-2 px-5 pt-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-[13px]">Active Agents</CardTitle>
              <Button variant="ghost" size="sm" className="text-[11px] gap-1 h-6">
                All <ArrowUpRight className="w-3 h-3" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="px-3 pb-3 space-y-0.5">
            {activeAgents.map((agent) => (
              <div key={agent.id} className="flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-[var(--color-surface-3)] transition-colors cursor-pointer">
                <div className="w-6 h-6 rounded-md bg-[var(--color-surface-4)] flex items-center justify-center text-[10px] font-bold text-[var(--color-electric)] shrink-0 border border-[var(--color-border)]">
                  {agent.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] font-medium text-[var(--color-foreground)] truncate">{agent.name}</div>
                  <div className="text-[10px] text-[var(--color-muted-foreground)] tabular-nums">{agent.runs.toLocaleString()} runs</div>
                </div>
                <span className={cn(
                  "status-dot",
                  agent.status === "active" && "online",
                  agent.status === "idle"   && "offline",
                  agent.status === "error"  && "error",
                )} />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* System health */}
        <Card>
          <CardHeader className="pb-2 px-5 pt-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-[13px]">System Health</CardTitle>
              <Activity className="w-3.5 h-3.5 text-green-400" />
            </div>
          </CardHeader>
          <CardContent className="px-5 pb-3 space-y-1.5">
            {serviceStatuses.map((svc) => (
              <div key={svc.name} className="flex items-center justify-between py-0.5">
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "status-dot",
                    svc.status === "operational" && "online",
                    svc.status === "degraded"    && "warning",
                    svc.status === "outage"      && "error",
                  )} />
                  <span className="text-[12px] text-[var(--color-foreground)]">{svc.name}</span>
                </div>
                <span className={cn(
                  "text-[10px] font-semibold w-10 text-right",
                  svc.status === "operational" && "text-green-400",
                  svc.status === "degraded"    && "text-amber-400",
                  svc.status === "outage"      && "text-red-400",
                )}>
                  {svc.status === "operational" ? "OK" : svc.status === "degraded" ? "SLOW" : "DOWN"}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* ── Recent leads table ── */}
      <Card>
        <CardHeader className="pb-2 px-5 pt-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-[13px] flex items-center gap-2">
                <GitBranch className="w-3.5 h-3.5 text-[var(--color-electric)]" />
                Recent Leads
              </CardTitle>
              <CardDescription className="text-[11px]">Latest inbound activity</CardDescription>
            </div>
            <Button variant="outline" size="sm" className="text-[12px] h-7 gap-1.5">
              <ExternalLink className="w-3 h-3" />
              Open pipeline
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="border-b border-[var(--color-border)]">
                  {["Lead", "Company", "Status", "Value", "Score", "Source", "Updated"].map((h) => (
                    <th key={h} className="text-left text-[10px] font-semibold text-[var(--color-muted-foreground)] uppercase tracking-[0.06em] px-5 py-2.5 whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentLeads.map((lead) => (
                  <tr key={lead.id} className="border-b border-[var(--color-border)]/60 hover:bg-[var(--color-surface-2)] transition-colors cursor-pointer last:border-0">
                    <td className="px-5 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-[rgba(10,132,255,0.15)] text-[#7cc4ff] text-[9px] font-bold flex items-center justify-center">
                          {lead.initials}
                        </div>
                        <span className="font-medium text-[var(--color-foreground)]">{lead.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-2.5 text-[var(--color-muted-foreground)]">{lead.company}</td>
                    <td className="px-5 py-2.5">
                      <Badge variant={
                        lead.status === "won" ? "success" :
                        lead.status === "negotiation" ? "warning" :
                        (lead.status === "qualified" || lead.status === "proposal") ? "primary" :
                        "muted"
                      }>
                        {lead.status}
                      </Badge>
                    </td>
                    <td className="px-5 py-2.5 font-medium text-[var(--color-foreground)] tabular-nums">
                      {lead.value ? formatCurrency(lead.value) : "—"}
                    </td>
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
