import { LMSSidebar } from "@/components/LMSSidebar";
import { ResourceCard } from "@/components/ResourceCard";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useState } from "react";

export default function Resources() {
  const [searchQuery, setSearchQuery] = useState("");

  const resources = [
    {
      title: "Infrastructure Project Development Guide",
      category: "Technical",
      fileType: "PDF",
      size: "2.4 MB"
    },
    {
      title: "Financial Modeling Templates",
      category: "Finance",
      fileType: "XLSX",
      size: "1.8 MB"
    },
    {
      title: "Regulatory Compliance Checklist",
      category: "Regulation",
      fileType: "PDF",
      size: "856 KB"
    },
    {
      title: "Capital Raising Strategy Toolkit",
      category: "Finance",
      fileType: "PDF",
      size: "3.2 MB"
    },
    {
      title: "Energy Sector Policy Brief - West Africa",
      category: "Research",
      fileType: "PDF",
      size: "1.5 MB"
    },
    {
      title: "Project Feasibility Study Template",
      category: "Technical",
      fileType: "DOCX",
      size: "945 KB"
    },
    {
      title: "Mentorship Session Recording - Q1 2025",
      category: "Recordings",
      fileType: "MP4",
      size: "245 MB"
    },
    {
      title: "Leadership Development Workbook",
      category: "Soft Skills",
      fileType: "PDF",
      size: "1.2 MB"
    }
  ];

  const filteredResources = resources.filter(resource =>
    resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    resource.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-screen">
      <LMSSidebar />
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <h1 className="text-3xl font-bold mb-6">Resource Library</h1>

          <div className="relative mb-8">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search resources..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              data-testid="input-search-resources"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredResources.map((resource, i) => (
              <ResourceCard key={i} {...resource} />
            ))}
          </div>

          {filteredResources.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No resources found matching your search.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
