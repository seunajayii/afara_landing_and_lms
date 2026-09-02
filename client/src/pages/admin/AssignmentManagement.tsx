import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { AdminSidebar } from "@/components/AdminSidebar";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ClipboardCheck, Loader2, Plus, Save, Trash2 } from "lucide-react";
import type { Cohort, Course, User } from "@shared/schema";

type Question = {
  prompt: string;
  questionType: "single_choice" | "multiple_choice" | "short_text" | "long_text" | "reflection";
  options: string[];
  correctAnswers: string[];
  points: number;
  orderIndex: number;
};
type Assignment = {
  id: string;
  cohortId: string;
  title: string;
  instructions?: string | null;
  assignmentType: "quiz" | "submission" | "reflection";
  status: string;
  maxScore: number;
  passingScore: number;
  targets: { targetType: string; targetId: string }[];
  questions: Question[];
  submissions: Submission[];
};
type Submission = {
  id: string;
  userId: string;
  responseText?: string | null;
  links: string[];
  score?: number | null;
  passed?: boolean | null;
  feedback?: string | null;
  internalNotes?: string | null;
  status: string;
  submittedAt?: string | null;
};

const emptyQuestion = (): Question => ({
  prompt: "",
  questionType: "single_choice",
  options: ["", ""],
  correctAnswers: [],
  points: 10,
  orderIndex: 0,
});

