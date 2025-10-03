import { LMSSidebar } from "@/components/LMSSidebar";
import { MentorCard } from "@/components/MentorCard";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Clock, CheckCircle } from "lucide-react";

export default function Mentorship() {
  const mentors = [
    {
      name: "Dr. Amara Nwosu",
      expertise: ["Energy Policy", "Regulation", "Compliance"],
      bio: "15+ years advising on energy regulatory frameworks across West Africa.",
      available: true
    },
    {
      name: "Kwame Osei",
      expertise: ["Project Finance", "Capital Markets", "M&A"],
      bio: "Former investment banker with experience in $2B+ infrastructure transactions.",
      available: true
    },
    {
      name: "Zainab Ibrahim",
      expertise: ["Technical Due Diligence", "Engineering", "Solar"],
      bio: "Renewable energy engineer with 50+ solar project implementations.",
      available: false
    }
  ];

  const sessions = [
    { title: "Regulatory Strategy Session", mentor: "Dr. Amara Nwosu", date: "Mar 10, 2025", time: "10:00 AM" },
    { title: "Financial Modeling Review", mentor: "Kwame Osei", date: "Mar 12, 2025", time: "2:00 PM" }
  ];

  return (
    <div className="flex h-screen">
      <LMSSidebar />
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <h1 className="text-3xl font-bold mb-6">Mentorship</h1>

          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <h2 className="text-xl font-bold mb-4">Available Mentors</h2>
              <div className="space-y-4">
                {mentors.map((mentor, i) => (
                  <MentorCard key={i} {...mentor} />
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-xl font-bold mb-4">Upcoming Sessions</h2>
              <div className="space-y-4">
                {sessions.map((session, i) => (
                  <Card key={i} className="hover-elevate transition-all duration-300">
                    <CardContent className="pt-6">
                      <h3 className="font-bold mb-2">{session.title}</h3>
                      <p className="text-sm text-muted-foreground mb-3">{session.mentor}</p>
                      <div className="space-y-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>{session.date}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          <span>{session.time}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                <Card className="bg-muted/50">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-chart-5 flex-shrink-0 mt-0.5" />
                      <div>
                        <h3 className="font-semibold mb-1">Mentorship Hours</h3>
                        <p className="text-2xl font-bold">24 hours</p>
                        <p className="text-xs text-muted-foreground mt-1">Completed this cohort</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
