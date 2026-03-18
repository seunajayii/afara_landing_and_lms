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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MessageSquarePlus,
  MessageCircle,
  Eye,
  Pin,
  Lock,
  Trash2,
  ChevronRight,
  Link2,
  X,
} from "lucide-react";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { formatDistanceToNow } from "date-fns";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import type { DiscussionThread, User } from "@shared/schema";

interface ThreadWithAuthor extends DiscussionThread {
  author?: User;
}

const CATEGORIES = [
  "General",
  "Energy",
  "Infrastructure",
  "Finance",
  "Mentorship",
  "Events",
  "Resources",
  "Success Stories",
  "Questions",
];

interface Attachment {
  url: string;
  title: string;
  type: "link";
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

function ThreadSkeleton() {
  return (
    <Card>
      <CardContent className="pt-5 pb-4">
        <div className="flex items-start gap-3">
          <Skeleton className="h-9 w-9 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <div className="flex gap-3 pt-1">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-16" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Community() {
  const { user, isAdmin } = useAuth();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("General");
  const [attachment, setAttachment] = useState<Attachment | null>(null);
  const [attachUrl, setAttachUrl] = useState("");
  const [attachTitle, setAttachTitle] = useState("");
  const [showAttachForm, setShowAttachForm] = useState(false);

  const { data: threads, isLoading } = useQuery<ThreadWithAuthor[]>({
    queryKey: ["/api/community/threads"],
  });

  const createThread = useMutation({
    mutationFn: async (data: { title: string; content: string; category: string; attachmentJson?: string }) => {
      const res = await apiRequest("POST", "/api/community/threads", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/community/threads"] });
      setDialogOpen(false);
      setTitle("");
      setContent("");
      setCategory("General");
      setAttachment(null);
      setAttachUrl("");
      setAttachTitle("");
      setShowAttachForm(false);
      toast({ title: "Discussion started", description: "Your thread has been posted." });
    },
    onError: () => {
      toast({ title: "Failed to post", description: "Please try again.", variant: "destructive" });
    },
  });

  const deleteThread = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/community/threads/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/community/threads"] });
      toast({ title: "Thread deleted" });
    },
  });

  const pinThread = useMutation({
    mutationFn: async ({ id, isPinned }: { id: string; isPinned: boolean }) => {
      const res = await apiRequest("PATCH", `/api/community/threads/${id}`, { isPinned });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/community/threads"] });
    },
  });

  const lockThread = useMutation({
    mutationFn: async ({ id, isLocked }: { id: string; isLocked: boolean }) => {
      const res = await apiRequest("PATCH", `/api/community/threads/${id}`, { isLocked });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/community/threads"] });
    },
  });

  const handleAddAttachment = () => {
    if (!attachUrl.trim()) return;
    setAttachment({ url: attachUrl.trim(), title: attachTitle.trim() || attachUrl.trim(), type: "link" });
    setAttachUrl("");
    setAttachTitle("");
    setShowAttachForm(false);
  };

  const handleCreate = () => {
    if (!title.trim()) return;
    createThread.mutate({
      title: title.trim(),
      content: content.trim(),
      category,
      attachmentJson: attachment ? JSON.stringify(attachment) : undefined,
    });
  };

  const sorted = [...(threads || [])].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <div className="flex h-screen">
      <LMSSidebar />
      <main className="flex-1 overflow-auto">
        <div className="p-8 max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
            <div>
              <h1 className="text-3xl font-bold">Community Board</h1>
              <p className="text-muted-foreground mt-1">
                Connect, share, and grow with fellow AFÁRÁ members
              </p>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-new-thread">
                  <MessageSquarePlus className="w-4 h-4 mr-2" />
                  Start Discussion
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>Start a New Discussion</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="thread-title">Title</Label>
                    <Input
                      id="thread-title"
                      placeholder="What would you like to discuss?"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      data-testid="input-thread-title"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="thread-category">Category</Label>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger id="thread-category" data-testid="select-thread-category">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="thread-content">Content (optional)</Label>
                    <Textarea
                      id="thread-content"
                      placeholder="Share more details about your topic..."
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      rows={4}
                      data-testid="input-thread-content"
                    />
                  </div>

                  {/* Attachment section */}
                  <div className="space-y-2">
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
                            data-testid="input-attach-url"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">Link title (optional)</Label>
                          <Input
                            placeholder="Descriptive title"
                            value={attachTitle}
                            onChange={(e) => setAttachTitle(e.target.value)}
                            data-testid="input-attach-title"
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
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowAttachForm(true)}
                        data-testid="button-add-attachment"
                      >
                        <Link2 className="w-3.5 h-3.5 mr-1.5" />
                        Attach a link
                      </Button>
                    )}
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button
                      onClick={handleCreate}
                      disabled={!title.trim() || createThread.isPending}
                      data-testid="button-submit-thread"
                    >
                      {createThread.isPending ? "Posting…" : "Post Discussion"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <ThreadSkeleton key={i} />
              ))}
            </div>
          ) : sorted.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center">
                <MessageSquarePlus className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">
                  No discussions yet. Be the first to start one!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {sorted.map((thread) => {
                const authorName = thread.author
                  ? `${thread.author.firstName} ${thread.author.lastName}`
                  : "Anonymous";
                const initials = thread.author
                  ? `${thread.author.firstName[0]}${thread.author.lastName[0]}`
                  : "?";
                const isOwner = user?.id === thread.authorId;

                let threadAttachment: Attachment | null = null;
                try {
                  if ((thread as any).attachmentJson) {
                    threadAttachment = JSON.parse((thread as any).attachmentJson);
                  }
                } catch {}

                return (
                  <Card
                    key={thread.id}
                    className="hover-elevate cursor-pointer"
                    onClick={() => navigate(`/lms/community/${thread.id}`)}
                    data-testid={`thread-card-${thread.id}`}
                  >
                    <CardContent className="pt-5 pb-4">
                      <div className="flex items-start gap-3">
                        <Avatar className="w-9 h-9 flex-shrink-0">
                          <AvatarImage src={thread.author?.profileImageUrl ?? undefined} />
                          <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="text-sm font-medium">{authorName}</span>
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
                          <div className="mb-1">
                            <Badge variant="outline" className="text-xs">
                              {thread.category || "General"}
                            </Badge>
                          </div>
                          <h3 className="font-semibold leading-snug mb-1 truncate">
                            {thread.title}
                          </h3>
                          {thread.content && (
                            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                              {thread.content}
                            </p>
                          )}
                          {threadAttachment && (
                            <div className="mb-2" onClick={(e) => e.stopPropagation()}>
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
                        <div
                          className="flex items-center gap-1 flex-shrink-0"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {isAdmin && (
                            <>
                              <Button
                                size="icon"
                                variant="ghost"
                                title={thread.isPinned ? "Unpin" : "Pin"}
                                onClick={() =>
                                  pinThread.mutate({ id: thread.id, isPinned: !thread.isPinned })
                                }
                                data-testid={`button-pin-${thread.id}`}
                              >
                                <Pin
                                  className={`w-4 h-4 ${thread.isPinned ? "text-primary fill-primary" : ""}`}
                                />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                title={thread.isLocked ? "Unlock" : "Lock"}
                                onClick={() =>
                                  lockThread.mutate({ id: thread.id, isLocked: !thread.isLocked })
                                }
                                data-testid={`button-lock-${thread.id}`}
                              >
                                <Lock
                                  className={`w-4 h-4 ${thread.isLocked ? "text-yellow-600" : ""}`}
                                />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                title="Delete thread"
                                onClick={() => {
                                  if (confirm("Delete this thread and all its replies?")) {
                                    deleteThread.mutate(thread.id);
                                  }
                                }}
                                data-testid={`button-delete-thread-${thread.id}`}
                              >
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            </>
                          )}
                          {!isAdmin && isOwner && (
                            <Button
                              size="icon"
                              variant="ghost"
                              title="Delete thread"
                              onClick={() => {
                                if (confirm("Delete this thread?")) {
                                  deleteThread.mutate(thread.id);
                                }
                              }}
                              data-testid={`button-delete-own-thread-${thread.id}`}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          )}
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
