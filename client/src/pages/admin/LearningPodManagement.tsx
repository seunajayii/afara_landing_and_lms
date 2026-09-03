import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { AdminSidebar } from "@/components/AdminSidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { getAdminCohortId } from "@/lib/adminCohortContext";
import { ArrowRight, Loader2, Plus, Save, Shuffle, Users, X } from "lucide-react";
import type { Cohort, User } from "@shared/schema";

type EligibleParticipant = Pick<User, "id" | "email" | "firstName" | "lastName"> & { applicationId: string };
type PodAssignment = {
  id: string;
  title: string;
  workType: "individual" | "group";
  status: "draft" | "published";
  dueAt?: string | null;
  maxScore: number;
};
type Pod = {
  id: string;
  cohortId: string;
  name: string;
  description?: string | null;
  mentorId: string;
  mentor?: User | null;
  members: User[];
  assignments: PodAssignment[];
};

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export default function LearningPodManagement() {
  const { toast } = useToast();
  const selectedCohortId = getAdminCohortId();
  const [createCohortId, setCreateCohortId] = useState(() => selectedCohortId ?? "");
  const [createName, setCreateName] = useState("");
  const [createDescription, setCreateDescription] = useState("");
  const [createMentorId, setCreateMentorId] = useState("");
  const [createMemberIds, setCreateMemberIds] = useState<string[]>([]);
  const [autoCohortId, setAutoCohortId] = useState(() => selectedCohortId ?? "");
  const [autoPodSize, setAutoPodSize] = useState("4");
  const [autoMentorIds, setAutoMentorIds] = useState<string[]>([]);
  const [activePodId, setActivePodId] = useState<string | null>(null);
  const [memberIds, setMemberIds] = useState<string[]>([]);
  const [assignmentTitle, setAssignmentTitle] = useState("");
  const [assignmentInstructions, setAssignmentInstructions] = useState("");
  const [assignmentType, setAssignmentType] = useState<"individual" | "group">("individual");
  const [assignmentDueAt, setAssignmentDueAt] = useState("");
  const [assignmentMaxScore, setAssignmentMaxScore] = useState("100");

  const { data: cohorts = [], isLoading: cohortsLoading } = useQuery<Cohort[]>({
    queryKey: ["/api/admin/cohorts"],
  });
  const { data: mentors = [], isLoading: mentorsLoading } = useQuery<User[]>({
    queryKey: ["/api/users/role/mentor"],
  });
  const { data: pods = [], isLoading: podsLoading } = useQuery<Pod[]>({
    queryKey: ["/api/admin/learning-pods", selectedCohortId],
    queryFn: async () => (await apiRequest("GET", selectedCohortId ? `/api/admin/learning-pods?cohortId=${encodeURIComponent(selectedCohortId)}` : "/api/admin/learning-pods")).json(),
  });
  const { data: eligible = [], isLoading: eligibleLoading } = useQuery<EligibleParticipant[]>({
    queryKey: ["/api/admin/learning-pods/eligible", createCohortId],
    queryFn: async () => {
      const response = await fetch(`/api/admin/learning-pods/eligible?cohortId=${encodeURIComponent(createCohortId)}`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Unable to load accepted participants.");
      return response.json();
    },
    enabled: Boolean(createCohortId),
  });
  const autoEligibleCount = useQuery<EligibleParticipant[]>({
    queryKey: ["/api/admin/learning-pods/eligible", autoCohortId],
    queryFn: async () => {
      const response = await fetch(`/api/admin/learning-pods/eligible?cohortId=${encodeURIComponent(autoCohortId)}`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Unable to load accepted participants.");
      return response.json();
    },
    enabled: Boolean(autoCohortId),
  });

  useEffect(() => {
    if (!createCohortId && cohorts[0]) setCreateCohortId(cohorts[0].id);
    if (!autoCohortId && cohorts[0]) setAutoCohortId(cohorts[0].id);
  }, [cohorts, createCohortId, autoCohortId]);
  useEffect(() => {
    if (!createMentorId && mentors[0]) setCreateMentorId(mentors[0].id);
    if (autoMentorIds.length === 0 && mentors[0]) setAutoMentorIds([mentors[0].id]);
  }, [mentors, createMentorId, autoMentorIds.length]);
  useEffect(() => {
    const pod = pods.find((item) => item.id === activePodId);
    setMemberIds(pod?.members.map((member) => member.id) || []);
  }, [activePodId, pods]);

  const activePod = useMemo(() => pods.find((pod) => pod.id === activePodId), [activePodId, pods]);
  const { data: activeEligible = [] } = useQuery<EligibleParticipant[]>({
    queryKey: ["/api/admin/learning-pods/eligible", activePod?.cohortId],
    queryFn: async () => {
      const response = await fetch(`/api/admin/learning-pods/eligible?cohortId=${encodeURIComponent(activePod!.cohortId)}`, { credentials: "include" });
      if (!response.ok) throw new Error("Unable to load accepted participants.");
      return response.json();
    },
    enabled: Boolean(activePod?.cohortId),
  });

  const invalidatePods = () => queryClient.invalidateQueries({ queryKey: ["/api/admin/learning-pods"] });
  const createMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/admin/learning-pods", {
        cohortId: createCohortId,
        name: createName,
        description: createDescription || null,
        mentorId: createMentorId,
        userIds: createMemberIds,
      });
      return response.json();
    },
    onSuccess: () => {
      invalidatePods();
      setCreateName("");
      setCreateDescription("");
      setCreateMemberIds([]);
      toast({ title: "Learning pod created" });
    },
    onError: (error) => toast({ title: "Could not create pod", description: getErrorMessage(error, "Try again."), variant: "destructive" }),
  });
  const autoMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/admin/learning-pods/auto-distribute", {
        cohortId: autoCohortId,
        podSize: Number(autoPodSize),
        mentorIds: autoMentorIds,
        namePrefix: "Learning Pod",
      });
      return response.json();
    },
    onSuccess: (result) => {
      invalidatePods();
      toast({ title: `${result.pods?.length || 0} pods distributed` });
    },
    onError: (error) => toast({ title: "Could not distribute pods", description: getErrorMessage(error, "Try again."), variant: "destructive" }),
  });
  const membersMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("PUT", `/api/admin/learning-pods/${activePodId}/members`, { userIds: memberIds });
      return response.json();
    },
    onSuccess: () => {
      invalidatePods();
      toast({ title: "Pod members updated" });
    },
    onError: (error) => toast({ title: "Could not update members", description: getErrorMessage(error, "Try again."), variant: "destructive" }),
  });
  const assignmentMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/admin/learning-pods/${activePodId}/assignments`, {
        title: assignmentTitle,
        instructions: assignmentInstructions || null,
        workType: assignmentType,
        dueAt: assignmentDueAt ? new Date(assignmentDueAt).toISOString() : null,
        maxScore: Number(assignmentMaxScore),
      });
      return response.json();
    },
    onSuccess: () => {
      invalidatePods();
      setAssignmentTitle("");
      setAssignmentInstructions("");
      setAssignmentDueAt("");
      toast({ title: "Assignment added" });
    },
    onError: (error) => toast({ title: "Could not add assignment", description: getErrorMessage(error, "Try again."), variant: "destructive" }),
  });

  const toggleAutoMentor = (mentorId: string) => {
    setAutoMentorIds((current) => current.includes(mentorId)
      ? current.filter((id) => id !== mentorId)
      : [...current, mentorId]);
  };

  return (
    <div className="flex flex-col md:flex-row h-screen">
      <AdminSidebar />
      <main className="flex-1 overflow-auto">
        <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
          <div>
            <p className="text-sm font-medium text-primary mb-2">Cohort operations</p>
            <h1 className="text-3xl font-bold tracking-tight">Learning Pods</h1>
            <p className="text-muted-foreground mt-2 max-w-2xl">
              Create focused peer groups for accepted participants, assign exactly one mentor, and manage the work they complete together.
            </p>
          </div>

          <div className="grid xl:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Plus className="h-5 w-5" /> Create a pod</CardTitle>
                <CardDescription>Choose a cohort, one mentor, and optionally add members now.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="pod-cohort">Cohort</Label>
                    <select id="pod-cohort" className="w-full h-10 rounded-md border bg-background px-3 text-sm" value={createCohortId} onChange={(event) => { setCreateCohortId(event.target.value); setCreateMemberIds([]); }}>
                      {cohorts.map((cohort) => <option key={cohort.id} value={cohort.id}>{cohort.displayName || cohort.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pod-mentor">Mentor</Label>
                    <select id="pod-mentor" className="w-full h-10 rounded-md border bg-background px-3 text-sm" value={createMentorId} onChange={(event) => setCreateMentorId(event.target.value)}>
                      {mentors.map((mentor) => <option key={mentor.id} value={mentor.id}>{mentor.firstName} {mentor.lastName}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="pod-name">Pod name</Label>
                    <Input id="pod-name" value={createName} onChange={(event) => setCreateName(event.target.value)} placeholder="Solar Builders" />
                  </div>
                  <div className="space-y-2">
                    <Label>Accepted participants</Label>
                    <select multiple size={4} className="w-full rounded-md border bg-background p-2 text-sm" value={createMemberIds} onChange={(event) => setCreateMemberIds(Array.from(event.currentTarget.selectedOptions, (option) => option.value))}>
                      {eligible.map((participant) => <option key={participant.id} value={participant.id}>{participant.firstName} {participant.lastName} — {participant.email}</option>)}
                    </select>
                    <p className="text-xs text-muted-foreground">{eligibleLoading ? "Loading accepted participants…" : `${eligible.length} eligible participant${eligible.length === 1 ? "" : "s"}`}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pod-description">Description</Label>
                  <Textarea id="pod-description" value={createDescription} onChange={(event) => setCreateDescription(event.target.value)} placeholder="What this pod will focus on…" />
                </div>
                <Button className="w-full sm:w-auto" disabled={!createName.trim() || !createCohortId || !createMentorId || createMutation.isPending} onClick={() => createMutation.mutate()}>
                  {createMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                  Create pod
                </Button>
              </CardContent>
            </Card>

            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Shuffle className="h-5 w-5" /> Auto-distribute participants</CardTitle>
                <CardDescription>Split every accepted participant into pods of a target size. Selected mentors rotate one per pod.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="auto-cohort">Cohort</Label>
                    <select id="auto-cohort" className="w-full h-10 rounded-md border bg-background px-3 text-sm" value={autoCohortId} onChange={(event) => setAutoCohortId(event.target.value)}>
                      {cohorts.map((cohort) => <option key={cohort.id} value={cohort.id}>{cohort.displayName || cohort.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="auto-size">Target pod size</Label>
                    <select id="auto-size" className="w-full h-10 rounded-md border bg-background px-3 text-sm" value={autoPodSize} onChange={(event) => setAutoPodSize(event.target.value)}>
                      {[3, 4, 5].map((size) => <option key={size} value={size}>{size} participants</option>)}
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Mentor pool</Label>
                  <div className="grid sm:grid-cols-2 gap-2 rounded-md border p-3">
                    {mentors.map((mentor) => (
                      <label key={mentor.id} className="flex items-center gap-2 text-sm cursor-pointer">
                        <input type="checkbox" checked={autoMentorIds.includes(mentor.id)} onChange={() => toggleAutoMentor(mentor.id)} />
                        {mentor.firstName} {mentor.lastName}
                      </label>
                    ))}
                    {mentors.length === 0 && <p className="text-sm text-muted-foreground">No mentors available.</p>}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  {autoEligibleCount.isLoading ? "Checking accepted participants…" : `${autoEligibleCount.data?.length || 0} accepted participant${autoEligibleCount.data?.length === 1 ? "" : "s"} will be distributed.`}
                </p>
                <Button variant="secondary" disabled={!autoCohortId || autoMentorIds.length === 0 || !autoEligibleCount.data?.length || autoMutation.isPending} onClick={() => autoMutation.mutate()}>
                  {autoMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Shuffle className="h-4 w-4 mr-2" />}
                  Distribute into pods
                </Button>
              </CardContent>
            </Card>
          </div>

          <section className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold">Existing pods</h2>
                <p className="text-sm text-muted-foreground">{pods.length} pod{pods.length === 1 ? "" : "s"} in the current cohort workspace</p>
              </div>
              <Link href="/admin/cohorts"><Button variant="outline" size="sm">Manage cohorts <ArrowRight className="h-4 w-4 ml-2" /></Button></Link>
            </div>
            {podsLoading || cohortsLoading || mentorsLoading ? (
              <Card><CardContent className="py-12 text-center text-muted-foreground"><Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />Loading pods…</CardContent></Card>
            ) : pods.length === 0 ? (
              <Card><CardContent className="py-12 text-center text-muted-foreground">No pods yet. Create one above or auto-distribute a cohort.</CardContent></Card>
            ) : (
              <div className="grid lg:grid-cols-2 gap-4">
                {pods.map((pod) => {
                  const cohort = cohorts.find((item) => item.id === pod.cohortId);
                  return (
                    <Card key={pod.id} className={activePodId === pod.id ? "ring-2 ring-primary" : ""}>
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <CardTitle>{pod.name}</CardTitle>
                            <CardDescription>{cohort?.displayName || cohort?.name || "Unknown cohort"}</CardDescription>
                          </div>
                          <Badge variant="outline">{pod.members.length} members</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <p className="text-sm text-muted-foreground">{pod.description || "No description yet."}</p>
                        <div className="text-sm"><span className="font-medium">Mentor:</span> {pod.mentor ? `${pod.mentor.firstName} ${pod.mentor.lastName}` : "Not found"}</div>
                        <div className="flex flex-wrap gap-2">
                          {pod.members.map((member) => <Badge key={member.id} variant="secondary">{member.firstName} {member.lastName}</Badge>)}
                          {pod.members.length === 0 && <span className="text-sm text-muted-foreground">No members assigned.</span>}
                        </div>
                        <div className="flex items-center justify-between gap-3 pt-2 border-t">
                          <span className="text-sm text-muted-foreground">{pod.assignments.length} assignment{pod.assignments.length === 1 ? "" : "s"}</span>
                          <Button size="sm" variant={activePodId === pod.id ? "default" : "outline"} onClick={() => setActivePodId(activePodId === pod.id ? null : pod.id)}>
                            {activePodId === pod.id ? <X className="h-4 w-4 mr-2" /> : <Users className="h-4 w-4 mr-2" />}
                            {activePodId === pod.id ? "Close editor" : "Manage pod"}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </section>

          {activePod && (
            <Card>
              <CardHeader>
                <CardTitle>Manage {activePod.name}</CardTitle>
                <CardDescription>Adjust membership and add individual assignments or group projects.</CardDescription>
              </CardHeader>
              <CardContent className="grid xl:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="edit-members">Pod members</Label>
                    <select id="edit-members" multiple size={8} className="w-full mt-2 rounded-md border bg-background p-2 text-sm" value={memberIds} onChange={(event) => setMemberIds(Array.from(event.currentTarget.selectedOptions, (option) => option.value))}>
                      {activeEligible.map((participant) => <option key={participant.id} value={participant.id}>{participant.firstName} {participant.lastName} — {participant.email}</option>)}
                    </select>
                    <p className="text-xs text-muted-foreground mt-2">Only accepted participants from this pod&apos;s cohort can be added.</p>
                  </div>
                  <Button disabled={membersMutation.isPending} onClick={() => membersMutation.mutate()}>
                    {membersMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                    Save membership
                  </Button>
                </div>
                <div className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2 sm:col-span-2"><Label htmlFor="assignment-title">Assignment title</Label><Input id="assignment-title" value={assignmentTitle} onChange={(event) => setAssignmentTitle(event.target.value)} placeholder="Customer discovery interview" /></div>
                    <div className="space-y-2"><Label htmlFor="assignment-type">Work type</Label><select id="assignment-type" className="w-full h-10 rounded-md border bg-background px-3 text-sm" value={assignmentType} onChange={(event) => setAssignmentType(event.target.value as "individual" | "group")}><option value="individual">Individual assignment</option><option value="group">Group project</option></select></div>
                    <div className="space-y-2"><Label htmlFor="assignment-score">Maximum score</Label><Input id="assignment-score" type="number" min="1" value={assignmentMaxScore} onChange={(event) => setAssignmentMaxScore(event.target.value)} /></div>
                    <div className="space-y-2"><Label htmlFor="assignment-due">Due date</Label><Input id="assignment-due" type="datetime-local" value={assignmentDueAt} onChange={(event) => setAssignmentDueAt(event.target.value)} /></div>
                  </div>
                  <div className="space-y-2"><Label htmlFor="assignment-instructions">Instructions</Label><Textarea id="assignment-instructions" value={assignmentInstructions} onChange={(event) => setAssignmentInstructions(event.target.value)} placeholder="Brief the pod on the expected output…" /></div>
                  <Button disabled={!assignmentTitle.trim() || assignmentMutation.isPending} onClick={() => assignmentMutation.mutate()}>
                    {assignmentMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                    Add assignment
                  </Button>
                  <div className="rounded-md border divide-y">
                    {activePod.assignments.map((assignment) => <div key={assignment.id} className="p-3 flex items-center justify-between gap-3 text-sm"><span>{assignment.title}</span><Badge variant="outline">{assignment.workType === "group" ? "Group" : "Individual"} · {assignment.maxScore} pts</Badge></div>)}
                    {activePod.assignments.length === 0 && <p className="p-4 text-sm text-muted-foreground">No assignments yet.</p>}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}