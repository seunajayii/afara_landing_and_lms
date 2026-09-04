import { useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { AdminSidebar } from "@/components/AdminSidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { getAdminCohortId } from "@/lib/adminCohortContext";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import {
  ArrowDown, ArrowLeft, ArrowUp, BookOpen, Clock, FileText, GripVertical,
  Loader2, Pencil, Plus, Search, Settings2, Trash2, UploadCloud, Video, X,
} from "lucide-react";
import type { Cohort, Course, Lesson, Module, Resource } from "@shared/schema";

type LessonWithResource = Lesson & { resource?: Resource | null };
type ModuleWithLessons = Module & { lessons: LessonWithResource[] };
type CourseWithCurriculum = Course & {
  modules: ModuleWithLessons[];
  calculatedDurationMinutes: number;
  moduleCount: number;
  lessonCount: number;
  cohortIds?: string[];
};

const categories = ["Business Foundations", "Financial Management", "Leadership", "Marketing & Sales", "Operations", "Legal & Compliance", "Technology & Innovation"];
const initialCourse = {
  title: "", shortDescription: "", description: "", category: "Business Foundations", level: "beginner",
  status: "draft", durationOverrideMinutes: null as number | null, audience: "all" as "all" | "selected", cohortIds: [] as string[],
};

function formatDuration(minutes: number | null | undefined) {
  if (!minutes) return "Self-paced";
  if (minutes < 60) return `${minutes} min`;
  return `${Math.floor(minutes / 60)}h${minutes % 60 ? ` ${minutes % 60}m` : ""}`;
}

function statusBadge(status: string | null) {
  const styles: Record<string, string> = {
    published: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    draft: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
    pending_review: "bg-blue-500/10 text-blue-700 dark:text-blue-300",
    archived: "bg-muted text-muted-foreground",
  };
  return <Badge className={styles[status || "draft"]}>{status || "draft"}</Badge>;
}

