import { LMSSidebar } from "@/components/LMSSidebar";
import { EventCard } from "@/components/EventCard";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import type { Event } from "@shared/schema";

function getEventType(event: Event): "live" | "recorded" | "upcoming" {
  const now = new Date();
  const startTime = new Date(event.startTime);
  const endTime = event.endTime ? new Date(event.endTime) : null;
  
  if (event.recordingUrl) return "recorded";
  if (startTime <= now && (!endTime || endTime >= now)) return "live";
  return "upcoming";
}

function formatLocation(event: Event): string {
  if (event.meetingPlatform) {
    const platforms: Record<string, string> = {
      zoom: "Zoom",
      teams: "Microsoft Teams",
      google_meet: "Google Meet",
    };
    return `Virtual (${platforms[event.meetingPlatform] || event.meetingPlatform})`;
  }
  return "Virtual";
}

function EventCardSkeleton() {
  return (
    <div className="border rounded-lg p-6 space-y-4">
      <Skeleton className="h-6 w-20" />
      <Skeleton className="h-6 w-3/4" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-24" />
      </div>
      <Skeleton className="h-9 w-full" />
    </div>
  );
}

export default function Events() {
  const { data: events, isLoading } = useQuery<Event[]>({
    queryKey: ["/api/events"],
  });

  const sortedEvents = events?.sort((a, b) => {
    const aType = getEventType(a);
    const bType = getEventType(b);
    const typeOrder = { live: 0, upcoming: 1, recorded: 2 };
    return typeOrder[aType] - typeOrder[bType];
  }) || [];

  return (
    <div className="flex h-screen">
      <LMSSidebar />
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <h1 className="text-3xl font-bold mb-6">Events & Sessions</h1>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <EventCardSkeleton key={i} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedEvents.map((event) => {
                const eventType = getEventType(event);
                const startTime = new Date(event.startTime);
                
                return (
                  <EventCard
                    key={event.id}
                    title={event.title}
                    date={eventType === "recorded" ? "Recorded" : format(startTime, "MMMM d, yyyy")}
                    time={eventType === "recorded" 
                      ? `${event.durationMinutes || 60} minutes` 
                      : format(startTime, "h:mm a") + " WAT"
                    }
                    type={eventType}
                    location={formatLocation(event)}
                  />
                );
              })}
            </div>
          )}

          {!isLoading && sortedEvents.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No events scheduled yet.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
