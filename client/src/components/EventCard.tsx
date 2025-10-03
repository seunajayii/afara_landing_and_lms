import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, MapPin } from "lucide-react";

interface EventCardProps {
  title: string;
  date: string;
  time: string;
  type: "live" | "recorded" | "upcoming";
  location?: string;
}

export function EventCard({ title, date, time, type, location }: EventCardProps) {
  const typeColors = {
    live: "bg-status-online text-white",
    recorded: "bg-muted text-muted-foreground",
    upcoming: "bg-chart-3 text-white"
  };

  return (
    <Card className="hover-elevate transition-all duration-300" data-testid={`card-event-${title.toLowerCase().replace(/\s+/g, "-")}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between mb-2">
          <Badge className={typeColors[type]}>{type === "live" ? "Live Now" : type === "upcoming" ? "Upcoming" : "Recorded"}</Badge>
        </div>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm text-muted-foreground mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <span>{date}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span>{time}</span>
          </div>
          {location && (
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              <span>{location}</span>
            </div>
          )}
        </div>
        <Button size="sm" className="w-full" data-testid={`button-join-${title.toLowerCase().replace(/\s+/g, "-")}`}>
          {type === "live" ? "Join Now" : type === "upcoming" ? "Set Reminder" : "Watch Recording"}
        </Button>
      </CardContent>
    </Card>
  );
}
