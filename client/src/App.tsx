import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import About from "@/pages/About";
import Services from "@/pages/Services";
import TrackRecord from "@/pages/TrackRecord";
import Afara from "@/pages/Afara";
import Contact from "@/pages/Contact";
import Dashboard from "@/pages/lms/Dashboard";
import Courses from "@/pages/lms/Courses";
import Mentorship from "@/pages/lms/Mentorship";
import Events from "@/pages/lms/Events";
import Resources from "@/pages/lms/Resources";
import Community from "@/pages/lms/Community";
import Certificates from "@/pages/lms/Certificates";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/about" component={About} />
      <Route path="/services" component={Services} />
      <Route path="/track-record" component={TrackRecord} />
      <Route path="/afara" component={Afara} />
      <Route path="/contact" component={Contact} />
      
      <Route path="/lms/dashboard" component={Dashboard} />
      <Route path="/lms/courses" component={Courses} />
      <Route path="/lms/mentorship" component={Mentorship} />
      <Route path="/lms/events" component={Events} />
      <Route path="/lms/resources" component={Resources} />
      <Route path="/lms/community" component={Community} />
      <Route path="/lms/certificates" component={Certificates} />
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
