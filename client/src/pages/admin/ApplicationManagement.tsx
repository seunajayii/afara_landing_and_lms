import { useState } from "react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { 
  Search, 
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Users,
  FileText,
  Building2,
  Mail,
  MapPin,
  ThumbsUp,
  Bookmark,
} from "lucide-react";
import type { Application } from "@shared/schema";
import { format } from "date-fns";

function TableSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4, 5].map((i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  );
}

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  draft: { label: "Draft", variant: "secondary" },
  submitted: { label: "Submitted", variant: "default" },
  under_review: { label: "Under Review", variant: "outline" },
  accepted: { label: "Accepted", variant: "default" },
  rejected: { label: "Rejected", variant: "destructive" },
  waitlisted: { label: "Waitlisted", variant: "secondary" },
};

export default function ApplicationManagement() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [reviewNotes, setReviewNotes] = useState("");

  const { data: applications = [], isLoading } = useQuery<Application[]>({
    queryKey: ["/api/applications"],
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, reviewNotes }: { id: string; status: string; reviewNotes: string }) => {
      const response = await apiRequest("PATCH", `/api/admin/applications/${id}`, { 
        status, 
        reviewNotes,
        reviewedAt: new Date().toISOString()
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/applications"] });
      toast({ title: "Application Updated", description: "The application status has been updated." });
      setIsStatusDialogOpen(false);
      setSelectedApplication(null);
      setNewStatus("");
      setReviewNotes("");
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update application.", variant: "destructive" });
    },
  });

  const filteredApplications = applications.filter((app) => {
    const matchesSearch = 
      app.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.companyLegalName?.toLowerCase().includes(searchQuery.toLowerCase());

    if (activeTab === "all") return matchesSearch;
    if (activeTab === "pending") return matchesSearch && (app.status === "submitted" || app.status === "under_review");
    return matchesSearch && app.status === activeTab;
  });

  const stats = {
    total: applications.length,
    pending: applications.filter(a => a.status === "submitted" || a.status === "under_review").length,
    accepted: applications.filter(a => a.status === "accepted").length,
    rejected: applications.filter(a => a.status === "rejected").length,
  };

  const handleViewApplication = (app: Application) => {
    setSelectedApplication(app);
    setIsViewDialogOpen(true);
  };

  const handleStatusChange = (app: Application) => {
    setSelectedApplication(app);
    setNewStatus(app.status);
    setReviewNotes(app.reviewNotes || "");
    setIsStatusDialogOpen(true);
  };

  const handleUpdateStatus = () => {
    if (selectedApplication && newStatus) {
      updateStatusMutation.mutate({ 
        id: selectedApplication.id, 
        status: newStatus,
        reviewNotes 
      });
    }
  };

  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <main className="flex-1 p-6 bg-background overflow-auto">
        <div className="max-w-7xl mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Application Management</h1>
            <p className="text-muted-foreground mt-1">Review and manage program applications</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
                <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="text-total-applications">{stats.total}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
                <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600" data-testid="text-pending-applications">{stats.pending}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
                <CardTitle className="text-sm font-medium">Accepted</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600" data-testid="text-accepted-applications">{stats.accepted}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
                <CardTitle className="text-sm font-medium">Rejected</CardTitle>
                <XCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600" data-testid="text-rejected-applications">{stats.rejected}</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <CardTitle>Applications</CardTitle>
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search applications..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                    data-testid="input-search-applications"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="mb-4">
                  <TabsTrigger value="all" data-testid="tab-all">All ({applications.length})</TabsTrigger>
                  <TabsTrigger value="pending" data-testid="tab-pending">Pending ({stats.pending})</TabsTrigger>
                  <TabsTrigger value="accepted" data-testid="tab-accepted">Accepted ({stats.accepted})</TabsTrigger>
                  <TabsTrigger value="rejected" data-testid="tab-rejected">Rejected ({stats.rejected})</TabsTrigger>
                </TabsList>

                <TabsContent value={activeTab}>
                  {isLoading ? (
                    <TableSkeleton />
                  ) : filteredApplications.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No applications found
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Applicant</TableHead>
                            <TableHead>Company</TableHead>
                            <TableHead>Industry</TableHead>
                            <TableHead>Submitted</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredApplications.map((app) => (
                            <TableRow key={app.id} data-testid={`row-application-${app.id}`}>
                              <TableCell>
                                <div>
                                  <div className="font-medium">{app.firstName} {app.lastName}</div>
                                  <div className="text-sm text-muted-foreground">{app.email}</div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="font-medium">{app.companyLegalName || "N/A"}</div>
                                <div className="text-sm text-muted-foreground">{app.companyCountry || ""}</div>
                              </TableCell>
                              <TableCell>{app.primarySector || "N/A"}</TableCell>
                              <TableCell>
                                {app.submittedAt ? format(new Date(app.submittedAt), "MMM d, yyyy") : "N/A"}
                              </TableCell>
                              <TableCell>
                                <Badge variant={statusConfig[app.status]?.variant || "secondary"}>
                                  {statusConfig[app.status]?.label || app.status}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleViewApplication(app)}
                                    data-testid={`button-view-${app.id}`}
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  {(app.status === "submitted" || app.status === "under_review") && (
                                    <>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => updateStatusMutation.mutate({ id: app.id, status: "accepted", reviewNotes: app.reviewNotes || "" })}
                                        disabled={updateStatusMutation.isPending}
                                        data-testid={`button-accept-${app.id}`}
                                        title="Accept & Promote to Participant"
                                      >
                                        <ThumbsUp className="h-4 w-4 text-green-600" />
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => updateStatusMutation.mutate({ id: app.id, status: "waitlisted", reviewNotes: app.reviewNotes || "" })}
                                        disabled={updateStatusMutation.isPending}
                                        data-testid={`button-waitlist-${app.id}`}
                                        title="Waitlist"
                                      >
                                        <Bookmark className="h-4 w-4 text-yellow-600" />
                                      </Button>
                                    </>
                                  )}
                                  <Button
                                    size="sm"
                                    onClick={() => handleStatusChange(app)}
                                    data-testid={`button-status-${app.id}`}
                                  >
                                    Update
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </main>

      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Application Details</DialogTitle>
            <DialogDescription>
              Full application from {selectedApplication?.firstName} {selectedApplication?.lastName}
            </DialogDescription>
          </DialogHeader>
          {selectedApplication && (
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <Badge variant={statusConfig[selectedApplication.status]?.variant || "secondary"}>
                  {statusConfig[selectedApplication.status]?.label || selectedApplication.status}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  Submitted {selectedApplication.submittedAt ? format(new Date(selectedApplication.submittedAt), "MMMM d, yyyy") : "N/A"}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    Personal Information
                  </div>
                  <div className="font-medium">{selectedApplication.firstName} {selectedApplication.lastName}</div>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    Email
                  </div>
                  <div className="font-medium">{selectedApplication.email}</div>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    Location
                  </div>
                  <div className="font-medium">
                    {[selectedApplication.companyHeadquarters, selectedApplication.companyCountry].filter(Boolean).join(", ") || "Not specified"}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Building2 className="h-4 w-4" />
                    Company
                  </div>
                  <div className="font-medium">{selectedApplication.companyLegalName || "Not specified"}</div>
                  <div className="text-sm text-muted-foreground">{selectedApplication.primarySector || ""}</div>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t">
                <div>
                  <h4 className="font-medium mb-1">Primary Sector</h4>
                  <p className="text-muted-foreground">{selectedApplication.primarySector || "Not specified"}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-1">Years of Experience</h4>
                    <p className="text-muted-foreground">{selectedApplication.yearsOfExperience ?? "Not specified"}</p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Ownership %</h4>
                    <p className="text-muted-foreground">{selectedApplication.ownershipPercentage != null ? `${selectedApplication.ownershipPercentage}%` : "Not specified"}</p>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-1">Professional Background</h4>
                  <p className="text-muted-foreground whitespace-pre-wrap">{selectedApplication.professionalBackground || "Not provided"}</p>
                </div>
                <div>
                  <h4 className="font-medium mb-1">Main Challenges</h4>
                  <p className="text-muted-foreground whitespace-pre-wrap">{selectedApplication.mainChallenges || "Not provided"}</p>
                </div>
                <div>
                  <h4 className="font-medium mb-1">Why AFÁRÁ is Right</h4>
                  <p className="text-muted-foreground whitespace-pre-wrap">{selectedApplication.whyAfaraIsRight || "Not provided"}</p>
                </div>
                {selectedApplication.reviewNotes && (
                  <div className="pt-4 border-t">
                    <h4 className="font-medium mb-1">Review Notes</h4>
                    <p className="text-muted-foreground whitespace-pre-wrap">{selectedApplication.reviewNotes}</p>
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Close
            </Button>
            <Button onClick={() => {
              setIsViewDialogOpen(false);
              if (selectedApplication) handleStatusChange(selectedApplication);
            }}>
              Update Status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Application Status</DialogTitle>
            <DialogDescription>
              Change the status for {selectedApplication?.firstName} {selectedApplication?.lastName}'s application
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger data-testid="select-new-status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="under_review">Under Review</SelectItem>
                  <SelectItem value="accepted">Accepted</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="waitlisted">Waitlisted</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Review Notes</label>
              <Textarea
                placeholder="Add notes about this application..."
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                className="min-h-[100px]"
                data-testid="textarea-review-notes"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsStatusDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleUpdateStatus} 
              disabled={updateStatusMutation.isPending}
              data-testid="button-save-status"
            >
              {updateStatusMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
