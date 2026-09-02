import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ThemeToggle } from "./ThemeToggle";
import { useAuth } from "@/lib/auth";
import {
  LayoutDashboard,
  BookOpen,
  Users,
  Calendar,
  FolderOpen,
  MessageSquare,
  Award,
  LogOut,
  Shield,
  UserCircle,
  Menu,
  X,
  Info,
} from "lucide-react";
import afaraLogo from "@assets/AFARA Image 1_1759521116826.png";

const TEAM_ROLES = ["mentor", "facilitator", "admin", "superadmin"] as const;
type TeamRole = typeof TEAM_ROLES[number];

const ROLE_LABELS: Record<TeamRole, string> = {
  mentor: "Mentor",
  facilitator: "Facilitator",
  admin: "Admin",
  superadmin: "Super Admin",
};

const SESSION_KEY = "lms-view-notice-dismissed";

function LMSViewNotice({ onNavigate }: { onNavigate?: () => void }) {
  const { user, isAdmin } = useAuth();
  const [dismissed, setDismissed] = useState(() => {
    try { return sessionStorage.getItem(SESSION_KEY) === "true"; } catch { return false; }
  });

  if (!user || !TEAM_ROLES.includes(user.role as TeamRole)) return null;
  if (dismissed) return null;

  const roleLabel = ROLE_LABELS[user.role as TeamRole] ?? user.role;

  const handleDismiss = () => {
    try { sessionStorage.setItem(SESSION_KEY, "true"); } catch {}
    setDismissed(true);
  };

  return (
    <div className="mx-3 mt-3 rounded-md border border-[hsl(var(--primary)/0.25)] bg-[hsl(var(--primary)/0.07)] p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 min-w-0">
          <Info className="w-4 h-4 mt-0.5 shrink-0 text-[hsl(var(--primary))]" />
          <div className="min-w-0">
            <p className="text-xs font-semibold text-foreground leading-snug">
              Viewing as {roleLabel}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
              You are currently in Participant mode
            </p>
            {isAdmin && (
              <Link href="/admin/dashboard" onClick={() => { handleDismiss(); onNavigate?.(); }}>
                <Button
                  variant="default"
                  size="sm"
                  className="mt-2 h-7 text-xs gap-1.5 w-full"
                  data-testid="button-switch-admin-view"
                >
                  <Shield className="w-3 h-3" />
                  Switch to Admin View
                </Button>
              </Link>
            )}
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="shrink-0 text-muted-foreground hover:text-foreground transition-colors mt-0.5"
          data-testid="button-dismiss-lms-notice"
          aria-label="Dismiss"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

const navItems = [
  { path: "/lms/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "/lms/courses", label: "My Courses", icon: BookOpen },
  { path: "/lms/mentorship", label: "Learning Pods", icon: Users },
  { path: "/lms/events", label: "Events", icon: Calendar },
  { path: "/lms/resources", label: "Resources", icon: FolderOpen },
  { path: "/lms/community", label: "Community", icon: MessageSquare },
  { path: "/lms/certificates", label: "Certificates", icon: Award },
  { path: "/lms/profile", label: "Profile", icon: UserCircle },
];

function SidebarNav({ location, onNavigate }: { location: string; onNavigate?: () => void }) {
  const { user, logout, isAdmin } = useAuth();
  const [, setLocation] = useLocation();

  const handleLogout = async () => {
    onNavigate?.();
    await logout();
    setLocation("/login");
  };

  const initials = user
    ? `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase()
    : "?";

  return (
    <div className="flex flex-col h-full bg-sidebar">
      <div className="p-6 border-b">
        <Link href="/lms/dashboard" onClick={onNavigate}>
          <div className="cursor-pointer">
            <img src={afaraLogo} alt="AFÁRÁ" className="h-12 w-auto dark:brightness-0 dark:invert dark:opacity-90" />
          </div>
        </Link>
        <p className="text-xs text-muted-foreground mt-2">
          An{" "}
          <a
            href="https://openspacesandbridges.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline"
          >
            OPSB
          </a>{" "}
          Initiative
        </p>
      </div>

      <LMSViewNotice onNavigate={onNavigate} />

      <nav className="flex-1 p-4 overflow-y-auto">
        <div className="space-y-1">
          {navItems.map((item) => (
            <Link key={item.path} href={item.path} onClick={onNavigate}>
              <Button
                variant="ghost"
                className={`w-full justify-start gap-3 ${location === item.path ? "bg-sidebar-accent" : ""}`}
                data-testid={`link-${item.label.toLowerCase().replace(" ", "-")}`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Button>
            </Link>
          ))}
        </div>
      </nav>

      <div className="p-4 border-t space-y-2">
        {isAdmin && (
          <Link href="/admin/dashboard" onClick={onNavigate}>
            <Button variant="default" className="w-full justify-start gap-3" data-testid="button-admin-portal">
              <Shield className="w-4 h-4" />
              Admin Portal
            </Button>
          </Link>
        )}
        <div className="flex items-center justify-between gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="gap-2"
            onClick={handleLogout}
            data-testid="button-logout"
          >
            <LogOut className="w-4 h-4" />
            Log Out
          </Button>
          <ThemeToggle />
        </div>
        {user && (
          <Link href="/lms/profile" onClick={onNavigate}>
            <div
              className="flex items-center gap-2 rounded-md px-2 py-1 hover-elevate cursor-pointer"
              data-testid="link-sidebar-profile"
            >
              <Avatar className="h-7 w-7">
                <AvatarImage
                  src={user.profileImageUrl ?? undefined}
                  alt={`${user.firstName} ${user.lastName}`}
                />
                <AvatarFallback className="text-xs">{initials}</AvatarFallback>
              </Avatar>
              <p className="text-xs text-muted-foreground truncate">
                {user.firstName} {user.lastName}
              </p>
            </div>
          </Link>
        )}
      </div>
    </div>
  );
}

export function LMSSidebar() {
  const [location] = useLocation();
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Desktop sidebar — hidden on mobile */}
      <div className="hidden md:flex flex-col w-64 border-r bg-sidebar h-screen flex-shrink-0">
        <SidebarNav location={location} />
      </div>

      {/* Mobile top bar — hidden on desktop */}
      <div className="md:hidden flex items-center px-3 h-14 bg-sidebar border-b gap-3 shrink-0 sticky top-0 z-40">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button size="icon" variant="ghost" data-testid="button-mobile-menu">
              <Menu className="w-5 h-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-72 bg-sidebar border-r">
            <SidebarNav location={location} onNavigate={() => setOpen(false)} />
          </SheetContent>
        </Sheet>
        <Link href="/lms/dashboard">
          <img
            src={afaraLogo}
            alt="AFÁRÁ"
            className="h-8 w-auto dark:brightness-0 dark:invert dark:opacity-90 cursor-pointer"
          />
        </Link>
        <div className="ml-auto">
          <ThemeToggle />
        </div>
      </div>
    </>
  );
}
