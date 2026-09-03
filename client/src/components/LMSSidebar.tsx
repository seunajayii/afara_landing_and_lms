import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ThemeToggle } from "./ThemeToggle";
import { useAuth } from "@/lib/auth";
import {
  Award, BookOpen, CalendarDays, ClipboardCheck, FolderOpen, Home,
  LogOut, Menu, MessageCircle, Shield, Sparkles, TrendingUp, UserRound, UsersRound,
} from "lucide-react";
import afaraLogo from "@assets/AFARA Image 1_1759521116826.png";

const TEAM_ROLES = ["mentor", "facilitator", "admin", "superadmin"] as const;

const navGroups = [
  { label: "Home", items: [{ path: "/lms/dashboard", label: "Home", icon: Home }] },
  {
    label: "Learn",
    items: [
      { path: "/lms/courses", label: "My Courses", icon: BookOpen },
      { path: "/lms/resources", label: "Resources", icon: FolderOpen },
      { path: "/lms/progress", label: "My Progress", icon: TrendingUp },
    ],
  },
  {
    label: "Programme Work",
    items: [
      { path: "/lms/assignments", label: "Assignments", icon: ClipboardCheck },
      { path: "/lms/certificates", label: "Certificates", icon: Award },
    ],
  },
  {
    label: "Connect",
    items: [
      { path: "/lms/mentorship", label: "Learning Pods", icon: UsersRound },
      { path: "/lms/events", label: "Events", icon: CalendarDays },
      { path: "/lms/community", label: "Community", icon: MessageCircle },
    ],
  },
  { label: "Account", items: [{ path: "/lms/profile", label: "Profile", icon: UserRound }] },
];

function SidebarNav({ location, onNavigate }: { location: string; onNavigate?: () => void }) {
  const { user, logout, isAdmin } = useAuth();
  const [, setLocation] = useLocation();
  const initials = user ? `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase() : "?";
  const isTeamMember = Boolean(user && TEAM_ROLES.includes(user.role as typeof TEAM_ROLES[number]));

  const handleLogout = async () => {
    onNavigate?.();
    await logout();
    setLocation("/login");
  };

  return (
    <div className="flex h-full flex-col bg-[hsl(var(--sidebar))]">
      <div className="border-b px-5 py-5">
        <Link href="/lms/dashboard" onClick={onNavigate}>
          <img src={afaraLogo} alt="AFÁRÁ" className="h-10 w-auto cursor-pointer dark:brightness-0 dark:invert dark:opacity-90" />
        </Link>
        <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">An OPSB Initiative</p>
      </div>

      {isTeamMember && (
        <div className="mx-3 mt-3 flex items-center gap-2 rounded-full border bg-background/70 px-3 py-2 text-[11px] text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          Participant mode
          {isAdmin && <Link href="/admin/dashboard" onClick={onNavigate} className="ml-auto font-semibold text-primary">Admin</Link>}
        </div>
      )}

      <nav className="flex-1 overflow-y-auto px-3 pb-4 pt-3" aria-label="Learner navigation">
        {navGroups.map((group) => (
          <div key={group.label} className="mb-4">
            <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/80">{group.label}</p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const active = location === item.path || (item.path !== "/lms/dashboard" && location.startsWith(`${item.path}/`));
                return (
                  <Link key={item.path} href={item.path} onClick={onNavigate}>
                    <Button
                      variant="ghost"
                      className={`h-9 w-full justify-start gap-2.5 px-2.5 text-xs ${active ? "bg-background font-semibold shadow-sm" : "text-muted-foreground"}`}
                      data-testid={`link-${item.label.toLowerCase().replace(/ /g, "-")}`}
                    >
                      <item.icon className={`h-4 w-4 ${active ? "text-primary" : ""}`} />
                      {item.label}
                    </Button>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t p-4">
        {isAdmin && (
          <Link href="/admin/dashboard" onClick={onNavigate}>
            <Button variant="outline" size="sm" className="mb-2 w-full justify-start gap-2" data-testid="button-admin-portal"><Shield className="h-4 w-4" /> Admin Portal</Button>
          </Link>
        )}
        {user && (
          <Link href="/lms/profile" onClick={onNavigate}>
            <div className="mb-2 flex items-center gap-2 rounded-md px-2 py-1.5 hover-elevate" data-testid="link-sidebar-profile">
              <Avatar className="h-8 w-8"><AvatarImage src={user.profileImageUrl ?? undefined} alt={`${user.firstName} ${user.lastName}`} /><AvatarFallback className="text-xs">{initials}</AvatarFallback></Avatar>
              <div className="min-w-0"><p className="truncate text-xs font-semibold">{user.firstName} {user.lastName}</p><p className="text-[10px] capitalize text-muted-foreground">{user.role}</p></div>
            </div>
          </Link>
        )}
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" className="gap-2" onClick={handleLogout} data-testid="button-logout"><LogOut className="h-4 w-4" /> Log Out</Button>
          <ThemeToggle />
        </div>
      </div>
    </div>
  );
}

export function LMSSidebar() {
  const [location] = useLocation();
  const [open, setOpen] = useState(false);
  return (
    <>
      <div className="hidden h-screen w-56 flex-shrink-0 flex-col border-r bg-sidebar md:flex"><SidebarNav location={location} /></div>
      <div className="sticky top-0 z-40 flex h-14 shrink-0 items-center gap-3 border-b bg-sidebar px-3 md:hidden">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild><Button size="icon" variant="ghost" data-testid="button-mobile-menu"><Menu className="h-5 w-5" /></Button></SheetTrigger>
          <SheetContent side="left" className="w-72 border-r bg-sidebar p-0"><SidebarNav location={location} onNavigate={() => setOpen(false)} /></SheetContent>
        </Sheet>
        <Link href="/lms/dashboard"><img src={afaraLogo} alt="AFÁRÁ" className="h-8 w-auto cursor-pointer dark:brightness-0 dark:invert dark:opacity-90" /></Link>
        <div className="ml-auto"><ThemeToggle /></div>
      </div>
    </>
  );
}