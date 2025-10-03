import { CourseCard } from "../CourseCard";

export default function CourseCardExample() {
  return (
    <CourseCard
      title="Financial Structuring for Infrastructure"
      description="Learn to design bankable financial structures for energy and infrastructure projects."
      duration="6 weeks"
      modules={8}
      progress={45}
      category="Finance"
    />
  );
}
