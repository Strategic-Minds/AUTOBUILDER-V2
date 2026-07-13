"use client";

import * as React from "react";
import {
  LayoutDashboard, MessageSquare, Hammer, Search, Monitor,
  Globe, Workflow, Bot, Users, FolderKanban, TrendingUp,
  BookOpen, Brain, Settings, ChevronDown, Command,
  Building2, BarChart2, Mail, PenLine, Megaphone,
  ChevronRight, Sparkles, ChevronsUpDown, GitBranch,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useEditor, type ViewType } from "@/components/editor/editor-store";

// Sidebar pages that map to a dedicated editor view.
const PAGE_VIEWS: Record<string, { view: ViewType; title: string }> = {
  "/": { view: "dashboard", title: "Dashboard" },
  "/chat": { view: "swarm", title: "Agent Swarm" },
  "/leads": { view: "leads", title: "Lead Pipeline" },
  "/analytics": { view: "analytics", title: "Analytics" },
  "/workflow-factory": { view: "workflows", title: "Workflow Activity" },
};

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number;
  badgeVariant?: "primary" | "success" | "warning" | "danger";
}

interface NavSection {
  label: string;
  items: NavItem[];
}

const navigation: NavSection[] = [
  {
    label: "Overview",
    items: [
      { label: "Dashboard", href: "/", icon: LayoutDashboard },
      { label: "AI Chat", href: "/chat", icon: MessageSquare },
    ],
  },
  {
    label: "Intelligence",
    items: [
      { label: "Research", href: "/research", icon: Search },
      { label: "Computer Use", href: "/computer-use", icon: Monitor },
      { label: "Knowledge Base", href: "/knowledge", icon: BookOpen },
      { label: "Memory", href: "/memory", icon: Brain },
    ],
  },
  {
    label: "Build",
    items: [
      { label: "Builder", href: "/builder", icon: Hammer },
      { label: "Funnel Builder", href: "/funnels", icon: GitBranch, badge: "New", badgeVariant: "primary" },
      { label: "Website Factory", href: "/website-factory", icon: Globe },
      { label: "Workflow Factory", href: "/workflow-factory", icon: Workflow },
      { label: "Agent Factory", href: "/agent-factory", icon: Bot },
    ],
  },
  {
    label: "CRM",
    items: [
      { label: "Lead Pipeline", href: "/leads", icon: TrendingUp },
      { label: "Contacts", href: "/crm", icon: Users },
      { label: "Projects", href: "/projects", icon: FolderKanban },
      { label: "Client Portal", href: "/client-portal", icon: Building2 },
    ],
  },
  {
    label: "Engage",
    items: [
      { label: "Outreach", href: "/outreach", icon: Mail },
      { label: "Content", href: "/content", icon: PenLine },
      { label: "Campaigns", href: "/campaigns", icon: Megaphone },
    ],
  },
  {
    label: "Analytics",
    items: [{ label: "Analytics", href: "/analytics", icon: BarChart2 }],
  },
  {
    label: "System",
    items: [{ label: "Admin", href: "/admin", icon: Settings }],
  },
];

function NavBadge({ variant, value }: { variant?: NavItem["badgeVariant"]; value: string | number }) {
  return (
    <span className={cn(
      "text-[10px] font-semibold px-1.5 py-0.5 rounded-full leading-none tabular-nums",
      variant === "primary" && "bg-[rgba(10,132,255,0.16)] text-[#7cc4ff]",
      variant === "warning" && "bg-amber-500/15 text-amber-400",
      variant === "success" && "bg-green-500/15 text-green-400",
      variant === "danger"  && "bg-red-500/15 text-red-400",
      !variant              && "bg-[var(--color-surface-4)] text-[var(--color-muted-foreground)]",
    )}>
      {value}
    </span>
  );
}

