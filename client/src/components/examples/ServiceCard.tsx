import { ServiceCard } from "../ServiceCard";
import { Building2 } from "lucide-react";

export default function ServiceCardExample() {
  return (
    <ServiceCard
      icon={Building2}
      title="Project Advisory"
      description="From concept to capital—we guide the entire development process, ensuring technical and financial viability."
    />
  );
}
