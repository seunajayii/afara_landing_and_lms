import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Clock, BookOpen } from "lucide-react";

interface CourseCardProps {
  title: string;
  description: string;
  duration: string;
  modules: number;
  progress?: number;
  category: string;
}

export function CourseCard({ title, description, duration, modules, progress, category }: CourseCardProps) {
  return (
    <Card className="hover-elevate transition-all duration-300" data-testid={`card-course-${title.toLowerCase().replace(/\s+/g, "-")}`}>
      <CardHeader className="pb-3">
        <Badge variant="secondary" className="w-fit mb-2">{category}</Badge>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">{description}</p>
        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>{duration}</span>
          </div>
          <div className="flex items-center gap-1">
            <BookOpen className="w-4 h-4" />
            <span>{modules} modules</span>
          </div>
        </div>
        {progress !== undefined && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" indicatorClassName="bg-chart-2" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
