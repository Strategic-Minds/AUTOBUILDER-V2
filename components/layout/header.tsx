"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell, Plus, ChevronRight, Play, CheckCircle2,
  XCircle, Command, Slash,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const pageMeta: Record<string, { title: string; description: string }> = {
  "/":                { title: "Dashboard",        description: "System overview" },
  "/chat":            { title: "AI Chat",           description: "Multi-agent conversations" },
  "/research":        { title: "Research",          description: "Deep research & analysis" },
  "/computer-use":    { title: "Computer Use",      description: "Browser automation" },
  "/builder":         { title: "Builder",           description: "AI-powered builder" },
  "/website-factory": { title: "Website Factory",   description: "Generate production sites" },
  "/workflow-factory":{ title: "Workflow Factory",  description: "Durable automated workflows" },
  "/agent-factory":   { title: "Agent Factory",     description: "Specialized AI agents" },
  "/leads":           { title: "Lead Pipeline",     description: "Qualify inbound leads" },
  "/crm":             { title: "CRM",               description: "Contacts & relationships" },
  "/projects":        { title: "Projects",          description: "Client deliverables" },
  "/client-portal":   { title: "Client Portal",     description: "Secure client workspace" },
  "/knowledge":       { title: "Knowledge Base",    description: "RAG-ready documents" },
  "/memory":          { title: "Memory",            description: "Organization memory" },
  "/admin":           { title: "Admin",             description: "Control plane" },
  "/funnels":         { title: "Funnel Builder",    description: "Multi-step conversion funnels" },
  "/analytics":       { title: "Analytics",         description: "Performance metrics" },
  "/outreach":        { title: "Outreach",          description: "Sequences & campaigns" },
  "/content":         { title: "Content",           description: "AI content creation" },
};

interface LiveOp {
  id: string;
  label: string;
  status: "running" | "success" | "error";
}

const liveOps: LiveOp[] = [
  { id: "o1", label: "Lead Qualification",  status: "running" },
  { id: "o2", label: "SEO Audit · Done",    status: "success" },
];

// What "New" does per page
const newActionMap: Record<string, { label: string; href?: string; event?: string }> = {
  "/chat":             { label: "New Chat",      href: "/chat?new=1" },
  "/leads":            { label: "New Lead",      event: "new-lead" },
  "/crm":              { label: "New Contact",   event: "new-contact" },
  "/projects":         { label: "New Project",   event: "new-project" },
  "/agent-factory":    { label: "New Agent",     event: "new-agent" },
  "/workflow-factory": { label: "New Workflow",  event: "new-workflow" },
  "/outreach":         { label: "New Sequence",  event: "new-sequence" },
  "/content":          { label: "New Content",   event: "new-content" },
  "/knowledge":        { label: "New Document",  event: "new-document" },
  "/client-portal":    { label: "New Portal",    event: "new-portal" },
  "/research":         { label: "New Research",  event: "new-research" },
  "/builder":          { label: "New Site",      href: "/website-factory" },
  "/website-factory":  { label: "New Site",      href: "/website-factory?new=1" },
};

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const meta = pageMeta[pathname] ?? { title: "XPS Intelligence", description: "" };

  const newAction = newActionMap[pathname];

  function handleNew() {
    if (!newAction) return;
    if (newAction.href) {
      router.push(newAction.href);
    } else if (newAction.event) {
      // Dispatch a custom DOM event that the page component listens for
      window.dispatchEvent(new CustomEvent(newAction.event));
    }
  }

  return (
    <header className="flex items-center h-11 shrink-0 px-4 border-b border-[var(--color-border)] bg-[var(--color-background)] gap-3">

      {/* Breadcrumb */}
      <div className="flex items-center gap-1 flex-1 min-w-0">
        <span className="text-white text-[12px] font-medium hidden sm:block">XPS Intelligence</span>
        <ChevronRight className="w-3 h-3 text-[var(--color-muted-foreground)]/40 hidden sm:block" />
        <span className="text-[12px] font-semibold text-[var(--color-foreground)] truncate">{meta.title}</span>
        {meta.description && (
          <>
            <Slash className="w-3 h-3 text-[var(--color-muted-foreground)]/30 mx-0.5 hidden md:block" />
            <span className="text-[11px] text-[var(--color-muted-foreground)] truncate hidden md:block">{meta.description}</span>
          </>
        )}
      </div>

      {/* Live ops */}
      <div className="hidden lg:flex items-center gap-1.5">
        {liveOps.map((op) => (
          <div
            key={op.id}
            className={cn(
              "flex items-center gap-1.5 px-2 py-1 rounded-md border text-[11px] font-medium transition-colors",
              op.status === "running"
                ? "bg-indigo-500/8 border-indigo-500/20 text-indigo-300"
                : op.status === "success"
                ? "bg-green-500/8 border-green-500/15 text-green-400"
                : "bg-red-500/8 border-red-500/15 text-red-400",
            )}
          >
            {op.status === "running" ? (
              <Play className="w-2.5 h-2.5 fill-current animate-pulse" />
            ) : op.status === "success" ? (
              <CheckCircle2 className="w-2.5 h-2.5" />
            ) : (
              <XCircle className="w-2.5 h-2.5" />
            )}
            <span className="max-w-[140px] truncate">{op.label}</span>
          </div>
        ))}
      </div>

      {/* Divider */}
      <div className="hidden lg:block w-px h-5 bg-[var(--color-border)]" />

      {/* Actions */}
      <div className="flex items-center gap-1">
        {/* Notifications */}
        <Button variant="ghost" size="icon-sm" className="relative">
          <Bell className="w-3.5 h-3.5" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[var(--color-primary)]" />
        </Button>

        {/* New */}
        <Button
          size="sm"
          className="gap-1.5 h-7 px-2.5 text-[12px]"
          onClick={handleNew}
          disabled={!newAction}
          title={newAction ? newAction.label : "Navigate to a page to use New"}
        >
          <Plus className="w-3 h-3" />
          {newAction ? newAction.label : "New"}
        </Button>
      </div>
    </header>
  );
}
