import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ThemeToggle } from "./ThemeToggle";
import { useAuth } from "@/lib/auth";
import { adminCohortHref, setAdminCohortId, useAdminCohortId } from "@/lib/adminCohortContext";
import type { Cohort } from "@shared/schema";
import {
  Award, BarChart3, BookOpen, CalendarDays, ChevronDown, ClipboardCheck,
  FileBarChart, FileText, FolderKanban, LayoutDashboard, LogOut, Mail,
  Menu, Network, Search, ShieldCheck, Users,
} from "lucide-react";
import afaraLogo from "@assets/AFARA Image 1_1759521116826.png";

type NavItem = { path: string; label: string; icon: typeof LayoutDashboard };
type NavGroup = { label: string; items: NavItem[] };

const navGroups: NavGroup[] = [
  { label: "Overview", items: [{ path: "/admin/dashboard", label: "Cohort workspace", icon: LayoutDashboard }] },
  {
    label: "Programme Operations",
    items: [
      { path: "/admin/applications", label: "Applications", icon: FileText },
      { path: "/admin/cohorts", label: "Cohorts", icon: FolderKanban },
      { path: "/admin/cohort-analytics", label: "Analytics", icon: BarChart3 },
    ],
  },
  {
    label: "Learning Delivery",
    items: [
      { path: "/admin/learning-pods", label: "Learning Pods", icon: Network },
      { path: "/admin/progress-reporting", label: "Progress", icon: FileBarChart },
      { path: "/admin/cohort-report", label: "Reports", icon: FileText },
      { path: "/admin/assignments", label: "Assignments", icon: ClipboardCheck },
      { path: "/admin/courses", label: "Courses", icon: BookOpen },
      { path: "/admin/resources", label: "Resources", icon: FolderKanban },
    ],
  },
  {
    label: "Engagement",
    items: [
      { path: "/admin/events", label: "Events", icon: CalendarDays },
      { path: "/admin/newsletter", label: "Newsletter", icon: Mail },
    ],
  },
  { label: "People & Access", items: [{ path: "/admin/users", label: "Users", icon: Users }] },
  { label: "Credentials", items: [{ path: "/admin/certificates", label: "Certificates", icon: Award }] },
];

