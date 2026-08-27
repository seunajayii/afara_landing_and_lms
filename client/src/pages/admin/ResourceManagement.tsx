import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AdminSidebar } from "@/components/AdminSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  Pencil,
  Trash2,
  FileText,
  Search,
  Download,
  FileSpreadsheet,
  FileImage,
  File,
  UploadCloud,
  X,
  Loader2,
  Link as LinkIcon,
  ExternalLink,
  Eye,
  EyeOff,
  Video,
  CheckCircle2,
} from "lucide-react";
import type { Resource } from "@shared/schema";

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getRequestErrorMessage(error: unknown, fallback: string): string {
  if (!(error instanceof Error)) return fallback;
  const message = error.message.replace(/^\d+:\s*/, "");
  try {
    const body = JSON.parse(message) as { error?: string | { message?: string }[] };
    if (typeof body.error === "string") return body.error;
    if (Array.isArray(body.error) && body.error[0]?.message) return body.error[0].message;
  } catch {
    // Use the response text below when it was not JSON.
  }
  return message || fallback;
}

interface UploadedFile {
  fileUrl: string;
  fileName: string;
  fileSize: number;
}

interface YouTubeVideo {
  videoId: string;
  url: string;
  title: string;
  description: string;
  thumbnailUrl: string | null;
  durationSeconds: number | null;
  privacyStatus: string | null;
  uploadStatus: string | null;
}

interface ResourceFileUploaderProps {
  current: UploadedFile | null;
  onUploaded: (file: UploadedFile) => void;
  onCleared: () => void;
}

const MAX_RESOURCE_SIZE = 4 * 1024 * 1024; // 4 MB

function ResourceFileUploader({ current, onUploaded, onCleared }: ResourceFileUploaderProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_RESOURCE_SIZE) {
      toast({
        title: "File too large",
        description: "Files must be 4 MB or smaller. Please compress or reduce the file size before uploading.",
        variant: "destructive",
      });
      e.target.value = "";
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/resources/upload", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(data.error || "Upload failed");
      }
      const result = await res.json() as UploadedFile;
      onUploaded(result);
      toast({ title: "File uploaded", description: result.fileName });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Upload failed. Please try again.";
      toast({ title: "Upload error", description: msg, variant: "destructive" });
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleFileChange}
        data-testid="input-resource-file"
      />
      {current ? (
        <div className="flex items-center gap-3 p-3 rounded-md border bg-muted/50">
          <File className="w-5 h-5 text-primary shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{current.fileName}</p>
            <p className="text-xs text-muted-foreground">{formatFileSize(current.fileSize)}</p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onCleared}
            data-testid="button-clear-upload"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="w-full flex flex-col items-center justify-center gap-2 p-6 rounded-md border-2 border-dashed border-border hover-elevate text-center"
          data-testid="button-upload-resource-file"
        >
          {uploading ? (
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          ) : (
            <UploadCloud className="w-8 h-8 text-muted-foreground" />
          )}
          <span className="text-sm font-medium">
            {uploading ? "Uploading…" : "Click to upload a file"}
          </span>
          <span className="text-xs text-muted-foreground">PDF, DOCX, XLSX, PPTX, or any format — max 4 MB</span>
        </button>
      )}
    </div>
  );
}

function formatVideoDuration(seconds: number | null | undefined): string {
  if (seconds == null) return "Duration unavailable";
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
}

