import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, ThumbsUp } from "lucide-react";

interface DiscussionPostProps {
  author: string;
  authorImage?: string;
  topic: string;
  content: string;
  category: string;
  replies: number;
  likes: number;
  timeAgo: string;
}

export function DiscussionPost({ author, authorImage, topic, content, category, replies, likes, timeAgo }: DiscussionPostProps) {
  const initials = author.split(' ').map(n => n[0]).join('');

  return (
    <Card className="hover-elevate transition-all duration-300" data-testid={`post-${topic.toLowerCase().replace(/\s+/g, "-")}`}>
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          <Avatar className="w-10 h-10">
            <AvatarImage src={authorImage} alt={author} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold">{author}</span>
              <span className="text-xs text-muted-foreground">• {timeAgo}</span>
            </div>
            <Badge variant="outline" className="mb-2 text-xs">{category}</Badge>
            <h3 className="font-bold mb-2">{topic}</h3>
            <p className="text-sm text-muted-foreground mb-4">{content}</p>
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" className="gap-1">
                <ThumbsUp className="w-4 h-4" />
                <span className="text-xs">{likes}</span>
              </Button>
              <Button variant="ghost" size="sm" className="gap-1">
                <MessageCircle className="w-4 h-4" />
                <span className="text-xs">{replies} replies</span>
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
