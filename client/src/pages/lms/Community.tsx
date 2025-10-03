import { LMSSidebar } from "@/components/LMSSidebar";
import { DiscussionPost } from "@/components/DiscussionPost";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquarePlus } from "lucide-react";
import { useState } from "react";

export default function Community() {
  const [newPost, setNewPost] = useState("");

  const discussions = [
    {
      author: "Fatima Adeyemi",
      topic: "Navigating early-stage regulatory compliance",
      content: "I'm working on a mini-grid project in rural areas. What are the key regulatory considerations I should address first?",
      category: "Regulation",
      replies: 12,
      likes: 24,
      timeAgo: "2 hours ago"
    },
    {
      author: "Grace Mensah",
      topic: "Best practices for financial modeling",
      content: "Looking for recommendations on financial modeling tools specifically for infrastructure projects. What does everyone use?",
      category: "Finance",
      replies: 8,
      likes: 15,
      timeAgo: "5 hours ago"
    },
    {
      author: "Aisha Mwangi",
      topic: "Mentorship experience sharing",
      content: "Just had an amazing session with my mentor on capital raising strategy. Happy to share key takeaways!",
      category: "Mentorship",
      replies: 6,
      likes: 32,
      timeAgo: "1 day ago"
    },
    {
      author: "Chioma Okafor",
      topic: "Technical due diligence checklist",
      content: "Created a comprehensive checklist for solar project due diligence. Would love feedback from the community.",
      category: "Technical",
      replies: 18,
      likes: 41,
      timeAgo: "2 days ago"
    }
  ];

  const handlePost = () => {
    console.log("New post:", newPost);
    setNewPost("");
  };

  return (
    <div className="flex h-screen">
      <LMSSidebar />
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <h1 className="text-3xl font-bold mb-6">Community Board</h1>

          <Card className="mb-8">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <MessageSquarePlus className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <Textarea
                    placeholder="Start a discussion..."
                    value={newPost}
                    onChange={(e) => setNewPost(e.target.value)}
                    rows={3}
                    data-testid="input-new-post"
                  />
                  <div className="flex justify-end mt-3">
                    <Button onClick={handlePost} disabled={!newPost.trim()} data-testid="button-post">
                      Post
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            {discussions.map((discussion, i) => (
              <DiscussionPost key={i} {...discussion} />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