function YouTubeVideoFields({
  form,
  idPrefix,
  videoId,
  thumbnailUrl,
  durationSeconds,
  privacyStatus,
  uploadStatus,
  onVideoSelected,
  onClear,
}: {
  form: ReturnType<typeof useForm<ResourceFormData>>;
  idPrefix: string;
  videoId: string | undefined;
  thumbnailUrl: string | undefined;
  durationSeconds: number | undefined;
  privacyStatus: string | undefined;
  uploadStatus: string | undefined;
  onVideoSelected: (video: YouTubeVideo) => void;
  onClear: () => void;
}) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [videoValue, setVideoValue] = useState(form.getValues("youtubeUrl") || "");
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  async function resolveVideo() {
    if (!videoValue.trim()) {
      toast({ title: "Add a YouTube link", description: "Paste a YouTube URL or 11-character video ID first.", variant: "destructive" });
      return;
    }

    setIsLookingUp(true);
    try {
      const response = await apiRequest("POST", "/api/admin/youtube/videos/resolve", { value: videoValue.trim() });
      const video = await response.json() as YouTubeVideo;
      onVideoSelected(video);
      setVideoValue(video.url);
      toast({ title: "YouTube video added", description: video.title });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message.replace(/^\d+:\s*/, "") : "Unable to look up this YouTube video.";
      toast({ title: "Video not available", description: message, variant: "destructive" });
    } finally {
      setIsLookingUp(false);
    }
  }

  function uploadVideo(file: File) {
    const title = form.getValues("title").trim();
    if (!title) {
      toast({ title: "Add a title first", description: "Enter a resource title before uploading a video.", variant: "destructive" });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    const data = new FormData();
    data.append("video", file);
    data.append("title", title);
    data.append("description", form.getValues("description") || "");
    data.append("privacyStatus", form.getValues("youtubePrivacyStatus") || "unlisted");

    const request = new XMLHttpRequest();
    request.open("POST", "/api/admin/youtube/videos/upload");
    request.withCredentials = true;
    request.upload.onprogress = (event) => {
      if (event.lengthComputable) setUploadProgress(Math.round((event.loaded / event.total) * 100));
    };
    request.onerror = () => {
      setIsUploading(false);
      toast({ title: "Upload error", description: "The video could not be uploaded. Check your connection and try again.", variant: "destructive" });
    };
    request.onload = () => {
      setIsUploading(false);
      if (request.status < 200 || request.status >= 300) {
        let message = "YouTube could not process this upload.";
        try {
          message = (JSON.parse(request.responseText) as { error?: string }).error || message;
        } catch {
          // Fall back to the concise message above.
        }
        toast({ title: "Upload error", description: message, variant: "destructive" });
        return;
      }

      const video = JSON.parse(request.responseText) as YouTubeVideo;
      onVideoSelected(video);
      setVideoValue(video.url);
      toast({ title: "Video uploaded to YouTube", description: "You can now publish this learning resource." });
    };
    request.send(data);
  }

  return (
    <div className="space-y-4 rounded-md border p-4">
      <div className="flex items-center gap-2 text-sm font-medium text-red-600 dark:text-red-400">
        <Video className="w-4 h-4" />
        YouTube Video
      </div>

      {videoId ? (
        <div className="rounded-md border bg-muted/40 overflow-hidden">
          <div className="flex flex-col sm:flex-row">
            {thumbnailUrl ? (
              <img src={thumbnailUrl} alt="" className="h-32 w-full object-cover sm:w-56" />
            ) : (
              <div className="h-32 w-full bg-muted flex items-center justify-center sm:w-56">
                <Video className="w-8 h-8 text-muted-foreground" />
              </div>
            )}
            <div className="p-3 flex-1 min-w-0">
              <div className="flex items-center gap-2 text-sm font-medium">
                <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                <span>Video selected</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground break-all">ID: {videoId}</p>
              <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                <Badge variant="outline">{formatVideoDuration(durationSeconds)}</Badge>
                {privacyStatus && <Badge variant="outline">{privacyStatus}</Badge>}
                {uploadStatus && <Badge variant="outline">{uploadStatus}</Badge>}
              </div>
              <Button type="button" variant="ghost" className="px-0 h-auto mt-3 text-destructive hover:text-destructive" onClick={onClear} data-testid={`button-clear-${idPrefix}-youtube-video`}>
                Remove video
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            <FormLabel>Existing YouTube Video</FormLabel>
            <div className="flex gap-2">
              <Input
                value={videoValue}
                onChange={(event) => setVideoValue(event.target.value)}
                placeholder="Paste a YouTube URL or video ID"
                data-testid={`input-${idPrefix}-youtube-url`}
              />
              <Button type="button" variant="outline" onClick={resolveVideo} disabled={isLookingUp} data-testid={`button-${idPrefix}-youtube-lookup`}>
                {isLookingUp ? <Loader2 className="w-4 h-4 animate-spin" /> : "Use video"}
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground">or upload to the connected YouTube channel</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <FormField
            control={form.control}
            name="youtubePrivacyStatus"
            render={({ field }) => (
              <FormItem>
                <FormLabel>YouTube privacy for uploads</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || "unlisted"}>
                  <FormControl>
                    <SelectTrigger data-testid={`select-${idPrefix}-youtube-privacy`}>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="unlisted">Unlisted (recommended)</SelectItem>
                    <SelectItem value="private">Private</SelectItem>
                    <SelectItem value="public">Public</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Unlisted videos are not searchable, but anyone with the YouTube link can share it.</p>
              </FormItem>
            )}
          />

          <input
            ref={fileInputRef}
            type="file"
            accept="video/mp4,video/quicktime,video/webm,video/x-m4v"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) uploadVideo(file);
              event.target.value = "";
            }}
            data-testid={`input-${idPrefix}-youtube-upload`}
          />
          <Button
            type="button"
            variant="outline"
            className="w-full min-h-20 flex-col gap-1"
            disabled={isUploading}
            onClick={() => fileInputRef.current?.click()}
            data-testid={`button-${idPrefix}-youtube-upload`}
          >
            {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <UploadCloud className="w-5 h-5" />}
            <span>{isUploading ? `Uploading to YouTube… ${uploadProgress}%` : "Upload video to YouTube"}</span>
            <span className="text-xs font-normal text-muted-foreground">MP4, MOV, WebM, or M4V · maximum 250 MB</span>
          </Button>
        </>
      )}
    </div>
  );
}

function ResourceCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-3/4" />
      </CardHeader>
      <CardContent className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <div className="flex gap-2">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-6 w-16" />
        </div>
      </CardContent>
    </Card>
  );
}

const resourceFormSchema = z.object({
  title: z.string().min(1, "Title is required").min(3, "Title must be at least 3 characters"),
  description: z.string().optional(),
  resourceType: z.enum(["document", "template", "toolkit", "guide", "resource_partner", "video"]),
  category: z.string().min(1, "Category is required"),
  fileUrl: z.string().optional().or(z.literal("")),
  fileName: z.string().optional(),
  fileSize: z.number().optional(),
  thumbnailUrl: z.string().optional().or(z.literal("")),
  youtubeVideoId: z.string().optional().or(z.literal("")),
  youtubeUrl: z.string().optional().or(z.literal("")),
  youtubeThumbnailUrl: z.string().optional().or(z.literal("")),
  youtubeDurationSeconds: z.number().int().nonnegative().optional(),
  youtubePrivacyStatus: z.string().optional().or(z.literal("")),
  youtubeUploadStatus: z.string().optional().or(z.literal("")),
  visibility: z.enum(["public", "community", "cohort_only"]).default("community"),
  status: z.enum(["draft", "pending_review", "published", "archived"]),
  partnerName: z.string().optional(),
  partnerLoginUrl: z.string().optional().or(z.literal("")),
  partnerLoginUsername: z.string().optional(),
  partnerLoginPassword: z.string().optional(),
});

type ResourceFormData = z.infer<typeof resourceFormSchema>;

const categories = [
  "Business Strategy",
  "Financial Planning",
  "Marketing",
  "Operations",
  "Legal",
  "HR & Management",
  "Technology",
  "Fundraising",
];

function getStatusColor(status: string) {
  switch (status) {
    case "published": return "bg-green-500/10 text-green-600 dark:text-green-400";
    case "draft": return "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400";
    case "archived": return "bg-gray-500/10 text-gray-600 dark:text-gray-400";
    case "pending_review": return "bg-blue-500/10 text-blue-600 dark:text-blue-400";
    default: return "";
  }
}

