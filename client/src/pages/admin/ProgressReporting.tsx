import { useEffect, useMemo, useState } from "react";
import { AdminSidebar } from "@/components/AdminSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { getAdminCohortId, setAdminCohortId } from "@/lib/adminCohortContext";
import { ExternalLink, FileText, Flag, MessageSquare, Paperclip, Printer, Save, Target, Users } from "lucide-react";
import type { Cohort } from "@shared/schema";

const AREAS = [
  { key: "learning_application", label: "Learning & application" },
  { key: "project_business_development", label: "Project & business development" },
  { key: "leadership_execution", label: "Leadership & execution" },
  { key: "financial_operational_readiness", label: "Financial & operational readiness" },
  { key: "collaboration_network_engagement", label: "Collaboration & network engagement" },
];
const STATUSES = [
  { value: "not_started", label: "Not started" },
  { value: "emerging", label: "Emerging" },
  { value: "progressing", label: "Progressing" },
  { value: "strong_progress", label: "Strong progress" },
  { value: "achieved", label: "Achieved" },
  { value: "not_applicable", label: "Not applicable" },
];

type ProgressRow = {
  participant: { id: string; status: string; user: { firstName: string; lastName: string } };
  project: { name?: string | null; stage?: string | null };
  activity: { courseCompletionPercent: number; completedCourses: number; assignedCourses: number; assignments: number; submittedAssignments: number; reviewedAssignments: number; completedMentorshipSessions?: number };
  milestones: { id: string; title: string; description?: string | null; status: string; evidence?: string | null }[];
  reviews: { id: string; reviewType: string; status: string; participantReflection?: string | null; summary?: string | null; achievements?: string | null; challenges?: string | null; nextSteps?: string | null; areaUpdates: Record<string, { status: string; evidence?: string }> }[];
  pods: { name: string; mentor?: { name: string } | null }[];
};
type CohortReport = { cohort: Cohort; participants: ProgressRow[]; summary: { totalParticipants: number; activeParticipants: number; completedParticipants: number; courseCompletionPercent: number; milestonesCompleted: number; assignmentsSubmitted: number } };
type DetailReport = ProgressRow & {
  participant: ProgressRow["participant"] & { user: { email?: string; firstName: string; lastName: string } };
  project: { name?: string | null; description?: string | null; stage?: string | null };
  progressAreas: { key: string; label: string }[];
  application: { primarySector?: string | null; projectedImpact?: string | null; keyActivitiesForNextStage?: string | null } | null;
  admissionEvaluation: { overallScore: number; recommendation: string; summary: string } | null;
  milestones: { id: string; title: string; description?: string | null; status: string; evidence?: string | null }[];
  reviews: { id: string; reviewType: string; status: string; participantReflection?: string | null; summary?: string | null; achievements?: string | null; challenges?: string | null; nextSteps?: string | null; areaUpdates: Record<string, { status: string; evidence?: string }> }[];
  assignments: AssignmentEvidence[];
  feedback: { id: string; content: string; sourceType: string; visibility: string; createdAt: string }[];
  courses: { title: string; progressPercent: number; completed: boolean }[];
  activity: ProgressRow["activity"] & { completedMentorshipSessions: number };
};
type AssignmentEvidence = {
  id: string;
  assignmentId: string;
  title: string;
  assignmentType: string;
  sourceType: string;
  submissionId?: string | null;
  status: string;
  reviewState: "not_submitted" | "draft" | "submitted" | "reviewed";
  submittedAt?: string | null;
  reviewedAt?: string | null;
  score?: number | null;
  passed?: boolean | null;
  maxScore: number;
  responseText?: string | null;
  links: string[];
  feedback?: string | null;
  evidence: { name: string; contentType?: string; size: number; url: string }[];
};

function statusLabel(value: string) {
  return STATUSES.find((status) => status.value === value)?.label || value.replace(/_/g, " ");
}

function assignmentReviewLabel(value: AssignmentEvidence["reviewState"]) {
  return { not_submitted: "Not submitted", draft: "Draft", submitted: "Awaiting review", reviewed: "Reviewed" }[value];
}