export function Sidebar({
  displayName = "Jeremy",
  initials = "JX",
}: {
  displayName?: string;
  initials?: string;
}) {
  const { tabs, activeTabId, openView } = useEditor();
  const activeTab = tabs.find((t) => t.id === activeTabId);

  function handleNav(item: NavItem) {
    const dedicated = PAGE_VIEWS[item.href];
    if (dedicated) {
      openView(dedicated.view, dedicated.title);
    } else {
      openView("note", item.label, {
        content: `${item.label}\n\nThis workspace is agent-driven. Ask the XPS Agent in the chat panel to build, populate, or run "${item.label}" and the results will appear right here in the editor.`,
      });
    }
  }

  function isNavActive(item: NavItem) {
    const dedicated = PAGE_VIEWS[item.href];
    if (dedicated) return activeTab?.view === dedicated.view;
    return activeTab?.view === "note" && activeTab.title === item.label;
  }

  return (
    <aside className="hidden md:flex flex-col h-screen w-[216px] shrink-0 bg-[var(--color-sidebar)] backdrop-blur-xl border-r border-[var(--color-sidebar-border)] select-none">

      {/* Workspace switcher */}
      <div className="px-3 pt-3.5 pb-2.5 border-b border-[var(--color-sidebar-border)]">
        <button className="flex items-center gap-2.5 w-full px-2 py-1.5 rounded-md hover:bg-[var(--color-surface-3)] transition-colors cursor-pointer">
          <div className="flex items-center justify-center w-7 h-7 rounded-md bg-black overflow-hidden shrink-0 ring-1 ring-[var(--color-border)]">
            <img
              src="/images/xps-logo.jpg"
              alt="Xtreme Polishing Systems logo"
              className="w-full h-full object-contain"
            />
          </div>
          <div className="flex-1 min-w-0 text-left">
            <div className="text-[13px] font-semibold text-white leading-none truncate">Xtreme Auto Builder</div>
            <div className="text-[10px] text-[var(--color-muted-foreground)] mt-0.5 leading-none">Enhanced · v3.0</div>
          </div>
          <ChevronsUpDown className="w-3.5 h-3.5 text-[var(--color-muted-foreground)] shrink-0 opacity-60" />
        </button>
      </div>

      {/* Command search */}
      <div className="px-3 py-2">
        <button className="flex items-center gap-2 w-full px-2.5 py-1.5 rounded-md bg-[var(--color-surface-2)] border border-[var(--color-border)] text-[12px] text-[var(--color-muted-foreground)] hover:border-[var(--color-border-hover)] hover:text-[var(--color-foreground)] transition-all cursor-pointer">
          <Command className="w-3 h-3 shrink-0" />
          <span className="flex-1 text-left">Search or jump to...</span>
          <div className="flex items-center gap-0.5">
            <kbd className="px-1 py-0.5 text-[10px] rounded bg-[var(--color-surface-3)] border border-[var(--color-border)] font-mono leading-none">⌘</kbd>
            <kbd className="px-1 py-0.5 text-[10px] rounded bg-[var(--color-surface-3)] border border-[var(--color-border)] font-mono leading-none">K</kbd>
          </div>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 pb-2 space-y-3">
        {navigation.map((section) => (
          <div key={section.label}>
            <div className="px-2 mb-0.5 text-[10px] font-semibold text-[var(--color-muted-foreground)]/60 uppercase tracking-[0.08em]">
              {section.label}
            </div>
            <div className="flex flex-col gap-px">
              {section.items.map((item) => {
                const isActive = isNavActive(item);
                return (
                  <a
                    key={item.href}
                    href={item.href}
                    onClick={(e) => { e.preventDefault(); handleNav(item); }}
                    className={cn("nav-item", isActive && "active")}
                  >
                    <item.icon className={cn(
                      "nav-icon w-[15px] h-[15px] shrink-0 transition-colors",
                      isActive ? "text-[var(--color-electric)]" : "text-[var(--color-muted-foreground)]/70",
                    )} />
                    <span className="flex-1 truncate text-[13px]">{item.label}</span>
                    {item.badge && <NavBadge variant={item.badgeVariant} value={item.badge} />}
                  </a>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Live agent indicator */}
      <div className="mx-3 mb-2 px-2.5 py-2 rounded-md bg-[var(--color-surface-2)] border border-[var(--color-border)]">
        <div className="flex items-center gap-2">
          <div className="relative shrink-0">
            <Sparkles className="w-3.5 h-3.5 text-[var(--color-electric)]" />
            <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-green-400 border border-black" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[11px] font-medium text-[var(--color-foreground)] leading-none">XPS Intelligence</div>
            <div className="text-[10px] text-[var(--color-muted-foreground)] mt-0.5 leading-none">AI systems online</div>
          </div>
          <ChevronRight className="w-3 h-3 text-[var(--color-muted-foreground)]/50 shrink-0" />
        </div>
      </div>

      <div className="h-px bg-[var(--color-sidebar-border)]" />

      {/* User */}
      <div className="p-2">
        <button className="flex items-center gap-2 w-full px-2 py-1.5 rounded-md hover:bg-[var(--color-surface-2)] transition-colors cursor-pointer">
          <div className="relative shrink-0">
            <div className="w-6 h-6 rounded-full bg-[rgba(10,132,255,0.2)] text-[#7cc4ff] text-[10px] font-bold flex items-center justify-center">
              {initials}
            </div>
            <span className="status-dot online absolute -bottom-0.5 -right-0.5 border border-black" style={{ width: "7px", height: "7px" }} />
          </div>
          <div className="flex-1 text-left min-w-0">
            <div className="text-[12px] font-semibold text-[var(--color-foreground)] truncate leading-none">{displayName}</div>
            <div className="text-[10px] text-[var(--color-muted-foreground)] truncate mt-0.5 leading-none">Pro</div>
          </div>
          <ChevronDown className="w-3 h-3 text-[var(--color-muted-foreground)]/50 shrink-0" />
        </button>
      </div>
    </aside>
  );
}
