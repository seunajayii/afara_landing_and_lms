import { LMSSidebar } from "@/components/LMSSidebar";
import { ProgressDashboard } from "@/components/ProgressDashboard";
import { CourseCard } from "@/components/CourseCard";
import { EventCard } from "@/components/EventCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { format } from "date-fns";
import type { Course, Event } from "@shared/schema";

function formatDuration(minutes: number | null): string {
  if (!minutes) return "Self-paced";
  const weeks = Math.ceil(minutes / (7 * 60));
  return `${weeks} weeks`;
}

function getEventType(event: Event): "live" | "recorded" | "upcoming" {
  const now = new Date();
  const startTime = new Date(event.startTime);
  const endTime = event.endTime ? new Date(event.endTime) : null;
  
  if (event.recordingUrl) return "recorded";
  if (startTime <= now && (!endTime || endTime >= now)) return "live";
  return "upcoming";
}

function CourseCardSkeleton() {
  return (
    <div className="border rounded-lg p-6 space-y-4">
      <Skeleton className="h-6 w-20" />
      <Skeleton className="h-6 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <div className="flex gap-4">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-24" />
      </div>
    </div>
  );
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
    </div>
  );
}

export default function Dashboard() {
  const { data: courses, isLoading: coursesLoading } = useQuery<Course[]>({
    queryKey: ["/api/courses"],
  });

  const { data: events, isLoading: eventsLoading } = useQuery<Event[]>({
    queryKey: ["/api/events"],
  });

  const publishedCourses = courses?.filter(c => c.status === "published").slice(0, 2) || [];
  
  const upcomingEvents = events?.filter(e => {
    const eventType = getEventType(e);
    return eventType === "upcoming" || eventType === "live";
  }).slice(0, 2) || [];

  return (
    <div className="flex h-screen">
      <LMSSidebar />
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Welcome back, Founder</h1>
            <p className="text-muted-foreground">Here's your progress overview for this cohort.</p>
          </div>

          <ProgressDashboard />

          <div className="grid lg:grid-cols-2 gap-8 mt-8">
            <div>
              <h2 className="text-2xl font-bold mb-4">Active Courses</h2>
              {coursesLoading ? (
                <div className="space-y-4">
                  <CourseCardSkeleton />
                  <CourseCardSkeleton />
                </div>
              ) : (
                <div className="space-y-4">
                  {publishedCourses.map((course) => (
                    <CourseCard 
                      key={course.id}
                      title={course.title}
                      description={course.shortDescription || course.description || ""}
                      duration={formatDuration(course.durationMinutes)}
                      modules={0}
                      category={course.category || "General"}
                    />
                  ))}
                </div>
              )}
              <Link href="/lms/courses">
                <Button variant="outline" className="w-full mt-4" data-testid="button-view-all-courses">
                  View All Courses
                </Button>
              </Link>
            </div>

            <div>
              <h2 className="text-2xl font-bold mb-4">Upcoming Events</h2>
              {eventsLoading ? (
                <div className="space-y-4">
                  <EventCardSkeleton />
                  <EventCardSkeleton />
                </div>
              ) : (
                <div className="space-y-4">
                  {upcomingEvents.map((event) => {
                    const eventType = getEventType(event);
                    const startTime = new Date(event.startTime);
                    
                    return (
                      <EventCard
                        key={event.id}
                        title={event.title}
                        date={format(startTime, "MMMM d, yyyy")}
                        time={format(startTime, "h:mm a") + " WAT"}
                        type={eventType}
                        location={event.meetingPlatform ? `Virtual (${event.meetingPlatform})` : "Virtual"}
                      />
                    );
                  })}
                </div>
              )}

              <Card className="mt-6 bg-chart-2/10">
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Link href="/lms/mentorship">
                    <Button variant="outline" className="w-full justify-start" data-testid="button-find-mentor">
                      Find a Mentor
                    </Button>
                  </Link>
                  <Link href="/lms/community">
                    <Button variant="outline" className="w-full justify-start" data-testid="button-join-discussion">
                      Join Community Discussion
                    </Button>
                  </Link>
                  <Link href="/lms/resources">
                    <Button variant="outline" className="w-full justify-start" data-testid="button-upload-project">
                      Browse Resources
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
