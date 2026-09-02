import { useState } from "react";
import { Link } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { LMSSidebar } from "@/components/LMSSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress as ProgressBar } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { BookOpen, CheckCircle2, Flag, MessageSquare, Target, Users } from "lucide-react";

type Report = {
  participant: { id: string; status: string; user: { firstName: string; lastName: string } };
  cohort: { name: string; displayName?: string | null; year?: number | null };
  project: { name?: string | null; description?: string | null; stage?: string | null };
  progressAreas: { key: string; label: string }[];
  milestones: { id: string; title: string; description?: string | null; status: string; evidence?: string | null; targetAt?: string | null }[];
  reviews: { id: string; reviewType: string; status: string; participantReflection?: string | null; summary?: string | null; achievements?: string | null; challenges?: string | null; nextSteps?: string | null; areaUpdates: Record<string, { status: string; evidence?: string }> }[];
  feedback: { id: string; content: string; sourceType: string; visibility: string; createdAt: string }[];
  courses: { id: string; title: string; progressPercent: number; completed: boolean; completedLessons: number; totalLessons: number }[];
  pods: { id: string; name: string; mentor?: { name: string } | null; assignmentCount: number; submittedAssignments: number; reviewedAssignments: number }[];
  activity: { assignedCourses: number; completedCourses: number; courseCompletionPercent: number; assignments: number; submittedAssignments: number; reviewedAssignments: number; completedMentorshipSessions: number };
};

const STATUS_LABELS: Record<string, string> = {
  not_started: "Not started",
  emerging: "Emerging",
  progressing: "Progressing",
  strong_progress: "Strong progress",
  achieved: "Achieved",
  not_applicable: "Not applicable",
};

function label(value: string) {
  return STATUS_LABELS[value] ?? value.replace(/_/g, " ");
}

function statusVariant(status: string): "default" | "secondary" | "outline" {
  if (status === "achieved" || status === "completed") return "default";
  if (status === "strong_progress" || status === "progressing" || status === "in_progress") return "secondary";
  return "outline";
}

