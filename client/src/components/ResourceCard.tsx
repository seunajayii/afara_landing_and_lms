import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Download } from "lucide-react";

interface ResourceCardProps {
  title: string;
  category: string;
  fileType: string;
  size: string;
}

export function ResourceCard({ title, category, fileType, size }: ResourceCardProps) {
  return (
    <Card className="hover-elevate transition-all duration-300" data-testid={`card-resource-${title.toLowerCase().replace(/\s+/g, "-")}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <Badge variant="secondary" className="mb-2">{category}</Badge>
            <CardTitle className="text-base">{title}</CardTitle>
          </div>
          <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
            <FileText className="w-5 h-5 text-primary" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">{fileType} • {size}</span>
          <Button size="sm" variant="ghost" data-testid={`button-download-${title.toLowerCase().replace(/\s+/g, "-")}`}>
            <Download className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