function getResourceTypeIcon(type: string) {
  switch (type) {
    case "document": return <FileText className="w-5 h-5" />;
    case "template": return <FileSpreadsheet className="w-5 h-5" />;
    case "toolkit": return <File className="w-5 h-5" />;
    case "guide": return <FileImage className="w-5 h-5" />;
    case "resource_partner": return <ExternalLink className="w-5 h-5" />;
    case "video": return <Video className="w-5 h-5" />;
    default: return <FileText className="w-5 h-5" />;
  }
}

function getResourceTypeColor(type: string) {
  switch (type) {
    case "document": return "bg-blue-500/10 text-blue-600 dark:text-blue-400";
    case "template": return "bg-green-500/10 text-green-600 dark:text-green-400";
    case "toolkit": return "bg-purple-500/10 text-purple-600 dark:text-purple-400";
    case "guide": return "bg-orange-500/10 text-orange-600 dark:text-orange-400";
    case "resource_partner": return "bg-teal-500/10 text-teal-600 dark:text-teal-400";
    case "video": return "bg-red-500/10 text-red-600 dark:text-red-400";
    default: return "";
  }
}

const emptyDefaults: ResourceFormData = {
  title: "",
  description: "",
  resourceType: "document",
  category: "Business Strategy",
  fileUrl: "",
  fileName: "",
  fileSize: undefined,
  thumbnailUrl: "",
  youtubeVideoId: "",
  youtubeUrl: "",
  youtubeThumbnailUrl: "",
  youtubeDurationSeconds: undefined,
  youtubePrivacyStatus: "",
  youtubeUploadStatus: "",
  visibility: "community",
  status: "published",
  partnerName: "",
  partnerLoginUrl: "",
  partnerLoginUsername: "",
  partnerLoginPassword: "",
};

