import { LMSSidebar } from "@/components/LMSSidebar";
import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Lock, Calendar, MapPin, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import type { Event } from "@shared/schema";

export default function EventDetail() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();

  const { data: event, isLoading, error } = useQuery<Event & { registrations?: unknown[] }>({
    queryKey: ["/api/events", id],
    queryFn: async () => {
      const res = await fetch(`/api/events/${id}`, { credentials: "include" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw Object.assign(new Error(err.error || "Failed to load"), { status: res.status });
      }
      return res.json();
    },
  });

  const isCohortRestricted =
    typeof error === "object" && error !== null && "status" in error && (error as { status: number }).status === 403;

  const getTypeBadge = () => {
    if (!event) return null;
    if (event.recordingUrl) return <Badge variant="secondary">Recorded</Badge>;
    const now = new Date();
    const start = new Date(event.startTime);
    const end = event.endTime ? new Date(event.endTime) : null;
    if (start <= now && (!end || end >= now)) return <Badge className="bg-red-500 text-white">Live</Badge>;
    return <Badge variant="outline">Upcoming</Badge>;
  };

  return (
    <div className="flex flex-col md:flex-row h-screen">
      <LMSSidebar />
      <main className="flex-1 overflow-auto">
        <div className="p-8 max-w-3xl">
          <Button
            variant="ghost"
            className="mb-6 gap-2"
            onClick={() => setLocation("/lms/events")}
            data-testid="button-back-events"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Events
          </Button>

          {isLoading && (
            <div className="space-y-4">
              <Skeleton className="h-8 w-2/3" />
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-24 w-full" />
            </div>
          )}

          {isCohortRestricted && (
            <div className="flex flex-col items-center justify-center py-16 text-center gap-4" data-testid="notice-cohort-only-event">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                <Lock className="w-8 h-8 text-muted-foreground" />
              </div>
              <h2 className="text-2xl font-semibold">Cohort Members Only</h2>
              <p className="text-muted-foreground max-w-md">
                This event is available to cohort participants only. Apply to the AFÁRÁ program to access all sessions and events.
              </p>
              <Button onClick={() => setLocation("/apply")} data-testid="button-apply-now">
                Apply Now
              </Button>
            </div>
          )}

          {!isLoading && !isCohortRestricted && !event && (
            <div className="text-center py-16" data-testid="notice-event-not-found">
              <p className="text-muted-foreground">Event not found.</p>
            </div>
          )}

          {event && (
            <div className="space-y-6" data-testid={`event-detail-${event.id}`}>
              <div className="flex items-center gap-3 flex-wrap">
                {getTypeBadge()}
                {event.eventType && <Badge variant="outline">{event.eventType}</Badge>}
              </div>

              <div>
                <h1 className="text-3xl font-bold mb-2">{event.title}</h1>
                {event.description && (
                  <p className="text-muted-foreground">{event.description}</p>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4 shrink-0" />
                  <span>{format(new Date(event.startTime), "MMMM d, yyyy 'at' h:mm a")}</span>
                </div>
                {event.meetingPlatform && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4 shrink-0" />
                    <span>Virtual ({event.meetingPlatform})</span>
                  </div>
                )}
              </div>

              {event.meetingLink && (
                <Button asChild className="gap-2" data-testid="button-join-event">
                  <a href={event.meetingLink} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-4 h-4" />
                    Join Session
                  </a>
                </Button>
              )}
              {event.recordingUrl && (
                <Button asChild variant="outline" className="gap-2" data-testid="button-watch-recording">
                  <a href={event.recordingUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-4 h-4" />
                    Watch Recording
                  </a>
                </Button>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
