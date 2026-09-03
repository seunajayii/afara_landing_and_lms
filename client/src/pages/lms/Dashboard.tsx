import { LMSSidebar } from "@/components/LMSSidebar";
import { ProgressDashboard } from "@/components/ProgressDashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { format } from "date-fns";
import {
  ArrowUpRight, BookOpen, CalendarDays, ChevronRight, ClipboardCheck,
  MessageCircle, Play, Sparkles, UserRound, UsersRound,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import type { Assignment, Course, Event } from "@shared/schema";

export default function Dashboard() {
  const { user } = useAuth();
  const { data: courses = [], isLoading: coursesLoading } = useQuery<Course[]>({
    queryKey: ["/api/courses", user?.id, user?.role],
    queryFn: async () => {
      const response = await fetch("/api/courses", { credentials: "include" });
      if (!response.ok) throw new Error("Unable to load courses.");
      return response.json();
    },
    enabled: Boolean(user?.id),
  });
  const { data: events = [], isLoading: eventsLoading } = useQuery<Event[]>({ queryKey: ["/api/events"] });
  const { data: assignments = [], isLoading: assignmentsLoading } = useQuery<Assignment[]>({ queryKey: ["/api/assignments"] });

  const publishedCourses = courses.filter((course) => course.status === "published");
  const continueCourse = publishedCourses[0];
  const upcomingEvents = events
    .filter((event) => new Date(event.startTime) >= new Date())
    .sort((a, b) => +new Date(a.startTime) - +new Date(b.startTime));
  const upcomingAssignments = assignments
    .filter((assignment) => assignment.status === "published")
    .sort((a, b) => +(a.dueAt ? new Date(a.dueAt) : new Date("9999-12-31")) - +(b.dueAt ? new Date(b.dueAt) : new Date("9999-12-31")))
    .slice(0, 2);
  const isLoading = coursesLoading || eventsLoading || assignmentsLoading;

  return (
    <div className="flex h-screen flex-col md:flex-row">
      <LMSSidebar />
      <main className="flex-1 overflow-auto bg-[radial-gradient(circle_at_85%_0%,hsl(var(--accent)/0.45),transparent_28%)]">
        <div className="mx-auto max-w-6xl p-5 md:p-8">
          <div className="mb-7 flex items-center justify-between gap-3">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground"><span className="h-2 w-2 rounded-full bg-orange-400" /> Your learning space</p>
            <span className="flex items-center gap-1.5 rounded-full border bg-background/70 px-3 py-1.5 text-[11px] text-muted-foreground"><Sparkles className="h-3.5 w-3.5 text-primary" /> Participant mode</span>
          </div>

          <header className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-orange-700 dark:text-orange-300">{format(new Date(), "EEEE, d MMMM yyyy")}</p>
            <h1 className="mt-2 font-serif text-3xl font-semibold tracking-tight md:text-4xl" data-testid="text-welcome">Good morning, {user?.firstName || "there"}.</h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">One focused step is waiting for you. Pick up where you left off, then see what is coming up across your programme.</p>
          </header>

          {isLoading ? <Skeleton className="h-44 w-full" /> : continueCourse ? (
            <section className="relative overflow-hidden rounded-xl bg-primary p-6 text-primary-foreground shadow-lg">
              <div className="absolute -right-16 -top-24 h-56 w-56 rounded-full border border-primary-foreground/20 shadow-[0_0_0_22px_hsl(var(--primary-foreground)/0.04)]" />
              <p className="relative text-[10px] font-semibold uppercase tracking-[0.14em] text-primary-foreground/65">Continue learning</p>
              <h2 className="relative mt-3 max-w-lg font-serif text-2xl">{continueCourse.title}</h2>
              <p className="relative mt-2 max-w-xl text-sm text-primary-foreground/70">{continueCourse.shortDescription || continueCourse.description}</p>
              <Link href={`/lms/courses/${continueCourse.id}`}>
                <Button variant="secondary" size="sm" className="relative mt-5 gap-2" data-testid="button-continue-learning"><Play className="h-4 w-4 fill-current" /> Continue course</Button>
              </Link>
            </section>
          ) : (
            <Card><CardContent className="p-6"><BookOpen className="h-6 w-6 text-primary" /><h2 className="mt-3 font-semibold">Your next course will appear here</h2><p className="mt-1 text-sm text-muted-foreground">There are no published courses available to you yet.</p></CardContent></Card>
          )}

          <div className="mb-3 mt-7 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Coming up</h2>
            <Link href="/lms/progress" className="flex items-center gap-1 text-xs font-semibold text-orange-700 dark:text-orange-300">View programme <ArrowUpRight className="h-3.5 w-3.5" /></Link>
          </div>
          <section className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Programme work</CardTitle></CardHeader>
              <CardContent className="space-y-1">
                {assignmentsLoading ? <Skeleton className="h-20 w-full" /> : upcomingAssignments.length ? upcomingAssignments.map((assignment) => (
                  <Link key={assignment.id} href={`/lms/assignments?id=${assignment.id}`}>
                    <div className="flex items-start gap-3 border-b py-3 last:border-0">
                      <ClipboardCheck className="mt-0.5 h-4 w-4 text-orange-700 dark:text-orange-300" />
                      <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{assignment.title}</p><p className="mt-1 text-xs text-muted-foreground">{assignment.dueAt ? `Due ${format(new Date(assignment.dueAt), "EEE, d MMM")}` : "No due date"}</p></div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </Link>
                )) : <p className="py-4 text-sm text-muted-foreground">No assignments are due right now.</p>}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Upcoming sessions</CardTitle></CardHeader>
              <CardContent className="space-y-1">
                {eventsLoading ? <Skeleton className="h-20 w-full" /> : upcomingEvents.length ? upcomingEvents.slice(0, 2).map((event) => (
                  <Link key={event.id} href={`/lms/events/${event.id}`}>
                    <div className="flex items-start gap-3 border-b py-3 last:border-0">
                      <div className="grid h-8 w-8 place-items-center rounded-md bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300"><CalendarDays className="h-4 w-4" /></div>
                      <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{event.title}</p><p className="mt-1 text-xs text-muted-foreground">{format(new Date(event.startTime), "EEE, d MMM · h:mm a")} WAT</p></div>
                    </div>
                  </Link>
                )) : <p className="py-4 text-sm text-muted-foreground">No upcoming sessions are scheduled.</p>}
              </CardContent>
            </Card>
          </section>

          <div className="mb-3 mt-7 flex items-center justify-between"><h2 className="text-sm font-semibold">Your connections</h2><Link href="/lms/community" className="flex items-center gap-1 text-xs font-semibold text-orange-700 dark:text-orange-300">Explore <ChevronRight className="h-3.5 w-3.5" /></Link></div>
          <section className="grid gap-4 sm:grid-cols-2">
            <Link href="/lms/mentorship">
              <div className="rounded-xl bg-secondary/70 p-5 transition-transform hover:-translate-y-0.5">
                <UsersRound className="h-5 w-5 text-primary" /><h3 className="mt-3 font-semibold">Learning Pods</h3><p className="mt-1 text-xs text-muted-foreground">Your group studio, shared work, and pod check-ins.</p>
              </div>
            </Link>
            <Link href="/lms/profile">
              <div className="rounded-xl bg-orange-100/70 p-5 transition-transform hover:-translate-y-0.5 dark:bg-orange-950/25">
                <UserRound className="h-5 w-5 text-orange-700 dark:text-orange-300" /><h3 className="mt-3 font-semibold">Mentorship</h3><p className="mt-1 text-xs text-muted-foreground">One-to-one guidance and your mentor relationship.</p>
              </div>
            </Link>
          </section>

          <section className="mt-7"><ProgressDashboard /></section>
          <section className="mt-7 grid gap-3 sm:grid-cols-3">
            <Link href="/lms/courses"><Button variant="outline" className="w-full justify-start gap-2"><BookOpen className="h-4 w-4" /> Browse courses</Button></Link>
            <Link href="/lms/events"><Button variant="outline" className="w-full justify-start gap-2"><CalendarDays className="h-4 w-4" /> Open calendar</Button></Link>
            <Link href="/lms/community"><Button variant="outline" className="w-full justify-start gap-2"><MessageCircle className="h-4 w-4" /> Join community</Button></Link>
          </section>
        </div>
      </main>
    </div>
  );
}