import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { CalendarDays, CheckCircle2, ExternalLink, Loader2, MessageSquare, Plus, Send, Trash2, Users } from "lucide-react";
import { useAuth } from "@/lib/auth";

type Person = { id: string; firstName: string; lastName: string; email?: string; role?: string };
type Submission = {
  id: string;
  submitterId: string;
  submissionText?: string | null;
  submissionUrl?: string | null;
  submittedAt: string;
  score?: number | null;
  feedback?: string | null;
};
type Assignment = {
  id: string;
  title: string;
  instructions?: string | null;
  workType: "individual" | "group";
  status: "draft" | "published";
  dueAt?: string | null;
  maxScore: number;
  submissions: Submission[];
};
type Pod = {
  id: string;
  name: string;
  description?: string | null;
  cohort?: { id: string; name: string; displayName?: string | null } | null;
  mentor?: Person | null;
  members: Person[];
  assignments: Assignment[];
  events: PodEvent[];
  canManageEvents: boolean;
};
type PodEvent = {
  id: string;
  title: string;
  description?: string | null;
  startTime: string;
  endTime?: string | null;
  meetingPlatform?: string | null;
  meetingLink?: string | null;
  host?: Person | null;
  facilitators?: Person[];
};

function dateLabel(value?: string | null) {
  if (!value) return "No due date";
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function PodAssignment({ pod, assignment, user, isStaff }: { pod: Pod; assignment: Assignment; user: Person; isStaff: boolean }) {
  const { toast } = useToast();
  const [submissionText, setSubmissionText] = useState("");
  const [submissionUrl, setSubmissionUrl] = useState("");
  const [reviewScores, setReviewScores] = useState<Record<string, string>>({});
  const [reviewFeedback, setReviewFeedback] = useState<Record<string, string>>({});
  const currentSubmission = assignment.workType === "group"
    ? assignment.submissions[0]
    : assignment.submissions.find((submission) => submission.submitterId === user.id);

  const submitMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/learning-pods/${pod.id}/assignments/${assignment.id}/submissions`, {
        submissionText: submissionText || null,
        submissionUrl: submissionUrl || null,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/learning-pods", pod.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/learning-pods"] });
      setSubmissionText("");
      setSubmissionUrl("");
      toast({ title: currentSubmission ? "Submission updated" : "Work submitted" });
    },
    onError: (error) => toast({ title: "Could not submit work", description: error instanceof Error ? error.message : "Try again.", variant: "destructive" }),
  });
  const reviewMutation = useMutation({
    mutationFn: async ({ submissionId, score, feedback }: { submissionId: string; score: number; feedback: string }) => {
      const response = await apiRequest("PATCH", `/api/learning-pods/${pod.id}/assignments/${assignment.id}/submissions/${submissionId}/review`, { score, feedback });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/learning-pods", pod.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/learning-pods"] });
      toast({ title: "Feedback saved" });
    },
    onError: (error) => toast({ title: "Could not save feedback", description: error instanceof Error ? error.message : "Try again.", variant: "destructive" }),
  });

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-muted/30">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="text-lg">{assignment.title}</CardTitle>
            <CardDescription className="mt-1">{assignment.workType === "group" ? "Group project" : "Individual assignment"} · Due {dateLabel(assignment.dueAt)}</CardDescription>
          </div>
          <Badge variant={currentSubmission?.score != null ? "default" : "outline"}>{currentSubmission?.score != null ? `${currentSubmission.score}/${assignment.maxScore}` : `${assignment.maxScore} points`}</Badge>
        </div>
      </CardHeader>
      <CardContent className="p-5 space-y-5">
        {assignment.instructions && <p className="text-sm whitespace-pre-wrap text-muted-foreground">{assignment.instructions}</p>}

        {!isStaff && (
          <div className="space-y-3 rounded-lg border p-4">
            <div className="flex items-center gap-2 text-sm font-medium"><Send className="h-4 w-4 text-primary" /> {currentSubmission ? "Update your submission" : "Submit your work"}</div>
            <div className="space-y-2"><Label htmlFor={`submission-text-${assignment.id}`}>Response or notes</Label><Textarea id={`submission-text-${assignment.id}`} value={submissionText} onChange={(event) => setSubmissionText(event.target.value)} placeholder="Share your answer, progress, or context…" /></div>
            <div className="space-y-2"><Label htmlFor={`submission-url-${assignment.id}`}>Submission link <span className="font-normal text-muted-foreground">(optional)</span></Label><Input id={`submission-url-${assignment.id}`} type="url" value={submissionUrl} onChange={(event) => setSubmissionUrl(event.target.value)} placeholder="https://…" /></div>
            <Button disabled={submitMutation.isPending || (!submissionText.trim() && !submissionUrl.trim())} onClick={() => submitMutation.mutate()}>
              {submitMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
              {currentSubmission ? "Update submission" : "Submit work"}
            </Button>
          </div>
        )}

        {currentSubmission && !isStaff && (
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold"><CheckCircle2 className="h-4 w-4 text-primary" /> Submitted {dateLabel(currentSubmission.submittedAt)}</div>
            {currentSubmission.submissionText && <p className="text-sm whitespace-pre-wrap">{currentSubmission.submissionText}</p>}
            {currentSubmission.submissionUrl && <a className="inline-flex items-center gap-1 text-sm text-primary hover:underline" href={currentSubmission.submissionUrl} target="_blank" rel="noreferrer">Open submission <ExternalLink className="h-3 w-3" /></a>}
            {currentSubmission.score != null && <div className="pt-2 border-t text-sm"><span className="font-semibold">Mentor score: {currentSubmission.score}/{assignment.maxScore}</span>{currentSubmission.feedback && <p className="mt-1 text-muted-foreground whitespace-pre-wrap">{currentSubmission.feedback}</p>}</div>}
          </div>
        )}

        {isStaff && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold"><MessageSquare className="h-4 w-4 text-primary" /> Submissions ({assignment.submissions.length})</div>
            {assignment.submissions.length === 0 && <p className="text-sm text-muted-foreground border rounded-lg p-4">No submissions yet.</p>}
            {assignment.submissions.map((submission) => {
              const submitter = pod.members.find((member) => member.id === submission.submitterId);
              return (
                <div key={submission.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between gap-3 text-sm"><span className="font-medium">{assignment.workType === "group" ? "Group submission" : `${submitter?.firstName || "Participant"} ${submitter?.lastName || ""}`}</span><span className="text-muted-foreground">{dateLabel(submission.submittedAt)}</span></div>
                  {submission.submissionText && <p className="text-sm whitespace-pre-wrap">{submission.submissionText}</p>}
                  {submission.submissionUrl && <a className="inline-flex items-center gap-1 text-sm text-primary hover:underline" href={submission.submissionUrl} target="_blank" rel="noreferrer">Open link <ExternalLink className="h-3 w-3" /></a>}
                  <div className="grid sm:grid-cols-[120px_1fr_auto] gap-3 items-end pt-3 border-t">
                    <div className="space-y-2"><Label htmlFor={`score-${submission.id}`}>Score / {assignment.maxScore}</Label><Input id={`score-${submission.id}`} type="number" min="0" max={assignment.maxScore} value={reviewScores[submission.id] ?? (submission.score ?? "")} onChange={(event) => setReviewScores((current) => ({ ...current, [submission.id]: event.target.value }))} /></div>
                    <div className="space-y-2"><Label htmlFor={`feedback-${submission.id}`}>Written feedback</Label><Input id={`feedback-${submission.id}`} value={reviewFeedback[submission.id] ?? (submission.feedback || "")} onChange={(event) => setReviewFeedback((current) => ({ ...current, [submission.id]: event.target.value }))} placeholder="What went well and what to improve…" /></div>
                    <Button disabled={reviewMutation.isPending || !reviewFeedback[submission.id]?.trim() && !submission.feedback} onClick={() => reviewMutation.mutate({ submissionId: submission.id, score: Number(reviewScores[submission.id] ?? submission.score), feedback: reviewFeedback[submission.id] ?? submission.feedback ?? "" })}>Save feedback</Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function LearningPodSummary() {
  const { data: pods = [] } = useQuery<Pod[]>({
    queryKey: ["/api/learning-pods"],
  });
  const firstPod = pods[0];
  if (!firstPod) return null;
  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader className="pb-3"><CardTitle className="text-lg flex items-center gap-2"><Users className="h-5 w-5 text-primary" /> Your Learning Pod</CardTitle><CardDescription>{firstPod.name} · {firstPod.cohort?.displayName || firstPod.cohort?.name || "Current cohort"}</CardDescription></CardHeader>
      <CardContent className="space-y-3"><p className="text-sm text-muted-foreground">{firstPod.members.length} participants · {firstPod.assignments.length} active assignment{firstPod.assignments.length === 1 ? "" : "s"}</p><Button asChild variant="outline" size="sm"><a href="/lms/mentorship">Open pod workspace</a></Button></CardContent>
    </Card>
  );
}

export default function LearningPods() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [selectedPodId, setSelectedPodId] = useState<string | null>(null);
  const [eventDialogOpen, setEventDialogOpen] = useState(false);
  const [eventDraft, setEventDraft] = useState({
    title: "", description: "", startTime: "", endTime: "", durationMinutes: 60, meetingPlatform: "Zoom", meetingLink: "",
  });
  const { data: pods = [], isLoading } = useQuery<Pod[]>({
    queryKey: ["/api/learning-pods"],
  });
  const selectedPod = useMemo(() => pods.find((pod) => pod.id === (selectedPodId || pods[0]?.id)), [pods, selectedPodId]);
  const isStaff = user?.role === "mentor" || user?.role === "facilitator" || user?.role === "admin" || user?.role === "superadmin";
  const eventMutation = useMutation({
    mutationFn: async () => {
      if (!selectedPod) throw new Error("Select a pod first.");
      const response = await apiRequest("POST", `/api/learning-pods/${selectedPod.id}/events`, {
        title: eventDraft.title,
        description: eventDraft.description || null,
        startTime: new Date(eventDraft.startTime).toISOString(),
        endTime: eventDraft.endTime ? new Date(eventDraft.endTime).toISOString() : null,
        durationMinutes: eventDraft.durationMinutes,
        meetingPlatform: eventDraft.meetingPlatform || "Zoom",
        meetingLink: eventDraft.meetingLink || null,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/learning-pods"] });
      setEventDialogOpen(false);
      setEventDraft({ title: "", description: "", startTime: "", endTime: "", durationMinutes: 60, meetingPlatform: "Zoom", meetingLink: "" });
      toast({ title: "Pod meeting scheduled", description: "Everyone in this pod can now see the meeting." });
    },
    onError: (error) => toast({ title: "Could not schedule pod meeting", description: error instanceof Error ? error.message.replace(/^\d+:\s*/, "") : "Try again.", variant: "destructive" }),
  });
  const deleteEventMutation = useMutation({
    mutationFn: async (eventId: string) => {
      if (!selectedPod) return;
      await apiRequest("DELETE", `/api/learning-pods/${selectedPod.id}/events/${eventId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/learning-pods"] });
      toast({ title: "Pod meeting removed" });
    },
    onError: () => toast({ title: "Could not remove pod meeting", variant: "destructive" }),
  });

  if (isLoading) return <Card><CardContent className="py-12 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" /></CardContent></Card>;
  if (!selectedPod) return <Card><CardContent className="py-12 text-center space-y-2"><Users className="h-8 w-8 mx-auto text-muted-foreground" /><h2 className="font-semibold">No learning pod assigned yet</h2><p className="text-sm text-muted-foreground">An administrator will add you to a pod after your cohort placement is confirmed.</p></CardContent></Card>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1">
          <p className="text-sm font-medium text-primary mb-2">Collaborative learning</p>
          <h1 className="text-3xl font-bold">Learning Pods</h1>
          <p className="text-muted-foreground mt-2 max-w-2xl">Your pod is the primary space for peer learning, mentor guidance, individual assignments, and group projects.</p>
        </div>
        {pods.length > 1 && <div className="lg:w-64"><Label htmlFor="pod-switcher">Switch pod</Label><select id="pod-switcher" className="w-full h-10 mt-2 rounded-md border bg-background px-3 text-sm" value={selectedPod.id} onChange={(event) => setSelectedPodId(event.target.value)}>{pods.map((pod) => <option key={pod.id} value={pod.id}>{pod.name}</option>)}</select></div>}
      </div>
      <div className="grid md:grid-cols-[1fr_280px] gap-6">
        <div className="space-y-4">
          <Card><CardHeader><CardTitle>{selectedPod.name}</CardTitle><CardDescription>{selectedPod.description || "Work together, learn from one another, and ask your mentor for support."}</CardDescription></CardHeader><CardContent><div className="flex flex-wrap gap-2">{selectedPod.members.map((member) => <Badge key={member.id} variant="secondary">{member.firstName} {member.lastName}</Badge>)}</div></CardContent></Card>
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-xl font-bold">Pod meetings</h2><p className="text-sm text-muted-foreground">Private live sessions for this learning pod.</p></div>{selectedPod.canManageEvents && <Button onClick={() => setEventDialogOpen(true)}><Plus className="mr-2 h-4 w-4" />Schedule meeting</Button>}</div>
            {selectedPod.events.length === 0 ? <Card><CardContent className="py-10 text-center"><CalendarDays className="mx-auto mb-3 h-8 w-8 text-muted-foreground" /><p className="font-medium">No pod meetings scheduled</p><p className="mt-1 text-sm text-muted-foreground">{selectedPod.canManageEvents ? "Schedule a time for this pod to meet." : "Your mentor or facilitator will add meetings here."}</p></CardContent></Card> :
              <div className="grid gap-4">{selectedPod.events.map((event) => <Card key={event.id} className="overflow-hidden"><CardContent className="p-5"><div className="flex items-start justify-between gap-4"><div className="flex min-w-0 gap-3"><div className="mt-0.5 rounded-lg bg-primary/10 p-2 text-primary"><CalendarDays className="h-5 w-5" /></div><div><h3 className="font-semibold">{event.title}</h3><p className="mt-1 text-sm font-medium">{dateLabel(event.startTime)}</p>{event.description && <p className="mt-2 text-sm text-muted-foreground">{event.description}</p>}<div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground"><span>{event.meetingPlatform || "Online meeting"}</span>{event.host && <span>Set up by {event.host.firstName} {event.host.lastName}</span>}</div></div></div>{selectedPod.canManageEvents && <Button variant="ghost" size="icon" onClick={() => deleteEventMutation.mutate(event.id)} aria-label={`Remove ${event.title}`}><Trash2 className="h-4 w-4 text-destructive" /></Button>}</div>{event.meetingLink && <Button asChild className="mt-4"><a href={event.meetingLink} target="_blank" rel="noreferrer">Join pod meeting<ExternalLink className="ml-2 h-4 w-4" /></a></Button>}</CardContent></Card>)}</div>}
          </div>
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Pod work</h2>
            {selectedPod.assignments.length === 0 ? <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">Your mentor or administrator has not added any assignments yet.</CardContent></Card> : selectedPod.assignments.map((assignment) => <PodAssignment key={assignment.id} pod={selectedPod} assignment={assignment} user={user as Person} isStaff={isStaff} />)}
          </div>
        </div>
        <aside className="space-y-4">
          <Card><CardHeader className="pb-3"><CardTitle className="text-base">Your mentor</CardTitle></CardHeader><CardContent>{selectedPod.mentor ? <div><p className="font-semibold">{selectedPod.mentor.firstName} {selectedPod.mentor.lastName}</p><p className="text-sm text-muted-foreground">{selectedPod.mentor.email}</p></div> : <p className="text-sm text-muted-foreground">Mentor not assigned</p>}</CardContent></Card>
          <Card className="bg-muted/40"><CardContent className="pt-6 text-sm text-muted-foreground">Need private one-to-one support? The mentor directory and session tools are still available below this pod workspace.</CardContent></Card>
        </aside>
      </div>
      <Dialog open={eventDialogOpen} onOpenChange={setEventDialogOpen}><DialogContent className="max-w-xl"><DialogHeader><DialogTitle>Schedule a pod meeting</DialogTitle><DialogDescription>This meeting is private to {selectedPod.name}. Leave the meeting link blank to create it with the connected Zoom account.</DialogDescription></DialogHeader><div className="space-y-4"><div><Label>Meeting title</Label><Input value={eventDraft.title} onChange={(event) => setEventDraft({ ...eventDraft, title: event.target.value })} placeholder="Weekly pod check-in" /></div><div><Label>Description (optional)</Label><Textarea value={eventDraft.description} onChange={(event) => setEventDraft({ ...eventDraft, description: event.target.value })} placeholder="Topics or preparation for the meeting…" /></div><div className="grid gap-4 sm:grid-cols-2"><div><Label>Starts</Label><Input type="datetime-local" value={eventDraft.startTime} onChange={(event) => setEventDraft({ ...eventDraft, startTime: event.target.value })} /></div><div><Label>Ends (optional)</Label><Input type="datetime-local" value={eventDraft.endTime} onChange={(event) => setEventDraft({ ...eventDraft, endTime: event.target.value })} /></div></div><div className="grid gap-4 sm:grid-cols-2"><div><Label>Duration (minutes)</Label><Input type="number" min="1" value={eventDraft.durationMinutes} onChange={(event) => setEventDraft({ ...eventDraft, durationMinutes: Number(event.target.value) || 60 })} /></div><div><Label>Platform</Label><Input value={eventDraft.meetingPlatform} onChange={(event) => setEventDraft({ ...eventDraft, meetingPlatform: event.target.value })} /></div></div><div><Label>Meeting link (optional)</Label><Input type="url" value={eventDraft.meetingLink} onChange={(event) => setEventDraft({ ...eventDraft, meetingLink: event.target.value })} placeholder="Leave blank for Zoom auto-creation" /></div></div><DialogFooter><Button variant="outline" onClick={() => setEventDialogOpen(false)}>Cancel</Button><Button disabled={!eventDraft.title.trim() || !eventDraft.startTime || eventMutation.isPending} onClick={() => eventMutation.mutate()}>{eventMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Schedule meeting</Button></DialogFooter></DialogContent></Dialog>
    </div>
  );
}