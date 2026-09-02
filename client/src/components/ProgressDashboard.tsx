import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Award, BookOpen, Users, TrendingUp } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";

type ProgressSummary = {
  report: {
    activity: {
      courseCompletionPercent: number;
      completedCourses: number;
      assignedCourses: number;
      reviewedAssignments: number;
      completedMentorshipSessions: number;
    };
    milestones: { status: string }[];
  } | null;
};

export function ProgressDashboard() {
  const { data } = useQuery<ProgressSummary>({
    queryKey: ["/api/progress-reporting/me"],
  });
  const report = data?.report;
  const activity = report?.activity;
  const completedMilestones = report?.milestones.filter((milestone) => milestone.status === "completed").length ?? 0;
  const stats = [
    { label: "Courses Completed", value: activity ? `${activity.completedCourses}/${activity.assignedCourses}` : "—", icon: BookOpen, progress: activity?.courseCompletionPercent ?? 0 },
    { label: "Reviewed Submissions", value: activity ? String(activity.reviewedAssignments) : "—", icon: Users, progress: activity?.reviewedAssignments ? 100 : 0 },
    { label: "Mentorship Sessions", value: activity ? String(activity.completedMentorshipSessions) : "—", icon: Award, progress: activity?.completedMentorshipSessions ? 100 : 0 },
    { label: "Milestones Completed", value: report ? String(completedMilestones) : "—", icon: TrendingUp, progress: report?.milestones.length ? Math.round((completedMilestones / report.milestones.length) * 100) : 0 },
  ];

  return (
    <div className="space-y-3" data-testid="dashboard-progress">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <Card key={i} className="hover-elevate transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
            <stat.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-2">{stat.value}</div>
            <Progress value={stat.progress} className="h-2" indicatorClassName="bg-chart-2" />
          </CardContent>
          </Card>
        ))}
      </div>
      {report && <Link href="/lms/progress"><a className="text-sm text-primary hover:underline">View your full progress journey →</a></Link>}
    </div>
  );
}
