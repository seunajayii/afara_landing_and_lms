import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AdminSidebar } from "@/components/AdminSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { ZoomConnectionPanel } from "@/components/ZoomConnectionPanel";
import { 
  Plus, 
  Pencil, 
  Trash2, 
  Calendar,
  Search,
  Video,
  Users,
  Clock,
  ExternalLink,
  RefreshCw,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Clock3,
  RotateCcw,
} from "lucide-react";
import type { Course, Event } from "@shared/schema";

function EventCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-3/4" />
      </CardHeader>
      <CardContent className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <div className="flex gap-2">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-6 w-16" />
        </div>
      </CardContent>
    </Card>
  );
}

const eventFormSchema = z.object({
  title: z.string().min(1, "Title is required").min(3, "Title must be at least 3 characters"),
  description: z.string().optional(),
  eventType: z.enum(["webinar", "workshop", "live_session", "networking"]),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().optional(),
  durationMinutes: z.coerce.number().min(1).optional(),
  meetingPlatform: z.string().optional(),
  meetingLink: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
  zoomMeetingId: z.string().trim().optional(),
  recordingUrl: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
  recordingLessonId: z.string().optional(),
  maxAttendees: z.coerce.number().min(1).optional(),
  isPublic: z.boolean().default(true),
  visibility: z.enum(["public", "community", "cohort_only"]).default("community"),
  status: z.enum(["draft", "pending_review", "published", "archived"]),
});

type EventFormData = z.infer<typeof eventFormSchema>;
type AdminCourse = Course & {
  modules?: Array<{
    id: string;
    title: string;
    lessons?: Array<{ id: string; title: string; lessonType: string }>;
  }>;
};

type ZoomSyncEvent = {
  id: string;
  eventId: string;
  eventType: string;
  status: string;
  receivedAt: string;
  processingStartedAt: string | null;
  processedAt: string | null;
  error: string | null;
  eventTitle: string | null;
};
const eventTypes = [
  { value: "webinar", label: "Webinar" },
  { value: "workshop", label: "Workshop" },
  { value: "live_session", label: "Live Session" },
  { value: "networking", label: "Networking" },
];

const statusOptions = [
  { value: "draft", label: "Draft" },
  { value: "pending_review", label: "Pending Review" },
  { value: "published", label: "Published" },
  { value: "archived", label: "Archived" },
];

function getEventTypeBadgeVariant(type: string): "default" | "secondary" | "outline" {
  switch (type) {
    case "webinar": return "default";
    case "workshop": return "secondary";
    case "live_session": return "outline";
    case "networking": return "secondary";
    default: return "outline";
  }
}

function getStatusBadgeVariant(status: string): "default" | "secondary" | "outline" | "destructive" {
  switch (status) {
    case "published": return "default";
    case "draft": return "secondary";
    case "pending_review": return "outline";
    case "archived": return "destructive";
    default: return "outline";
  }
}

function getZoomStatusLabel(status: string, eventType: string): string {
  switch (status) {
    case "received": return eventType === "recording.completed" ? "Waiting" : "Received";
    case "processing": return "Importing";
    case "completed": return "Complete";
    case "failed": return "Failed";
    default: return "Received";
  }
}
function formatDateTime(dateString: string | Date): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatDateTimeForInput(dateString: string | Date | null): string {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toISOString().slice(0, 16);
}

