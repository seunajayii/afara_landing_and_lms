import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, Clock3, Database, Loader2, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface CleanupStatus {
  counts: {
    pending: number;
    failed: number;
    untracked: number;
    removed: number;
  };
  totalAttempts: number;
  lastAttemptAt: string | null;
}

interface ReconcileResult {
  scanned: number;
  deletedKeys: string[];
  failedKeys: string[];
  untrackedKeys: string[];
}

function formatLastAttempt(value: string | null) {
  if (!value) return "No retries recorded";
  return `Last retry ${new Date(value).toLocaleString()}`;
}

export function PrivateVideoCleanupCard() {
  const { toast } = useToast();
  const [latestResult, setLatestResult] = useState<ReconcileResult | null>(null);
  const { data, isLoading, isError } = useQuery<CleanupStatus>({
    queryKey: ["/api/admin/resources/private-videos/status"],
  });

  const retryMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/admin/resources/private-videos/reconcile");
      return response.json() as Promise<ReconcileResult>;
    },
    onSuccess: (result) => {
      setLatestResult(result);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/resources/private-videos/status"] });
      toast({
        title: result.failedKeys.length ? "Cleanup retry completed with failures" : "Cleanup retry completed",
        description: `${result.deletedKeys.length} removed, ${result.failedKeys.length} failed, ${result.untrackedKeys.length} untracked.`,
        variant: result.failedKeys.length ? "destructive" : "default",
      });
    },
    onError: () => {
      toast({
        title: "Cleanup retry failed",
        description: "The cleanup sweep could not be started. Try again shortly.",
        variant: "destructive",
      });
    },
  });

  const counts = data?.counts;
  return (
    <Card data-testid="card-private-video-cleanup">
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Database className="h-5 w-5 text-primary" />
            Private video cleanup
          </CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            Storage cleanup health for private hosted videos. Learners never see provider details.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 shrink-0"
          onClick={() => retryMutation.mutate()}
          disabled={retryMutation.isPending || isLoading}
          data-testid="button-retry-private-video-cleanup"
        >
          {retryMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Retry cleanup
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground" role="status">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading cleanup status…
          </div>
        ) : isError || !counts ? (
          <div className="flex items-center gap-2 text-sm text-destructive" role="alert">
            <AlertTriangle className="h-4 w-4" />
            Cleanup status is temporarily unavailable.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <CleanupMetric icon={<Clock3 className="h-4 w-4" />} label="Pending" value={counts.pending} />
              <CleanupMetric icon={<AlertTriangle className="h-4 w-4" />} label="Failed" value={counts.failed} tone={counts.failed ? "danger" : "default"} />
              <CleanupMetric icon={<Database className="h-4 w-4" />} label="Untracked" value={counts.untracked} tone={counts.untracked ? "warning" : "default"} />
              <CleanupMetric icon={<CheckCircle2 className="h-4 w-4" />} label="Successfully removed" value={counts.removed} tone="success" />
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
              <span>{data.totalAttempts} cleanup attempt{data.totalAttempts === 1 ? "" : "s"} recorded</span>
              <span>{formatLastAttempt(data.lastAttemptAt)}</span>
            </div>
            {latestResult && (
              <Badge variant={latestResult.failedKeys.length ? "destructive" : "secondary"} className="mt-3" data-testid="badge-latest-cleanup-result">
                Latest retry: {latestResult.deletedKeys.length} removed · {latestResult.failedKeys.length} failed · {latestResult.untrackedKeys.length} untracked
              </Badge>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

function CleanupMetric({
  icon,
  label,
  value,
  tone = "default",
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  tone?: "default" | "danger" | "warning" | "success";
}) {
  const valueClass = {
    default: "text-foreground",
    danger: "text-destructive",
    warning: "text-amber-600 dark:text-amber-400",
    success: "text-green-600 dark:text-green-400",
  }[tone];
  return (
    <div className="rounded-md border bg-muted/20 p-3" data-testid={`metric-private-video-${label.toLowerCase().replace(/ /g, "-")}`}>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {icon}
        <span>{label}</span>
      </div>
      <div className={`mt-1 text-2xl font-bold ${valueClass}`}>{value}</div>
    </div>
  );
}