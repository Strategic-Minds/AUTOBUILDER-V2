"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, MessageSquare, Hammer, Search, Monitor,
  Globe, Workflow, Bot, Users, FolderKanban, TrendingUp,
  BookOpen, Brain, Settings, ChevronDown, Zap, Bell,
  LogOut, User, Building2, Command, BarChart2, Mail,
  PenLine, Megaphone, ChevronRight, Sparkles, ChevronsUpDown,
  Circle, GitBranch,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    ],
  },
  {
    label: "Operations",
    items: [
      { label: "Opportunities", href: "/opportunities", icon: TrendingUp },
      { label: "Takeoff", href: "/takeoff", icon: Hammer },
      { label: "Estimates", href: "/estimates", icon: FolderKanban },
      { label: "Proposals", href: "/proposals", icon: PenLine },
      { label: "Price Book", href: "/price-book", icon: BookOpen },
    ],
  },
];

function NavBadge({ variant, value }: { variant?: NavItem["badgeVariant"]; value: string | number }) {
  return (
    <span className={cn(
      "text-[10px] font-semibold px-1.5 py-0.5 rounded-full leading-none tabular-nums",
      variant === "primary" && "bg-indigo-500/15 text-indigo-400",
      variant === "warning"  && "bg-amber-500/15 text-amber-400",
      variant === "success"  && "bg-green-500/15 text-green-400",
      variant === "danger"   && "bg-red-500/15 text-red-400",
      !variant               && "bg-[var(--color-surface-4)] text-[var(--color-muted-foreground)]",
    )}>
      {value}
    </span>
  );
}

interface SidebarProps {
  displayName?: string;
  initials?: string;
  email?: string;
}

export function Sidebar({ displayName = "User", initials = "U", email = "" }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
    router.refresh();
  }

  return (
    <aside className="flex flex-col h-screen w-[216px] shrink-0 bg-[var(--color-sidebar)] border-r border-[var(--color-sidebar-border)] select-none">

      {/* Workspace switcher */}
      <div className="px-3 pt-3.5 pb-2.5 border-b border-[var(--color-sidebar-border)]">
        <button className="flex items-center gap-2.5 w-full px-2 py-1.5 rounded-md hover:bg-[var(--color-surface-3)] transition-colors cursor-pointer group">
          <div className="flex items-center justify-center w-6 h-6 rounded-md bg-[var(--color-primary)] shadow-md shadow-indigo-500/30 shrink-0">
            <Zap className="w-3.5 h-3.5 text-white" />
          </div>
          <div className="flex-1 min-w-0 text-left">
            <div className="text-[13px] font-semibold text-white leading-none truncate">Xtreme Auto Builder</div>
            <div className="text-[10px] text-[var(--color-muted-foreground)] mt-0.5 leading-none">XAB · v3.0</div>
          </div>
          <ChevronsUpDown className="w-3.5 h-3.5 text-[var(--color-muted-foreground)] shrink-0 opacity-60" />
        </button>
      </div>

      {/* Command search */}
      <div className="px-3 py-2">
        <button className="flex items-center gap-2 w-full px-2.5 py-1.5 rounded-md bg-[var(--color-surface-2)] border border-[var(--color-border)] text-[12px] text-[var(--color-muted-foreground)] hover:border-[var(--color-primary)]/50 hover:text-[var(--color-foreground)] transition-all cursor-pointer group">
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
            <div className="space-y-px">
              {section.items.map((item) => {
                const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn("nav-item", isActive && "active")}
                  >
                    <item.icon className={cn(
                      "nav-icon w-[15px] h-[15px] shrink-0 transition-colors",
                      isActive ? "text-[var(--color-primary)]" : "text-[var(--color-muted-foreground)]/70"
                    )} />
                    <span className="flex-1 truncate text-[13px]">{item.label}</span>
                    {item.badge && <NavBadge variant={item.badgeVariant} value={item.badge} />}
                  </Link>
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
            <Sparkles className="w-3.5 h-3.5 text-[var(--color-primary)]" />
            <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-green-400 border border-[var(--color-surface-2)]" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[11px] font-medium text-[var(--color-foreground)] leading-none">XPS Intelligence</div>
            <div className="text-[10px] text-[var(--color-muted-foreground)] mt-0.5 leading-none">AI systems online</div>
          </div>
          <ChevronRight className="w-3 h-3 text-[var(--color-muted-foreground)]/50 shrink-0" />
        </div>
      </div>

      <Separator />

      {/* User */}
      <div className="p-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 w-full px-2 py-1.5 rounded-md hover:bg-[var(--color-surface-2)] transition-colors cursor-pointer">
              <div className="relative shrink-0">
                <Avatar className="w-6 h-6">
                  <AvatarFallback className="bg-indigo-500/20 text-indigo-300 text-[10px] font-bold">{initials}</AvatarFallback>
                </Avatar>
                <span className="status-dot online absolute -bottom-0.5 -right-0.5 border border-[var(--color-sidebar)]" style={{width:"7px",height:"7px"}} />
              </div>
              <div className="flex-1 text-left min-w-0">
                <div className="text-[12px] font-semibold text-[var(--color-foreground)] truncate leading-none">{displayName}</div>
                <div className="text-[10px] text-[var(--color-muted-foreground)] truncate mt-0.5 leading-none">Pro</div>
              </div>
              <ChevronDown className="w-3 h-3 text-[var(--color-muted-foreground)]/50 shrink-0" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start" className="w-52 mb-1">
            <DropdownMenuLabel className="text-xs text-[var(--color-muted-foreground)] truncate">{email}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem><User className="w-3.5 h-3.5" />Profile settings</DropdownMenuItem>
            <DropdownMenuItem><Building2 className="w-3.5 h-3.5" />Organization</DropdownMenuItem>
            <DropdownMenuItem><Bell className="w-3.5 h-3.5" />Notifications</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem destructive onClick={handleSignOut}><LogOut className="w-3.5 h-3.5" />Sign out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
}
