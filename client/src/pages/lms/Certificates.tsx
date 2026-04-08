import { LMSSidebar } from "@/components/LMSSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Award, Download, Share2 } from "lucide-react";

export default function Certificates() {
  const certificates = [
    {
      title: "Financial Structuring for Infrastructure",
      issuedDate: "February 2025",
      status: "earned"
    },
    {
      title: "Regulatory Compliance & Strategy",
      issuedDate: "January 2025",
      status: "earned"
    },
    {
      title: "Project Development Fundamentals",
      progress: 65,
      status: "in-progress"
    },
    {
      title: "Leadership & Communication Skills",
      status: "locked"
    }
  ];

  return (
    <div className="flex flex-col md:flex-row h-screen">
      <LMSSidebar />
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <h1 className="text-3xl font-bold mb-6">Certificates & Achievements</h1>

          <div className="grid gap-6">
            {certificates.map((cert, i) => (
              <Card key={i} className={cert.status === "locked" ? "opacity-60" : "hover-elevate transition-all duration-300"}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      <div className={`w-12 h-12 rounded-md flex items-center justify-center flex-shrink-0 ${
                        cert.status === "earned" ? "bg-chart-2/10" : cert.status === "in-progress" ? "bg-chart-2/10" : "bg-muted"
                      }`}>
                        <Award className={`w-6 h-6 ${
                          cert.status === "earned" ? "text-chart-2" : cert.status === "in-progress" ? "text-chart-2" : "text-muted-foreground"
                        }`} />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-2">{cert.title}</CardTitle>
                        {cert.status === "earned" && (
                          <Badge className="bg-chart-2 text-white">Earned</Badge>
                        )}
                        {cert.status === "in-progress" && (
                          <Badge variant="secondary">{cert.progress}% Complete</Badge>
                        )}
                        {cert.status === "locked" && (
                          <Badge variant="outline">Locked</Badge>
                        )}
                      </div>
                    </div>
                    {cert.status === "earned" && (
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" data-testid={`button-download-${i}`}>
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="outline" data-testid={`button-share-${i}`}>
                          <Share2 className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                {cert.issuedDate && (
                  <CardContent>
                    <p className="text-sm text-muted-foreground">Issued: {cert.issuedDate}</p>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>

          <Card className="mt-8 bg-chart-2/10">
            <CardContent className="pt-6">
              <div className="text-center">
                <h3 className="text-xl font-bold mb-2">Program Completion Certificate</h3>
                <p className="text-muted-foreground mb-4">
                  Complete all core modules to earn your AFÁRÁ Program Completion Certificate
                </p>
                <div className="w-full bg-muted rounded-full h-3 mb-2">
                  <div className="bg-chart-2 h-3 rounded-full" style={{ width: "67%" }} />
                </div>
                <p className="text-sm text-muted-foreground">8 of 12 modules completed (67%)</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
