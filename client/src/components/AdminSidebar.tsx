import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./ThemeToggle";
import { useAuth } from "@/lib/auth";
import {
  LayoutDashboard,
  BookOpen,
  Users,
  UserCog,
  Calendar,
  FolderOpen,
  Award,
  Settings,
  LogOut,
  Shield,
  FileText,
  Mail,
} from "lucide-react";
import afaraLogo from "@assets/AFARA Image 1_1759521116826.png";

export function AdminSidebar() {
  const [location, setLocation] = useLocation();
  const { user, logout, isSuperAdmin } = useAuth();

  const handleLogout = async () => {
    await logout();
    setLocation("/login");
  };

  const adminNavItems = [
    { path: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { path: "/admin/applications", label: "Applications", icon: FileText },
    { path: "/admin/courses", label: "Course Management", icon: BookOpen },
    { path: "/admin/users", label: "User Management", icon: Users },
    { path: "/admin/mentors", label: "Mentor Management", icon: UserCog },
    { path: "/admin/resources", label: "Resource Management", icon: FolderOpen },
    { path: "/admin/events", label: "Event Management", icon: Calendar },
    { path: "/admin/certificates", label: "Certificate Management", icon: Award },
    { path: "/admin/newsletter", label: "Newsletter", icon: Mail },
  ];

  const superAdminItems = [
    { path: "/admin/settings", label: "Platform Settings", icon: Settings },
  ];

  return (
    <div className="w-64 border-r bg-sidebar h-screen flex flex-col">
      <div className="p-6 border-b">
        <Link href="/admin/dashboard">
          <div className="cursor-pointer">
            <img src={afaraLogo} alt="AFÁRÁ" className="h-12 w-auto" />
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
            <Link key={item.path} href={item.path}>
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
            <div className="space-y-1">
              {superAdminItems.map((item) => (
                <Link key={item.path} href={item.path}>
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
          </div>
        )}
      </nav>

      <div className="p-4 border-t space-y-2">
        <Link href="/lms/dashboard">
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
