import { Switch, Route, Redirect, useLocation } from "wouter";
import { useEffect } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider, useAuth } from "@/lib/auth";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import About from "@/pages/About";
import Program from "@/pages/Program";
import Contact from "@/pages/Contact";
import Login from "@/pages/Login";
import Dashboard from "@/pages/lms/Dashboard";
import Courses from "@/pages/lms/Courses";
import Mentorship from "@/pages/lms/Mentorship";
import Events from "@/pages/lms/Events";
import EventDetail from "@/pages/lms/EventDetail";
import Resources from "@/pages/lms/Resources";
import ResourceDetail from "@/pages/lms/ResourceDetail";
import Community from "@/pages/lms/Community";
import ThreadDetail from "@/pages/lms/ThreadDetail";
import Certificates from "@/pages/lms/Certificates";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import CourseManagement from "@/pages/admin/CourseManagement";
import UserManagement from "@/pages/admin/UserManagement";
import ResourceManagement from "@/pages/admin/ResourceManagement";
import CertificateManagement from "@/pages/admin/CertificateManagement";
import ApplicationManagement from "@/pages/admin/ApplicationManagement";
import EventManagement from "@/pages/admin/EventManagement";
import NewsletterManagement from "@/pages/admin/NewsletterManagement";
import Apply from "@/pages/Apply";
import Profile from "@/pages/lms/Profile";
import ChangePassword from "@/pages/ChangePassword";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";
import FAQ from "@/pages/FAQ";
import { Loader2 } from "lucide-react";

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { isAuthenticated, isLoading } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate("/login", { replace: true });
    }
  }, [isLoading, isAuthenticated, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <Component />;
}

function AdminProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { isAuthenticated, isLoading, isAdmin } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        navigate("/login", { replace: true });
      } else if (!isAdmin) {
        navigate("/lms/dashboard", { replace: true });
      }
    }
  }, [isLoading, isAuthenticated, isAdmin, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated || !isAdmin) {
    return null;
  }

  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/about" component={About} />
      <Route path="/program" component={Program} />
      <Route path="/contact" component={Contact} />
      <Route path="/apply" component={Apply} />
      <Route path="/login" component={Login} />
      <Route path="/change-password" component={ChangePassword} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/reset-password" component={ResetPassword} />
      <Route path="/faq" component={FAQ} />
      
      <Route path="/lms/dashboard">{() => <ProtectedRoute component={Dashboard} />}</Route>
      <Route path="/lms/courses">{() => <ProtectedRoute component={Courses} />}</Route>
      <Route path="/lms/mentorship">{() => <ProtectedRoute component={Mentorship} />}</Route>
      <Route path="/lms/events">{() => <ProtectedRoute component={Events} />}</Route>
      <Route path="/lms/events/:id">{() => <ProtectedRoute component={EventDetail} />}</Route>
      <Route path="/lms/resources">{() => <ProtectedRoute component={Resources} />}</Route>
      <Route path="/lms/resources/:id">{() => <ProtectedRoute component={ResourceDetail} />}</Route>
      <Route path="/lms/community">{() => <ProtectedRoute component={Community} />}</Route>
      <Route path="/lms/community/:threadId">{() => <ProtectedRoute component={ThreadDetail} />}</Route>
      <Route path="/lms/certificates">{() => <ProtectedRoute component={Certificates} />}</Route>
      <Route path="/lms/profile">{() => <ProtectedRoute component={Profile} />}</Route>
      
      {/* Admin Routes */}
      <Route path="/admin/dashboard">{() => <AdminProtectedRoute component={AdminDashboard} />}</Route>
      <Route path="/admin/courses">{() => <AdminProtectedRoute component={CourseManagement} />}</Route>
      <Route path="/admin/users">{() => <AdminProtectedRoute component={UserManagement} />}</Route>
      <Route path="/admin/resources">{() => <AdminProtectedRoute component={ResourceManagement} />}</Route>
      <Route path="/admin/certificates">{() => <AdminProtectedRoute component={CertificateManagement} />}</Route>
      <Route path="/admin/applications">{() => <AdminProtectedRoute component={ApplicationManagement} />}</Route>
      <Route path="/admin/events">{() => <AdminProtectedRoute component={EventManagement} />}</Route>
      <Route path="/admin/newsletter">{() => <AdminProtectedRoute component={NewsletterManagement} />}</Route>
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <AuthProvider>
            <Toaster />
            <Router />
          </AuthProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
