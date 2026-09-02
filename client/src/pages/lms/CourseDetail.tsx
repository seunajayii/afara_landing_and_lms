import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import { LMSSidebar } from "@/components/LMSSidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import { ArrowLeft, CheckCircle2, ChevronLeft, ChevronRight, Circle, Download, FileText, Lock, PlayCircle, ShieldCheck, Video } from "lucide-react";
import type { Course, Lesson, LessonProgress, Module, Resource } from "@shared/schema";

type LessonWithResource = Lesson & { resource?: Resource | null; contentAvailable?: boolean };
type ModuleWithLessons = Module & { lessons: LessonWithResource[] };
type CourseCurriculum = Course & { modules: ModuleWithLessons[]; lessonCount: number; calculatedDurationMinutes: number };

function formatDuration(minutes: number | null | undefined) {
  if (!minutes) return "Self-paced";
  if (minutes < 60) return `${minutes} min`;
  return `${Math.floor(minutes / 60)}h${minutes % 60 ? ` ${minutes % 60}m` : ""}`;
}

function PrivateLessonVideo({ resource }: { resource: Resource }) {
  const playback = useQuery<{ playbackUrl: string }>({
    queryKey: ["/api/resources", resource.id, "playback"],
    queryFn: async () => {
      const response = await fetch(`/api/resources/${resource.id}/playback`, { credentials: "include" });
      if (!response.ok) throw new Error("Unable to authorize playback");
      return response.json();
    },
  });
  if (playback.isLoading) return <div className="flex aspect-video items-center justify-center rounded-lg bg-muted"><span className="text-sm text-muted-foreground">Preparing protected video…</span></div>;
  if (playback.isError || !playback.data?.playbackUrl) return <div className="flex aspect-video flex-col items-center justify-center rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-center"><Lock className="mb-3 h-7 w-7 text-destructive" /><p className="font-medium">Playback is unavailable</p><p className="mt-1 text-sm text-muted-foreground">Your access could not be verified. Please sign in again and retry.</p></div>;
  return <div className="aspect-video overflow-hidden rounded-lg bg-black"><video className="h-full w-full" src={playback.data.playbackUrl} controls controlsList="nodownload" preload="metadata" data-testid="private-lesson-player">Your browser does not support video playback.</video></div>;
}

