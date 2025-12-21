import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
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
  Settings,
  LogOut,
  Shield,
} from "lucide-react";
import afaraLogo from "@assets/AFARA Image 1_1759521116826.png";

export function LMSSidebar() {
  const [location, setLocation] = useLocation();
  const { user, logout, isAdmin } = useAuth();

  const handleLogout = async () => {
    await logout();
    setLocation("/login");
  };

  const navItems = [
    { path: "/lms/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { path: "/lms/courses", label: "My Courses", icon: BookOpen },
    { path: "/lms/mentorship", label: "Mentorship", icon: Users },
    { path: "/lms/events", label: "Events", icon: Calendar },
    { path: "/lms/resources", label: "Resources", icon: FolderOpen },
    { path: "/lms/community", label: "Community", icon: MessageSquare },
    { path: "/lms/certificates", label: "Certificates", icon: Award },
  ];

  return (
    <div className="w-64 border-r bg-sidebar h-screen flex flex-col">
      <div className="p-6 border-b">
        <Link href="/lms/dashboard">
          <div className="cursor-pointer">
            <img src={afaraLogo} alt="AFÁRÁ" className="h-12 w-auto" />
          </div>
        </Link>
        <p className="text-xs text-muted-foreground mt-2">An OPSB Initiative</p>
      </div>

      <nav className="flex-1 p-4">
        <div className="space-y-1">
          {navItems.map((item) => (
            <Link key={item.path} href={item.path}>
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
          <Link href="/admin/dashboard">
            <Button variant="default" className="w-full justify-start gap-3" data-testid="button-admin-portal">
              <Shield className="w-4 h-4" />
              Admin Portal
            </Button>
          </Link>
        )}
        <Button variant="ghost" className="w-full justify-start gap-3" data-testid="button-settings">
          <Settings className="w-4 h-4" />
          Settings
        </Button>
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
          <p className="text-xs text-muted-foreground truncate">
            {user.firstName} {user.lastName}
          </p>
        )}
      </div>
    </div>
  );
}
