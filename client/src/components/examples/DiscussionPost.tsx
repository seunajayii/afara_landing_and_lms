import { DiscussionPost } from "../DiscussionPost";

export default function DiscussionPostExample() {
  return (
    <DiscussionPost
      author="Fatima Adeyemi"
      topic="Navigating early-stage regulatory compliance"
      content="I'm working on a mini-grid project in rural areas. What are the key regulatory considerations I should address first?"
      category="Regulation"
      replies={12}
      likes={24}
      timeAgo="2 hours ago"
    />
  );
}
