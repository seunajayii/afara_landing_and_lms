import { LMSSidebar } from "@/components/LMSSidebar";
import { EventCard } from "@/components/EventCard";

export default function Events() {
  const events = [
    {
      title: "Live Q&A: Funding Strategy",
      date: "Today",
      time: "3:00 PM WAT",
      type: "live" as const,
      location: "Zoom"
    },
    {
      title: "Funding Strategy Masterclass",
      date: "March 15, 2025",
      time: "2:00 PM WAT",
      type: "upcoming" as const,
      location: "Virtual (Zoom)"
    },
    {
      title: "Peer Networking Session",
      date: "March 18, 2025",
      time: "4:00 PM WAT",
      type: "upcoming" as const,
      location: "Virtual"
    },
    {
      title: "Introduction to Project Finance",
      date: "Recorded",
      time: "45 minutes",
      type: "recorded" as const
    },
    {
      title: "Regulatory Frameworks Workshop",
      date: "March 22, 2025",
      time: "10:00 AM WAT",
      type: "upcoming" as const,
      location: "Virtual (Zoom)"
    },
    {
      title: "Technical Due Diligence Basics",
      date: "Recorded",
      time: "1 hour",
      type: "recorded" as const
    }
  ];

  return (
    <div className="flex h-screen">
      <LMSSidebar />
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <h1 className="text-3xl font-bold mb-6">Events & Sessions</h1>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event, i) => (
              <EventCard key={i} {...event} />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