function CourseFields({ value, onChange, showStatus = true }: { value: typeof initialCourse; onChange: (value: typeof initialCourse) => void; showStatus?: boolean }) {
  const { data: cohorts, isLoading: cohortsLoading } = useQuery<Cohort[]>({ queryKey: ["/api/admin/cohorts"] });
  const availableCohorts = cohorts || [];

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="course-title">Course title</Label>
        <Input id="course-title" value={value.title} onChange={(e) => onChange({ ...value, title: e.target.value })} placeholder="e.g. Financial Foundations" data-testid="input-course-title" />
      </div>
      <div>
        <Label htmlFor="course-summary">Short description</Label>
        <Input id="course-summary" value={value.shortDescription} onChange={(e) => onChange({ ...value, shortDescription: e.target.value })} placeholder="Shown on the course card" />
      </div>
      <div>
        <Label htmlFor="course-description">Description</Label>
        <Textarea id="course-description" value={value.description} onChange={(e) => onChange({ ...value, description: e.target.value })} placeholder="What learners will gain from this course" rows={3} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label>Category</Label>
          <Select value={value.category} onValueChange={(category) => onChange({ ...value, category })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{categories.map((category) => <SelectItem key={category} value={category}>{category}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div>
          <Label>Level</Label>
          <Select value={value.level} onValueChange={(level) => onChange({ ...value, level })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="beginner">Beginner</SelectItem>
              <SelectItem value="intermediate">Intermediate</SelectItem>
              <SelectItem value="advanced">Advanced</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="course-duration">Duration override (minutes)</Label>
          <Input id="course-duration" type="number" min="0" value={value.durationOverrideMinutes ?? ""} onChange={(e) => onChange({ ...value, durationOverrideMinutes: e.target.value === "" ? null : Math.max(0, Number(e.target.value)) })} placeholder="Calculated from lessons" />
          <p className="mt-1 text-xs text-muted-foreground">Leave empty to calculate it from lesson durations.</p>
        </div>
        {showStatus ? <div>
            <Label>Status</Label>
            <Select value={value.status} onValueChange={(status) => onChange({ ...value, status })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="pending_review">Pending review</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div> : <div className="rounded-md border bg-muted/40 p-3 text-sm text-muted-foreground">New courses are created as drafts. You can publish after adding complete modules and lessons.</div>}
      </div>
      <div className="rounded-md border p-4">
        <Label>Course availability</Label>
        <p className="mt-1 text-xs text-muted-foreground">Choose which participant cohorts can see this course. Existing courses remain available to everyone by default.</p>
        <Select
          value={value.audience}
          onValueChange={(audience: "all" | "selected") => onChange({
            ...value,
            audience,
            cohortIds: audience === "all" ? [] : value.cohortIds,
          })}
        >
          <SelectTrigger className="mt-3"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All participants</SelectItem>
            <SelectItem value="selected">Selected cohorts only</SelectItem>
          </SelectContent>
        </Select>
        {value.audience === "selected" && (
          <div className="mt-4 space-y-3">
            <p className="text-sm font-medium">Assign to cohorts</p>
            {cohortsLoading ? <p className="text-sm text-muted-foreground">Loading cohorts…</p> :
              availableCohorts.length === 0 ? <p className="text-sm text-muted-foreground">Create a cohort before restricting this course.</p> :
              <div className="grid gap-2 sm:grid-cols-2">
                {availableCohorts.map((cohort) => (
                  <label key={cohort.id} className="flex cursor-pointer items-center gap-2 rounded-md border p-3 text-sm">
                    <Checkbox
                      checked={value.cohortIds.includes(cohort.id)}
                      onCheckedChange={(checked) => onChange({
                        ...value,
                        cohortIds: checked
                          ? [...value.cohortIds, cohort.id]
                          : value.cohortIds.filter((id) => id !== cohort.id),
                      })}
                    />
                    <span>{cohort.displayName || cohort.name}</span>
                  </label>
                ))}
              </div>}
            {value.cohortIds.length === 0 && <p className="text-xs text-destructive">Select at least one cohort.</p>}
          </div>
        )}
      </div>
    </div>
  );
}

type QuickResourceDraft = {
  title: string;
  description: string;
  resourceType: "document" | "template" | "toolkit" | "guide" | "resource_partner";
  category: string;
  fileUrl: string;
  partnerName: string;
  partnerLinkType: "external" | "lms";
  partnerResourceUrl: string;
  partnerLoginUrl: string;
  partnerLoginUsername: string;
  partnerLoginPassword: string;
};

const emptyQuickResource: QuickResourceDraft = {
  title: "",
  description: "",
  resourceType: "document",
  category: "Business Strategy",
  fileUrl: "",
  partnerName: "",
  partnerLinkType: "external",
  partnerResourceUrl: "",
  partnerLoginUrl: "",
  partnerLoginUsername: "",
  partnerLoginPassword: "",
};

function QuickResourceDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (resource: Resource) => void;
}) {
  const { toast } = useToast();
  const fileInput = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState<QuickResourceDraft>(emptyQuickResource);
  const [file, setFile] = useState<File | null>(null);

  const createResource = useMutation({
    mutationFn: async () => {
      let uploaded: { fileUrl: string; fileName: string; fileSize: number } | null = null;
      if (file) {
        const body = new FormData();
        body.append("file", file);
        const uploadResponse = await fetch("/api/resources/upload", {
          method: "POST",
          body,
          credentials: "include",
        });
        if (!uploadResponse.ok) {
          const result = await uploadResponse.json().catch(() => ({})) as { error?: string };
          throw new Error(result.error || "The file could not be uploaded.");
        }
        uploaded = await uploadResponse.json();
      }

      const isPartner = draft.resourceType === "resource_partner";
      const response = await apiRequest("POST", "/api/resources", {
        title: draft.title.trim(),
        description: draft.description.trim() || null,
        resourceType: draft.resourceType,
        category: draft.category,
        fileUrl: isPartner ? null : uploaded?.fileUrl || draft.fileUrl.trim() || null,
        fileName: isPartner ? null : uploaded?.fileName || null,
        fileSize: isPartner ? null : uploaded?.fileSize || null,
        visibility: "community",
        status: "published",
        partnerName: isPartner ? draft.partnerName.trim() : null,
        partnerLinkType: isPartner ? draft.partnerLinkType : "lms",
        partnerResourceUrl: isPartner && draft.partnerLinkType === "external" ? draft.partnerResourceUrl.trim() : null,
        partnerLoginUrl: isPartner && draft.partnerLinkType === "lms" ? draft.partnerLoginUrl.trim() : null,
        partnerLoginUsername: isPartner && draft.partnerLinkType === "lms" ? draft.partnerLoginUsername.trim() || null : null,
        partnerLoginPassword: isPartner && draft.partnerLinkType === "lms" ? draft.partnerLoginPassword || null : null,
      });
      return response.json() as Promise<Resource>;
    },
    onSuccess: (resource) => {
      queryClient.invalidateQueries({ queryKey: ["/api/resources"] });
      onCreated(resource);
      setDraft(emptyQuickResource);
      setFile(null);
      onOpenChange(false);
      toast({ title: "Resource created and attached", description: resource.title });
    },
    onError: (error: Error) => {
      toast({
        title: "Could not create resource",
        description: error.message.replace(/^\d+:\s*/, ""),
        variant: "destructive",
      });
    },
  });

  const isPartner = draft.resourceType === "resource_partner";
  const targetUrl = draft.partnerLinkType === "external" ? draft.partnerResourceUrl : draft.partnerLoginUrl;
  const canCreate = Boolean(
    draft.title.trim()
    && (isPartner
      ? draft.partnerName.trim() && targetUrl.trim()
      : file || draft.fileUrl.trim())
  );

  return (
    <Dialog open={open} onOpenChange={(next) => {
      if (!createResource.isPending) onOpenChange(next);
    }}>
      <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create and attach resource</DialogTitle>
          <DialogDescription>
            Add this material here. It will be attached to the lesson and also remain reusable in other courses.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Resource title</Label>
            <Input value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} placeholder="e.g. Financial planning workbook" data-testid="input-inline-resource-title" />
          </div>
          <div>
            <Label>Description (optional)</Label>
            <Textarea value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} rows={2} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Resource type</Label>
              <Select value={draft.resourceType} onValueChange={(resourceType: QuickResourceDraft["resourceType"]) => {
                setDraft({ ...draft, resourceType, fileUrl: "", partnerResourceUrl: "", partnerLoginUrl: "" });
                setFile(null);
              }}>
                <SelectTrigger data-testid="select-inline-resource-type"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="document">Document</SelectItem>
                  <SelectItem value="template">Template</SelectItem>
                  <SelectItem value="toolkit">Toolkit</SelectItem>
                  <SelectItem value="guide">Guide</SelectItem>
                  <SelectItem value="resource_partner">Partner resource / external link</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Category</Label>
              <Select value={draft.category} onValueChange={(category) => setDraft({ ...draft, category })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["Business Strategy", "Financial Planning", "Marketing", "Operations", "Legal", "HR & Management", "Technology", "Fundraising"].map((category) => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {isPartner ? (
            <div className="space-y-4 rounded-md border p-4">
              <div>
                <Label>Partner name</Label>
                <Input value={draft.partnerName} onChange={(event) => setDraft({ ...draft, partnerName: event.target.value })} placeholder="e.g. Coursera or a resource provider" />
              </div>
              <div>
                <Label>Link type</Label>
                <Select value={draft.partnerLinkType} onValueChange={(partnerLinkType: "external" | "lms") => setDraft({ ...draft, partnerLinkType })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="external">External resource or website</SelectItem>
                    <SelectItem value="lms">Partner LMS with login access</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {draft.partnerLinkType === "external" ? (
                <div>
                  <Label>External resource URL</Label>
                  <Input type="url" value={draft.partnerResourceUrl} onChange={(event) => setDraft({ ...draft, partnerResourceUrl: event.target.value })} placeholder="https://partner.example.com/resource" />
                </div>
              ) : (
                <>
                  <div>
                    <Label>Partner LMS URL</Label>
                    <Input type="url" value={draft.partnerLoginUrl} onChange={(event) => setDraft({ ...draft, partnerLoginUrl: event.target.value })} placeholder="https://partner.example.com/login" />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div><Label>Username / email</Label><Input value={draft.partnerLoginUsername} onChange={(event) => setDraft({ ...draft, partnerLoginUsername: event.target.value })} /></div>
                    <div><Label>Password</Label><Input type="password" value={draft.partnerLoginPassword} onChange={(event) => setDraft({ ...draft, partnerLoginPassword: event.target.value })} /></div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-3 rounded-md border p-4">
              <Label>Resource file or link</Label>
              <input
                ref={fileInput}
                className="hidden"
                type="file"
                onChange={(event) => {
                  const selected = event.target.files?.[0] || null;
                  if (selected && selected.size > 4 * 1024 * 1024) {
                    toast({ title: "File too large", description: "Choose a file that is 4 MB or smaller.", variant: "destructive" });
                    event.target.value = "";
                    return;
                  }
                  setFile(selected);
                }}
              />
              {file ? (
                <div className="flex items-center gap-3 rounded-md bg-muted p-3 text-sm">
                  <FileText className="h-4 w-4 text-primary" />
                  <span className="min-w-0 flex-1 truncate">{file.name}</span>
                  <Button type="button" size="icon" variant="ghost" onClick={() => setFile(null)}><X className="h-4 w-4" /></Button>
                </div>
              ) : (
                <Button type="button" variant="outline" className="w-full gap-2" onClick={() => fileInput.current?.click()}>
                  <UploadCloud className="h-4 w-4" />Upload a file
                </Button>
              )}
              <div className="flex items-center gap-3 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border" />or use a link<span className="h-px flex-1 bg-border" /></div>
              <Input type="url" value={draft.fileUrl} disabled={Boolean(file)} onChange={(event) => setDraft({ ...draft, fileUrl: event.target.value })} placeholder="https://example.com/resource.pdf" />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" disabled={createResource.isPending} onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button disabled={!canCreate || createResource.isPending} onClick={() => createResource.mutate()} data-testid="button-create-inline-resource">
            {createResource.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating…</> : "Create and attach"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CurriculumEditor({ courseId, onBack }: { courseId: string; onBack: () => void }) {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [moduleDialog, setModuleDialog] = useState(false);
  const [lessonDialog, setLessonDialog] = useState<{ moduleId: string; lesson?: LessonWithResource } | null>(null);
  const [quickResourceDialog, setQuickResourceDialog] = useState(false);
  const [settingsDialog, setSettingsDialog] = useState(false);
  const [moduleDraft, setModuleDraft] = useState({ title: "", description: "" });
  const [lessonDraft, setLessonDraft] = useState({
    title: "", description: "", lessonType: "video", status: "draft", durationMinutes: 0,
    content: "", source: "resource", resourceId: "", youtubeValue: "", videoId: "", videoDurationSeconds: 0,
  });
  const [settingsDraft, setSettingsDraft] = useState<typeof initialCourse>(initialCourse);

  const courseQuery = useQuery<CourseWithCurriculum>({ queryKey: ["/api/courses", courseId] });
  const resourcesQuery = useQuery<Resource[]>({ queryKey: ["/api/resources"] });
  const course = courseQuery.data;
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
    queryClient.invalidateQueries({ queryKey: ["/api/courses", courseId] });
  };

  const moduleMutation = useMutation({
    mutationFn: async () => apiRequest("POST", "/api/modules", { ...moduleDraft, courseId, orderIndex: course?.modules.length || 0 }),
    onSuccess: () => { invalidate(); setModuleDialog(false); setModuleDraft({ title: "", description: "" }); toast({ title: "Module added" }); },
    onError: () => toast({ title: "Could not add module", variant: "destructive" }),
  });
  const lessonMutation = useMutation({
    mutationFn: async () => {
      if (!lessonDialog) return;
      const payload = {
        moduleId: lessonDialog.moduleId, title: lessonDraft.title, description: lessonDraft.description || null,
        lessonType: lessonDraft.lessonType, status: lessonDraft.status, durationMinutes: lessonDraft.durationMinutes || null,
        content: lessonDraft.lessonType === "text" ? lessonDraft.content : null,
        resourceId: lessonDraft.source === "resource" && lessonDraft.resourceId ? lessonDraft.resourceId : null,
        videoSource: lessonDraft.lessonType === "video" && lessonDraft.source === "youtube" ? "youtube" : null,
        videoUrl: lessonDraft.lessonType === "video" && lessonDraft.source === "youtube" ? lessonDraft.youtubeValue : null,
        videoId: lessonDraft.lessonType === "video" && lessonDraft.source === "youtube" ? lessonDraft.videoId : null,
        videoDurationSeconds: lessonDraft.videoDurationSeconds || null,
        downloadableUrl: null,
        orderIndex: lessonDialog.lesson?.orderIndex ?? (course?.modules.find((module) => module.id === lessonDialog.moduleId)?.lessons.length || 0),
      };
      return lessonDialog.lesson
        ? apiRequest("PATCH", `/api/lessons/${lessonDialog.lesson.id}`, payload)
        : apiRequest("POST", "/api/lessons", payload);
    },
    onSuccess: () => { invalidate(); setLessonDialog(null); toast({ title: "Lesson saved" }); },
    onError: async (error: Error) => toast({ title: "Could not save lesson", description: error.message.replace(/^\d+:\s*/, ""), variant: "destructive" }),
  });
  const settingsMutation = useMutation({
    mutationFn: async () => apiRequest("PATCH", `/api/courses/${courseId}`, settingsDraft),
    onSuccess: () => { invalidate(); setSettingsDialog(false); toast({ title: "Course settings saved" }); },
    onError: async (error: Error) => toast({ title: "Could not publish course", description: error.message.replace(/^\d+:\s*/, ""), variant: "destructive" }),
  });

  function openLesson(moduleId: string, lesson?: LessonWithResource) {
    setLessonDialog({ moduleId, lesson });
    setLessonDraft({
      title: lesson?.title || "", description: lesson?.description || "", lessonType: lesson?.lessonType || "video",
      status: lesson?.status || "draft", durationMinutes: lesson?.durationMinutes || 0, content: lesson?.content || "",
      source: lesson?.resourceId ? "resource" : "youtube", resourceId: lesson?.resourceId || "",
      youtubeValue: lesson?.videoUrl || "", videoId: lesson?.videoId || "", videoDurationSeconds: lesson?.videoDurationSeconds || 0,
    });
  }
  async function resolveYouTube() {
    if (!lessonDraft.youtubeValue.trim()) {
      toast({ title: "Add a YouTube URL or ID first", variant: "destructive" });
      return;
    }
    try {
      const res = await apiRequest("POST", "/api/admin/youtube/videos/resolve", { value: lessonDraft.youtubeValue });
      const video = await res.json();
      setLessonDraft((draft) => ({ ...draft, youtubeValue: video.url, videoId: video.videoId, videoDurationSeconds: video.durationSeconds || 0, durationMinutes: draft.durationMinutes || Math.ceil((video.durationSeconds || 0) / 60) }));
      toast({ title: "YouTube video validated", description: video.title });
    } catch (error) {
      toast({ title: "Video could not be validated", description: error instanceof Error ? error.message.replace(/^\d+:\s*/, "") : undefined, variant: "destructive" });
    }
  }
  async function reorder(kind: "modules" | "lessons", item: ModuleWithLessons | LessonWithResource, direction: -1 | 1, parentId?: string) {
    const items = kind === "modules" ? course?.modules || [] : course?.modules.find((module) => module.id === parentId)?.lessons || [];
    const index = items.findIndex((candidate) => candidate.id === item.id);
    const target = items[index + direction];
    if (!target) return;
    try {
      await Promise.all([
        apiRequest("PATCH", kind === "modules" ? `/api/modules/${item.id}` : `/api/lessons/${item.id}`, { orderIndex: target.orderIndex }),
        apiRequest("PATCH", kind === "modules" ? `/api/modules/${target.id}` : `/api/lessons/${target.id}`, { orderIndex: item.orderIndex }),
      ]);
      invalidate();
    } catch {
      toast({ title: "Could not reorder content", variant: "destructive" });
    }
  }
  async function remove(kind: "module" | "lesson", id: string, title: string) {
    if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) return;
    try {
      await apiRequest("DELETE", kind === "module" ? `/api/modules/${id}` : `/api/lessons/${id}`);
      invalidate();
      toast({ title: `${kind === "module" ? "Module" : "Lesson"} deleted` });
    } catch {
      toast({ title: "Could not delete content", variant: "destructive" });
    }
  }

  if (courseQuery.isLoading) return <main className="flex-1 p-8 space-y-4"><Skeleton className="h-10 w-72" /><Skeleton className="h-64 w-full" /></main>;
  if (!course) return <main className="flex-1 p-8"><Button variant="outline" onClick={onBack}><ArrowLeft className="mr-2 h-4 w-4" />Back to courses</Button><p className="mt-8 text-muted-foreground">Course not found.</p></main>;
  const resourceOptions = (resourcesQuery.data || []).filter((resource) =>
    lessonDraft.lessonType === "video" ? resource.resourceType === "video" : resource.resourceType !== "video"
  );

  return (
    <main className="flex-1 overflow-auto">
      <div className="mx-auto max-w-5xl p-6 md:p-8">
        <Button variant="ghost" className="mb-5 -ml-3" onClick={onBack}><ArrowLeft className="mr-2 h-4 w-4" />All courses</Button>
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-2">{statusBadge(course.status)} <span className="text-sm text-muted-foreground">{course.moduleCount} modules · {course.lessonCount} lessons · {formatDuration(course.durationMinutes)}</span></div>
            <h1 className="text-3xl font-bold">{course.title}</h1>
            <p className="mt-1 text-muted-foreground">Build modules, lessons, and their resources in one place. Created resources remain reusable across courses.</p>
          </div>
          <div className="flex gap-2">
             <Button variant="outline" onClick={() => setLocation("/admin/resources")}><FileText className="mr-2 h-4 w-4" />Resource library</Button>
             <Button variant="outline" onClick={() => { setSettingsDraft({ title: course.title, shortDescription: course.shortDescription || "", description: course.description || "", category: course.category || categories[0], level: course.level || "beginner", status: course.status || "draft", durationOverrideMinutes: course.durationOverrideMinutes, audience: course.audience || "all", cohortIds: course.cohortIds || [] }); setSettingsDialog(true); }}><Settings2 className="mr-2 h-4 w-4" />Course settings</Button>
            <Button onClick={() => setModuleDialog(true)}><Plus className="mr-2 h-4 w-4" />Add module</Button>
          </div>
        </div>

        {course.modules.length === 0 ? (
          <Card className="border-dashed py-10 text-center"><CardContent><BookOpen className="mx-auto mb-3 h-10 w-10 text-muted-foreground" /><h2 className="text-lg font-semibold">Start with a module</h2><p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">Modules group a set of ordered lessons. Add your first module, then attach a video, PDF, or written lesson.</p><Button className="mt-5" onClick={() => setModuleDialog(true)}>Add first module</Button></CardContent></Card>
        ) : course.modules.map((module, index) => (
          <Card key={module.id} className="mb-5" data-testid={`course-module-${module.id}`}>
            <CardHeader className="border-b bg-muted/20 pb-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex gap-3">
                  <GripVertical className="mt-1 h-5 w-5 text-muted-foreground" />
                  <div><p className="text-xs font-semibold uppercase tracking-wide text-primary">Module {index + 1}</p><CardTitle className="mt-1">{module.title}</CardTitle>{module.description && <p className="mt-1 text-sm text-muted-foreground">{module.description}</p>}</div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" disabled={index === 0} onClick={() => reorder("modules", module, -1)} aria-label="Move module up"><ArrowUp className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" disabled={index === course.modules.length - 1} onClick={() => reorder("modules", module, 1)} aria-label="Move module down"><ArrowDown className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => remove("module", module.id, module.title)} aria-label="Delete module"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  <Button size="sm" onClick={() => openLesson(module.id)}><Plus className="mr-1 h-4 w-4" />Lesson</Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {module.lessons.length === 0 ? <p className="p-5 text-sm text-muted-foreground">No lessons yet. Add a lesson to make this module ready for learners.</p> :
                <div className="divide-y">{module.lessons.map((lesson, lessonIndex) => (
                  <div key={lesson.id} className="flex flex-wrap items-center gap-3 p-4">
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                    {lesson.lessonType === "video" ? <Video className="h-4 w-4 text-primary" /> : <FileText className="h-4 w-4 text-primary" />}
                    <div className="min-w-[180px] flex-1"><p className="font-medium">{lesson.title}</p><p className="text-xs text-muted-foreground">{lesson.resource?.title || (lesson.videoId ? "YouTube video" : lesson.lessonType)} · {formatDuration(lesson.durationMinutes)}</p></div>
                    {statusBadge(lesson.status)}
                    <div className="flex">
                      <Button variant="ghost" size="icon" disabled={lessonIndex === 0} onClick={() => reorder("lessons", lesson, -1, module.id)} aria-label="Move lesson up"><ArrowUp className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" disabled={lessonIndex === module.lessons.length - 1} onClick={() => reorder("lessons", lesson, 1, module.id)} aria-label="Move lesson down"><ArrowDown className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => openLesson(module.id, lesson)} aria-label="Edit lesson"><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => remove("lesson", lesson.id, lesson.title)} aria-label="Delete lesson"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                  </div>
                ))}</div>}
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={moduleDialog} onOpenChange={setModuleDialog}>
        <DialogContent><DialogHeader><DialogTitle>Add module</DialogTitle><DialogDescription>Modules keep lessons grouped and ordered.</DialogDescription></DialogHeader><div className="space-y-4"><div><Label>Module title</Label><Input value={moduleDraft.title} onChange={(e) => setModuleDraft({ ...moduleDraft, title: e.target.value })} /></div><div><Label>Description (optional)</Label><Textarea value={moduleDraft.description} onChange={(e) => setModuleDraft({ ...moduleDraft, description: e.target.value })} /></div></div><DialogFooter><Button variant="outline" onClick={() => setModuleDialog(false)}>Cancel</Button><Button disabled={!moduleDraft.title.trim() || moduleMutation.isPending} onClick={() => moduleMutation.mutate()}>{moduleMutation.isPending ? "Adding…" : "Add module"}</Button></DialogFooter></DialogContent>
      </Dialog>

      <Dialog open={Boolean(lessonDialog)} onOpenChange={(open) => !open && setLessonDialog(null)}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader><DialogTitle>{lessonDialog?.lesson ? "Edit lesson" : "Add lesson"}</DialogTitle><DialogDescription>Draft lessons stay in the editor. Published lessons become visible when the course is published.</DialogDescription></DialogHeader>
          <div className="space-y-4">
            <div><Label>Lesson title</Label><Input value={lessonDraft.title} onChange={(e) => setLessonDraft({ ...lessonDraft, title: e.target.value })} /></div>
            <div><Label>Description (optional)</Label><Textarea value={lessonDraft.description} onChange={(e) => setLessonDraft({ ...lessonDraft, description: e.target.value })} /></div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div><Label>Lesson type</Label><Select value={lessonDraft.lessonType} onValueChange={(lessonType) => setLessonDraft({ ...lessonDraft, lessonType, source: lessonType === "video" ? lessonDraft.source : "resource", resourceId: "" })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="video">Video</SelectItem><SelectItem value="downloadable">PDF / download</SelectItem><SelectItem value="text">Written lesson</SelectItem></SelectContent></Select></div>
              <div><Label>Duration (minutes)</Label><Input type="number" min="0" value={lessonDraft.durationMinutes || ""} onChange={(e) => setLessonDraft({ ...lessonDraft, durationMinutes: Number(e.target.value) || 0 })} /></div>
              <div><Label>Status</Label><Select value={lessonDraft.status} onValueChange={(status) => setLessonDraft({ ...lessonDraft, status })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="draft">Draft</SelectItem><SelectItem value="published">Published</SelectItem></SelectContent></Select></div>
            </div>
            {lessonDraft.lessonType === "text" && <div><Label>Lesson content</Label><Textarea rows={7} value={lessonDraft.content} onChange={(e) => setLessonDraft({ ...lessonDraft, content: e.target.value })} placeholder="Write the learning content here" /></div>}
            {lessonDraft.lessonType !== "text" && <>
              {lessonDraft.lessonType === "video" && <div><Label>Content source</Label><Select value={lessonDraft.source} onValueChange={(source) => setLessonDraft({ ...lessonDraft, source, resourceId: "", youtubeValue: "", videoId: "" })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="resource">Reusable video resource</SelectItem><SelectItem value="youtube">YouTube URL / ID</SelectItem></SelectContent></Select></div>}
              {lessonDraft.lessonType === "video" && lessonDraft.source === "youtube" ? <div className="rounded-md border p-4"><Label>YouTube URL or video ID</Label><div className="mt-2 flex gap-2"><Input value={lessonDraft.youtubeValue} onChange={(e) => setLessonDraft({ ...lessonDraft, youtubeValue: e.target.value, videoId: "" })} placeholder="https://youtube.com/watch?v=…" /><Button type="button" variant="outline" onClick={resolveYouTube}>Validate</Button></div><p className="mt-2 text-xs text-muted-foreground">{lessonDraft.videoId ? `Validated video ID: ${lessonDraft.videoId}` : "Validate before publishing so learners receive a playable video."}</p></div> :
                <div className="rounded-md border p-4"><Label>Attach a reusable {lessonDraft.lessonType === "video" ? "video" : "resource"}</Label><Select value={lessonDraft.resourceId || "none"} onValueChange={(resourceId) => setLessonDraft({ ...lessonDraft, resourceId: resourceId === "none" ? "" : resourceId })}><SelectTrigger className="mt-2"><SelectValue placeholder="Choose a resource" /></SelectTrigger><SelectContent><SelectItem value="none">Choose a resource</SelectItem>{resourceOptions.map((resource) => <SelectItem key={resource.id} value={resource.id}>{resource.title}{resource.status !== "published" ? " (draft)" : ""}</SelectItem>)}</SelectContent></Select>{lessonDraft.lessonType !== "video" ? <Button type="button" variant="outline" className="mt-3 w-full gap-2" onClick={() => setQuickResourceDialog(true)} data-testid="button-create-resource-from-lesson"><Plus className="h-4 w-4" />Create and attach a new resource</Button> : <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground"><Video className="h-3.5 w-3.5" />Use a YouTube URL above or choose an existing protected video.</div>}</div>}
            </>}
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setLessonDialog(null)}>Cancel</Button><Button disabled={!lessonDraft.title.trim() || lessonMutation.isPending} onClick={() => lessonMutation.mutate()}>{lessonMutation.isPending ? "Saving…" : "Save lesson"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <QuickResourceDialog
        open={quickResourceDialog}
        onOpenChange={setQuickResourceDialog}
        onCreated={(resource) => setLessonDraft((current) => ({
          ...current,
          resourceId: resource.id,
          title: current.title || resource.title,
        }))}
      />

      <Dialog open={settingsDialog} onOpenChange={setSettingsDialog}><DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto"><DialogHeader><DialogTitle>Course settings</DialogTitle><DialogDescription>Courses can only be published when each module has published, playable lessons.</DialogDescription></DialogHeader><CourseFields value={settingsDraft} onChange={setSettingsDraft} /><p className="rounded-md bg-muted p-3 text-sm text-muted-foreground">Calculated curriculum duration: {formatDuration(course.calculatedDurationMinutes)}.</p><DialogFooter><Button variant="outline" onClick={() => setSettingsDialog(false)}>Cancel</Button><Button disabled={!settingsDraft.title.trim() || (settingsDraft.audience === "selected" && settingsDraft.cohortIds.length === 0) || settingsMutation.isPending} onClick={() => settingsMutation.mutate()}>{settingsMutation.isPending ? "Saving…" : "Save settings"}</Button></DialogFooter></DialogContent></Dialog>
    </main>
  );
}

export default function CourseManagement() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const selectedCohortId = getAdminCohortId();
  const [searchQuery, setSearchQuery] = useState("");
  const [createDialog, setCreateDialog] = useState(false);
  const [createDraft, setCreateDraft] = useState(() => selectedCohortId
    ? { ...initialCourse, audience: "selected" as const, cohortIds: [selectedCohortId] }
    : initialCourse);
  const [editorCourseId, setEditorCourseId] = useState<string | null>(null);
  const { data: courses, isLoading } = useQuery<CourseWithCurriculum[]>({ queryKey: ["/api/courses"] });
  const createCourse = useMutation({
    mutationFn: async () => apiRequest("POST", "/api/courses", { ...createDraft, status: "draft" }),
    onSuccess: async (response) => { const course = await response.json(); queryClient.invalidateQueries({ queryKey: ["/api/courses"] }); setCreateDialog(false); setCreateDraft(initialCourse); setEditorCourseId(course.id); toast({ title: "Course created", description: "Add modules and lessons before publishing." }); },
    onError: () => toast({ title: "Could not create course", variant: "destructive" }),
  });
  const deleteCourse = async (course: CourseWithCurriculum) => {
    if (!window.confirm(`Delete "${course.title}" and all of its modules, lessons, enrolments, and certificate records? Reusable resources will not be deleted.`)) return;
    try { await apiRequest("DELETE", `/api/courses/${course.id}`); queryClient.invalidateQueries({ queryKey: ["/api/courses"] }); toast({ title: "Course deleted" }); } catch { toast({ title: "Could not delete course", variant: "destructive" }); }
  };
  const filteredCourses = useMemo(() => (courses || []).filter((course) =>
    (course.audience === "all" || !selectedCohortId || course.cohortIds?.includes(selectedCohortId))
    && `${course.title} ${course.description || ""} ${course.category || ""}`.toLowerCase().includes(searchQuery.toLowerCase())
  ), [courses, searchQuery, selectedCohortId]);

  return (
    <div className="flex h-screen flex-col md:flex-row"><AdminSidebar />
      {editorCourseId ? <CurriculumEditor courseId={editorCourseId} onBack={() => setEditorCourseId(null)} /> :
        <main className="flex-1 overflow-auto"><div className="p-6 md:p-8">
          <div className="mb-8 flex flex-wrap items-start justify-between gap-4"><div><h1 className="text-3xl font-bold">Courses & Resources</h1><p className="mt-1 text-muted-foreground">Build each course, module, lesson, and attached resource in one connected workflow.</p></div><div className="flex gap-2"><Button variant="outline" onClick={() => setLocation("/admin/resources")}><FileText className="mr-2 h-4 w-4" />Resource library</Button><Button onClick={() => setCreateDialog(true)} data-testid="button-create-course"><Plus className="mr-2 h-4 w-4" />Add course</Button></div></div>
          <div className="relative mb-6 max-w-md"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input className="pl-9" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search courses" /></div>
          {isLoading ? <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{[1, 2, 3].map((key) => <Skeleton key={key} className="h-56" />)}</div> :
            filteredCourses.length === 0 ? <Card className="border-dashed py-12 text-center"><CardContent><BookOpen className="mx-auto mb-3 h-10 w-10 text-muted-foreground" /><h2 className="text-lg font-semibold">No courses found</h2><p className="mt-1 text-sm text-muted-foreground">{searchQuery ? "Try a different search." : "Create your first course, then add its curriculum."}</p>{!searchQuery && <Button className="mt-5" onClick={() => setCreateDialog(true)}>Create course</Button>}</CardContent></Card> :
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{filteredCourses.map((course) => <Card key={course.id} data-testid={`card-course-${course.id}`}><CardHeader><div className="flex items-start justify-between gap-3">{statusBadge(course.status)}<Button variant="ghost" size="icon" onClick={() => deleteCourse(course)} aria-label="Delete course"><Trash2 className="h-4 w-4 text-destructive" /></Button></div><CardTitle className="mt-2">{course.title}</CardTitle></CardHeader><CardContent><p className="min-h-10 text-sm text-muted-foreground">{course.shortDescription || course.description || "No description yet."}</p><div className="my-4 flex flex-wrap gap-3 text-sm text-muted-foreground"><span className="flex items-center gap-1"><Clock className="h-4 w-4" />{formatDuration(course.durationMinutes)}</span><span className="flex items-center gap-1"><BookOpen className="h-4 w-4" />{course.moduleCount} modules · {course.lessonCount} lessons</span></div><Button className="w-full" variant="outline" onClick={() => setEditorCourseId(course.id)}><Pencil className="mr-2 h-4 w-4" />Edit curriculum</Button></CardContent></Card>)}</div>}
        </div></main>}
      <Dialog open={createDialog} onOpenChange={setCreateDialog}><DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto"><DialogHeader><DialogTitle>Create a course</DialogTitle><DialogDescription>Courses start as drafts so you can build a complete curriculum before learners see it.</DialogDescription></DialogHeader><CourseFields value={createDraft} onChange={setCreateDraft} showStatus={false} /><DialogFooter><Button variant="outline" onClick={() => setCreateDialog(false)}>Cancel</Button><Button disabled={!createDraft.title.trim() || (createDraft.audience === "selected" && createDraft.cohortIds.length === 0) || createCourse.isPending} onClick={() => createCourse.mutate()}>{createCourse.isPending ? "Creating…" : "Create course"}</Button></DialogFooter></DialogContent></Dialog>
    </div>
  );
}