export default function CourseDetail() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
  const courseQuery = useQuery<CourseCurriculum>({
    queryKey: ["/api/courses", id, user?.id, user?.role],
    enabled: Boolean(user?.id && id),
    queryFn: async () => {
      const response = await fetch(`/api/courses/${id}`, { credentials: "include" });
      if (!response.ok) throw new Error(response.status === 404 ? "This course is not available." : "Unable to load this course.");
      return response.json();
    },
  });
  const progressQuery = useQuery<LessonProgress[]>({ queryKey: ["/api/progress/me"] });
  const allLessons = useMemo(() => courseQuery.data?.modules.flatMap((module) => module.lessons) || [], [courseQuery.data]);
  const activeLesson = allLessons.find((lesson) => lesson.id === activeLessonId) || allLessons[0];
  const completedIds = new Set((progressQuery.data || []).filter((entry) => entry.status === "completed").map((entry) => entry.lessonId));
  const startedEntries = (progressQuery.data || []).filter((entry) => entry.status !== "not_started").sort((a, b) => new Date(b.lastAccessedAt || 0).getTime() - new Date(a.lastAccessedAt || 0).getTime());
  const completedPercent = allLessons.length ? Math.round((allLessons.filter((lesson) => completedIds.has(lesson.id)).length / allLessons.length) * 100) : 0;
  const progressMutation = useMutation({
    mutationFn: async ({ lessonId, status, videoWatchedSeconds }: { lessonId: string; status: "in_progress" | "completed"; videoWatchedSeconds?: number }) =>
      apiRequest("POST", "/api/progress", { lessonId, status, videoWatchedSeconds }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/progress/me"] }),
  });

  useEffect(() => {
    if (activeLessonId || !allLessons.length) return;
    const resumeId = startedEntries.find((entry) => allLessons.some((lesson) => lesson.id === entry.lessonId))?.lessonId;
    setActiveLessonId(resumeId || allLessons[0].id);
  }, [activeLessonId, allLessons, startedEntries]);

  function selectLesson(lesson: LessonWithResource) {
    setActiveLessonId(lesson.id);
    if (!completedIds.has(lesson.id)) progressMutation.mutate({ lessonId: lesson.id, status: "in_progress" });
  }
  function completeCurrent() {
    if (activeLesson) progressMutation.mutate({ lessonId: activeLesson.id, status: "completed" });
  }

  return (
    <div className="flex h-screen flex-col md:flex-row"><LMSSidebar />
      <main className="flex-1 overflow-auto">
        <div className="mx-auto max-w-7xl p-6 md:p-8">
          <Button variant="ghost" className="mb-5 -ml-3" onClick={() => setLocation("/lms/courses")}><ArrowLeft className="mr-2 h-4 w-4" />Back to courses</Button>
          {courseQuery.isLoading && <div className="space-y-4"><Skeleton className="h-9 w-2/3" /><Skeleton className="h-5 w-1/2" /><Skeleton className="h-96 w-full" /></div>}
          {courseQuery.isError && <Card className="py-12 text-center"><CardContent><Lock className="mx-auto mb-3 h-8 w-8 text-muted-foreground" /><h1 className="text-xl font-semibold">Course unavailable</h1><p className="mt-2 text-muted-foreground">{courseQuery.error.message}</p><Button className="mt-5" variant="outline" onClick={() => setLocation("/lms/courses")}>Return to courses</Button></CardContent></Card>}
          {courseQuery.data && (
            <div>
              <div className="mb-8"><div className="mb-3 flex flex-wrap items-center gap-2"><Badge variant="secondary">{courseQuery.data.category || "General"}</Badge><span className="text-sm text-muted-foreground">{courseQuery.data.modules.length} modules · {allLessons.length} lessons · {formatDuration(courseQuery.data.durationMinutes)}</span></div><h1 className="text-3xl font-bold">{courseQuery.data.title}</h1>{courseQuery.data.description && <p className="mt-2 max-w-3xl text-muted-foreground">{courseQuery.data.description}</p>}<div className="mt-5 max-w-md"><div className="mb-1 flex justify-between text-sm"><span className="text-muted-foreground">Course progress</span><span className="font-medium">{completedPercent}%</span></div><Progress value={completedPercent} /></div></div>
              {allLessons.length === 0 ? <Card className="py-12 text-center"><CardContent><FileText className="mx-auto mb-3 h-8 w-8 text-muted-foreground" /><h2 className="text-lg font-semibold">Content is being prepared</h2><p className="mt-1 text-sm text-muted-foreground">Check back when the course lessons are published.</p></CardContent></Card> :
                <div className="grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
                  <aside className="rounded-lg border bg-card lg:sticky lg:top-4 lg:max-h-[calc(100vh-4rem)] lg:overflow-y-auto"><div className="border-b p-4"><h2 className="font-semibold">Course content</h2><p className="mt-1 text-xs text-muted-foreground">Pick up where you left off at any time.</p></div>{courseQuery.data.modules.map((module, index) => <div key={module.id} className="border-b last:border-b-0"><p className="px-4 pt-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Module {index + 1}: {module.title}</p><div className="p-2">{module.lessons.map((lesson) => <button key={lesson.id} type="button" onClick={() => selectLesson(lesson)} className={`flex w-full items-center gap-2 rounded-md p-2.5 text-left text-sm transition-colors ${activeLesson?.id === lesson.id ? "bg-primary/10 text-primary" : "hover:bg-muted"}`} data-testid={`lesson-nav-${lesson.id}`}>{completedIds.has(lesson.id) ? <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" /> : activeLesson?.id === lesson.id ? <PlayCircle className="h-4 w-4 shrink-0" /> : <Circle className="h-4 w-4 shrink-0 text-muted-foreground" />}<span className="min-w-0 flex-1 truncate">{lesson.title}</span></button>)}</div></div>)}</aside>
                  {activeLesson && <section className="min-w-0"><Card><CardContent className="p-5 md:p-7"><div className="mb-5 flex flex-wrap items-start justify-between gap-3"><div><div className="mb-2 flex gap-2"><Badge variant="outline">{activeLesson.lessonType === "downloadable" ? "Download" : activeLesson.lessonType}</Badge>{completedIds.has(activeLesson.id) && <Badge className="bg-emerald-500/10 text-emerald-700">Completed</Badge>}</div><h2 className="text-2xl font-bold">{activeLesson.title}</h2>{activeLesson.description && <p className="mt-2 text-muted-foreground">{activeLesson.description}</p>}</div><span className="text-sm text-muted-foreground">{formatDuration(activeLesson.durationMinutes)}</span></div>
                    {!activeLesson.contentAvailable ? <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-5 text-sm">This lesson’s resource is not available for your account. Contact the programme team if you think this is incorrect.</div> :
                      activeLesson.lessonType === "video" && activeLesson.resource?.videoSource === "upload" ? <div className="space-y-3"><PrivateLessonVideo resource={activeLesson.resource} /><p className="flex items-center gap-2 text-sm text-muted-foreground"><ShieldCheck className="h-4 w-4 text-primary" />Protected video · signed playback</p></div> :
                      activeLesson.lessonType === "video" && (activeLesson.resource?.youtubeVideoId || activeLesson.videoId) ? <div className="aspect-video overflow-hidden rounded-lg bg-black"><iframe className="h-full w-full" src={`https://www.youtube-nocookie.com/embed/${activeLesson.resource?.youtubeVideoId || activeLesson.videoId}`} title={activeLesson.title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen data-testid="youtube-lesson-player" /></div> :
                      activeLesson.lessonType === "downloadable" && activeLesson.resource ? <div className="rounded-lg border bg-muted/30 p-6"><FileText className="mb-3 h-8 w-8 text-primary" /><h3 className="font-semibold">{activeLesson.resource.title}</h3><p className="mt-1 text-sm text-muted-foreground">{activeLesson.resource.description || "Open or download this material when you are ready."}</p><div className="mt-4 flex flex-wrap gap-2"><Button onClick={() => { completeCurrent(); setLocation(`/lms/resources/${activeLesson.resource!.id}`); }}><FileText className="mr-2 h-4 w-4" />Open resource</Button>{activeLesson.resource.fileUrl && <Button asChild variant="outline" onClick={completeCurrent}><a href={activeLesson.resource.fileUrl} target="_blank" rel="noreferrer"><Download className="mr-2 h-4 w-4" />Download</a></Button>}</div></div> :
                      activeLesson.lessonType === "text" ? <div className="whitespace-pre-wrap rounded-lg bg-muted/40 p-5 leading-7">{activeLesson.content}</div> :
                      <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-5 text-sm">This lesson is being prepared.</div>}
                    <div className="mt-7 flex flex-wrap justify-between gap-3 border-t pt-5"><Button variant="outline" disabled={allLessons.findIndex((lesson) => lesson.id === activeLesson.id) === 0} onClick={() => { const index = allLessons.findIndex((lesson) => lesson.id === activeLesson.id); selectLesson(allLessons[index - 1]); }}><ChevronLeft className="mr-2 h-4 w-4" />Previous</Button><Button variant={completedIds.has(activeLesson.id) ? "outline" : "default"} onClick={completeCurrent}>{completedIds.has(activeLesson.id) ? <><CheckCircle2 className="mr-2 h-4 w-4" />Completed</> : "Mark complete"}</Button><Button variant="outline" disabled={allLessons.findIndex((lesson) => lesson.id === activeLesson.id) === allLessons.length - 1} onClick={() => { const index = allLessons.findIndex((lesson) => lesson.id === activeLesson.id); selectLesson(allLessons[index + 1]); }}>Next<ChevronRight className="ml-2 h-4 w-4" /></Button></div>
                  </CardContent></Card></section>}
                </div>}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}