import { LMSSidebar } from "@/components/LMSSidebar";
import { CourseCard } from "@/components/CourseCard";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function Courses() {
  const [filter, setFilter] = useState("all");

  const courses = [
    {
      title: "Financial Structuring for Infrastructure",
      description: "Learn to design bankable financial structures for energy and infrastructure projects.",
      duration: "6 weeks",
      modules: 8,
      progress: 45,
      category: "Finance"
    },
    {
      title: "Regulatory Compliance & Strategy",
      description: "Navigate policy and regulatory frameworks with confidence.",
      duration: "4 weeks",
      modules: 6,
      progress: 20,
      category: "Regulation"
    },
    {
      title: "Project Development Fundamentals",
      description: "From concept to capital—master the entire development process.",
      duration: "8 weeks",
      modules: 12,
      progress: 10,
      category: "Technical"
    },
    {
      title: "Leadership & Communication Skills",
      description: "Build confidence, audacity, and executive presence.",
      duration: "5 weeks",
      modules: 7,
      category: "Soft Skills"
    },
    {
      title: "Funding Strategy & Capital Raising",
      description: "Shape funding strategies and connect with the right capital partners.",
      duration: "6 weeks",
      modules: 9,
      category: "Finance"
    },
    {
      title: "Technical Due Diligence",
      description: "Conduct thorough technical assessments for infrastructure projects.",
      duration: "4 weeks",
      modules: 6,
      category: "Technical"
    }
  ];

  const categories = ["all", "Finance", "Technical", "Regulation", "Soft Skills"];
  const filteredCourses = filter === "all" ? courses : courses.filter(c => c.category === filter);

  return (
    <div className="flex h-screen">
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

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course, i) => (
              <CourseCard key={i} {...course} />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
