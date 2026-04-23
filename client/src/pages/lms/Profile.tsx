import { useRef, useState } from "react";
import { LMSSidebar } from "@/components/LMSSidebar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Camera, Loader2, User } from "lucide-react";

const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4 MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const ROLE_LABELS: Record<string, string> = {
  superadmin: "Super Admin",
  admin: "Admin",
  facilitator: "Facilitator",
  mentor: "Mentor",
  participant: "Participant",
  community_member: "Community Member",
};

export default function Profile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const initials = user
    ? `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase()
    : "?";

  const avatarSrc = previewUrl ?? user?.profileImageUrl ?? undefined;

  function handleFileClick() {
    fileInputRef.current?.click();
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a JPEG, PNG, or WebP image.",
        variant: "destructive",
      });
      e.target.value = "";
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      toast({
        title: "File too large",
        description: "Profile photos must be 4 MB or smaller.",
        variant: "destructive",
      });
      e.target.value = "";
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("avatar", file);

      const res = await fetch("/api/auth/upload-avatar", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(data.error || "Upload failed");
      }

      await queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/community/threads"] });

      toast({
        title: "Photo updated",
        description: "Your profile photo has been saved.",
      });
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Something went wrong. Please try again.";
      setPreviewUrl(null);
      toast({
        title: "Upload failed",
        description: errMsg,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  return (
    <div className="flex flex-col md:flex-row h-screen">
      <LMSSidebar />
      <main className="flex-1 overflow-auto">
        <div className="p-8 max-w-2xl">
          <h1 className="text-3xl font-bold mb-2" data-testid="text-profile-title">
            My Profile
          </h1>
          <p className="text-muted-foreground mb-8">
            Manage your personal information and profile photo.
          </p>

          <Card>
            <CardHeader>
              <CardTitle>Profile Photo</CardTitle>
              <CardDescription>JPEG, PNG, or WebP — max 4 MB</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center gap-6">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleFileChange}
                data-testid="input-avatar-file"
              />
              <button
                type="button"
                onClick={handleFileClick}
                disabled={uploading}
                className="relative rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Change profile photo"
                data-testid="button-avatar-click"
              >
                <Avatar className="h-24 w-24">
                  <AvatarImage src={avatarSrc} alt={`${user?.firstName} ${user?.lastName}`} />
                  <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
                </Avatar>
                {uploading ? (
                  <div className="absolute inset-0 flex items-center justify-center rounded-full bg-background/70">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 hover:opacity-100 transition-opacity">
                    <Camera className="h-6 w-6 text-white" />
                  </div>
                )}
              </button>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  onClick={handleFileClick}
                  disabled={uploading}
                  data-testid="button-change-photo"
                >
                  {uploading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Camera className="h-4 w-4 mr-2" />
                  )}
                  {uploading ? "Uploading…" : "Change Photo"}
                </Button>
                <p className="text-xs text-muted-foreground">
                  Click the photo or this button to upload a new image.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Account Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">First Name</p>
                  <p className="font-medium" data-testid="text-first-name">{user?.firstName}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Last Name</p>
                  <p className="font-medium" data-testid="text-last-name">{user?.lastName}</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Email Address</p>
                <p className="font-medium" data-testid="text-email">{user?.email}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Role</p>
                <Badge variant="secondary" data-testid="badge-role">
                  <User className="h-3 w-3 mr-1" />
                  {user ? (ROLE_LABELS[user.role] ?? user.role) : "—"}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
