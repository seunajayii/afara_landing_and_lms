import { LMSSidebar } from "@/components/LMSSidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Pin,
  Lock,
  Trash2,
  ArrowLeft,
  MessageCircle,
  Eye,
  Send,
} from "lucide-react";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { formatDistanceToNow } from "date-fns";
import { useLocation, useParams } from "wouter";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import type { DiscussionThread, DiscussionPost, User } from "@shared/schema";

interface PostWithAuthor extends DiscussionPost {
  author?: User;
}

interface ThreadDetail extends DiscussionThread {
  author?: User;
  posts: PostWithAuthor[];
}

function PostSkeleton() {
  return (
    <div className="flex items-start gap-3 py-4 border-b last:border-0">
      <Skeleton className="h-9 w-9 rounded-full flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    </div>
  );
}

export default function ThreadDetail() {
  const { id } = useParams<{ id: string }>();
  const { user, isAdmin } = useAuth();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [replyText, setReplyText] = useState("");

  const { data: thread, isLoading } = useQuery<ThreadDetail>({
    queryKey: ["/api/community/threads", id],
    queryFn: async () => {
      const res = await fetch(`/api/community/threads/${id}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load thread");
      return res.json();
    },
    enabled: !!id,
  });

  const createPost = useMutation({
    mutationFn: async (content: string) => {
      const res = await apiRequest("POST", `/api/community/threads/${id}/posts`, { content });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/community/threads", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/community/threads"] });
      setReplyText("");
    },
    onError: (err: Error) => {
      toast({
        title: "Could not post reply",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const deletePost = useMutation({
    mutationFn: async (postId: string) => {
      await apiRequest("DELETE", `/api/community/posts/${postId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/community/threads", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/community/threads"] });
      toast({ title: "Reply deleted" });
    },
  });

  const pinThread = useMutation({
    mutationFn: async (isPinned: boolean) => {
      const res = await apiRequest("PATCH", `/api/community/threads/${id}`, { isPinned });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/community/threads", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/community/threads"] });
    },
  });

  const lockThread = useMutation({
    mutationFn: async (isLocked: boolean) => {
      const res = await apiRequest("PATCH", `/api/community/threads/${id}`, { isLocked });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/community/threads", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/community/threads"] });
    },
  });

  const deleteThread = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/community/threads/${id}`);
    },
    onSuccess: () => {
      toast({ title: "Thread deleted" });
      navigate("/lms/community");
    },
  });

  const isLocked = thread?.isLocked;
  const canReply = !isLocked || isAdmin;

  if (isLoading) {
    return (
      <div className="flex h-screen">
        <LMSSidebar />
        <main className="flex-1 overflow-auto">
          <div className="p-8 max-w-3xl mx-auto space-y-6">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-32 w-full" />
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <PostSkeleton key={i} />
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!thread) {
    return (
      <div className="flex h-screen">
        <LMSSidebar />
        <main className="flex-1 overflow-auto">
          <div className="p-8 text-center text-muted-foreground">Thread not found.</div>
        </main>
      </div>
    );
  }

  const authorName = thread.author
    ? `${thread.author.firstName} ${thread.author.lastName}`
    : "Anonymous";
  const authorInitials = thread.author
    ? `${thread.author.firstName[0]}${thread.author.lastName[0]}`
    : "?";

  return (
    <div className="flex h-screen">
      <LMSSidebar />
      <main className="flex-1 overflow-auto">
        <div className="p-8 max-w-3xl mx-auto">
          {/* Back nav */}
          <Button
            variant="ghost"
            size="sm"
            className="mb-4 -ml-2"
            onClick={() => navigate("/lms/community")}
            data-testid="button-back-to-community"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Community
          </Button>

          {/* Thread header */}
          <Card className="mb-6">
            <CardContent className="pt-6 pb-5">
              <div className="flex items-start gap-3">
                <Avatar className="w-10 h-10 flex-shrink-0">
                  <AvatarImage src={thread.author?.profileImageUrl ?? undefined} />
                  <AvatarFallback>{authorInitials}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-medium">{authorName}</span>
                    <span className="text-xs text-muted-foreground">
                      {thread.createdAt
                        ? formatDistanceToNow(new Date(thread.createdAt), { addSuffix: true })
                        : "Recently"}
                    </span>
                    {thread.isPinned && (
                      <Badge variant="secondary" className="text-xs gap-1">
                        <Pin className="w-3 h-3" /> Pinned
                      </Badge>
                    )}
                    {thread.isLocked && (
                      <Badge variant="outline" className="text-xs gap-1">
                        <Lock className="w-3 h-3" /> Locked
                      </Badge>
                    )}
                  </div>
                  <div className="mb-2">
                    <Badge variant="outline" className="text-xs">
                      {thread.category || "General"}
                    </Badge>
                  </div>
                  <h1 className="text-xl font-bold mb-2">{thread.title}</h1>
                  {thread.content && (
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {thread.content}
                    </p>
                  )}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground mt-3">
                    <span className="flex items-center gap-1">
                      <MessageCircle className="w-3.5 h-3.5" />
                      {thread.replyCount || 0} replies
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5" />
                      {(thread.viewCount || 0)} views
                    </span>
                  </div>
                </div>

                {/* Admin controls */}
                {isAdmin && (
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Button
                      size="icon"
                      variant="ghost"
                      title={thread.isPinned ? "Unpin" : "Pin"}
                      onClick={() => pinThread.mutate(!thread.isPinned)}
                      data-testid="button-pin-thread"
                    >
                      <Pin className={`w-4 h-4 ${thread.isPinned ? "text-primary fill-primary" : ""}`} />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      title={thread.isLocked ? "Unlock" : "Lock"}
                      onClick={() => lockThread.mutate(!thread.isLocked)}
                      data-testid="button-lock-thread"
                    >
                      <Lock className={`w-4 h-4 ${thread.isLocked ? "text-yellow-600" : ""}`} />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      title="Delete thread"
                      onClick={() => {
                        if (confirm("Delete this entire thread and all its replies?")) {
                          deleteThread.mutate();
                        }
                      }}
                      data-testid="button-delete-thread"
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Replies */}
          {thread.posts.length > 0 && (
            <Card className="mb-6">
              <CardContent className="py-0 divide-y">
                {thread.posts.map((post) => {
                  const postAuthorName = post.author
                    ? `${post.author.firstName} ${post.author.lastName}`
                    : "Anonymous";
                  const postInitials = post.author
                    ? `${post.author.firstName[0]}${post.author.lastName[0]}`
                    : "?";
                  const canDeletePost = isAdmin || user?.id === post.authorId;

                  return (
                    <div
                      key={post.id}
                      className="flex items-start gap-3 py-4"
                      data-testid={`post-${post.id}`}
                    >
                      <Avatar className="w-8 h-8 flex-shrink-0">
                        <AvatarImage src={post.author?.profileImageUrl ?? undefined} />
                        <AvatarFallback className="text-xs">{postInitials}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium">{postAuthorName}</span>
                          <span className="text-xs text-muted-foreground">
                            {post.createdAt
                              ? formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })
                              : "Recently"}
                          </span>
                          {post.isEdited && (
                            <span className="text-xs text-muted-foreground italic">(edited)</span>
                          )}
                        </div>
                        <p className="text-sm whitespace-pre-wrap">{post.content}</p>
                      </div>
                      {canDeletePost && (
                        <Button
                          size="icon"
                          variant="ghost"
                          title="Delete reply"
                          className="flex-shrink-0"
                          onClick={() => {
                            if (confirm("Delete this reply?")) {
                              deletePost.mutate(post.id);
                            }
                          }}
                          data-testid={`button-delete-post-${post.id}`}
                        >
                          <Trash2 className="w-3.5 h-3.5 text-destructive" />
                        </Button>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}

          {/* Reply composer */}
          {canReply ? (
            <Card>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-start gap-3">
                  <Avatar className="w-8 h-8 flex-shrink-0">
                    <AvatarFallback className="text-xs">
                      {user ? `${user.firstName[0]}${user.lastName[0]}` : "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <Textarea
                      placeholder="Write a reply…"
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      rows={3}
                      data-testid="input-reply"
                    />
                    <div className="flex justify-end mt-2">
                      <Button
                        size="sm"
                        onClick={() => createPost.mutate(replyText.trim())}
                        disabled={!replyText.trim() || createPost.isPending}
                        data-testid="button-submit-reply"
                      >
                        <Send className="w-3.5 h-3.5 mr-1.5" />
                        {createPost.isPending ? "Posting…" : "Reply"}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="text-center py-6 text-sm text-muted-foreground border rounded-md">
              <Lock className="w-4 h-4 mx-auto mb-2" />
              This thread is locked. No new replies can be added.
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