export default function ProgressReporting() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [cohortId, setCohortId] = useState(() => getAdminCohortId() ?? "");
  const [participantId, setParticipantId] = useState("");
  const [reviewType, setReviewType] = useState("baseline");
  const [reviewSummary, setReviewSummary] = useState("");
  const [achievements, setAchievements] = useState("");
  const [challenges, setChallenges] = useState("");
  const [nextSteps, setNextSteps] = useState("");
  const [areaUpdates, setAreaUpdates] = useState<Record<string, { status: string; evidence: string }>>({});
  const [feedback, setFeedback] = useState("");
  const [feedbackVisibility, setFeedbackVisibility] = useState("participant");
  const [milestoneTitle, setMilestoneTitle] = useState("");
  const [milestoneDescription, setMilestoneDescription] = useState("");

  const { data: cohorts = [] } = useQuery<Cohort[]>({ queryKey: ["/api/admin/cohorts"] });
  useEffect(() => {
    if (!cohortId && cohorts[0]) setCohortId(cohorts[0].id);
  }, [cohorts, cohortId]);
  const { data: cohortReport, isLoading } = useQuery<CohortReport>({
    queryKey: ["/api/admin/progress/cohorts", cohortId],
    queryFn: async () => (await apiRequest("GET", `/api/admin/progress/cohorts/${cohortId}`)).json(),
    enabled: Boolean(cohortId),
  });
  useEffect(() => {
    if (cohortReport?.participants.length && !cohortReport.participants.some((row) => row.participant.id === participantId)) {
      setParticipantId(cohortReport.participants[0].participant.id);
    }
  }, [cohortReport, participantId]);
  const { data: detail } = useQuery<DetailReport>({
    queryKey: ["/api/progress-reporting/participants", participantId],
    queryFn: async () => (await apiRequest("GET", `/api/progress-reporting/participants/${participantId}`)).json(),
    enabled: Boolean(participantId),
  });
  const currentReview = useMemo(() => detail?.reviews.find((review) => review.reviewType === reviewType), [detail, reviewType]);
  const podSummaries = useMemo(() => {
    const groups = new Map<string, { name: string; mentor: string; members: number; completionTotal: number; submitted: number; reviewed: number }>();
    cohortReport?.participants.forEach((row) => row.pods.forEach((pod) => {
      const current = groups.get(pod.name) || { name: pod.name, mentor: pod.mentor?.name || "Mentor pending", members: 0, completionTotal: 0, submitted: 0, reviewed: 0 };
      current.members += 1;
      current.completionTotal += row.activity.courseCompletionPercent;
      current.submitted += row.activity.submittedAssignments;
      current.reviewed += row.activity.reviewedAssignments;
      groups.set(pod.name, current);
    }));
    return Array.from(groups.values()).map((pod) => ({ ...pod, completionPercent: pod.members ? Math.round(pod.completionTotal / pod.members) : 0 }));
  }, [cohortReport]);

  useEffect(() => {
    if (!currentReview) {
      setReviewSummary("");
      setAchievements("");
      setChallenges("");
      setNextSteps("");
      setAreaUpdates({});
      return;
    }
    setReviewSummary(currentReview.summary || "");
    setAchievements(currentReview.achievements || "");
    setChallenges(currentReview.challenges || "");
    setNextSteps(currentReview.nextSteps || "");
    setAreaUpdates(Object.fromEntries(Object.entries(currentReview.areaUpdates || {}).map(([key, value]) => [key, { status: value.status, evidence: value.evidence || "" }])));
  }, [currentReview]);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/admin/progress/cohorts", cohortId] });
    queryClient.invalidateQueries({ queryKey: ["/api/progress-reporting/participants", participantId] });
  };
  const reviewMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("PATCH", `/api/progress-reporting/participants/${participantId}/reviews/${reviewType}`, {
        status: "published",
        summary: reviewSummary.trim() || null,
        achievements: achievements.trim() || null,
        challenges: challenges.trim() || null,
        nextSteps: nextSteps.trim() || null,
        areaUpdates,
      });
      return response.json();
    },
    onSuccess: () => { invalidate(); toast({ title: "Review saved", description: `${reviewType[0].toUpperCase()}${reviewType.slice(1)} review published.` }); },
    onError: (error: Error) => toast({ title: "Could not save review", description: error.message, variant: "destructive" }),
  });
  const feedbackMutation = useMutation({
    mutationFn: async () => (await apiRequest("POST", `/api/progress-reporting/participants/${participantId}/feedback`, { content: feedback.trim(), visibility: feedbackVisibility, contextType: "progress_review" })).json(),
    onSuccess: () => { setFeedback(""); invalidate(); toast({ title: "Feedback added" }); },
    onError: (error: Error) => toast({ title: "Could not add feedback", description: error.message, variant: "destructive" }),
  });
  const milestoneMutation = useMutation({
    mutationFn: async () => (await apiRequest("POST", `/api/progress-reporting/participants/${participantId}/milestones`, { title: milestoneTitle.trim(), description: milestoneDescription.trim() || null, status: "planned" })).json(),
    onSuccess: () => { setMilestoneTitle(""); setMilestoneDescription(""); invalidate(); toast({ title: "Milestone added" }); },
    onError: (error: Error) => toast({ title: "Could not add milestone", description: error.message, variant: "destructive" }),
  });
  const milestoneUpdateMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => (await apiRequest("PATCH", `/api/progress-reporting/milestones/${id}`, { status })).json(),
    onSuccess: invalidate,
    onError: (error: Error) => toast({ title: "Could not update milestone", description: error.message, variant: "destructive" }),
  });

  return (
    <div className="flex flex-col md:flex-row min-h-screen">
      <AdminSidebar />
      <main className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto p-6 md:p-10 space-y-6">
          <div className="flex flex-wrap justify-between items-start gap-4">
            <div><p className="text-sm text-primary font-medium">Programme evidence</p><h1 className="text-3xl font-bold mt-1">Progress reporting</h1><p className="text-muted-foreground mt-2">Track participant, pod, and cohort progress from baseline to final review.</p></div>
            <Button variant="outline" onClick={() => window.print()}><Printer className="h-4 w-4 mr-2" />Print report</Button>
          </div>
          <div className="max-w-sm"><Select value={cohortId} onValueChange={(value) => { setCohortId(value); setAdminCohortId(value); setParticipantId(""); }}><SelectTrigger><SelectValue placeholder="Select a cohort" /></SelectTrigger><SelectContent>{cohorts.map((cohort) => <SelectItem key={cohort.id} value={cohort.id}>{cohort.displayName || cohort.name}{cohort.year ? ` · ${cohort.year}` : ""}</SelectItem>)}</SelectContent></Select></div>
          {cohortReport && <div className="grid sm:grid-cols-2 lg:grid-cols-6 gap-3">
            <Card><CardContent className="p-4"><Users className="h-4 w-4 text-primary mb-2" /><p className="text-2xl font-bold">{cohortReport.summary.totalParticipants}</p><p className="text-xs text-muted-foreground">Participants</p></CardContent></Card>
            <Card><CardContent className="p-4"><Target className="h-4 w-4 text-primary mb-2" /><p className="text-2xl font-bold">{cohortReport.summary.activeParticipants}</p><p className="text-xs text-muted-foreground">Active</p></CardContent></Card>
            <Card><CardContent className="p-4"><FileText className="h-4 w-4 text-primary mb-2" /><p className="text-2xl font-bold">{cohortReport.summary.courseCompletionPercent}%</p><p className="text-xs text-muted-foreground">Course completion</p></CardContent></Card>
            <Card><CardContent className="p-4"><Flag className="h-4 w-4 text-primary mb-2" /><p className="text-2xl font-bold">{cohortReport.summary.milestonesCompleted}</p><p className="text-xs text-muted-foreground">Milestones complete</p></CardContent></Card>
            <Card><CardContent className="p-4"><MessageSquare className="h-4 w-4 text-primary mb-2" /><p className="text-2xl font-bold">{cohortReport.summary.assignmentsSubmitted}</p><p className="text-xs text-muted-foreground">Submissions</p></CardContent></Card>
            <Card><CardContent className="p-4"><CheckIcon /><p className="text-2xl font-bold">{cohortReport.summary.completedParticipants}</p><p className="text-xs text-muted-foreground">Completed</p></CardContent></Card>
          </div>}
          {podSummaries.length > 0 && <Card><CardHeader><CardTitle>Pod summaries</CardTitle></CardHeader><CardContent className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">{podSummaries.map((pod) => <div key={pod.name} className="border rounded-lg p-4"><div className="flex justify-between gap-2"><p className="font-medium">{pod.name}</p><Badge variant="outline">{pod.completionPercent}% learning</Badge></div><p className="text-xs text-muted-foreground mt-1">{pod.members} participant{pod.members === 1 ? "" : "s"} · {pod.mentor}</p><p className="text-xs text-muted-foreground mt-2">{pod.submitted} submissions · {pod.reviewed} reviewed</p></div>)}</CardContent></Card>}
          <div className="grid xl:grid-cols-[360px_1fr] gap-6">
            <Card className="h-fit"><CardHeader><CardTitle>Participants</CardTitle></CardHeader><CardContent className="space-y-2">
              {isLoading && <p className="text-sm text-muted-foreground">Loading participants…</p>}
              {!isLoading && !cohortReport?.participants.length && <p className="text-sm text-muted-foreground">No accepted participants have been recorded for this cohort yet.</p>}
              {cohortReport?.participants.map((row) => <button key={row.participant.id} onClick={() => setParticipantId(row.participant.id)} className={`w-full text-left border rounded-lg p-3 transition-colors ${row.participant.id === participantId ? "border-primary bg-primary/5" : "hover:bg-muted/50"}`}><div className="flex justify-between gap-2"><span className="font-medium">{row.participant.user.firstName} {row.participant.user.lastName}</span><Badge variant="outline">{row.activity.courseCompletionPercent}%</Badge></div><p className="text-xs text-muted-foreground mt-1">{row.project.name || "Project not named"}{row.pods[0] ? ` · ${row.pods[0].name}` : ""}</p></button>)}
            </CardContent></Card>
            {!detail ? <Card><CardContent className="p-8 text-center text-muted-foreground">Select a participant to review their progress record.</CardContent></Card> : <div className="space-y-6" id="progress-report">
              <Card><CardHeader><div className="flex flex-wrap justify-between gap-3"><div><CardTitle>{detail.participant.user.firstName} {detail.participant.user.lastName}</CardTitle><p className="text-sm text-muted-foreground mt-1">{detail.project.name || "Project not named"} · {detail.project.stage || "Stage not recorded"}</p></div><Badge>{detail.participant.status}</Badge></div></CardHeader><CardContent className="grid sm:grid-cols-3 gap-4 text-sm"><div><p className="text-muted-foreground">Courses</p><p className="font-semibold">{detail.activity.completedCourses}/{detail.activity.assignedCourses} completed</p></div><div><p className="text-muted-foreground">Pod work</p><p className="font-semibold">{detail.activity.submittedAssignments}/{detail.activity.assignments} submitted</p></div><div><p className="text-muted-foreground">Mentorship</p><p className="font-semibold">{detail.activity.completedMentorshipSessions} completed sessions</p></div><p className="sm:col-span-3 text-sm">{detail.project.description || "No project description recorded."}</p></CardContent></Card>
              <div className="grid lg:grid-cols-2 gap-6">
                <Card><CardHeader><CardTitle>Progress review</CardTitle></CardHeader><CardContent className="space-y-3"><Select value={reviewType} onValueChange={setReviewType}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="baseline">Baseline review</SelectItem><SelectItem value="midpoint">Midpoint review</SelectItem><SelectItem value="final">Final review</SelectItem></SelectContent></Select><Textarea value={reviewSummary} onChange={(event) => setReviewSummary(event.target.value)} placeholder="Overall progress summary" /><Textarea value={achievements} onChange={(event) => setAchievements(event.target.value)} placeholder="Achievements and evidence" /><Textarea value={challenges} onChange={(event) => setChallenges(event.target.value)} placeholder="Challenges or support needs" /><Textarea value={nextSteps} onChange={(event) => setNextSteps(event.target.value)} placeholder="Recommended next steps" /><div className="space-y-3 border-t pt-3"><p className="text-sm font-semibold">Five progress areas</p>{AREAS.map((area) => <div key={area.key} className="space-y-1"><div className="flex justify-between gap-3 items-center"><label className="text-sm">{area.label}</label><select className="h-8 rounded-md border bg-background px-2 text-xs" value={areaUpdates[area.key]?.status || "not_started"} onChange={(event) => setAreaUpdates((current) => ({ ...current, [area.key]: { status: event.target.value, evidence: current[area.key]?.evidence || "" } }))}>{STATUSES.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}</select></div><Input value={areaUpdates[area.key]?.evidence || ""} onChange={(event) => setAreaUpdates((current) => ({ ...current, [area.key]: { status: current[area.key]?.status || "not_started", evidence: event.target.value } }))} placeholder="Evidence or observation (optional)" /></div>)}</div><Button onClick={() => reviewMutation.mutate()} disabled={reviewMutation.isPending}><Save className="h-4 w-4 mr-2" />{reviewMutation.isPending ? "Saving…" : "Publish review"}</Button></CardContent></Card>
                <div className="space-y-6">
                  <Card><CardHeader><CardTitle className="flex items-center gap-2"><Paperclip className="h-4 w-4 text-primary" />Assignment evidence</CardTitle></CardHeader><CardContent className="space-y-4">
                    {detail.assignments.length === 0 ? <p className="text-sm text-muted-foreground">No published assignments are linked to this participant yet.</p> : detail.assignments.map((assignment) => <div key={assignment.id} className="border-b last:border-0 pb-4 last:pb-0 space-y-2">
                      <div className="flex flex-wrap items-start justify-between gap-2"><div><p className="text-sm font-semibold">{assignment.title}</p><p className="text-xs text-muted-foreground capitalize">{assignment.sourceType.replace("_", " ")} · {assignment.assignmentType.replace("_", " ")}</p></div><Badge variant={assignment.reviewState === "reviewed" ? "default" : "outline"}>{assignmentReviewLabel(assignment.reviewState)}</Badge></div>
                      {assignment.submittedAt && <p className="text-xs text-muted-foreground">Submitted {new Date(assignment.submittedAt).toLocaleDateString()}</p>}
                      {assignment.score !== null && assignment.score !== undefined && <p className="text-sm">Score: <span className="font-medium">{assignment.score}/{assignment.maxScore}</span>{assignment.passed !== null && assignment.passed !== undefined ? ` · ${assignment.passed ? "Passed" : "Needs revision"}` : ""}</p>}
                      {assignment.responseText && <p className="text-sm whitespace-pre-wrap">{assignment.responseText}</p>}
                      {assignment.links.length > 0 && <div className="space-y-1">{assignment.links.map((link) => <a key={link} href={link} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-sm text-primary hover:underline break-all"><ExternalLink className="h-3 w-3 shrink-0" />{link}</a>)}</div>}
                      {assignment.evidence.length > 0 && <div className="space-y-1"><p className="text-xs font-medium text-muted-foreground">Files</p>{assignment.evidence.map((file) => <a key={file.url} href={file.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-primary hover:underline"><Paperclip className="h-3 w-3 shrink-0" />{file.name}</a>)}</div>}
                      {assignment.feedback && <div className="rounded-md bg-muted/50 p-3"><p className="text-xs font-medium text-muted-foreground mb-1">Participant-facing feedback</p><p className="text-sm whitespace-pre-wrap">{assignment.feedback}</p></div>}
                    </div>)}
                  </CardContent></Card>
                  <Card><CardHeader><CardTitle className="flex items-center gap-2"><Flag className="h-4 w-4 text-primary" />Milestones</CardTitle></CardHeader><CardContent className="space-y-3">{detail.milestones.map((milestone) => <div key={milestone.id} className="border-b last:border-0 pb-2 last:pb-0"><div className="flex justify-between gap-2 items-center"><p className="text-sm font-medium">{milestone.title}</p><select className="h-8 rounded-md border bg-background px-2 text-xs" value={milestone.status} onChange={(event) => milestoneUpdateMutation.mutate({ id: milestone.id, status: event.target.value })}><option value="planned">Planned</option><option value="in_progress">In progress</option><option value="completed">Completed</option><option value="blocked">Blocked</option></select></div>{milestone.evidence && <p className="text-xs text-muted-foreground mt-1">{milestone.evidence}</p>}</div>)}<Input value={milestoneTitle} onChange={(event) => setMilestoneTitle(event.target.value)} placeholder="New milestone" /><Textarea value={milestoneDescription} onChange={(event) => setMilestoneDescription(event.target.value)} placeholder="What evidence will show progress?" /><Button variant="outline" onClick={() => milestoneMutation.mutate()} disabled={milestoneMutation.isPending || !milestoneTitle.trim()}>Add milestone</Button></CardContent></Card>
                  <Card><CardHeader><CardTitle className="flex items-center gap-2"><MessageSquare className="h-4 w-4 text-primary" />Feedback</CardTitle></CardHeader><CardContent className="space-y-3">{detail.feedback.slice(0, 6).map((item) => <div key={item.id} className="border-b last:border-0 pb-2 last:pb-0"><p className="text-sm">{item.content}</p><p className="text-xs text-muted-foreground mt-1">{item.sourceType} · {item.visibility}</p></div>)}<Textarea value={feedback} onChange={(event) => setFeedback(event.target.value)} placeholder="Add mentor or facilitator feedback" /><select className="w-full h-9 rounded-md border bg-background px-2 text-sm" value={feedbackVisibility} onChange={(event) => setFeedbackVisibility(event.target.value)}><option value="participant">Visible to participant</option><option value="internal">Internal note</option></select><Button variant="outline" onClick={() => feedbackMutation.mutate()} disabled={feedbackMutation.isPending || !feedback.trim()}>Add feedback</Button></CardContent></Card>
                </div>
              </div>
            </div>}
          </div>
        </div>
      </main>
    </div>
  );
}

function CheckIcon() {
  return <span className="block h-4 w-4 text-primary mb-2">✓</span>;
}