import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, FileUp, Loader2, Save, Send } from "lucide-react";
import type { AssignmentFileEvidence } from "@shared/schema";

type Question = { id: string; prompt: string; questionType: string; options: string[]; points: number };
type Submission = { id: string; status: string; responseText?: string | null; links: string[]; fileEvidence: AssignmentFileEvidence[]; score?: number | null; passed?: boolean | null; feedback?: string | null; submittedAt?: string | null; answers: { questionId: string; answer: unknown }[] };
type Assignment = { id: string; title: string; instructions?: string | null; assignmentType: string; dueAt?: string | null; maxScore: number; passingScore: number; questions: Question[]; submissions: Submission[] };

function WorkCard({ assignment }: { assignment: Assignment }) {
  const { toast } = useToast();
  const [responseText, setResponseText] = useState(assignment.submissions[0]?.responseText || "");
  const [links, setLinks] = useState(assignment.submissions[0]?.links?.join("\n") || "");
  const [answers, setAnswers] = useState<Record<string, string | string[]>>(() => Object.fromEntries((assignment.submissions[0]?.answers || []).map((answer) => [answer.questionId, answer.answer as string | string[]])));
  const [file, setFile] = useState<File | null>(null);
  const current = assignment.submissions[0];

  const saveMutation = useMutation({
    mutationFn: async (submit: boolean) => {
      const result = await apiRequest("POST", `/api/assignments/${assignment.id}/submissions`, {
        responseText: responseText || null,
        links: links.split("\n").map((item) => item.trim()).filter(Boolean),
        answers: Object.entries(answers).map(([questionId, answer]) => ({ questionId, answer })),
        submit,
      });
      return result.json();
    },
    onSuccess: async (submission) => {
      if (file) {
        const form = new FormData();
        form.append("file", file);
        const response = await fetch(`/api/assignments/${assignment.id}/submissions/${submission.id}/files`, { method: "POST", body: form, credentials: "include" });
        if (!response.ok) throw new Error(await response.text());
        setFile(null);
      }
      queryClient.invalidateQueries({ queryKey: ["/api/assignments"] });
      toast({ title: submission.status === "draft" ? "Draft saved" : "Assignment submitted" });
    },
    onError: (error) => toast({ title: "Could not save assignment", description: error instanceof Error ? error.message : "Try again.", variant: "destructive" }),
  });

  const toggleChoice = (question: Question, option: string) => {
    if (question.questionType === "multiple_choice") {
      const currentValues = Array.isArray(answers[question.id]) ? answers[question.id] as string[] : [];
      setAnswers((current) => ({ ...current, [question.id]: currentValues.includes(option) ? currentValues.filter((value) => value !== option) : [...currentValues, option] }));
    } else setAnswers((current) => ({ ...current, [question.id]: option }));
  };

  return <Card>
    <CardHeader><div className="flex flex-wrap items-start justify-between gap-3"><div><CardTitle>{assignment.title}</CardTitle><CardDescription>{assignment.assignmentType} · {assignment.maxScore} points{assignment.dueAt ? ` · Due ${new Date(assignment.dueAt).toLocaleDateString()}` : ""}</CardDescription></div><Badge variant={current?.score != null ? "default" : "outline"}>{current?.score != null ? `${current.score}/${assignment.maxScore}` : current?.status || "Not started"}</Badge></div></CardHeader>
    <CardContent className="space-y-5">
      {assignment.instructions && <p className="whitespace-pre-wrap text-sm text-muted-foreground">{assignment.instructions}</p>}
      {assignment.questions.map((question, index) => <div key={question.id} className="space-y-3 rounded-lg border p-4"><Label>{index + 1}. {question.prompt} <span className="font-normal text-muted-foreground">({question.points} pts)</span></Label>{(question.questionType === "single_choice" || question.questionType === "multiple_choice") ? <div className="space-y-2">{question.options.map((option) => <label key={option} className="flex items-center gap-2 text-sm"><input type={question.questionType === "multiple_choice" ? "checkbox" : "radio"} name={question.id} checked={question.questionType === "multiple_choice" ? (answers[question.id] as string[] || []).includes(option) : answers[question.id] === option} onChange={() => toggleChoice(question, option)} />{option}</label>)}</div> : question.questionType === "short_text" ? <Input value={(answers[question.id] as string) || ""} onChange={(event) => setAnswers((current) => ({ ...current, [question.id]: event.target.value }))} placeholder="Your answer" /> : <Textarea value={(answers[question.id] as string) || ""} onChange={(event) => setAnswers((current) => ({ ...current, [question.id]: event.target.value }))} placeholder="Write your response" />}</div>)}
      {assignment.assignmentType !== "quiz" && <><div className="space-y-2"><Label>Your response</Label><Textarea value={responseText} onChange={(event) => setResponseText(event.target.value)} placeholder="Share your work, reflection, or context…" /></div><div className="space-y-2"><Label>Links <span className="font-normal text-muted-foreground">(one per line)</span></Label><Textarea value={links} onChange={(event) => setLinks(event.target.value)} placeholder="https://…" /></div></>}
      <div className="space-y-2"><Label htmlFor={`evidence-${assignment.id}`}>File evidence <span className="font-normal text-muted-foreground">(optional, max 25 MB)</span></Label><Input id={`evidence-${assignment.id}`} type="file" onChange={(event) => setFile(event.target.files?.[0] || null)} />{current?.fileEvidence?.map((evidence, index) => <a key={evidence.key} className="block text-sm text-primary hover:underline" href={`/api/assignment-files/${current.id}/${index}`} target="_blank" rel="noreferrer"><FileUp className="mr-1 inline h-3 w-3" />{evidence.name}</a>)}</div>
      <div className="flex flex-wrap gap-3"><Button variant="outline" disabled={saveMutation.isPending} onClick={() => saveMutation.mutate(false)}><Save className="mr-2 h-4 w-4" />Save draft</Button><Button disabled={saveMutation.isPending} onClick={() => saveMutation.mutate(true)}><Send className="mr-2 h-4 w-4" />Submit assignment</Button></div>
      {current?.score != null && <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 text-sm"><div className="flex items-center gap-2 font-semibold"><CheckCircle2 className="h-4 w-4 text-primary" />{current.passed ? "Passed" : "Review complete"} · {current.score}/{assignment.maxScore}</div>{current.feedback && <p className="mt-2 whitespace-pre-wrap text-muted-foreground">{current.feedback}</p>}</div>}
    </CardContent>
  </Card>;
}

export default function Assignments() {
  const { data: assignments = [], isLoading } = useQuery<Assignment[]>({ queryKey: ["/api/assignments"] });
  return <div className="space-y-6"><div><p className="mb-2 text-sm font-medium text-primary">Programme work</p><h1 className="text-3xl font-bold">Assignments</h1><p className="mt-2 text-muted-foreground">Save work as a draft, submit when ready, and review feedback from your mentor or facilitator.</p></div>{isLoading ? <Card><CardContent className="py-12 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin" /></CardContent></Card> : assignments.length === 0 ? <Card><CardContent className="py-12 text-center text-muted-foreground">No assignments are available for your cohort yet.</CardContent></Card> : assignments.map((assignment) => <WorkCard key={assignment.id} assignment={assignment} />)}</div>;
}