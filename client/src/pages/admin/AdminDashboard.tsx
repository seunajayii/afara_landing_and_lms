import { AdminSidebar } from "@/components/AdminSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { useAuth } from "@/lib/auth";
import { 
  Users, 
  BookOpen, 
  Calendar, 
  FolderOpen, 
  Award,
  TrendingUp,
  UserCheck,
  FileCheck
} from "lucide-react";
import type { Course, Event, Resource, User } from "@shared/schema";

function StatCardSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <Skeleton className="h-4 w-24" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-16" />
      </CardContent>
    </Card>
  );
}

export default function AdminDashboard() {
  const { user } = useAuth();

  const { data: courses, isLoading: coursesLoading } = useQuery<Course[]>({
    queryKey: ["/api/courses"],
  });

  const { data: events, isLoading: eventsLoading } = useQuery<Event[]>({
    queryKey: ["/api/events"],
  });

  const { data: resources, isLoading: resourcesLoading } = useQuery<Resource[]>({
    queryKey: ["/api/resources"],
  });

  const { data: users, isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const isLoading = coursesLoading || eventsLoading || resourcesLoading || usersLoading;

  const totalUsers = users?.length || 0;
  const activeCourses = courses?.filter(c => c.status === "published").length || 0;
  const totalResources = resources?.length || 0;
  const upcomingEvents = events?.filter(e => new Date(e.startTime) > new Date()).length || 0;
  const mentors = users?.filter(u => u.role === "mentor").length || 0;
  const participants = users?.filter(u => u.role === "participant").length || 0;

  return (
    <div className="flex flex-col md:flex-row h-screen">
      <AdminSidebar />
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold" data-testid="text-admin-welcome">
              Admin Dashboard
            </h1>
            <p className="text-muted-foreground">
              Welcome back, {user?.firstName}. Here's an overview of the AFÁRÁ platform.
            </p>
          </div>

          {isLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[...Array(8)].map((_, i) => (
                <StatCardSkeleton key={i} />
              ))}
            </div>
          ) : (
            <>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <Card className="hover-elevate">
                  <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold" data-testid="text-stat-total-users">{totalUsers}</div>
                    <p className="text-xs text-muted-foreground">{participants} participants, {mentors} mentors</p>
                  </CardContent>
                </Card>

                <Card className="hover-elevate">
                  <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Active Courses</CardTitle>
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold" data-testid="text-stat-active-courses">{activeCourses}</div>
                    <p className="text-xs text-muted-foreground">{courses?.length || 0} total courses</p>
                  </CardContent>
                </Card>

                <Card className="hover-elevate">
                  <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Resources</CardTitle>
                    <FolderOpen className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold" data-testid="text-stat-resources">{totalResources}</div>
                    <p className="text-xs text-muted-foreground">Available to participants</p>
                  </CardContent>
                </Card>

                <Card className="hover-elevate">
                  <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Upcoming Events</CardTitle>
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold" data-testid="text-stat-events">{upcomingEvents}</div>
                    <p className="text-xs text-muted-foreground">{events?.length || 0} total events</p>
                  </CardContent>
                </Card>
              </div>

              <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <BookOpen className="h-5 w-5 text-primary" />
                      Course Management
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Create, edit, and manage training courses for participants.
                    </p>
                    <Link href="/admin/courses">
                      <Button className="w-full" data-testid="button-manage-courses">
                        Manage Courses
                      </Button>
                    </Link>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Users className="h-5 w-5 text-primary" />
                      User Management
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Manage user accounts, roles, and permissions.
                    </p>
                    <Link href="/admin/users">
                      <Button className="w-full" data-testid="button-manage-users">
                        Manage Users
                      </Button>
                    </Link>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <UserCheck className="h-5 w-5 text-primary" />
                      Mentor Management
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Assign mentors and manage mentorship pairings.
                    </p>
                    <Button className="w-full" disabled data-testid="button-manage-mentors" title="Coming soon">
                      Manage Mentors (Coming Soon)
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <FolderOpen className="h-5 w-5 text-primary" />
                      Resource Library
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Upload and organize resources for participants.
                    </p>
                    <Link href="/admin/resources">
                      <Button className="w-full" data-testid="button-manage-resources">
                        Manage Resources
                      </Button>
                    </Link>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Calendar className="h-5 w-5 text-primary" />
                      Event Management
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Schedule and manage live sessions and webinars.
                    </p>
                    <Link href="/admin/events">
                      <Button className="w-full" data-testid="button-manage-events">
                        Manage Events
                      </Button>
                    </Link>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Award className="h-5 w-5 text-primary" />
                      Certificate Approval
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Review and approve certificate download requests.
                    </p>
                    <Link href="/admin/certificates">
                      <Button className="w-full" data-testid="button-manage-certificates">
                        Manage Certificates
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