export default function AssignmentManagement() {
  const { toast } = useToast();
  const [cohortId, setCohortId] = useState("");
  const [title, setTitle] = useState("");
  const [instructions, setInstructions] = useState("");
  const [assignmentType, setAssignmentType] = useState<Assignment["assignmentType"]>("quiz");
  const [targetType, setTargetType] = useState("cohort");
  const [targetId, setTargetId] = useState("");
  const [maxScore, setMaxScore] = useState("100");
  const [passingScore, setPassingScore] = useState("70");
  const [questions, setQuestions] = useState<Question[]>([emptyQuestion()]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [reviewValues, setReviewValues] = useState<Record<string, { score: string; feedback: string; internalNotes: string }>>({});

  const { data: cohorts = [] } = useQuery<Cohort[]>({ queryKey: ["/api/admin/cohorts"] });
  const { data: pods = [] } = useQuery<any[]>({ queryKey: ["/api/admin/learning-pods"] });
  const { data: courses = [] } = useQuery<(Course & { modules?: any[] })[]>({ queryKey: ["/api/courses"] });
  const { data: assignments = [], isLoading } = useQuery<Assignment[]>({ queryKey: ["/api/admin/assignments"] });

  useEffect(() => {
    if (!cohortId && cohorts[0]) setCohortId(cohorts[0].id);
  }, [cohortId, cohorts]);
  const targetOptions = targetType === "cohort"
    ? cohorts.map((item) => ({ id: item.id, label: item.displayName || item.name }))
    : targetType === "pod"
      ? pods.filter((pod) => !cohortId || pod.cohortId === cohortId).map((pod) => ({ id: pod.id, label: pod.name }))
      : targetType === "course"
        ? courses.map((course) => ({ id: course.id, label: course.title }))
        : courses.flatMap((course) => (course.modules || []).map((module) => ({ id: module.id, label: `${course.title} · ${module.title}` })));

  const createMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/admin/assignments", {
        cohortId,
        title,
        instructions: instructions || null,
        assignmentType,
        status: "draft",
        maxScore: Number(maxScore),
        passingScore: Number(passingScore),
        targets: [{ targetType, targetId: targetType === "cohort" ? cohortId : targetId }],
        questions: assignmentType === "quiz" ? questions.map((question, index) => ({
          ...question,
          options: question.options.filter(Boolean),
          correctAnswers: question.correctAnswers.filter(Boolean),
          orderIndex: index,
        })) : [],
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/assignments"] });
      setTitle(""); setInstructions(""); setQuestions([emptyQuestion()]);
      toast({ title: "Assignment saved as draft" });
    },
    onError: (error) => toast({ title: "Could not save assignment", description: error instanceof Error ? error.message : "Try again.", variant: "destructive" }),
  });

  const lifecycleMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const response = await apiRequest("PATCH", `/api/admin/assignments/${id}`, { status });
      return response.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/admin/assignments"] }),
    onError: (error) => toast({ title: "Could not update assignment", description: error instanceof Error ? error.message : "Try again.", variant: "destructive" }),
  });

  const reviewMutation = useMutation({
    mutationFn: async ({ assignmentId, submissionId, value }: { assignmentId: string; submissionId: string; value: { score: string; feedback: string; internalNotes: string } }) => {
      const response = await apiRequest("PATCH", `/api/assignments/${assignmentId}/submissions/${submissionId}/review`, {
        score: value.score === "" ? null : Number(value.score),
        feedback: value.feedback || null,
        internalNotes: value.internalNotes || null,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/assignments"] });
      toast({ title: "Review saved" });
    },
    onError: (error) => toast({ title: "Could not save review", description: error instanceof Error ? error.message : "Try again.", variant: "destructive" }),
  });

  const updateQuestion = (index: number, patch: Partial<Question>) => {
    setQuestions((current) => current.map((question, itemIndex) => itemIndex === index ? { ...question, ...patch } : question));
  };

  return (
    <div className="flex h-screen flex-col md:flex-row">
      <AdminSidebar />
      <main className="flex-1 overflow-auto">
        <div className="mx-auto max-w-7xl space-y-8 p-6 md:p-8">
          <div>
            <p className="mb-2 text-sm font-medium text-primary">Assessment workspace</p>
            <h1 className="text-3xl font-bold">Assignments & assessments</h1>
            <p className="mt-2 max-w-2xl text-muted-foreground">Create cohort, pod, course, or module work. Drafts stay private until an administrator publishes them.</p>
          </div>

          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Plus className="h-5 w-5" /> Create assignment</CardTitle><CardDescription>Participant targeting is cohort-scoped; add a pod, course, or module context when needed.</CardDescription></CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2"><Label>Cohort</Label><select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={cohortId} onChange={(event) => setCohortId(event.target.value)}>{cohorts.map((item) => <option key={item.id} value={item.id}>{item.displayName || item.name}</option>)}</select></div>
                <div className="space-y-2"><Label>Assignment type</Label><select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={assignmentType} onChange={(event) => setAssignmentType(event.target.value as Assignment["assignmentType"])}><option value="quiz">Quiz / test</option><option value="submission">Take-home submission</option><option value="reflection">Reflection / evaluation</option></select></div>
              </div>
              <div className="space-y-2"><Label htmlFor="assignment-title">Title</Label><Input id="assignment-title" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. Customer discovery checkpoint" /></div>
              <div className="space-y-2"><Label htmlFor="assignment-instructions">Instructions</Label><Textarea id="assignment-instructions" value={instructions} onChange={(event) => setInstructions(event.target.value)} placeholder="What should participants complete and submit?" /></div>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="space-y-2"><Label>Target context</Label><select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={targetType} onChange={(event) => { setTargetType(event.target.value); setTargetId(""); }}><option value="cohort">Whole cohort</option><option value="pod">Learning pod</option><option value="course">Course</option><option value="module">Module</option></select></div>
                <div className="space-y-2 md:col-span-2"><Label>Target</Label><select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={targetId || (targetType === "cohort" ? cohortId : "")} onChange={(event) => setTargetId(event.target.value)}>{targetOptions.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}</select></div>
                <div className="space-y-2"><Label>Max points</Label><Input type="number" min="1" value={maxScore} onChange={(event) => setMaxScore(event.target.value)} /></div>
              </div>
              <div className="grid gap-4 md:grid-cols-2"><div className="space-y-2"><Label>Passing score</Label><Input type="number" min="0" value={passingScore} onChange={(event) => setPassingScore(event.target.value)} /></div><div className="flex items-end text-sm text-muted-foreground">Manual work can be scored and marked passed or needs revision after submission.</div></div>

              {assignmentType === "quiz" && <div className="space-y-4 rounded-lg border p-4">
                <div className="flex items-center justify-between gap-3"><div><h3 className="font-semibold">Questions</h3><p className="text-sm text-muted-foreground">Choice questions are marked automatically when submitted.</p></div><Button type="button" variant="outline" size="sm" onClick={() => setQuestions((current) => [...current, emptyQuestion()])}><Plus className="mr-2 h-4 w-4" />Add question</Button></div>
                {questions.map((question, index) => <div key={index} className="space-y-3 rounded-md bg-muted/30 p-4">
                  <div className="flex items-center justify-between"><Label>Question {index + 1}</Label><Button type="button" variant="ghost" size="icon" disabled={questions.length === 1} onClick={() => setQuestions((current) => current.filter((_, itemIndex) => itemIndex !== index))}><Trash2 className="h-4 w-4" /></Button></div>
                  <Textarea value={question.prompt} onChange={(event) => updateQuestion(index, { prompt: event.target.value })} placeholder="Write the question prompt" />
                  <div className="grid gap-3 sm:grid-cols-3"><select className="h-10 rounded-md border bg-background px-3 text-sm" value={question.questionType} onChange={(event) => updateQuestion(index, { questionType: event.target.value as Question["questionType"] })}><option value="single_choice">Single choice</option><option value="multiple_choice">Multiple choice</option><option value="short_text">Short answer</option><option value="long_text">Written answer</option><option value="reflection">Reflection</option></select><Input type="number" min="1" value={question.points} onChange={(event) => updateQuestion(index, { points: Number(event.target.value) })} placeholder="Points" /><Input value={question.correctAnswers.join(", ")} onChange={(event) => updateQuestion(index, { correctAnswers: event.target.value.split(",").map((item) => item.trim()).filter(Boolean) })} placeholder="Correct answer(s)" /></div>
                  {(question.questionType === "single_choice" || question.questionType === "multiple_choice") && <Input value={question.options.join(" | ")} onChange={(event) => updateQuestion(index, { options: event.target.value.split("|").map((item) => item.trim()) })} placeholder="Options separated by |" />}
                </div>)}
              </div>}
              <Button disabled={!title.trim() || !cohortId || createMutation.isPending} onClick={() => createMutation.mutate()}>{createMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}Save draft</Button>
            </CardContent>
          </Card>

          <section className="space-y-4">
            <div><h2 className="text-2xl font-bold">Assignment bank</h2><p className="text-sm text-muted-foreground">{assignments.length} assignment{assignments.length === 1 ? "" : "s"}</p></div>
            {isLoading ? <Card><CardContent className="py-12 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin" /></CardContent></Card> : assignments.length === 0 ? <Card><CardContent className="py-12 text-center text-muted-foreground">No shared assignments yet.</CardContent></Card> : assignments.map((assignment) => {
              const isExpanded = expandedId === assignment.id;
              return <Card key={assignment.id}>
                <CardHeader><div className="flex flex-wrap items-start justify-between gap-3"><div><CardTitle>{assignment.title}</CardTitle><CardDescription>{assignment.assignmentType} · {assignment.submissions.length} submission{assignment.submissions.length === 1 ? "" : "s"}</CardDescription></div><Badge variant={assignment.status === "published" ? "default" : "outline"}>{assignment.status}</Badge></div></CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-2"><Button size="sm" variant="outline" onClick={() => setExpandedId(isExpanded ? null : assignment.id)}>{isExpanded ? "Hide submissions" : "Review submissions"}</Button>{assignment.status === "draft" && <Button size="sm" onClick={() => lifecycleMutation.mutate({ id: assignment.id, status: "published" })}>Publish</Button>}{assignment.status === "published" && <Button size="sm" variant="secondary" onClick={() => lifecycleMutation.mutate({ id: assignment.id, status: "archived" })}>Archive</Button>}{assignment.status === "archived" && <Button size="sm" variant="secondary" onClick={() => lifecycleMutation.mutate({ id: assignment.id, status: "draft" })}>Restore draft</Button>}</div>
                  {isExpanded && <div className="space-y-3 border-t pt-4">{assignment.submissions.length === 0 ? <p className="text-sm text-muted-foreground">No participant submissions yet.</p> : assignment.submissions.map((submission) => {
                    const value = reviewValues[submission.id] || { score: submission.score?.toString() || "", feedback: submission.feedback || "", internalNotes: submission.internalNotes || "" };
                    return <div key={submission.id} className="space-y-3 rounded-lg border p-4"><div className="flex justify-between gap-3 text-sm"><span className="font-medium">Participant submission</span><Badge variant="outline">{submission.status}{submission.passed === true ? " · passed" : submission.passed === false ? " · needs revision" : ""}</Badge></div>{submission.responseText && <p className="whitespace-pre-wrap text-sm">{submission.responseText}</p>}{submission.links?.map((link) => <a key={link} className="block text-sm text-primary hover:underline" href={link} target="_blank" rel="noreferrer">{link}</a>)}{(submission as any).fileEvidence?.map((evidence: any, index: number) => <a key={evidence.key} className="block text-sm text-primary hover:underline" href={`/api/assignment-files/${submission.id}/${index}`} target="_blank" rel="noreferrer">Open evidence: {evidence.name}</a>)}<div className="grid gap-3 md:grid-cols-[130px_1fr]"><Input type="number" min="0" max={assignment.maxScore} value={value.score} onChange={(event) => setReviewValues((current) => ({ ...current, [submission.id]: { ...value, score: event.target.value } }))} placeholder={`Score / ${assignment.maxScore}`} /><Textarea value={value.feedback} onChange={(event) => setReviewValues((current) => ({ ...current, [submission.id]: { ...value, feedback: event.target.value } }))} placeholder="Participant-facing feedback" /></div><Textarea value={value.internalNotes} onChange={(event) => setReviewValues((current) => ({ ...current, [submission.id]: { ...value, internalNotes: event.target.value } }))} placeholder="Internal notes (not shown to participant)" /><Button size="sm" onClick={() => reviewMutation.mutate({ assignmentId: assignment.id, submissionId: submission.id, value })}><Save className="mr-2 h-4 w-4" />Save review</Button></div>;
                  })}</div>}
                </CardContent>
              </Card>;
            })}
          </section>
        </div>
      </main>
    </div>
  );
}