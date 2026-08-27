import { LMSSidebar } from "@/components/LMSSidebar";
import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Lock, Download, FileText, Video, ShieldCheck, AlertTriangle, Loader2 } from "lucide-react";
import type { Resource } from "@shared/schema";

export default function ResourceDetail() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();

  const { data: resource, isLoading, error } = useQuery<Resource>({
    queryKey: ["/api/resources", id],
    queryFn: async () => {
      const res = await fetch(`/api/resources/${id}`, { credentials: "include" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw Object.assign(new Error(err.error || "Failed to load"), { status: res.status });
      }
      return res.json();
    },
  });

  const privatePlayback = useQuery<{ playbackUrl: string; expiresAt: number }>({
    queryKey: ["/api/resources", id, "playback"],
    // The server deliberately removes videoStorageKey from learner responses.
    // The source field is the safe signal that protected playback is needed.
    enabled: Boolean(resource?.resourceType === "video" && resource.videoSource === "upload"),
    queryFn: async () => {
      const res = await fetch(`/api/resources/${id}/playback`, { credentials: "include" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Unable to authorize video playback");
      }
      return res.json();
    },
  });

  const isCohortRestricted =
    typeof error === "object" && error !== null && "status" in error && (error as { status: number }).status === 403;

  return (
    <div className="flex flex-col md:flex-row h-screen">
      <LMSSidebar />
      <main className="flex-1 overflow-auto">
        <div className="p-8 max-w-3xl">
          <Button
            variant="ghost"
            className="mb-6 gap-2"
            onClick={() => setLocation("/lms/resources")}
            data-testid="button-back-resources"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Resources
          </Button>

          {isLoading && (
            <div className="space-y-4">
              <Skeleton className="h-8 w-2/3" />
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-24 w-full" />
            </div>
          )}

          {isCohortRestricted && (
            <div className="flex flex-col items-center justify-center py-16 text-center gap-4" data-testid="notice-cohort-only-resource">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                <Lock className="w-8 h-8 text-muted-foreground" />
              </div>
              <h2 className="text-2xl font-semibold">Cohort Members Only</h2>
              <p className="text-muted-foreground max-w-md">
                This resource is available to cohort participants only. Apply to the AFÁRÁ program to gain access to the full resource library.
              </p>
              <Button onClick={() => setLocation("/apply")} data-testid="button-apply-now">
                Apply Now
              </Button>
            </div>
          )}

          {!isLoading && !isCohortRestricted && !resource && (
            <div className="text-center py-16" data-testid="notice-resource-not-found">
              <p className="text-muted-foreground">Resource not found.</p>
            </div>
          )}

          {resource && (
            <div className="space-y-6" data-testid={`resource-detail-${resource.id}`}>
              <div className="flex items-start gap-3 flex-wrap">
                <Badge variant="secondary" className="shrink-0">{resource.category || "General"}</Badge>
                {resource.fileName && (
                  <Badge variant="outline" className="shrink-0">
                    {resource.fileName.split(".").pop()?.toUpperCase() || "FILE"}
                  </Badge>
                )}
              </div>

              <div>
                <h1 className="text-3xl font-bold mb-2">{resource.title}</h1>
                {resource.description && (
                  <p className="text-muted-foreground">{resource.description}</p>
                )}
              </div>

              {resource.resourceType === "video" && resource.videoSource === "upload" ? (
                <div className="space-y-3">
                  {privatePlayback.isLoading && (
                    <div className="flex aspect-video items-center justify-center rounded-lg border bg-muted" data-testid="private-video-loading">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  )}
                  {privatePlayback.data?.playbackUrl && (
                    <div className="aspect-video overflow-hidden rounded-lg border bg-black shadow-sm">
                      <video
                        className="h-full w-full"
                        src={privatePlayback.data.playbackUrl}
                        controls
                        controlsList="nodownload"
                        preload="metadata"
                        data-testid="private-resource-player"
                      >
                        Your browser does not support video playback.
                      </video>
                    </div>
                  )}
                  {privatePlayback.isError && (
                    <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/5 p-4 text-sm" data-testid="notice-private-video-unavailable">
                      <Lock className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                      <p>Video playback is unavailable because your access could not be verified. Please sign in with an authorized account and try again.</p>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <ShieldCheck className="h-4 w-4 text-primary" />
                    <span>Protected video · signed playback</span>
                    {resource.videoFileSize ? <span>· {Math.round(resource.videoFileSize / (1024 * 1024))} MB</span> : null}
                  </div>
                </div>
              ) : resource.resourceType === "video" && resource.youtubeVideoId ? (
                <div className="space-y-3">
                  <div className="aspect-video overflow-hidden rounded-lg border bg-black shadow-sm">
                    <iframe
                      className="h-full w-full"
                      src={`https://www.youtube-nocookie.com/embed/${resource.youtubeVideoId}`}
                      title={resource.title}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                      data-testid="youtube-resource-player"
                    />
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Video className="h-4 w-4" />
                    <span>YouTube video</span>
                    {resource.youtubeDurationSeconds ? (
                      <span>· {Math.floor(resource.youtubeDurationSeconds / 60)} min</span>
                    ) : null}
                  </div>
                </div>
              ) : resource.resourceType === "video" && resource.visibility !== "public" ? (
                <div className="flex items-start gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-800 dark:text-amber-200" data-testid="notice-video-needs-protected-hosting">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <p>This restricted video is not yet configured for protected playback. Please contact an administrator.</p>
                </div>
              ) : resource.fileUrl ? (
                <Button asChild className="gap-2" data-testid="button-download-resource">
                  <a href={resource.fileUrl} target="_blank" rel="noopener noreferrer">
                    <Download className="w-4 h-4" />
                    Download Resource
                  </a>
                </Button>
              ) : (
                <div className="flex items-center gap-2 p-4 rounded-md bg-muted">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">No file available for download.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