function AdminSidebarNav({ location, onNavigate }: { location: string; onNavigate?: () => void }) {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [query, setQuery] = useState("");
  const selectedCohortId = useAdminCohortId();
  const { data: cohorts = [] } = useQuery<Cohort[]>({ queryKey: ["/api/admin/cohorts"] });
  const activeCohort = cohorts.find((cohort) => cohort.id === selectedCohortId)
    ?? cohorts.find((cohort) => cohort.status === "open")
    ?? cohorts[0];

  useEffect(() => {
    if (activeCohort && activeCohort.id !== selectedCohortId) {
      setAdminCohortId(activeCohort.id);
    }
  }, [activeCohort, selectedCohortId]);

  const handleCohortChange = (cohortId: string) => {
    setAdminCohortId(cohortId);
    onNavigate?.();
    setLocation(`/admin/dashboard?cohortId=${encodeURIComponent(cohortId)}`);
  };

  const visibleGroups = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return navGroups;
    return navGroups
      .map((group) => ({ ...group, items: group.items.filter((item) => item.label.toLowerCase().includes(needle)) }))
      .filter((group) => group.items.length > 0);
  }, [query]);

  const handleLogout = async () => {
    onNavigate?.();
    await logout();
    setLocation("/login");
  };

  const initials = user ? `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase() : "A";

  return (
    <div className="flex h-full flex-col bg-sidebar">
      <div className="border-b px-5 py-5">
        <div className="flex items-center justify-between gap-3">
          <Link href={adminCohortHref("/admin/dashboard", activeCohort?.id)} onClick={onNavigate}>
            <img src={afaraLogo} alt="AFÁRÁ" className="h-10 w-auto cursor-pointer dark:brightness-0 dark:invert dark:opacity-90" />
          </Link>
          <div className="grid h-8 w-8 place-items-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">{initials}</div>
        </div>
        <div className="mt-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5 text-primary" /> Admin portal
        </div>
      </div>

      <div className="space-y-3 px-3 pb-2 pt-4">
        <div className="rounded-lg border bg-card px-3 py-2.5" data-testid="button-admin-cohort-context">
          <span className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Working in</span>
          <Select value={activeCohort?.id ?? ""} onValueChange={handleCohortChange}>
            <SelectTrigger
              className="mt-1 h-auto min-h-5 w-full border-0 bg-transparent p-0 text-left text-xs font-semibold shadow-none focus:ring-0"
              aria-label="Choose the cohort workspace"
              data-testid="select-admin-cohort-context"
            >
              <SelectValue placeholder="Choose a cohort" />
            </SelectTrigger>
            <SelectContent>
              {cohorts.map((cohort) => (
                <SelectItem key={cohort.id} value={cohort.id}>
                  {cohort.displayName || cohort.name}{cohort.year ? ` · ${cohort.year}` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {activeCohort && <p className="mt-1 text-[10px] text-muted-foreground">Select a cohort to open its workspace</p>}
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Find a destination"
            aria-label="Find an admin destination"
            className="h-9 pl-8 text-xs"
            data-testid="input-admin-nav-search"
          />
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pb-4" aria-label="Admin destinations">
        {visibleGroups.map((group) => (
          <div key={group.label} className="mt-4 first:mt-2">
            <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">{group.label}</p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const active = location === item.path;
                return (
                  <Link key={item.path} href={adminCohortHref(item.path, activeCohort?.id)} onClick={onNavigate}>
                    <Button
                      variant="ghost"
                      className={`h-9 w-full justify-start gap-2.5 rounded-l-none border-l-2 px-2.5 text-xs ${
                        active ? "border-l-primary bg-sidebar-accent font-semibold" : "border-l-transparent text-muted-foreground"
                      }`}
                      data-testid={`link-admin-${item.label.toLowerCase().replace(/ /g, "-")}`}
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {item.label}
                    </Button>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
        {visibleGroups.length === 0 && <p className="px-2 py-6 text-xs text-muted-foreground">No destinations found.</p>}
      </nav>

      <div className="space-y-2 border-t p-4">
        <Link href="/lms/dashboard" onClick={onNavigate}>
          <Button variant="outline" size="sm" className="w-full justify-start gap-2" data-testid="button-switch-to-lms">
            <LayoutDashboard className="h-4 w-4" /> Switch to LMS
          </Button>
        </Link>
        <div className="flex items-center justify-between gap-2">
          <Button variant="ghost" size="sm" className="gap-2" onClick={handleLogout} data-testid="button-admin-logout">
            <LogOut className="h-4 w-4" /> Log Out
          </Button>
          <ThemeToggle />
        </div>
        {user && <p className="truncate px-2 text-[11px] text-muted-foreground">{user.firstName} {user.lastName} · <span className="capitalize text-primary">{user.role}</span></p>}
      </div>
    </div>
  );
}

export function AdminSidebar() {
  const [location] = useLocation();
  const [open, setOpen] = useState(false);
  return (
    <>
      <div className="hidden h-screen w-60 flex-shrink-0 flex-col border-r bg-sidebar md:flex">
        <AdminSidebarNav location={location} />
      </div>
      <div className="sticky top-0 z-40 flex h-14 shrink-0 items-center gap-3 border-b bg-sidebar px-3 md:hidden">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild><Button size="icon" variant="ghost" data-testid="button-admin-mobile-menu"><Menu className="h-5 w-5" /></Button></SheetTrigger>
          <SheetContent side="left" className="w-72 border-r bg-sidebar p-0"><AdminSidebarNav location={location} onNavigate={() => setOpen(false)} /></SheetContent>
        </Sheet>
        <Link href="/admin/dashboard"><img src={afaraLogo} alt="AFÁRÁ" className="h-8 w-auto cursor-pointer dark:brightness-0 dark:invert dark:opacity-90" /></Link>
        <span className="text-xs font-medium text-primary">Admin</span>
        <div className="ml-auto"><ThemeToggle /></div>
      </div>
    </>
  );
}