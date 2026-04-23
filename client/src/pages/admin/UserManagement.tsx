import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AdminSidebar } from "@/components/AdminSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { 
  Plus, 
  Pencil, 
  UserX, 
  UserCheck,
  Users,
  Search,
  Shield,
  GraduationCap,
  UserCog,
  Trash2,
  KeyRound,
  AlertTriangle,
} from "lucide-react";
import type { User } from "@shared/schema";

const userFormSchema = z.object({
  email: z.string().email("Invalid email address"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  role: z.enum(["community_member", "participant", "mentor", "facilitator", "admin", "superadmin"]),
  password: z.string().min(6, "Password must be at least 6 characters").optional(),
});

type UserFormData = z.infer<typeof userFormSchema>;

function UserTableSkeleton() {
  return (
    <TableRow>
      <TableCell><Skeleton className="h-10 w-10 rounded-full" /></TableCell>
      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
      <TableCell><Skeleton className="h-4 w-48" /></TableCell>
      <TableCell><Skeleton className="h-6 w-20" /></TableCell>
      <TableCell><Skeleton className="h-6 w-16" /></TableCell>
      <TableCell><Skeleton className="h-8 w-24" /></TableCell>
    </TableRow>
  );
}

export default function UserManagement() {
  const { toast } = useToast();
  const { isSuperAdmin, user: currentUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeactivateDialogOpen, setIsDeactivateDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isResetPasswordDialogOpen, setIsResetPasswordDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  const createForm = useForm<UserFormData>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      email: "",
      firstName: "",
      lastName: "",
      role: "participant",
      password: "",
    },
  });

  const editForm = useForm<UserFormData>({
    resolver: zodResolver(userFormSchema.omit({ password: true })),
    defaultValues: {
      email: "",
      firstName: "",
      lastName: "",
      role: "participant",
    },
  });

  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: UserFormData) => {
      const res = await apiRequest("POST", "/api/admin/users", {
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role,
      });
      return res.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setIsCreateDialogOpen(false);
      createForm.reset();
      const teamRoles = ["mentor", "facilitator", "admin", "superadmin"];
      const sentEmail = teamRoles.includes(variables.role);
      toast({
        title: "User Created",
        description: sentEmail
          ? `Account created and login credentials emailed to ${variables.email}.`
          : "The user account has been created successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create user. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<UserFormData> }) => {
      const res = await apiRequest("PATCH", `/api/users/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setIsEditDialogOpen(false);
      setSelectedUser(null);
      editForm.reset();
      toast({
        title: "User Updated",
        description: "The user has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update user. Please try again.",
        variant: "destructive",
      });
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const res = await apiRequest("PATCH", `/api/users/${id}`, { isActive });
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setIsDeactivateDialogOpen(false);
      setSelectedUser(null);
      toast({
        title: variables.isActive ? "User Activated" : "User Deactivated",
        description: `The user has been ${variables.isActive ? "activated" : "deactivated"} successfully.`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update user status. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/users/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setIsDeleteDialogOpen(false);
      setDeleteConfirmText("");
      setSelectedUser(null);
      toast({
        title: "User Deleted",
        description: "The user account has been permanently deleted.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete user. Please try again.",
        variant: "destructive",
      });
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("POST", `/api/users/${id}/reset-password`);
      return res.json();
    },
    onSuccess: () => {
      setIsResetPasswordDialogOpen(false);
      setSelectedUser(null);
      toast({
        title: "Password Reset",
        description: "User password has been reset to the default (Admin123!).",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to reset password. Please try again.",
        variant: "destructive",
      });
    },
  });

  const filteredUsers = users?.filter(user => {
    const matchesSearch = 
      user.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (activeTab === "all") return matchesSearch;
    if (activeTab === "admin") return matchesSearch && (user.role === "admin" || user.role === "superadmin");
    return matchesSearch && user.role === activeTab;
  }) || [];

  const handleCreateSubmit = (data: UserFormData) => {
    createMutation.mutate(data);
  };

  const handleEditSubmit = (data: UserFormData) => {
    if (selectedUser) {
      updateMutation.mutate({ id: selectedUser.id, data });
    }
  };

  const openEditDialog = (user: User) => {
    setSelectedUser(user);
    editForm.reset({
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role as UserFormData["role"],
    });
    setIsEditDialogOpen(true);
  };

  const openDeactivateDialog = (user: User) => {
    setSelectedUser(user);
    setIsDeactivateDialogOpen(true);
  };

  const openDeleteDialog = (user: User) => {
    setSelectedUser(user);
    setDeleteConfirmText("");
    setIsDeleteDialogOpen(true);
  };

  const handleToggleActive = () => {
    if (selectedUser) {
      toggleActiveMutation.mutate({ id: selectedUser.id, isActive: !selectedUser.isActive });
    }
  };

  const handleDelete = () => {
    if (selectedUser) {
      deleteMutation.mutate(selectedUser.id);
    }
  };

  const openResetPasswordDialog = (user: User) => {
    setSelectedUser(user);
    setIsResetPasswordDialogOpen(true);
  };

  const handleResetPassword = () => {
    if (selectedUser) {
      resetPasswordMutation.mutate(selectedUser.id);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "superadmin":
        return "bg-purple-500/10 text-purple-600 dark:text-purple-400";
      case "admin":
        return "bg-red-500/10 text-red-600 dark:text-red-400";
      case "facilitator":
        return "bg-blue-500/10 text-blue-600 dark:text-blue-400";
      case "mentor":
        return "bg-green-500/10 text-green-600 dark:text-green-400";
      case "community_member":
        return "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400";
      default:
        return "bg-gray-500/10 text-gray-600 dark:text-gray-400";
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "superadmin":
      case "admin":
        return <Shield className="w-4 h-4" />;
      case "facilitator":
        return <GraduationCap className="w-4 h-4" />;
      case "mentor":
        return <UserCog className="w-4 h-4" />;
      default:
        return <Users className="w-4 h-4" />;
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const userCounts = {
    all: users?.length || 0,
    community_member: users?.filter(u => u.role === "community_member").length || 0,
    participant: users?.filter(u => u.role === "participant").length || 0,
    mentor: users?.filter(u => u.role === "mentor").length || 0,
    facilitator: users?.filter(u => u.role === "facilitator").length || 0,
    admin: users?.filter(u => u.role === "admin" || u.role === "superadmin").length || 0,
  };

  return (
    <div className="flex flex-col md:flex-row h-screen">
      <AdminSidebar />
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="flex items-center justify-between gap-4 mb-8 flex-wrap">
            <div>
              <h1 className="text-3xl font-bold" data-testid="text-user-management-title">
                User Management
              </h1>
              <p className="text-muted-foreground">
                Manage platform users, roles, and permissions.
              </p>
            </div>
            <Button onClick={() => setIsCreateDialogOpen(true)} data-testid="button-create-user">
              <Plus className="w-4 h-4 mr-2" />
              Add User
            </Button>
          </div>

          <div className="mb-6">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="input-search-users"
              />
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList>
              <TabsTrigger value="all" data-testid="tab-all-users">
                All ({userCounts.all})
              </TabsTrigger>
              <TabsTrigger value="community_member" data-testid="tab-community-members">
                Community ({userCounts.community_member})
              </TabsTrigger>
              <TabsTrigger value="participant" data-testid="tab-participants">
                Cohort Members ({userCounts.participant})
              </TabsTrigger>
              <TabsTrigger value="mentor" data-testid="tab-mentors">
                Mentors ({userCounts.mentor})
              </TabsTrigger>
              <TabsTrigger value="facilitator" data-testid="tab-facilitators">
                Facilitators ({userCounts.facilitator})
              </TabsTrigger>
              <TabsTrigger value="admin" data-testid="tab-admins">
                Admins ({userCounts.admin})
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab}>
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12"></TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoading ? (
                        [...Array(5)].map((_, i) => (
                          <UserTableSkeleton key={i} />
                        ))
                      ) : filteredUsers.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8">
                            <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                            <p className="text-muted-foreground">No users found</p>
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredUsers.map((user) => (
                          <TableRow key={user.id} data-testid={`row-user-${user.id}`}>
                            <TableCell>
                              <Avatar>
                                <AvatarImage src={user.profileImageUrl || undefined} />
                                <AvatarFallback>{getInitials(user.firstName, user.lastName)}</AvatarFallback>
                              </Avatar>
                            </TableCell>
                            <TableCell className="font-medium">
                              {user.firstName} {user.lastName}
                            </TableCell>
                            <TableCell>{user.email}</TableCell>
                            <TableCell>
                              <Badge className={getRoleColor(user.role)}>
                                <span className="flex items-center gap-1">
                                  {getRoleIcon(user.role)}
                                  {user.role}
                                </span>
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant={user.isActive ? "default" : "secondary"}>
                                {user.isActive ? "Active" : "Inactive"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openEditDialog(user)}
                                  data-testid={`button-edit-user-${user.id}`}
                                  title="Edit user"
                                >
                                  <Pencil className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openResetPasswordDialog(user)}
                                  data-testid={`button-reset-password-user-${user.id}`}
                                  title="Reset to default password"
                                >
                                  <KeyRound className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openDeactivateDialog(user)}
                                  data-testid={`button-toggle-user-${user.id}`}
                                  title={user.isActive ? "Deactivate user" : "Activate user"}
                                >
                                  {user.isActive ? (
                                    <UserX className="w-4 h-4 text-destructive" />
                                  ) : (
                                    <UserCheck className="w-4 h-4 text-green-600" />
                                  )}
                                </Button>
                                {isSuperAdmin && user.id !== currentUser?.id && (
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => openDeleteDialog(user)}
                                    data-testid={`button-delete-user-${user.id}`}
                                    disabled={deleteMutation.isPending}
                                    title="Delete user (Super Admin only)"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Create User Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={(open) => {
        setIsCreateDialogOpen(open);
        if (!open) createForm.reset();
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>
              Create a new user account for the platform.
            </DialogDescription>
          </DialogHeader>
          <Form {...createForm}>
            <form onSubmit={createForm.handleSubmit(handleCreateSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={createForm.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="First name" 
                          {...field}
                          data-testid="input-user-firstname"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createForm.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Last name" 
                          {...field}
                          data-testid="input-user-lastname"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={createForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input 
                        type="email"
                        placeholder="email@example.com" 
                        {...field}
                        data-testid="input-user-email"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={createForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input 
                        type="password"
                        placeholder="Minimum 6 characters" 
                        {...field}
                        data-testid="input-user-password"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={createForm.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-user-role">
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="community_member">Community Member</SelectItem>
                        <SelectItem value="participant">Participant (Cohort member)</SelectItem>
                        <SelectItem value="mentor">Mentor</SelectItem>
                        <SelectItem value="facilitator">Facilitator</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                        {isSuperAdmin && (
                          <SelectItem value="superadmin">Super Admin</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending} data-testid="button-submit-create-user">
                  {createMutation.isPending ? "Creating..." : "Create User"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
        setIsEditDialogOpen(open);
        if (!open) {
          editForm.reset();
          setSelectedUser(null);
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user details and role.
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(handleEditSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="First name" 
                          {...field}
                          data-testid="input-edit-user-firstname"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Last name" 
                          {...field}
                          data-testid="input-edit-user-lastname"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={editForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input 
                        type="email"
                        placeholder="email@example.com" 
                        {...field}
                        data-testid="input-edit-user-email"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-edit-user-role">
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="community_member">Community Member</SelectItem>
                        <SelectItem value="participant">Participant (Cohort member)</SelectItem>
                        <SelectItem value="mentor">Mentor</SelectItem>
                        <SelectItem value="facilitator">Facilitator</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                        {isSuperAdmin && (
                          <SelectItem value="superadmin">Super Admin</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updateMutation.isPending} data-testid="button-submit-edit-user">
                  {updateMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Deactivate/Activate Confirmation Dialog */}
      <AlertDialog open={isDeactivateDialogOpen} onOpenChange={setIsDeactivateDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {selectedUser?.isActive ? "Deactivate User" : "Activate User"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {selectedUser?.isActive
                ? `Are you sure you want to deactivate "${selectedUser?.firstName} ${selectedUser?.lastName}"? They will no longer be able to access the platform.`
                : `Are you sure you want to activate "${selectedUser?.firstName} ${selectedUser?.lastName}"? They will be able to access the platform again.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleToggleActive}
              className={selectedUser?.isActive ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}
              data-testid="button-confirm-toggle-user"
            >
              {toggleActiveMutation.isPending 
                ? "Processing..." 
                : selectedUser?.isActive 
                  ? "Deactivate" 
                  : "Activate"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete User Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={(open) => {
        setIsDeleteDialogOpen(open);
        if (!open) setDeleteConfirmText("");
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-destructive" />
              </div>
              <DialogTitle className="text-destructive">Delete User Account</DialogTitle>
            </div>
            <DialogDescription className="pt-1">
              This will <strong>permanently delete</strong> {selectedUser?.firstName} {selectedUser?.lastName}'s account and all associated data. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">
              To confirm, type <strong className="text-foreground">{selectedUser?.firstName} {selectedUser?.lastName}</strong> below:
            </p>
            <Input
              placeholder="Type full name to confirm"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              data-testid="input-delete-confirm"
              autoComplete="off"
            />
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => { setIsDeleteDialogOpen(false); setDeleteConfirmText(""); }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={
                deleteMutation.isPending ||
                deleteConfirmText !== `${selectedUser?.firstName} ${selectedUser?.lastName}`
              }
              data-testid="button-confirm-delete-user"
            >
              {deleteMutation.isPending ? "Deleting..." : "Permanently Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password Confirmation Dialog */}
      <AlertDialog open={isResetPasswordDialogOpen} onOpenChange={setIsResetPasswordDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset Password</AlertDialogTitle>
            <AlertDialogDescription>
              This will reset <strong>{selectedUser?.firstName} {selectedUser?.lastName}</strong>'s password to the default (<strong>Admin123!</strong>). They will be able to log in with this password immediately.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleResetPassword}
              data-testid="button-confirm-reset-password"
            >
              {resetPasswordMutation.isPending ? "Resetting..." : "Reset Password"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