export default function ProgressPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [milestoneTitle, setMilestoneTitle] = useState("");
  const [milestoneDescription, setMilestoneDescription] = useState("");
  const [reflection, setReflection] = useState("");
  const [reflectionType, setReflectionType] = useState("midpoint");

  const { data, isLoading } = useQuery<{ report: Report | null }>({
    queryKey: ["/api/progress-reporting/me"],
  });
  const report = data?.report;

  const milestoneMutation = useMutation({
    mutationFn: async () => {
      if (!report || !milestoneTitle.trim()) throw new Error("Add a milestone title.");
      const response = await apiRequest("POST", `/api/progress-reporting/participants/${report.participant.id}/milestones`, {
        title: milestoneTitle.trim(),
        description: milestoneDescription.trim() || null,
        status: "planned",
      });
      return response.json();
    },
    onSuccess: () => {
      setMilestoneTitle("");
      setMilestoneDescription("");
      queryClient.invalidateQueries({ queryKey: ["/api/progress-reporting/me"] });
      toast({ title: "Milestone added", description: "Your programme milestone has been saved." });
    },
    onError: (error: Error) => toast({ title: "Could not add milestone", description: error.message, variant: "destructive" }),
  });
  const milestoneUpdateMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => (await apiRequest("PATCH", `/api/progress-reporting/milestones/${id}`, { status })).json(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/progress-reporting/me"] }),
    onError: (error: Error) => toast({ title: "Could not update milestone", description: error.message, variant: "destructive" }),
  });

  const reflectionMutation = useMutation({
    mutationFn: async () => {
      if (!report || !reflection.trim()) throw new Error("Write a reflection before saving.");
      const response = await apiRequest("PATCH", `/api/progress-reporting/participants/${report.participant.id}/reviews/${reflectionType}`, {
        participantReflection: reflection.trim(),
      });
      return response.json();
    },
    onSuccess: () => {
      setReflection("");
      queryClient.invalidateQueries({ queryKey: ["/api/progress-reporting/me"] });
      toast({ title: "Reflection saved", description: "Your reflection is now part of your progress record." });
    },
    onError: (error: Error) => toast({ title: "Could not save reflection", description: error.message, variant: "destructive" }),
  });

  return (
    <div className="flex flex-col md:flex-row min-h-screen">
      <LMSSidebar />
      <main className="flex-1 overflow-auto">
        <div className="max-w-6xl mx-auto p-6 md:p-10 space-y-8">
          {isLoading ? <div className="text-muted-foreground">Loading your progress…</div> : !report ? (
            <Card>
              <CardContent className="p-8 text-center space-y-3">
                <Target className="h-10 w-10 text-primary mx-auto" />
                <h1 className="text-2xl font-semibold">Your progress record is not ready yet</h1>
                <p className="text-muted-foreground">Once you are accepted into a cohort, your progress journey will appear here.</p>
                <Link href="/lms/dashboard"><Button>Back to dashboard</Button></Link>
              </CardContent>
            </Card>
          ) : (
            <>
              <div>
                <p className="text-sm text-primary font-medium">{report.cohort.displayName || report.cohort.name}{report.cohort.year ? ` · ${report.cohort.year}` : ""}</p>
                <h1 className="text-3xl font-bold mt-1">My progress journey</h1>
                <p className="text-muted-foreground mt-2">A record of your learning, project milestones, and feedback throughout the cohort.</p>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card><CardContent className="p-5"><BookOpen className="h-5 w-5 text-primary mb-3" /><p className="text-2xl font-bold">{report.activity.courseCompletionPercent}%</p><p className="text-sm text-muted-foreground">Course completion</p></CardContent></Card>
                <Card><CardContent className="p-5"><CheckCircle2 className="h-5 w-5 text-primary mb-3" /><p className="text-2xl font-bold">{report.activity.completedCourses}/{report.activity.assignedCourses}</p><p className="text-sm text-muted-foreground">Courses completed</p></CardContent></Card>
                <Card><CardContent className="p-5"><Flag className="h-5 w-5 text-primary mb-3" /><p className="text-2xl font-bold">{report.milestones.filter((milestone) => milestone.status === "completed").length}/{report.milestones.length}</p><p className="text-sm text-muted-foreground">Milestones completed</p></CardContent></Card>
                <Card><CardContent className="p-5"><MessageSquare className="h-5 w-5 text-primary mb-3" /><p className="text-2xl font-bold">{report.activity.reviewedAssignments}</p><p className="text-sm text-muted-foreground">Reviewed submissions</p></CardContent></Card>
              </div>

              <div className="grid lg:grid-cols-[1.4fr_1fr] gap-6">
                <Card>
                  <CardHeader><CardTitle className="flex items-center gap-2"><Target className="h-5 w-5 text-primary" />Project baseline</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <div><p className="font-semibold">{report.project.name || "Project details pending"}</p><p className="text-sm text-muted-foreground mt-1">{report.project.description || "Your project description will appear here."}</p></div>
                    <div className="flex items-center gap-2"><span className="text-sm text-muted-foreground">Current stage</span><Badge variant="outline">{report.project.stage || "Not recorded"}</Badge></div>
                    <ProgressBar value={report.activity.courseCompletionPercent} className="h-2" />
                    <p className="text-xs text-muted-foreground">Learning progress is shown alongside project milestones so the final report reflects both participation and development.</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle className="flex items-center gap-2"><Users className="h-5 w-5 text-primary" />Learning pod</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    {report.pods.length === 0 ? <p className="text-sm text-muted-foreground">Your pod assignment will appear here.</p> : report.pods.map((pod) => (
                      <div key={pod.id} className="border rounded-lg p-4">
                        <p className="font-medium">{pod.name}</p>
                        <p className="text-sm text-muted-foreground">{pod.mentor ? `Mentor: ${pod.mentor.name}` : "Mentor pending"}</p>
                        <p className="text-xs text-muted-foreground mt-2">{pod.submittedAssignments}/{pod.assignmentCount} assignments submitted · {pod.reviewedAssignments} reviewed</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader><CardTitle>Learning progress</CardTitle></CardHeader>
                <CardContent className="space-y-5">
                  {report.courses.length === 0 ? <p className="text-sm text-muted-foreground">No published courses are assigned to this cohort yet.</p> : report.courses.map((course) => (
                    <div key={course.id} className="space-y-2">
                      <div className="flex justify-between gap-4 text-sm"><span className="font-medium">{course.title}</span><span className="text-muted-foreground">{course.progressPercent}%</span></div>
                      <ProgressBar value={course.progressPercent} className="h-2" />
                      <p className="text-xs text-muted-foreground">{course.completedLessons} of {course.totalLessons} lessons completed</p>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <div className="grid lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader><CardTitle>Milestones</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    {report.milestones.map((milestone) => <div key={milestone.id} className="flex gap-3 border-b last:border-0 pb-3 last:pb-0"><Flag className="h-4 w-4 text-primary mt-1 shrink-0" /><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center justify-between gap-2"><p className="font-medium">{milestone.title}</p><select className="h-8 rounded-md border bg-background px-2 text-xs" value={milestone.status} onChange={(event) => milestoneUpdateMutation.mutate({ id: milestone.id, status: event.target.value })}><option value="planned">Planned</option><option value="in_progress">In progress</option><option value="completed">Completed</option><option value="blocked">Blocked</option></select></div>{milestone.description && <p className="text-sm text-muted-foreground mt-1">{milestone.description}</p>}{milestone.evidence && <p className="text-xs text-muted-foreground mt-1">Evidence: {milestone.evidence}</p>}</div></div>)}
                    {report.milestones.length === 0 && <p className="text-sm text-muted-foreground">Add your first milestone below.</p>}
                    <div className="border-t pt-4 space-y-3">
                      <Input value={milestoneTitle} onChange={(event) => setMilestoneTitle(event.target.value)} placeholder="Milestone title" />
                      <Textarea value={milestoneDescription} onChange={(event) => setMilestoneDescription(event.target.value)} placeholder="What would you like to accomplish?" />
                      <Button onClick={() => milestoneMutation.mutate()} disabled={milestoneMutation.isPending || !milestoneTitle.trim()}>{milestoneMutation.isPending ? "Saving…" : "Add milestone"}</Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader><CardTitle>Check-ins and feedback</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    {report.reviews.length === 0 ? <p className="text-sm text-muted-foreground">Your baseline review will appear once your cohort team completes it.</p> : report.reviews.map((review) => <div key={review.id} className="border rounded-lg p-4 space-y-2"><div className="flex justify-between gap-3"><p className="font-medium capitalize">{review.reviewType} review</p><Badge variant={review.status === "published" ? "default" : "outline"}>{review.status}</Badge></div>{review.summary && <p className="text-sm">{review.summary}</p>}{review.participantReflection && <p className="text-sm text-muted-foreground"><span className="font-medium text-foreground">Your reflection:</span> {review.participantReflection}</p>}</div>)}
                    <div className="border-t pt-4 space-y-3">
                      <select className="w-full h-10 rounded-md border bg-background px-3 text-sm" value={reflectionType} onChange={(event) => setReflectionType(event.target.value)}>
                        <option value="baseline">Baseline reflection</option><option value="midpoint">Midpoint reflection</option><option value="final">Final reflection</option>
                      </select>
                      <Textarea value={reflection} onChange={(event) => setReflection(event.target.value)} placeholder="What has changed in your project or learning since the last check-in?" />
                      <Button onClick={() => reflectionMutation.mutate()} disabled={reflectionMutation.isPending || !reflection.trim()}>{reflectionMutation.isPending ? "Saving…" : "Save reflection"}</Button>
                    </div>
                    {report.feedback.length > 0 && <div className="border-t pt-4 space-y-3"><p className="text-sm font-semibold">Recent feedback</p>{report.feedback.slice(0, 5).map((item) => <div key={item.id} className="text-sm"><p>{item.content}</p><p className="text-xs text-muted-foreground mt-1">{item.sourceType} · {new Date(item.createdAt).toLocaleDateString()}</p></div>)}</div>}
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}