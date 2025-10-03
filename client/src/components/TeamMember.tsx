import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface TeamMemberProps {
  name: string;
  role: string;
  bio: string;
  image?: string;
}

export function TeamMember({ name, role, bio, image }: TeamMemberProps) {
  const initials = name.split(' ').map(n => n[0]).join('');

  return (
    <Card className="hover-elevate transition-all duration-300" data-testid={`card-team-${name.toLowerCase().replace(/\s+/g, "-")}`}>
      <CardContent className="pt-6">
        <div className="flex flex-col items-center text-center">
          <Avatar className="w-24 h-24 mb-4 border-2 border-primary/20">
            <AvatarImage src={image} alt={name} />
            <AvatarFallback className="text-xl font-semibold">{initials}</AvatarFallback>
          </Avatar>
          <h3 className="font-bold text-lg mb-1">{name}</h3>
          <p className="text-sm text-primary font-medium mb-3">{role}</p>
          <p className="text-sm text-muted-foreground">{bio}</p>
        </div>
      </CardContent>
    </Card>
  );
}
