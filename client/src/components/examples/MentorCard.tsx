import { MentorCard } from "../MentorCard";

export default function MentorCardExample() {
  return (
    <MentorCard
      name="Dr. Amara Nwosu"
      expertise={["Energy Policy", "Regulation", "Compliance"]}
      bio="15+ years advising on energy regulatory frameworks across West Africa."
      available={true}
    />
  );
}
