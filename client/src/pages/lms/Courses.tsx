import { LMSSidebar } from "@/components/LMSSidebar";
import { CourseCard } from "@/components/CourseCard";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import type { Course } from "@shared/schema";

interface CourseWithModules extends Course {
  modules?: { id: string }[];
  moduleCount?: number;
  lessonCount?: number;
}

function formatDuration(minutes: number | null): string {
  if (!minutes) return "Self-paced";
  const weeks = Math.ceil(minutes / (7 * 60));
  return `${weeks} weeks`;
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

export default function Courses() {
  const [filter, setFilter] = useState("all");

  const { data: courses, isLoading } = useQuery<CourseWithModules[]>({
    queryKey: ["/api/courses"],
  });

  const categories = useMemo(() => {
    const availableCategories = (courses || [])
      .map((course) => course.category?.trim())
      .filter((category): category is string => Boolean(category));
    return ["all", ...Array.from(new Set(availableCategories)).sort()];
  }, [courses]);
  
  const filteredCourses = courses?.filter(course => {
    if (filter === "all") return course.status === "published";
    return course.status === "published" && course.category === filter;
  }) || [];

  return (
    <div className="flex flex-col md:flex-row h-screen">
      <LMSSidebar />
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <h1 className="text-3xl font-bold mb-6">My Courses</h1>

          <div className="flex flex-wrap gap-2 mb-8">
            {categories.map((category) => (
              <Button
                key={category}
                variant={filter === category ? "default" : "outline"}
                onClick={() => setFilter(category)}
                data-testid={`filter-${category.toLowerCase().replace(" ", "-")}`}
              >
                {category === "all" ? "All Courses" : category}
              </Button>
            ))}
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <CourseCardSkeleton key={i} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCourses.map((course) => (
                <CourseCard 
                  key={course.id} 
                  title={course.title}
                  description={course.shortDescription || course.description || ""}
                  duration={formatDuration(course.durationMinutes)}
                  modules={course.moduleCount ?? course.modules?.length ?? 0}
                  category={course.category || "General"}
                  href={`/lms/courses/${course.id}`}
                />
              ))}
            </div>
          )}

          {!isLoading && filteredCourses.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No courses found in this category.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
