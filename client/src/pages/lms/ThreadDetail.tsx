import { LMSSidebar } from "@/components/LMSSidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Pin,
  Lock,
  Trash2,
  ArrowLeft,
  MessageCircle,
  Eye,
  Send,
  Link2,
  X,
} from "lucide-react";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { formatDistanceToNow } from "date-fns";
import { useLocation, useParams } from "wouter";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import type { DiscussionThread, DiscussionPost, User } from "@shared/schema";

interface Attachment {
  url: string;
  title: string;
  type: "link";
}

interface PostWithAuthor extends DiscussionPost {
  author?: User;
}

interface ThreadDetail extends DiscussionThread {
  author?: User;
  posts: PostWithAuthor[];
}

function AttachmentCard({ attachment, onRemove }: { attachment: Attachment; onRemove?: () => void }) {
  return (
    <div className="flex items-center gap-2 rounded-md border px-3 py-2 bg-muted/40 text-sm">
      <Link2 className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
      <a
        href={attachment.url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex-1 min-w-0 text-primary hover:underline truncate"
      >
        {attachment.title || attachment.url}
      </a>
      {onRemove && (
        <button onClick={onRemove} className="flex-shrink-0 text-muted-foreground hover:text-foreground">
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}

function parseAttachment(json: string | null | undefined): Attachment | null {
  if (!json) return null;
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
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

export default function ThreadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user, isAdmin } = useAuth();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [replyText, setReplyText] = useState("");
  const [attachment, setAttachment] = useState<Attachment | null>(null);
  const [attachUrl, setAttachUrl] = useState("");
  const [attachTitle, setAttachTitle] = useState("");
  const [showAttachForm, setShowAttachForm] = useState(false);

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
    mutationFn: async ({ content, attachmentJson }: { content: string; attachmentJson?: string }) => {
      const res = await apiRequest("POST", `/api/community/threads/${id}/posts`, {
        content,
        attachmentJson,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/community/threads", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/community/threads"] });
      setReplyText("");
      setAttachment(null);
      setAttachUrl("");
      setAttachTitle("");
      setShowAttachForm(false);
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

  const handleAddAttachment = () => {
    if (!attachUrl.trim()) return;
    setAttachment({ url: attachUrl.trim(), title: attachTitle.trim() || attachUrl.trim(), type: "link" });
    setAttachUrl("");
    setAttachTitle("");
    setShowAttachForm(false);
  };

  const handleReply = () => {
    if (!replyText.trim()) return;
    createPost.mutate({
      content: replyText.trim(),
      attachmentJson: attachment ? JSON.stringify(attachment) : undefined,
    });
  };

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

  const threadAttachment = parseAttachment((thread as any).attachmentJson);

  return (
    <div className="flex h-screen">
      <LMSSidebar />
      <main className="flex-1 overflow-auto">
        <div className="p-8 max-w-3xl mx-auto">
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
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap mb-3">
                      {thread.content}
                    </p>
                  )}
                  {threadAttachment && (
                    <div className="mb-3">
                      <AttachmentCard attachment={threadAttachment} />
                    </div>
                  )}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <MessageCircle className="w-3.5 h-3.5" />
                      {thread.replyCount || 0} replies
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5" />
                      {thread.viewCount || 0} views
                    </span>
                  </div>
                </div>

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
                  const postAttachment = parseAttachment(post.attachmentJson);

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
                        {postAttachment && (
                          <div className="mt-2">
                            <AttachmentCard attachment={postAttachment} />
                          </div>
                        )}
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
                  <div className="flex-1 space-y-2">
                    <Textarea
                      placeholder="Write a reply…"
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      rows={3}
                      data-testid="input-reply"
                    />

                    {/* Reply attachment */}
                    {attachment ? (
                      <AttachmentCard attachment={attachment} onRemove={() => setAttachment(null)} />
                    ) : showAttachForm ? (
                      <div className="space-y-2 p-3 border rounded-md bg-muted/30">
                        <div className="space-y-1.5">
                          <Label className="text-xs">Link URL</Label>
                          <Input
                            placeholder="https://..."
                            value={attachUrl}
                            onChange={(e) => setAttachUrl(e.target.value)}
                            data-testid="input-reply-attach-url"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">Link title (optional)</Label>
                          <Input
                            placeholder="Descriptive title"
                            value={attachTitle}
                            onChange={(e) => setAttachTitle(e.target.value)}
                            data-testid="input-reply-attach-title"
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={handleAddAttachment} disabled={!attachUrl.trim()}>
                            Attach
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setShowAttachForm(false)}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : null}

                    <div className="flex items-center justify-between">
                      {!showAttachForm && !attachment && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowAttachForm(true)}
                          data-testid="button-add-reply-attachment"
                        >
                          <Link2 className="w-3.5 h-3.5 mr-1.5" />
                          Attach link
                        </Button>
                      )}
                      {(showAttachForm || attachment) && <div />}
                      <Button
                        size="sm"
                        onClick={handleReply}
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
