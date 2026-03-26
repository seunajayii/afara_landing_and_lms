import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, KeyRound, Eye, EyeOff } from "lucide-react";

export default function ChangePassword() {
  const [, setLocation] = useLocation();
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    setLocation("/login");
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      toast({ title: "Password too short", description: "Password must be at least 8 characters.", variant: "destructive" });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: "Passwords don't match", description: "Please make sure both passwords are the same.", variant: "destructive" });
      return;
    }
    setIsSaving(true);
    try {
      const res = await apiRequest("POST", "/api/auth/change-password", { newPassword });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to change password");
      }
      await queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      toast({ title: "Password updated", description: "Your password has been changed successfully." });
      const role = user.role;
      if (role === "admin" || role === "superadmin") {
        setLocation("/admin/dashboard");
      } else {
        setLocation("/lms/dashboard");
      }
    } catch (error: any) {
      toast({ title: "Error", description: error?.message || "Failed to change password", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <KeyRound className="w-6 h-6 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl text-primary">Set Your Password</CardTitle>
          <CardDescription>
            Welcome, {user.firstName}! You're using a default password. Please set a new personal password to continue.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showNew ? "text" : "password"}
                  placeholder="Minimum 8 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  data-testid="input-new-password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowNew((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  tabIndex={-1}
                  data-testid="button-toggle-new-password"
                >
                  {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <div className="relative">
                <Input
                  id="confirm-password"
                  type={showConfirm ? "text" : "password"}
                  placeholder="Re-enter your new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  data-testid="input-confirm-password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  tabIndex={-1}
                  data-testid="button-toggle-confirm-password"
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {newPassword && confirmPassword && newPassword !== confirmPassword && (
              <p className="text-sm text-destructive">Passwords don't match</p>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={isSaving || !newPassword || !confirmPassword}
              data-testid="button-change-password"
            >
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Set New Password
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