export default function EventManagement() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  const createForm = useForm<EventFormData>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      title: "",
      description: "",
      eventType: "webinar",
      startTime: "",
      endTime: "",
      durationMinutes: 60,
      meetingPlatform: "Zoom",
      meetingLink: "",
      zoomMeetingId: "",
      recordingUrl: "",
      recordingLessonId: undefined,
      maxAttendees: 100,
      isPublic: true,
      visibility: "community",
      status: "published",
    },
  });

  const editForm = useForm<EventFormData>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      title: "",
      description: "",
      eventType: "webinar",
      startTime: "",
      endTime: "",
      durationMinutes: 60,
      meetingPlatform: "Zoom",
      meetingLink: "",
      zoomMeetingId: "",
      recordingUrl: "",
      recordingLessonId: undefined,
      maxAttendees: 100,
      isPublic: true,
      visibility: "community",
      status: "published",
    },
  });

  const { data: events, isLoading } = useQuery<Event[]>({
    queryKey: ["/api/events"],
  });
  const { data: courses } = useQuery<AdminCourse[]>({
    queryKey: ["/api/courses"],
  });
  const {
    data: zoomSync,
    isLoading: isZoomSyncLoading,
    isFetching: isZoomSyncFetching,
  } = useQuery<ZoomSyncStatusResponse>({
    queryKey: ["/api/admin/integrations/zoom/status"],
    refetchInterval: 10000,
    staleTime: 5000,
  });
  const retryZoomImportMutation = useMutation({
    mutationFn: async (eventId: string) => {
      const response = await apiRequest(
        "POST",
        `/api/admin/integrations/zoom/webhooks/${encodeURIComponent(eventId)}/retry`,
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/integrations/zoom/status"] });
      toast({
        title: "Retry started",
        description: "The Zoom recording import is being attempted again.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Retry failed",
        description: parseApiError(error),
        variant: "destructive",
      });
    },
  });
  const lessonOptions = (courses || []).flatMap((course) =>
    (course.modules || []).flatMap((module) =>
      (module.lessons || [])
        .filter((lesson) => lesson.lessonType === "video")
        .map((lesson) => ({
          id: lesson.id,
          label: `${course.title} / ${module.title} / ${lesson.title}`,
        })),
    ),
  );

  function parseApiError(error: Error): string {
    const colonIdx = error.message.indexOf(": ");
    if (colonIdx !== -1) {
      try {
        const json: unknown = JSON.parse(error.message.slice(colonIdx + 2));
        if (
          json !== null &&
          typeof json === "object" &&
          "error" in json
        ) {
          const { error: apiErr } = json as { error: unknown };
          if (Array.isArray(apiErr)) {
            return apiErr
              .filter(
                (e): e is { message: string } =>
                  typeof e === "object" && e !== null && "message" in e
              )
              .map((e) => e.message)
              .join("; ");
          }
          if (typeof apiErr === "string") return apiErr;
        }
      } catch {
        // fall through to raw message
      }
    }
    return error.message;
  }

  const createMutation = useMutation({
    mutationFn: async (data: EventFormData) => {
      const cleanedData: Record<string, unknown> = Object.fromEntries(
        Object.entries(data).map(([key, value]) => [
          key,
          value === "" ? undefined : value
        ])
      );
      cleanedData.zoomMeetingId = data.zoomMeetingId?.trim() || null;
      cleanedData.recordingLessonId = data.recordingLessonId || null;
      const response = await apiRequest("POST", "/api/events", cleanedData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      setIsCreateDialogOpen(false);
      createForm.reset();
      toast({
        title: "Event Created",
        description: "The event has been created successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: parseApiError(error),
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: EventFormData }) => {
      const cleanedData: Record<string, unknown> = Object.fromEntries(
        Object.entries(data).map(([key, value]) => [
          key,
          value === "" ? undefined : value
        ])
      );
      cleanedData.zoomMeetingId = data.zoomMeetingId?.trim() || null;
      cleanedData.recordingLessonId = data.recordingLessonId || null;
      const response = await apiRequest("PATCH", `/api/events/${id}`, cleanedData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      setIsEditDialogOpen(false);
      setSelectedEvent(null);
      toast({
        title: "Event Updated",
        description: "The event has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: parseApiError(error),
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/events/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      setIsDeleteDialogOpen(false);
      setSelectedEvent(null);
      toast({
        title: "Event Deleted",
        description: "The event has been deleted successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete event. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleEdit = (event: Event) => {
    setSelectedEvent(event);
    editForm.reset({
      title: event.title,
      description: event.description || "",
      eventType: event.eventType as EventFormData["eventType"],
      startTime: formatDateTimeForInput(event.startTime),
      endTime: formatDateTimeForInput(event.endTime),
      durationMinutes: event.durationMinutes || 60,
      meetingPlatform: event.meetingPlatform || "Zoom",
      meetingLink: event.meetingLink || "",
      zoomMeetingId: event.zoomMeetingId || "",
      recordingUrl: event.recordingUrl || "",
      recordingLessonId: event.recordingLessonId || undefined,
      maxAttendees: event.maxAttendees || 100,
      isPublic: event.isPublic ?? true,
      visibility: (event.visibility as EventFormData["visibility"]) || "community",
      status: event.status as EventFormData["status"],
    });
    setIsEditDialogOpen(true);
  };

  const handleDelete = (event: Event) => {
    setSelectedEvent(event);
    setIsDeleteDialogOpen(true);
  };

  const onCreateSubmit = (data: EventFormData) => {
    createMutation.mutate(data);
  };

  const onEditSubmit = (data: EventFormData) => {
    if (selectedEvent) {
      updateMutation.mutate({ id: selectedEvent.id, data });
    }
  };

  const filteredEvents = events?.filter((event) =>
    event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    event.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-background">
      <AdminSidebar />
      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground" data-testid="text-page-title">
                Event Management
              </h1>
              <p className="text-muted-foreground mt-1">
                Create and manage webinars, workshops, and networking sessions
              </p>
            </div>
            <Button
              onClick={() => setIsCreateDialogOpen(true)}
              data-testid="button-create-event"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Event
            </Button>
          </div>

          <ZoomConnectionPanel />

          <div className="mb-6">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="input-search-events"
              />
            </div>
          </div>

          <Card className="mb-8" data-testid="card-zoom-sync-status">
            <CardHeader className="pb-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Video className="h-5 w-5 text-primary" />
                    Zoom recording sync
                  </CardTitle>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Recent webhook receipts and protected recording imports
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/admin/integrations/zoom/status"] })}
                  disabled={isZoomSyncFetching}
                  data-testid="button-refresh-zoom-sync"
                >
                  <RefreshCw className={`mr-2 h-4 w-4 ${isZoomSyncFetching ? "animate-spin" : ""}`} />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isZoomSyncLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ) : (
                <>
                  <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div className="rounded-md border bg-muted/20 p-3">
                      <p className="text-xs text-muted-foreground">Waiting</p>
                      <p className="mt-1 text-xl font-semibold">{zoomSync?.counts.waiting ?? 0}</p>
                    </div>
                    <div className="rounded-md border bg-muted/20 p-3">
                      <p className="text-xs text-muted-foreground">Importing</p>
                      <p className="mt-1 text-xl font-semibold">{zoomSync?.counts.importing ?? 0}</p>
                    </div>
                    <div className="rounded-md border bg-muted/20 p-3">
                      <p className="text-xs text-muted-foreground">Complete</p>
                      <p className="mt-1 text-xl font-semibold">{zoomSync?.counts.complete ?? 0}</p>
                    </div>
                    <div className="rounded-md border bg-muted/20 p-3">
                      <p className="text-xs text-muted-foreground">Failed</p>
                      <p className="mt-1 text-xl font-semibold">{zoomSync?.counts.failed ?? 0}</p>
                    </div>
                  </div>
                  {zoomSync?.events.length ? (
                    <div className="space-y-3">
                      {zoomSync.events.map((webhook) => {
                        const StatusIcon = getZoomStatusIcon(webhook.status);
                        const isRecordingWebhook = webhook.eventType === "recording.completed";
                        return (
                          <div
                            key={webhook.id}
                            className="flex flex-col gap-3 rounded-md border p-3 sm:flex-row sm:items-start sm:justify-between"
                            data-testid={`zoom-sync-event-${webhook.eventId}`}
                          >
                            <div className="flex min-w-0 items-start gap-3">
                              <StatusIcon className={`mt-0.5 h-4 w-4 shrink-0 ${
                                webhook.status === "failed"
                                  ? "text-destructive"
                                  : webhook.status === "completed"
                                    ? "text-green-600"
                                    : webhook.status === "processing"
                                      ? "animate-spin text-primary"
                                      : "text-muted-foreground"
                              }`} />
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className="font-medium">
                                    {webhook.eventTitle || "Zoom recording notification"}
                                  </p>
                                  <Badge variant={getZoomStatusVariant(webhook.status)}>
                                    {getZoomStatusLabel(webhook.status, webhook.eventType)}
                                  </Badge>
                                </div>
                                <p className="mt-1 text-xs text-muted-foreground">
                                  {webhook.eventType} · received {formatDateTime(webhook.receivedAt)}
                                </p>
                                {webhook.error && (
                                  <p className="mt-2 text-sm text-destructive">
                                    {webhook.error}
                                  </p>
                                )}
                                {webhook.status === "received" && (
                                  <p className="mt-2 text-sm text-muted-foreground">
                                    {isRecordingWebhook
                                      ? "Notification already received and is waiting for import."
                                      : "Notification already received; no recording import is required."}
                                  </p>
                                )}
                              </div>
                            </div>
                            {webhook.status === "failed" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => retryZoomImportMutation.mutate(webhook.eventId)}
                                disabled={retryZoomImportMutation.isPending}
                                data-testid={`button-retry-zoom-${webhook.eventId}`}
                              >
                                {retryZoomImportMutation.isPending ? (
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                  <RotateCcw className="mr-2 h-4 w-4" />
                                )}
                                Retry import
                              </Button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
                      No Zoom recording notifications have been received yet.
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <EventCardSkeleton key={i} />
              ))}
            </div>
          ) : filteredEvents && filteredEvents.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredEvents.map((event) => (
                <Card key={event.id} data-testid={`card-event-${event.id}`}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-lg leading-tight">
                        {event.title}
                      </CardTitle>
                      <div className="flex gap-1 flex-shrink-0">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleEdit(event)}
                          data-testid={`button-edit-event-${event.id}`}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDelete(event)}
                          data-testid={`button-delete-event-${event.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {event.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {event.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDateTime(event.startTime)}</span>
                    </div>
                    {event.durationMinutes && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        <span>{event.durationMinutes} minutes</span>
                      </div>
                    )}
                    {event.maxAttendees && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Users className="w-4 h-4" />
                        <span>Max {event.maxAttendees} attendees</span>
                      </div>
                    )}
                    <div className="flex flex-wrap gap-2 pt-2">
                      <Badge variant={getEventTypeBadgeVariant(event.eventType)}>
                        {event.eventType.replace("_", " ")}
                      </Badge>
                      <Badge variant={getStatusBadgeVariant(event.status)}>
                        {event.status.replace("_", " ")}
                      </Badge>
                    </div>
                    {event.meetingLink && (
                      <div className="pt-2">
                        <a
                          href={event.meetingLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                        >
                          <Video className="w-4 h-4" />
                          Join Meeting
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Calendar className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Events Found</h3>
                <p className="text-muted-foreground text-center mb-4">
                  {searchQuery
                    ? "No events match your search criteria."
                    : "Get started by creating your first event."}
                </p>
                {!searchQuery && (
                  <Button onClick={() => setIsCreateDialogOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Event
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Event</DialogTitle>
              <DialogDescription>
                Add a new webinar, workshop, or networking session
              </DialogDescription>
            </DialogHeader>
            <Form {...createForm}>
              <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-4">
                <FormField
                  control={createForm.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Event title" {...field} data-testid="input-create-title" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Event description..."
                          className="resize-none"
                          {...field}
                          data-testid="input-create-description"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={createForm.control}
                    name="eventType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Event Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-create-event-type">
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {eventTypes.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createForm.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-create-status">
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {statusOptions.map((status) => (
                              <SelectItem key={status.value} value={status.value}>
                                {status.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="rounded-md border p-4 space-y-4">
                  <div>
                    <p className="font-medium text-sm">Automatic Zoom recording</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Add the Zoom meeting ID so completed recordings can be imported into protected storage.
                    </p>
                  </div>
                  <FormField
                    control={createForm.control}
                    name="zoomMeetingId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Zoom Meeting ID (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. 87565330005" {...field} data-testid="input-create-zoom-meeting-id" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createForm.control}
                    name="recordingLessonId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Course video lesson (Optional)</FormLabel>
                        <Select value={field.value || "none"} onValueChange={(value) => field.onChange(value === "none" ? undefined : value)}>
                          <FormControl>
                            <SelectTrigger data-testid="select-create-recording-lesson">
                              <SelectValue placeholder="Attach recording to a lesson" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">Event recording only</SelectItem>
                            {lessonOptions.map((lesson) => (
                              <SelectItem key={lesson.id} value={lesson.id}>{lesson.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={createForm.control}
                  name="visibility"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Visibility</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-create-visibility">
                            <SelectValue placeholder="Select visibility" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="public">Public (Everyone)</SelectItem>
                          <SelectItem value="community">Community (Logged in)</SelectItem>
                          <SelectItem value="cohort_only">Cohort Only (Participants+)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={createForm.control}
                    name="startTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Time</FormLabel>
                        <FormControl>
                          <Input type="datetime-local" {...field} data-testid="input-create-start-time" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createForm.control}
                    name="endTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>End Time (Optional)</FormLabel>
                        <FormControl>
                          <Input type="datetime-local" {...field} data-testid="input-create-end-time" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={createForm.control}
                    name="durationMinutes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Duration (minutes)</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} data-testid="input-create-duration" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createForm.control}
                    name="maxAttendees"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Max Attendees</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} data-testid="input-create-max-attendees" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={createForm.control}
                    name="meetingPlatform"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Meeting Platform</FormLabel>
                        <FormControl>
                          <Input placeholder="Zoom, Google Meet, etc." {...field} data-testid="input-create-platform" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createForm.control}
                    name="meetingLink"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Meeting Link</FormLabel>
                        <FormControl>
                          <Input placeholder="https://..." {...field} data-testid="input-create-meeting-link" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="rounded-md border p-4 space-y-4">
                  <div>
                    <p className="font-medium text-sm">Automatic Zoom recording</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Completed recordings are downloaded into protected storage and attached after Zoom notifies AFÁRÁ.
                    </p>
                  </div>
                  <FormField
                    control={editForm.control}
                    name="zoomMeetingId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Zoom Meeting ID (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. 87565330005" {...field} data-testid="input-edit-zoom-meeting-id" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={editForm.control}
                    name="recordingLessonId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Course video lesson (Optional)</FormLabel>
                        <Select value={field.value || "none"} onValueChange={(value) => field.onChange(value === "none" ? undefined : value)}>
                          <FormControl>
                            <SelectTrigger data-testid="select-edit-recording-lesson">
                              <SelectValue placeholder="Attach recording to a lesson" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">Event recording only</SelectItem>
                            {lessonOptions.map((lesson) => (
                              <SelectItem key={lesson.id} value={lesson.id}>{lesson.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={createForm.control}
                  name="recordingUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Recording URL (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="https://..." {...field} data-testid="input-create-recording-url" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending} data-testid="button-submit-create">
                    {createMutation.isPending ? "Creating..." : "Create Event"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Event</DialogTitle>
              <DialogDescription>
                Update event details
              </DialogDescription>
            </DialogHeader>
            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
                <FormField
                  control={editForm.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Event title" {...field} data-testid="input-edit-title" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Event description..."
                          className="resize-none"
                          {...field}
                          data-testid="input-edit-description"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={editForm.control}
                    name="eventType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Event Type</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-edit-event-type">
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {eventTypes.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={editForm.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-edit-status">
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {statusOptions.map((status) => (
                              <SelectItem key={status.value} value={status.value}>
                                {status.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={editForm.control}
                  name="visibility"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Visibility</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-edit-visibility">
                            <SelectValue placeholder="Select visibility" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="public">Public (Everyone)</SelectItem>
                          <SelectItem value="community">Community (Logged in)</SelectItem>
                          <SelectItem value="cohort_only">Cohort Only (Participants+)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={editForm.control}
                    name="startTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Time</FormLabel>
                        <FormControl>
                          <Input type="datetime-local" {...field} data-testid="input-edit-start-time" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={editForm.control}
                    name="endTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>End Time (Optional)</FormLabel>
                        <FormControl>
                          <Input type="datetime-local" {...field} data-testid="input-edit-end-time" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={editForm.control}
                    name="durationMinutes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Duration (minutes)</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} data-testid="input-edit-duration" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={editForm.control}
                    name="maxAttendees"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Max Attendees</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} data-testid="input-edit-max-attendees" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={editForm.control}
                    name="meetingPlatform"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Meeting Platform</FormLabel>
                        <FormControl>
                          <Input placeholder="Zoom, Google Meet, etc." {...field} data-testid="input-edit-platform" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={editForm.control}
                    name="meetingLink"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Meeting Link</FormLabel>
                        <FormControl>
                          <Input placeholder="https://..." {...field} data-testid="input-edit-meeting-link" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={editForm.control}
                  name="recordingUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Recording URL (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="https://..." {...field} data-testid="input-edit-recording-url" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsEditDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={updateMutation.isPending} data-testid="button-submit-edit">
                    {updateMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Event</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{selectedEvent?.title}"? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => selectedEvent && deleteMutation.mutate(selectedEvent.id)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                data-testid="button-confirm-delete"
              >
                {deleteMutation.isPending ? "Deleting..." : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
    </div>
  );
}

function getZoomStatusVariant(status: string): "default" | "secondary" | "outline" | "destructive" {
  switch (status) {
    case "completed": return "default";
    case "failed": return "destructive";
    case "processing": return "outline";
    default: return "secondary";
  }
}

type ZoomSyncStatusResponse = {
  events: ZoomSyncEvent[];
  counts: {
    waiting: number;
    importing: number;
    complete: number;
    failed: number;
  };
};

function getZoomStatusIcon(status: string) {
  switch (status) {
    case "completed": return CheckCircle2;
    case "failed": return AlertCircle;
    case "processing": return Loader2;
    default: return Clock3;
  }
}
