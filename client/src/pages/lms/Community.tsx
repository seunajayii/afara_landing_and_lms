import { LMSSidebar } from "@/components/LMSSidebar";
import { DiscussionPost } from "@/components/DiscussionPost";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquarePlus } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import type { DiscussionThread, User } from "@shared/schema";

interface ThreadWithAuthor extends DiscussionThread {
  author?: User;
}

function DiscussionSkeleton() {
  return (
    <div className="border rounded-lg p-6 space-y-4">
      <div className="flex items-start gap-4">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-1/3" />
          <Skeleton className="h-6 w-2/3" />
        </div>
      </div>
      <Skeleton className="h-16 w-full" />
      <div className="flex gap-4">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-20" />
      </div>
    </div>
  );
}

export default function Community() {
  const [newPost, setNewPost] = useState("");

  const { data: threads, isLoading } = useQuery<ThreadWithAuthor[]>({
    queryKey: ["/api/community/threads"],
  });

  const discussions = threads?.map(thread => ({
    author: thread.author ? `${thread.author.firstName} ${thread.author.lastName}` : "Anonymous",
    topic: thread.title,
    content: thread.content || "",
    category: thread.category || "General",
    replies: thread.replyCount || 0,
    likes: thread.viewCount || 0,
    timeAgo: thread.createdAt ? formatDistanceToNow(new Date(thread.createdAt), { addSuffix: true }) : "Recently",
    isPinned: thread.isPinned,
  })) || [];

  const sortedDiscussions = discussions.sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return 0;
  });

  const handlePost = () => {
    console.log("New post:", newPost);
    setNewPost("");
  };

  return (
    <div className="flex h-screen">
      <LMSSidebar />
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <h1 className="text-3xl font-bold mb-6">Community Board</h1>

          <Card className="mb-8">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-chart-2/10 flex items-center justify-center flex-shrink-0">
                  <MessageSquarePlus className="w-5 h-5 text-chart-2" />
                </div>
                <div className="flex-1">
                  <Textarea
                    placeholder="Start a discussion..."
                    value={newPost}
                    onChange={(e) => setNewPost(e.target.value)}
                    rows={3}
                    data-testid="input-new-post"
                  />
                  <div className="flex justify-end mt-3">
                    <Button onClick={handlePost} disabled={!newPost.trim()} data-testid="button-post">
                      Post
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <DiscussionSkeleton key={i} />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {sortedDiscussions.map((discussion, i) => (
                <DiscussionPost key={i} {...discussion} />
              ))}
            </div>
          )}

          {!isLoading && sortedDiscussions.length === 0 && (
            <div className="text-center py-12 border rounded-lg">
              <p className="text-muted-foreground">No discussions yet. Be the first to start one!</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