export default function ResourceManagement() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [createUpload, setCreateUpload] = useState<UploadedFile | null>(null);
  const [editUpload, setEditUpload] = useState<UploadedFile | null>(null);

  const createForm = useForm<ResourceFormData>({
    resolver: zodResolver(resourceFormSchema),
    defaultValues: emptyDefaults,
  });

  const editForm = useForm<ResourceFormData>({
    resolver: zodResolver(resourceFormSchema),
    defaultValues: emptyDefaults,
  });

  const { data: resources, isLoading } = useQuery<Resource[]>({
    queryKey: ["/api/resources"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: ResourceFormData) => {
      const res = await apiRequest("POST", "/api/resources", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/resources"] });
      setIsCreateDialogOpen(false);
      setCreateUpload(null);
      createForm.reset(emptyDefaults);
      toast({ title: "Resource Created", description: "The resource has been created successfully." });
    },
    onError: (error) => {
      toast({ title: "Resource not created", description: getRequestErrorMessage(error, "Failed to create resource. Please try again."), variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: ResourceFormData }) => {
      const res = await apiRequest("PATCH", `/api/resources/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/resources"] });
      setIsEditDialogOpen(false);
      setEditUpload(null);
      setSelectedResource(null);
      editForm.reset(emptyDefaults);
      toast({ title: "Resource Updated", description: "The resource has been updated successfully." });
    },
    onError: (error) => {
      toast({ title: "Resource not updated", description: getRequestErrorMessage(error, "Failed to update resource. Please try again."), variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/resources/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/resources"] });
      setIsDeleteDialogOpen(false);
      setSelectedResource(null);
      toast({ title: "Resource Deleted", description: "The resource has been deleted successfully." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete resource. Please try again.", variant: "destructive" });
    },
  });

  const filteredResources = resources?.filter(resource =>
    resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    resource.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    resource.category?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  function handleCreateUpload(file: UploadedFile) {
    setCreateUpload(file);
    createForm.setValue("fileUrl", file.fileUrl);
    createForm.setValue("fileName", file.fileName);
    createForm.setValue("fileSize", file.fileSize);
  }

  function handleCreateClearUpload() {
    setCreateUpload(null);
    createForm.setValue("fileUrl", "");
    createForm.setValue("fileName", "");
    createForm.setValue("fileSize", undefined);
  }

  function handleEditUpload(file: UploadedFile) {
    setEditUpload(file);
    editForm.setValue("fileUrl", file.fileUrl);
    editForm.setValue("fileName", file.fileName);
    editForm.setValue("fileSize", file.fileSize);
  }

  function handleEditClearUpload() {
    setEditUpload(null);
    editForm.setValue("fileUrl", "");
    editForm.setValue("fileName", "");
    editForm.setValue("fileSize", undefined);
  }

  function openEditDialog(resource: Resource) {
    setSelectedResource(resource);
    setEditUpload(
      resource.fileUrl && resource.fileName
        ? { fileUrl: resource.fileUrl, fileName: resource.fileName, fileSize: resource.fileSize ?? 0 }
        : null
    );
    editForm.reset({
      title: resource.title,
      description: resource.description || "",
      resourceType: resource.resourceType as ResourceFormData["resourceType"],
      category: resource.category || "Business Strategy",
      fileUrl: resource.fileUrl || "",
      fileName: resource.fileName || "",
      fileSize: resource.fileSize ?? undefined,
      thumbnailUrl: resource.thumbnailUrl || "",
      youtubeVideoId: resource.youtubeVideoId || "",
      youtubeUrl: resource.youtubeUrl || "",
      youtubeThumbnailUrl: resource.youtubeThumbnailUrl || "",
      youtubeDurationSeconds: resource.youtubeDurationSeconds ?? undefined,
      youtubePrivacyStatus: resource.youtubePrivacyStatus || "",
      youtubeUploadStatus: resource.youtubeUploadStatus || "",
      visibility: (resource.visibility as ResourceFormData["visibility"]) || "community",
      status: (resource.status as ResourceFormData["status"]) || "published",
      partnerName: (resource as any).partnerName || "",
      partnerLoginUrl: (resource as any).partnerLoginUrl || "",
      partnerLoginUsername: (resource as any).partnerLoginUsername || "",
      partnerLoginPassword: (resource as any).partnerLoginPassword || "",
    });
    setIsEditDialogOpen(true);
  }

  function openDeleteDialog(resource: Resource) {
    setSelectedResource(resource);
    setIsDeleteDialogOpen(true);
  }

  function handleDeleteConfirm() {
    if (selectedResource) deleteMutation.mutate(selectedResource.id);
  }

  function ResourceFormFields({
    form,
    upload,
    onUploaded,
    onCleared,
    idPrefix,
  }: {
    form: ReturnType<typeof useForm<ResourceFormData>>;
    upload: UploadedFile | null;
    onUploaded: (f: UploadedFile) => void;
    onCleared: () => void;
    idPrefix: string;
  }) {
    const [showPassword, setShowPassword] = useState(false);
    const watchedType = form.watch("resourceType");
    const isPartner = watchedType === "resource_partner";
    const isVideo = watchedType === "video";
    const youtubeVideoId = form.watch("youtubeVideoId");
    const youtubeThumbnailUrl = form.watch("youtubeThumbnailUrl");
    const youtubeDurationSeconds = form.watch("youtubeDurationSeconds");
    const youtubePrivacyStatus = form.watch("youtubePrivacyStatus");

    const applyYouTubeVideo = (video: YouTubeVideo) => {
      form.setValue("youtubeVideoId", video.videoId, { shouldValidate: true });
      form.setValue("youtubeUrl", video.url);
      form.setValue("youtubeThumbnailUrl", video.thumbnailUrl || "");
      form.setValue("youtubeDurationSeconds", video.durationSeconds ?? undefined);
      form.setValue("youtubePrivacyStatus", video.privacyStatus || "");
      form.setValue("youtubeUploadStatus", video.uploadStatus || "processing");
      form.setValue("thumbnailUrl", video.thumbnailUrl || "");
      form.setValue("fileUrl", video.url);
      if (!form.getValues("title").trim()) form.setValue("title", video.title);
      if (!form.getValues("description")?.trim() && video.description) form.setValue("description", video.description);
    };

    const clearYouTubeVideo = () => {
      form.setValue("youtubeVideoId", "");
      form.setValue("youtubeUrl", "");
      form.setValue("youtubeThumbnailUrl", "");
      form.setValue("youtubeDurationSeconds", undefined);
      form.setValue("youtubePrivacyStatus", "");
      form.setValue("youtubeUploadStatus", "");
      form.setValue("thumbnailUrl", "");
      form.setValue("fileUrl", "");
    };

    return (
      <div className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="Resource title" {...field} data-testid={`input-${idPrefix}-resource-title`} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea placeholder="Brief description of this resource" rows={3} {...field} data-testid={`input-${idPrefix}-resource-description`} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="resourceType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Resource Type</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger data-testid={`select-${idPrefix}-resource-type`}>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="document">Document</SelectItem>
                    <SelectItem value="template">Template</SelectItem>
                    <SelectItem value="toolkit">Toolkit</SelectItem>
                    <SelectItem value="guide">Guide</SelectItem>
                    <SelectItem value="video">YouTube Video</SelectItem>
                    <SelectItem value="resource_partner">Resource Partner</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger data-testid={`select-${idPrefix}-resource-category`}>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {isVideo && (
          <YouTubeVideoFields
            form={form}
            idPrefix={idPrefix}
            videoId={youtubeVideoId}
            thumbnailUrl={youtubeThumbnailUrl}
            durationSeconds={youtubeDurationSeconds}
            privacyStatus={youtubePrivacyStatus}
            uploadStatus={form.watch("youtubeUploadStatus")}
            onVideoSelected={applyYouTubeVideo}
            onClear={clearYouTubeVideo}
          />
        )}

        {!isPartner && !isVideo && (
          <div className="space-y-3">
            <p className="text-sm font-medium">File</p>
            <ResourceFileUploader current={upload} onUploaded={onUploaded} onCleared={onCleared} />
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <LinkIcon className="w-3 h-3" />
                or link to an external URL
              </span>
              <div className="flex-1 h-px bg-border" />
            </div>
            <FormField
              control={form.control}
              name="fileUrl"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      placeholder="https://example.com/file.pdf"
                      {...field}
                      disabled={!!upload}
                      data-testid={`input-${idPrefix}-resource-fileurl`}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

        {isPartner && (
          <div className="space-y-4 rounded-md border p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-teal-600 dark:text-teal-400">
              <ExternalLink className="w-4 h-4" />
              Resource Partner Details
            </div>
            <FormField
              control={form.control}
              name="partnerName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Partner Name *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Coursera, edX, LinkedIn Learning"
                      {...field}
                      data-testid={`input-${idPrefix}-partner-name`}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="partnerLoginUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Partner LMS / Login URL *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://partner-lms.example.com/login"
                      {...field}
                      data-testid={`input-${idPrefix}-partner-login-url`}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="partnerLoginUsername"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Login Username / Email</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="shared@example.com"
                        {...field}
                        data-testid={`input-${idPrefix}-partner-username`}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="partnerLoginPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Login Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="Shared access password"
                          {...field}
                          data-testid={`input-${idPrefix}-partner-password`}
                        />
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="absolute right-0 top-0"
                          onClick={() => setShowPassword(p => !p)}
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Login credentials are only visible to admins and will be displayed securely to enrolled participants when they access this resource.
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="visibility"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Visibility</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger data-testid={`select-${idPrefix}-resource-visibility`}>
                      <SelectValue placeholder="Select visibility" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="public">Public (Everyone)</SelectItem>
                    <SelectItem value="community">Community (Logged in)</SelectItem>
                    <SelectItem value="cohort_only">Cohort Only (Participants+)</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger data-testid={`select-${idPrefix}-resource-status`}>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="pending_review">Pending Review</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row h-screen">
      <AdminSidebar />
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="flex items-center justify-between gap-4 mb-8 flex-wrap">
            <div>
              <h1 className="text-3xl font-bold" data-testid="text-resource-management-title">
                Resource Management
              </h1>
              <p className="text-muted-foreground">
                Upload and manage resources for program participants.
              </p>
            </div>
            <Button onClick={() => setIsCreateDialogOpen(true)} data-testid="button-create-resource">
              <Plus className="w-4 h-4 mr-2" />
              Add Resource
            </Button>
          </div>

          <div className="mb-6">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search resources..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="input-search-resources"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => <ResourceCardSkeleton key={i} />)}
            </div>
          ) : filteredResources.length === 0 ? (
            <Card className="p-8 text-center">
              <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No resources found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery ? "Try adjusting your search query." : "Get started by adding your first resource."}
              </p>
              {!searchQuery && (
                <Button onClick={() => setIsCreateDialogOpen(true)} data-testid="button-create-first-resource">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Resource
                </Button>
              )}
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredResources.map((resource) => (
                <Card key={resource.id} className="hover-elevate" data-testid={`card-resource-${resource.id}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <div className={`p-2 rounded-md ${getResourceTypeColor(resource.resourceType)}`}>
                          {getResourceTypeIcon(resource.resourceType)}
                        </div>
                        <CardTitle className="text-lg line-clamp-1">{resource.title}</CardTitle>
                      </div>
                      <Badge className={getStatusColor(resource.status || "draft")}>
                        {resource.status || "draft"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                      {resource.description || "No description available"}
                    </p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3 flex-wrap">
                      <Badge variant="outline">{resource.resourceType}</Badge>
                      {resource.category && <Badge variant="outline">{resource.category}</Badge>}
                      {resource.fileSize && (
                        <span className="text-xs">{formatFileSize(resource.fileSize)}</span>
                      )}
                      {resource.downloadCount !== null && resource.downloadCount! > 0 && (
                        <div className="flex items-center gap-1">
                          <Download className="w-3 h-3" />
                          <span>{resource.downloadCount}</span>
                        </div>
                      )}
                    </div>
                    {resource.fileName && (
                      <p className="text-xs text-muted-foreground mb-3 truncate flex items-center gap-1">
                        <File className="w-3 h-3 shrink-0" />
                        {resource.fileName}
                      </p>
                    )}
                    <div className="flex gap-2 flex-wrap">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(resource)}
                        data-testid={`button-edit-resource-${resource.id}`}
                      >
                        <Pencil className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => openDeleteDialog(resource)}
                        data-testid={`button-delete-resource-${resource.id}`}
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Create Resource Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={(open) => {
        setIsCreateDialogOpen(open);
        if (!open) { createForm.reset(emptyDefaults); setCreateUpload(null); }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Resource</DialogTitle>
            <DialogDescription>Add a new resource for program participants.</DialogDescription>
          </DialogHeader>
          <Form {...createForm}>
            <form onSubmit={createForm.handleSubmit((d) => createMutation.mutate(d))} className="space-y-4">
              <ResourceFormFields
                form={createForm}
                upload={createUpload}
                onUploaded={handleCreateUpload}
                onCleared={handleCreateClearUpload}
                idPrefix="create"
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending} data-testid="button-submit-create-resource">
                  {createMutation.isPending ? "Creating..." : "Create Resource"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Resource Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
        setIsEditDialogOpen(open);
        if (!open) { editForm.reset(emptyDefaults); setEditUpload(null); setSelectedResource(null); }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Resource</DialogTitle>
            <DialogDescription>Update resource details.</DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit((d) => selectedResource && updateMutation.mutate({ id: selectedResource.id, data: d }))} className="space-y-4">
              <ResourceFormFields
                form={editForm}
                upload={editUpload}
                onUploaded={handleEditUpload}
                onCleared={handleEditClearUpload}
                idPrefix="edit"
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updateMutation.isPending} data-testid="button-submit-edit-resource">
                  {updateMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Resource</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedResource?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete-resource"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
