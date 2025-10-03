import { LMSSidebar } from "@/components/LMSSidebar";
import { ProgressDashboard } from "@/components/ProgressDashboard";
import { CourseCard } from "@/components/CourseCard";
import { EventCard } from "@/components/EventCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  const activeCourses = [
    {
      title: "Financial Structuring for Infrastructure",
      description: "Learn to design bankable financial structures.",
      duration: "6 weeks",
      modules: 8,
      progress: 45,
      category: "Finance"
    },
    {
      title: "Regulatory Compliance & Strategy",
      description: "Navigate policy and regulatory frameworks.",
      duration: "4 weeks",
      modules: 6,
      progress: 20,
      category: "Regulation"
    }
  ];

  const upcomingEvents = [
    {
      title: "Funding Strategy Masterclass",
      date: "March 15, 2025",
      time: "2:00 PM WAT",
      type: "upcoming" as const,
      location: "Virtual (Zoom)"
    },
    {
      title: "Peer Networking Session",
      date: "March 18, 2025",
      time: "4:00 PM WAT",
      type: "upcoming" as const,
      location: "Virtual"
    }
  ];

  return (
    <div className="flex h-screen">
      <LMSSidebar />
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Welcome back, Founder! 👋</h1>
            <p className="text-muted-foreground">Here's your progress overview for this cohort.</p>
          </div>

          <ProgressDashboard />

          <div className="grid lg:grid-cols-2 gap-8 mt-8">
            <div>
              <h2 className="text-2xl font-bold mb-4">Active Courses</h2>
              <div className="space-y-4">
                {activeCourses.map((course, i) => (
                  <CourseCard key={i} {...course} />
                ))}
              </div>
              <Button variant="outline" className="w-full mt-4" data-testid="button-view-all-courses">
                View All Courses
              </Button>
            </div>

            <div>
              <h2 className="text-2xl font-bold mb-4">Upcoming Events</h2>
              <div className="space-y-4">
                {upcomingEvents.map((event, i) => (
                  <EventCard key={i} {...event} />
                ))}
              </div>

              <Card className="mt-6 bg-gradient-to-r from-chart-1/10 to-chart-2/10">
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button variant="outline" className="w-full justify-start" data-testid="button-find-mentor">
                    Find a Mentor
                  </Button>
                  <Button variant="outline" className="w-full justify-start" data-testid="button-join-discussion">
                    Join Community Discussion
                  </Button>
                  <Button variant="outline" className="w-full justify-start" data-testid="button-upload-project">
                    Upload Project Update
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
