import { LMSSidebar } from "@/components/LMSSidebar";
import { ProgressDashboard } from "@/components/ProgressDashboard";
import { CourseCard } from "@/components/CourseCard";
import { EventCard } from "@/components/EventCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { format } from "date-fns";
import { Sparkles, BookOpen, FileText, Users, Settings, BarChart3 } from "lucide-react";
import { useAuth } from "@/lib/auth";
import type { Course, Event, Resource } from "@shared/schema";

interface RecommendationsResponse {
  courses: (Course & { score: number; type: "course" })[];
  resources: (Resource & { score: number; type: "resource" })[];
  userInterests: string[];
}

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
  const { user, isAdmin } = useAuth();
  
  const { data: courses, isLoading: coursesLoading } = useQuery<Course[]>({
    queryKey: ["/api/courses"],
  });

  const { data: events, isLoading: eventsLoading } = useQuery<Event[]>({
    queryKey: ["/api/events"],
  });

  // Use logged-in user for recommendations
  const { data: recommendations, isLoading: recommendationsLoading, isError } = useQuery<RecommendationsResponse>({
    queryKey: ["/api/recommendations", user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error("No user");
      const res = await fetch(`/api/recommendations/${user.id}?limit=3`);
      if (!res.ok) throw new Error("Failed to fetch recommendations");
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      return data;
    },
    enabled: !!user?.id,
    retry: 1
  });

  const publishedCourses = courses?.filter(c => c.status === "published").slice(0, 2) || [];
  
  const upcomingEvents = events?.filter(e => {
    const eventType = getEventType(e);
    return eventType === "upcoming" || eventType === "live";
  }).slice(0, 2) || [];

  const greeting = user ? `Welcome back, ${user.firstName}` : "Welcome back";
  const subtitle = isAdmin 
    ? "Here's your admin dashboard overview." 
    : "Here's your progress overview for this cohort.";

  return (
    <div className="flex h-screen">
      <LMSSidebar />
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold" data-testid="text-welcome">{greeting}</h1>
              {isAdmin && (
                <Badge variant="default" className="bg-primary" data-testid="badge-admin">
                  Admin
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground">{subtitle}</p>
          </div>

          {isAdmin ? (
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <Card className="hover-elevate">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    <span className="text-2xl font-bold" data-testid="text-total-users">--</span>
                  </div>
                </CardContent>
              </Card>
              <Card className="hover-elevate">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Active Courses</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-primary" />
                    <span className="text-2xl font-bold" data-testid="text-active-courses">{courses?.length || 0}</span>
                  </div>
                </CardContent>
              </Card>
              <Card className="hover-elevate">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Upcoming Events</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-primary" />
                    <span className="text-2xl font-bold" data-testid="text-upcoming-events">{upcomingEvents.length}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <ProgressDashboard />
          )}

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

          {/* Personalized Recommendations Section */}
          <div className="mt-8">
            <div className="flex items-center gap-2 mb-6">
              <Sparkles className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold">Recommended For You</h2>
            </div>
            
            {recommendationsLoading ? (
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <CourseCardSkeleton />
                  <CourseCardSkeleton />
                </div>
                <div className="space-y-4">
                  <CourseCardSkeleton />
                  <CourseCardSkeleton />
                </div>
              </div>
            ) : isError ? (
              <Card className="p-6 text-center border-destructive/50">
                <p className="text-muted-foreground">
                  Unable to load recommendations at this time. Please try again later.
                </p>
              </Card>
            ) : recommendations && (recommendations.courses.length > 0 || recommendations.resources.length > 0) ? (
              <div className="grid md:grid-cols-2 gap-6">
                {/* Recommended Courses */}
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5 text-primary" />
                      <CardTitle className="text-lg">Courses</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {recommendations.courses.slice(0, 3).map((course) => (
                      <div 
                        key={course.id} 
                        className="p-3 rounded-md border hover-elevate cursor-pointer"
                        data-testid={`recommendation-course-${course.id}`}
                      >
                        <div className="flex items-start justify-between gap-2 flex-wrap">
                          <h4 className="font-medium text-sm">{course.title}</h4>
                          <Badge variant="secondary">
                            {course.category || "General"}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {course.shortDescription || course.description}
                        </p>
                      </div>
                    ))}
                    {recommendations.courses.length === 0 && (
                      <p className="text-sm text-muted-foreground">No course recommendations yet.</p>
                    )}
                    <Link href="/lms/courses">
                      <Button variant="ghost" size="sm" className="w-full mt-2" data-testid="button-view-recommended-courses">
                        View All Courses
                      </Button>
                    </Link>
                  </CardContent>
                </Card>

                {/* Recommended Resources */}
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-primary" />
                      <CardTitle className="text-lg">Resources</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {recommendations.resources.slice(0, 3).map((resource) => (
                      <div 
                        key={resource.id} 
                        className="p-3 rounded-md border hover-elevate cursor-pointer"
                        data-testid={`recommendation-resource-${resource.id}`}
                      >
                        <div className="flex items-start justify-between gap-2 flex-wrap">
                          <h4 className="font-medium text-sm">{resource.title}</h4>
                          <Badge variant="outline">
                            {resource.resourceType}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {resource.description}
                        </p>
                      </div>
                    ))}
                    {recommendations.resources.length === 0 && (
                      <p className="text-sm text-muted-foreground">No resource recommendations yet.</p>
                    )}
                    <Link href="/lms/resources">
                      <Button variant="ghost" size="sm" className="w-full mt-2" data-testid="button-view-recommended-resources">
                        View All Resources
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card className="p-6 text-center">
                <Sparkles className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">
                  Complete your profile to get personalized recommendations based on your expertise and interests.
                </p>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
