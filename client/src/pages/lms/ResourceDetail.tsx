import { LMSSidebar } from "@/components/LMSSidebar";
import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Lock, Download, FileText } from "lucide-react";
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

  const isCohortRestricted = (error as any)?.status === 403;

  return (
    <div className="flex h-screen">
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

              {resource.fileUrl ? (
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
