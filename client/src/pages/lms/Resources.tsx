import { LMSSidebar } from "@/components/LMSSidebar";
import { ResourceCard } from "@/components/ResourceCard";
import { Input } from "@/components/ui/input";
import { Search, Lock } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth";
import { Link } from "wouter";
import type { Resource } from "@shared/schema";

function formatFileSize(bytes: number | null): string {
  if (!bytes) return "Unknown";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileType(fileName: string | null): string {
  if (!fileName) return "FILE";
  const ext = fileName.split(".").pop()?.toUpperCase();
  return ext || "FILE";
}

function ResourceCardSkeleton() {
  return (
    <div className="border rounded-lg p-6 space-y-4">
      <Skeleton className="h-6 w-20" />
      <Skeleton className="h-6 w-3/4" />
      <div className="flex gap-4">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-16" />
      </div>
      <Skeleton className="h-9 w-full" />
    </div>
  );
}

export default function Resources() {
  const [searchQuery, setSearchQuery] = useState("");
  const { user } = useAuth();
  const isCommunityMember = user?.role === "community_member";

  const { data: resources, isLoading } = useQuery<Resource[]>({
    queryKey: ["/api/resources"],
  });

  const filteredResources = resources?.filter(resource =>
    resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (resource.category || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (resource.description || "").toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  return (
    <div className="flex h-screen">
      <LMSSidebar />
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <h1 className="text-3xl font-bold mb-6">Resource Library</h1>

          {isCommunityMember && (
            <div className="flex items-start gap-3 p-4 mb-6 rounded-md bg-muted border" data-testid="notice-cohort-resources">
              <Lock className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
              <p className="text-sm text-muted-foreground">
                Some resources are available to cohort participants only. Apply to the AFÁRÁ program to unlock the full resource library.
              </p>
            </div>
          )}

          <div className="relative mb-8">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search resources..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              data-testid="input-search-resources"
            />
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <ResourceCardSkeleton key={i} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredResources.map((resource) => (
                <Link key={resource.id} href={`/lms/resources/${resource.id}`} data-testid={`link-resource-${resource.id}`}>
                  <ResourceCard
                    title={resource.title}
                    category={resource.category || "General"}
                    fileType={getFileType(resource.fileName)}
                    size={formatFileSize(resource.fileSize)}
                  />
                </Link>
              ))}
            </div>
          )}

          {!isLoading && filteredResources.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No resources found matching your search.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
