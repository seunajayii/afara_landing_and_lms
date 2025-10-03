import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Award, BookOpen, Users, TrendingUp } from "lucide-react";

export function ProgressDashboard() {
  const stats = [
    { label: "Modules Completed", value: "8/12", icon: BookOpen, progress: 67 },
    { label: "Mentorship Hours", value: "24", icon: Users, progress: 80 },
    { label: "Certifications", value: "3", icon: Award, progress: 50 },
    { label: "Community Engagement", value: "High", icon: TrendingUp, progress: 90 },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" data-testid="dashboard-progress">
      {stats.map((stat, i) => (
        <Card key={i} className="hover-elevate transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
            <stat.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-2">{stat.value}</div>
            <Progress value={stat.progress} className="h-2" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
