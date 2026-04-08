import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ThemeToggle } from "./ThemeToggle";
import { useAuth } from "@/lib/auth";
import {
  LayoutDashboard,
  BookOpen,
  Users,
  Calendar,
  FolderOpen,
  Award,
  LogOut,
  Shield,
  FileText,
  Mail,
  Menu,
} from "lucide-react";
import afaraLogo from "@assets/AFARA Image 1_1759521116826.png";

const adminNavItems = [
  { path: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "/admin/applications", label: "Applications", icon: FileText },
  { path: "/admin/courses", label: "Course Management", icon: BookOpen },
  { path: "/admin/users", label: "User Management", icon: Users },
  { path: "/admin/resources", label: "Resource Management", icon: FolderOpen },
  { path: "/admin/events", label: "Event Management", icon: Calendar },
  { path: "/admin/certificates", label: "Certificate Management", icon: Award },
  { path: "/admin/newsletter", label: "Newsletter", icon: Mail },
];

function AdminSidebarNav({ location, onNavigate }: { location: string; onNavigate?: () => void }) {
  const { user, logout, isSuperAdmin } = useAuth();
  const [, setLocation] = useLocation();

  const handleLogout = async () => {
    onNavigate?.();
    await logout();
    setLocation("/login");
  };

  return (
    <div className="flex flex-col h-full bg-sidebar">
      <div className="p-6 border-b">
        <Link href="/admin/dashboard" onClick={onNavigate}>
          <div className="cursor-pointer">
            <img src={afaraLogo} alt="AFÁRÁ" className="h-12 w-auto dark:brightness-0 dark:invert dark:opacity-90" />
          </div>
        </Link>
        <div className="flex items-center gap-2 mt-2">
          <Shield className="w-3 h-3 text-primary" />
          <p className="text-xs text-primary font-medium">Admin Portal</p>
        </div>
      </div>

      <nav className="flex-1 p-4 overflow-y-auto">
        <div className="space-y-1">
          {adminNavItems.map((item) => (
            <Link key={item.path} href={item.path} onClick={onNavigate}>
              <Button
                variant="ghost"
                className={`w-full justify-start gap-3 ${location === item.path ? "bg-sidebar-accent" : ""}`}
                data-testid={`link-admin-${item.label.toLowerCase().replace(/ /g, "-")}`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Button>
            </Link>
          ))}
        </div>

        {isSuperAdmin && (
          <div className="mt-6 pt-4 border-t">
            <p className="text-xs text-muted-foreground mb-2 px-3">Super Admin</p>
          </div>
        )}
      </nav>

      <div className="p-4 border-t space-y-2">
        <Link href="/lms/dashboard" onClick={onNavigate}>
          <Button variant="outline" className="w-full justify-start gap-3" data-testid="button-switch-to-lms">
            <LayoutDashboard className="w-4 h-4" />
            Switch to LMS
          </Button>
        </Link>
        <div className="flex items-center justify-between gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="gap-2"
            onClick={handleLogout}
            data-testid="button-admin-logout"
          >
            <LogOut className="w-4 h-4" />
            Log Out
          </Button>
          <ThemeToggle />
        </div>
        {user && (
          <div className="text-xs text-muted-foreground">
            <p className="truncate font-medium">{user.firstName} {user.lastName}</p>
            <p className="text-primary capitalize">{user.role}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export function AdminSidebar() {
  const [location] = useLocation();
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Desktop sidebar — hidden on mobile */}
      <div className="hidden md:flex flex-col w-64 border-r bg-sidebar h-screen flex-shrink-0">
        <AdminSidebarNav location={location} />
      </div>

      {/* Mobile top bar — hidden on desktop */}
      <div className="md:hidden flex items-center px-3 h-14 bg-sidebar border-b gap-3 shrink-0 sticky top-0 z-40">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button size="icon" variant="ghost" data-testid="button-admin-mobile-menu">
              <Menu className="w-5 h-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-72 bg-sidebar border-r">
            <AdminSidebarNav location={location} onNavigate={() => setOpen(false)} />
          </SheetContent>
        </Sheet>
        <Link href="/admin/dashboard">
          <img
            src={afaraLogo}
            alt="AFÁRÁ"
            className="h-8 w-auto dark:brightness-0 dark:invert dark:opacity-90 cursor-pointer"
          />
        </Link>
        <div className="flex items-center gap-2 ml-2">
          <Shield className="w-3 h-3 text-primary" />
          <span className="text-xs text-primary font-medium">Admin</span>
        </div>
        <div className="ml-auto">
          <ThemeToggle />
        </div>
      </div>
    </>
  );
}
