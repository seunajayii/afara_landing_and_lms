import { AdminSidebar } from "@/components/AdminSidebar";
import { PrivateVideoCleanupCard } from "@/components/admin/PrivateVideoCleanupCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { useAuth } from "@/lib/auth";
import { adminCohortHref, useAdminCohortId } from "@/lib/adminCohortContext";
import {
  AlertCircle, ArrowUpRight, BookOpen, CalendarDays, CheckCircle2,
  ClipboardCheck, FileText, FolderKanban, Network, Sparkles, Users,
} from "lucide-react";
import type { Application, Cohort, Course, Event, Resource } from "@shared/schema";

type AdminCourse = Course & { cohortIds?: string[] };

function DashboardSkeleton() {
  return <div className="space-y-4"><Skeleton className="h-36 w-full" /><Skeleton className="h-20 w-full" /><div className="grid gap-4 lg:grid-cols-3"><Skeleton className="h-48 lg:col-span-2" /><Skeleton className="h-48" /></div></div>;
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const { data: courses = [], isLoading: coursesLoading } = useQuery<AdminCourse[]>({ queryKey: ["/api/courses"] });
  const { data: events = [], isLoading: eventsLoading } = useQuery<Event[]>({ queryKey: ["/api/events"] });
  const { data: resources = [], isLoading: resourcesLoading } = useQuery<Resource[]>({ queryKey: ["/api/resources"] });
  const { data: applications = [], isLoading: applicationsLoading } = useQuery<Application[]>({ queryKey: ["/api/applications"] });
  const { data: cohorts = [], isLoading: cohortsLoading } = useQuery<Cohort[]>({ queryKey: ["/api/admin/cohorts"] });

  const isLoading = coursesLoading || eventsLoading || resourcesLoading || applicationsLoading || cohortsLoading;
  const selectedCohortId = useAdminCohortId();
  const activeCohort = cohorts.find((cohort) => cohort.id === selectedCohortId)
    ?? cohorts.find((cohort) => cohort.status === "open")
    ?? cohorts[0];
  const cohortApplications = applications.filter((application) => !activeCohort || application.cohortId === activeCohort.id);
  const cohortCourses = courses.filter((course) => course.audience === "all" || course.cohortIds?.includes(activeCohort?.id ?? ""));
  const reviewCount = cohortApplications.filter((application) => application.status === "submitted" || application.status === "under_review").length;
  const activeCourses = cohortCourses.filter((course) => course.status === "published").length;
  const upcoming = events.filter((event) => new Date(event.startTime) > new Date()).sort((a, b) => +new Date(a.startTime) - +new Date(b.startTime));
  const nextEvent = upcoming[0];

  return (
    <div className="flex h-screen flex-col md:flex-row">
      <AdminSidebar />
      <main className="flex-1 overflow-auto">
        <div className="mx-auto max-w-7xl p-5 md:p-8">
          <header className="mb-7 flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-primary"><Sparkles className="h-3.5 w-3.5" /> Cohort workspace</p>
              <h1 className="font-serif text-3xl font-semibold tracking-tight" data-testid="text-admin-welcome">Good morning, {user?.firstName || "Admin"}.</h1>
              <p className="mt-1 text-sm text-muted-foreground">Here’s the pulse of your programme workspace.</p>
            </div>
             <Link href={activeCohort ? `/admin/cohort-report?cohortId=${encodeURIComponent(activeCohort.id)}` : "/admin/cohort-report"}><Button variant="outline" size="sm" className="gap-2">View reports <ArrowUpRight className="h-3.5 w-3.5" /></Button></Link>
          </header>

          {isLoading ? <DashboardSkeleton /> : (
            <>
              <section className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
                <Card className="overflow-hidden border-primary bg-primary text-primary-foreground">
                  <CardContent className="relative p-6">
                    <div className="absolute -right-16 -top-24 h-52 w-52 rounded-full border border-primary-foreground/15" />
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary-foreground/70">Current cohort</p>
                    <h2 className="mt-3 font-serif text-2xl">{activeCohort?.displayName || activeCohort?.name || "No active cohort"}</h2>
                    <p className="mt-3 flex items-center gap-2 text-sm text-primary-foreground/75"><Users className="h-4 w-4" /> {cohortApplications.length} applications</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Programme status</CardTitle></CardHeader>
                  <CardContent className="grid grid-cols-3 gap-3">
                    <div><p className="text-2xl font-semibold text-primary">{activeCourses}</p><p className="text-xs text-muted-foreground">Live courses</p></div>
                    <div><p className="text-2xl font-semibold text-primary">{resources.length}</p><p className="text-xs text-muted-foreground">Resources</p></div>
                    <div><p className="text-2xl font-semibold text-primary">{upcoming.length}</p><p className="text-xs text-muted-foreground">Events</p></div>
                  </CardContent>
                </Card>
              </section>

              <section className="mt-4 flex flex-wrap items-center gap-3 rounded-lg border border-amber-300/60 bg-amber-50 p-4 dark:bg-amber-950/20">
                <div className="grid h-9 w-9 place-items-center rounded-md bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300"><AlertCircle className="h-5 w-5" /></div>
                <div className="min-w-0 flex-1"><h2 className="text-sm font-semibold">Needs attention</h2><p className="text-xs text-muted-foreground">{reviewCount ? `${reviewCount} applications are waiting for review.` : "No application reviews are waiting."}</p></div>
                <Link href={adminCohortHref("/admin/applications", activeCohort?.id)}><Button variant="ghost" size="sm" className="gap-1">Review queue <ArrowUpRight className="h-3.5 w-3.5" /></Button></Link>
              </section>

              <section className="mt-4 grid gap-4 lg:grid-cols-[1.25fr_.75fr]">
                <Card>
                  <CardHeader><CardTitle className="font-serif text-xl">Common actions</CardTitle></CardHeader>
                  <CardContent className="grid gap-3 sm:grid-cols-2">
                    {[
                      ["/admin/applications", "Review applications", "Evaluate and move applicants forward.", FileText],
                      ["/admin/assignments", "Manage assignments", "Publish work and review submissions.", ClipboardCheck],
                      ["/admin/learning-pods", "Open learning pods", "Check membership and facilitator activity.", Network],
                      ["/admin/courses", "Manage learning content", "Update courses and programme resources.", BookOpen],
                    ].map(([href, title, description, Icon]) => (
                      <Link key={href as string} href={adminCohortHref(href as string, activeCohort?.id)}>
                        <div className="h-full rounded-lg border p-4 transition-colors hover:bg-accent">
                          <Icon className="h-5 w-5 text-primary" />
                          <h3 className="mt-3 text-sm font-semibold">{title as string}</h3>
                          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{description as string}</p>
                        </div>
                      </Link>
                    ))}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle className="font-serif text-xl">Upcoming work</CardTitle></CardHeader>
                  <CardContent>
                    {nextEvent ? (
                      <div className="flex gap-3">
                        <div className="grid h-10 w-10 place-items-center rounded-md bg-secondary"><CalendarDays className="h-5 w-5 text-primary" /></div>
                        <div><p className="text-sm font-semibold">{nextEvent.title}</p><p className="mt-1 text-xs text-muted-foreground">{new Date(nextEvent.startTime).toLocaleString()}</p></div>
                      </div>
                    ) : <p className="text-sm text-muted-foreground">No upcoming events are scheduled.</p>}
                    <div className="mt-5 border-t pt-4">
                      <Link href="/admin/events"><Button variant="outline" size="sm" className="w-full gap-2"><CalendarDays className="h-4 w-4" /> Open calendar</Button></Link>
                    </div>
                  </CardContent>
                </Card>
              </section>

              <section className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border px-4 py-3 text-sm">
                <span className="flex items-center gap-2 text-muted-foreground"><CheckCircle2 className="h-4 w-4 text-primary" /> Workspace data is up to date</span>
                <Link href="/admin/cohorts"><Button variant="ghost" size="sm" className="gap-2"><FolderKanban className="h-4 w-4" /> Manage cohorts</Button></Link>
              </section>
              <div className="mt-8"><PrivateVideoCleanupCard /></div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}