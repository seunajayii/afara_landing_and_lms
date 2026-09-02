import { useMutation, useQuery } from "@tanstack/react-query";
import { LMSSidebar } from "@/components/LMSSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/lib/auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Award, CheckCircle2, Clock, Download, Loader2, Send, XCircle } from "lucide-react";
import type { Certificate } from "@shared/schema";

type CertificateProgress = {
  cohort: { id: string; name: string; year: number | null } | null;
  courses: Array<{ id: string; title: string; completed: boolean; progressPercent: number }>;
  completedCourses: number;
  totalCourses: number;
  progressPercent: number;
  thresholdPercent: number;
  eligible: boolean;
};

type CertificateWithDetails = Certificate & {
  cohort?: { id: string; name: string; year: number | null } | null;
};

export default function Certificates() {
  const { user } = useAuth();
  const { toast } = useToast();
  const progressQuery = useQuery<CertificateProgress>({
    queryKey: ["/api/certificates/progress", user?.id],
    enabled: Boolean(user?.id),
  });
  const certificatesQuery = useQuery<CertificateWithDetails[]>({
    queryKey: ["/api/certificates/user", user?.id],
    queryFn: async () => {
      const response = await fetch(`/api/certificates/user/${user!.id}`, { credentials: "include" });
      if (!response.ok) throw new Error("Unable to load certificate requests.");
      return response.json();
    },
    enabled: Boolean(user?.id),
  });
  const requestMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/certificates/request"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/certificates/progress", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/certificates/user", user?.id] });
      toast({ title: "Approval requested", description: "The AFÁRÁ team will review your programme completion." });
    },
    onError: async (error: Error & { response?: Response }) => {
      let message = error.message;
      if (error.response) {
        const body = await error.response.json().catch(() => null);
        if (body?.error) message = body.error;
      }
      toast({ title: "Could not request approval", description: message, variant: "destructive" });
    },
  });

  const progress = progressQuery.data;
  const request = certificatesQuery.data?.find((certificate) => certificate.cohortId === progress?.cohort?.id);
  const statusLabel = request?.approvalStatus === "pending"
    ? "Pending admin approval"
    : request?.approvalStatus === "approved"
      ? "Approved"
      : request?.approvalStatus === "rejected"
        ? "Rejected — you can request review again"
        : null;

  return (
    <div className="flex flex-col md:flex-row h-screen">
      <LMSSidebar />
      <main className="flex-1 overflow-auto">
        <div className="mx-auto max-w-5xl p-6 md:p-8">
          <div className="mb-8">
            <p className="text-sm font-medium uppercase tracking-wide text-primary">Learning achievements</p>
            <h1 className="mt-2 text-3xl font-bold">Certificates</h1>
            <p className="mt-2 text-muted-foreground">Reach 80% of your assigned cohort courses, request approval, and download your personalized programme certificate once approved.</p>
          </div>

          {progressQuery.isLoading ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground">Calculating your programme progress…</CardContent></Card>
          ) : !progress?.cohort ? (
            <Card><CardContent className="py-12 text-center"><Award className="mx-auto mb-3 h-10 w-10 text-muted-foreground" /><h2 className="text-lg font-semibold">No active cohort found</h2><p className="mt-2 text-sm text-muted-foreground">Certificate eligibility is available to accepted cohort participants.</p></CardContent></Card>
          ) : (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div><CardTitle>{progress.cohort.name}{progress.cohort.year ? ` · ${progress.cohort.year}` : ""}</CardTitle><p className="mt-1 text-sm text-muted-foreground">AFÁRÁ Accelerator Programme certificate</p></div>
                    {statusLabel && <Badge variant={request?.approvalStatus === "approved" ? "default" : request?.approvalStatus === "rejected" ? "destructive" : "secondary"}>{request?.approvalStatus === "approved" ? <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> : request?.approvalStatus === "rejected" ? <XCircle className="mr-1 h-3.5 w-3.5" /> : <Clock className="mr-1 h-3.5 w-3.5" />}{statusLabel}</Badge>}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="mb-2 flex justify-between text-sm"><span>Completed assigned courses</span><span className="font-medium">{progress.completedCourses} of {progress.totalCourses} ({progress.progressPercent}%)</span></div>
                  <Progress value={progress.progressPercent} />
                  <p className="mt-2 text-xs text-muted-foreground">At least {progress.thresholdPercent}% is required before requesting admin approval.</p>
                  <div className="mt-5 flex flex-wrap gap-3">
                    {!request || request.approvalStatus === "rejected" ? <Button disabled={!progress.eligible || requestMutation.isPending} onClick={() => requestMutation.mutate()}>{requestMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}{request ? "Request approval again" : "Request admin approval"}</Button> : null}
                    {request?.approvalStatus === "approved" && <Button asChild><a href={`/api/certificates/${request.id}/download`} download><Download className="mr-2 h-4 w-4" />Download certificate</a></Button>}
                  </div>
                  {!progress.eligible && !request && <p className="mt-3 text-sm text-muted-foreground">Complete {Math.max(0, Math.ceil(progress.totalCourses * 0.8) - progress.completedCourses)} more course{Math.max(0, Math.ceil(progress.totalCourses * 0.8) - progress.completedCourses) === 1 ? "" : "s"} to become eligible.</p>}
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-lg">Assigned course progress</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  {progress.courses.map((course) => <div key={course.id}><div className="mb-1 flex justify-between gap-4 text-sm"><span className="truncate">{course.title}</span><span className="shrink-0 text-muted-foreground">{course.progressPercent}%</span></div><Progress value={course.progressPercent} className="h-2" /></div>)}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}