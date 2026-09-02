import { LMSSidebar } from "@/components/LMSSidebar";
import { MentorCard } from "@/components/MentorCard";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Clock, CheckCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import type { User, Profile, MentorProfile } from "@shared/schema";
import LearningPods from "./LearningPods";

interface MentorWithProfile extends User {
  profile?: Profile;
  mentorProfile?: MentorProfile;
}

function MentorCardSkeleton() {
  return (
    <div className="border rounded-lg p-6 space-y-4">
      <div className="flex items-start gap-4">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-6 w-20" />
        <Skeleton className="h-6 w-24" />
      </div>
      <Skeleton className="h-9 w-full" />
    </div>
  );
}

export default function Mentorship() {
  const { data: mentorUsers, isLoading } = useQuery<User[]>({
    queryKey: ["/api/users/role/mentor"],
  });

  const mentorIds = mentorUsers?.map(u => u.id) || [];
  
  const { data: mentorDetails } = useQuery<MentorWithProfile[]>({
    queryKey: ["/api/mentors", "details"],
    queryFn: async () => {
      if (mentorIds.length === 0) return [];
      const results = await Promise.all(
        mentorIds.map(id => 
          fetch(`/api/mentors/${id}`, { credentials: "include" }).then(r => r.json())
        )
      );
      return results;
    },
    enabled: mentorIds.length > 0,
  });

  const mentors = mentorDetails?.map(mentor => ({
    name: `${mentor.firstName} ${mentor.lastName}`,
    expertise: mentor.mentorProfile?.specializations || mentor.profile?.expertiseAreas || [],
    bio: mentor.profile?.bio || "",
    available: mentor.mentorProfile?.isAcceptingMentees ?? true,
  })) || [];

  return (
    <div className="flex flex-col md:flex-row h-screen">
      <LMSSidebar />
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <LearningPods />

          <div className="border-t my-10 pt-10">
            <h2 className="text-2xl font-bold mb-2">One-to-one mentorship</h2>
            <p className="text-muted-foreground mb-6">Learning Pods are the primary experience. Use the directory below when you need additional individual support.</p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <h2 className="text-xl font-bold mb-4">Available Mentors</h2>
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <MentorCardSkeleton key={i} />
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {mentors.map((mentor, i) => (
                    <MentorCard key={i} {...mentor} />
                  ))}
                </div>
              )}

              {!isLoading && mentors.length === 0 && (
                <div className="text-center py-12 border rounded-lg">
                  <p className="text-muted-foreground">No mentors available at the moment.</p>
                </div>
              )}
            </div>

            <div>
              <h2 className="text-xl font-bold mb-4">Upcoming Sessions</h2>
              <div className="space-y-4">
                <Card className="text-center py-8 text-muted-foreground">
                  <CardContent>
                    <p>No upcoming sessions scheduled.</p>
                    <p className="text-sm mt-2">Request a session with a mentor to get started.</p>
                  </CardContent>
                </Card>

                <Card className="bg-muted/50">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-chart-5 flex-shrink-0 mt-0.5" />
                      <div>
                        <h3 className="font-semibold mb-1">Mentorship Hours</h3>
                        <p className="text-2xl font-bold">0 hours</p>
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
