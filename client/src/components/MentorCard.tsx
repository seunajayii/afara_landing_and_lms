import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface MentorCardProps {
  name: string;
  expertise: string[];
  bio: string;
  available?: boolean;
  image?: string;
}

export function MentorCard({ name, expertise, bio, available = false, image }: MentorCardProps) {
  const initials = name.split(' ').map(n => n[0]).join('');

  return (
    <Card className="hover-elevate transition-all duration-300" data-testid={`card-mentor-${name.toLowerCase().replace(/\s+/g, "-")}`}>
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          <div className="relative">
            <Avatar className="w-16 h-16 border-2 border-chart-2">
              <AvatarImage src={image} alt={name} />
              <AvatarFallback className="font-semibold">{initials}</AvatarFallback>
            </Avatar>
            {available && (
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-status-online rounded-full border-2 border-card" />
            )}
          </div>
          <div className="flex-1">
            <h3 className="font-bold mb-1">{name}</h3>
            <div className="flex flex-wrap gap-1 mb-3">
              {expertise.map((skill, i) => (
                <Badge key={i} variant="outline" className="text-xs bg-chart-3/10">
                  {skill}
                </Badge>
              ))}
            </div>
            <p className="text-sm text-muted-foreground mb-3">{bio}</p>
            <Button size="sm" variant="outline" data-testid={`button-connect-${name.toLowerCase().replace(/\s+/g, "-")}`}>
              Connect
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
