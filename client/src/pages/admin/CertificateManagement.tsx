import { useState } from "react";
import { AdminSidebar } from "@/components/AdminSidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { 
  Search,
  Award,
  CheckCircle,
  XCircle,
  Clock,
  Download,
} from "lucide-react";
import type { Certificate, User, Course } from "@shared/schema";

interface CertificateWithDetails extends Certificate {
  user?: User;
  course?: Course;
  cohort?: { id: string; name: string; year: number | null } | null;
}

function CertificateTableSkeleton() {
  return (
    <TableRow>
      <TableCell><Skeleton className="h-10 w-10 rounded-full" /></TableCell>
      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
      <TableCell><Skeleton className="h-4 w-48" /></TableCell>
      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
      <TableCell><Skeleton className="h-6 w-20" /></TableCell>
      <TableCell><Skeleton className="h-8 w-24" /></TableCell>
    </TableRow>
  );
}

export default function CertificateManagement() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("pending");
  const [selectedCertificate, setSelectedCertificate] = useState<CertificateWithDetails | null>(null);
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);

  const { data: certificates, isLoading } = useQuery<CertificateWithDetails[]>({
    queryKey: ["/api/certificates"],
  });

  const { data: users } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const { data: courses } = useQuery<Course[]>({
    queryKey: ["/api/courses"],
  });

  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("PATCH", `/api/certificates/${id}`, { 
        approvalStatus: "approved",
        approvedAt: new Date().toISOString(),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/certificates"] });
      setIsApproveDialogOpen(false);
      setSelectedCertificate(null);
      toast({
        title: "Certificate Approved",
        description: "The certificate has been approved for download.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to approve certificate. Please try again.",
        variant: "destructive",
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("PATCH", `/api/certificates/${id}`, { 
        approvalStatus: "rejected",
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/certificates"] });
      setIsRejectDialogOpen(false);
      setSelectedCertificate(null);
      toast({
        title: "Certificate Rejected",
        description: "The certificate request has been rejected.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to reject certificate. Please try again.",
        variant: "destructive",
      });
    },
  });

  const certificatesWithDetails: CertificateWithDetails[] = certificates?.map(cert => ({
    ...cert,
    user: users?.find(u => u.id === cert.userId),
    course: courses?.find(c => c.id === cert.courseId),
  })) || [];

  const filteredCertificates = certificatesWithDetails.filter(cert => {
    const matchesSearch = 
      cert.user?.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cert.user?.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cert.course?.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cert.cohort?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cert.certificateNumber.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (activeTab === "all") return matchesSearch;
    return matchesSearch && cert.approvalStatus === activeTab;
  });

  const openApproveDialog = (certificate: CertificateWithDetails) => {
    setSelectedCertificate(certificate);
    setIsApproveDialogOpen(true);
  };

  const openRejectDialog = (certificate: CertificateWithDetails) => {
    setSelectedCertificate(certificate);
    setIsRejectDialogOpen(true);
  };

  const handleApprove = () => {
    if (selectedCertificate) {
      approveMutation.mutate(selectedCertificate.id);
    }
  };

  const handleReject = () => {
    if (selectedCertificate) {
      rejectMutation.mutate(selectedCertificate.id);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-500/10 text-green-600 dark:text-green-400";
      case "pending":
        return "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400";
      case "rejected":
        return "bg-red-500/10 text-red-600 dark:text-red-400";
      default:
        return "";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="w-4 h-4" />;
      case "pending":
        return <Clock className="w-4 h-4" />;
      case "rejected":
        return <XCircle className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    if (!firstName || !lastName) return "??";
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const certificateCounts = {
    all: certificatesWithDetails.length,
    pending: certificatesWithDetails.filter(c => c.approvalStatus === "pending").length,
    approved: certificatesWithDetails.filter(c => c.approvalStatus === "approved").length,
    rejected: certificatesWithDetails.filter(c => c.approvalStatus === "rejected").length,
  };

  return (
    <div className="flex flex-col md:flex-row h-screen">
      <AdminSidebar />
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="flex items-center justify-between gap-4 mb-8 flex-wrap">
            <div>
              <h1 className="text-3xl font-bold" data-testid="text-certificate-management-title">
                Certificate Management
              </h1>
              <p className="text-muted-foreground">
                Review and approve certificate download requests.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-md bg-muted">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{certificateCounts.all}</p>
                  <p className="text-sm text-muted-foreground">Total Certificates</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-md bg-yellow-500/10">
                  <Clock className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{certificateCounts.pending}</p>
                  <p className="text-sm text-muted-foreground">Pending Review</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-md bg-green-500/10">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{certificateCounts.approved}</p>
                  <p className="text-sm text-muted-foreground">Approved</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-md bg-red-500/10">
                  <XCircle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{certificateCounts.rejected}</p>
                  <p className="text-sm text-muted-foreground">Rejected</p>
                </div>
              </div>
            </Card>
          </div>

          <div className="mb-6">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search by name, course, or certificate number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="input-search-certificates"
              />
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList>
              <TabsTrigger value="pending" data-testid="tab-pending-certificates">
                Pending ({certificateCounts.pending})
              </TabsTrigger>
              <TabsTrigger value="approved" data-testid="tab-approved-certificates">
                Approved ({certificateCounts.approved})
              </TabsTrigger>
              <TabsTrigger value="rejected" data-testid="tab-rejected-certificates">
                Rejected ({certificateCounts.rejected})
              </TabsTrigger>
              <TabsTrigger value="all" data-testid="tab-all-certificates">
                All ({certificateCounts.all})
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab}>
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12"></TableHead>
                        <TableHead>Participant</TableHead>
                        <TableHead>Course</TableHead>
                        <TableHead>Certificate #</TableHead>
                        <TableHead>Issued Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoading ? (
                        [...Array(5)].map((_, i) => (
                          <CertificateTableSkeleton key={i} />
                        ))
                      ) : filteredCertificates.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8">
                            <Award className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                            <p className="text-muted-foreground">
                              {activeTab === "pending" 
                                ? "No certificates pending review" 
                                : "No certificates found"}
                            </p>
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredCertificates.map((certificate) => (
                          <TableRow key={certificate.id} data-testid={`row-certificate-${certificate.id}`}>
                            <TableCell>
                              <Avatar>
                                <AvatarImage src={certificate.user?.profileImageUrl || undefined} />
                                <AvatarFallback>
                                  {getInitials(certificate.user?.firstName, certificate.user?.lastName)}
                                </AvatarFallback>
                              </Avatar>
                            </TableCell>
                            <TableCell className="font-medium">
                              {certificate.user 
                                ? `${certificate.user.firstName} ${certificate.user.lastName}`
                                : "Unknown User"}
                            </TableCell>
                             <TableCell>{certificate.course?.title || (certificate.cohort ? `${certificate.cohort.name}${certificate.cohort.year ? ` · ${certificate.cohort.year}` : ""}` : "AFÁRÁ Programme")}</TableCell>
                            <TableCell className="font-mono text-sm">
                              {certificate.certificateNumber}
                            </TableCell>
                             <TableCell>{formatDate(certificate.approvalStatus === "pending" ? certificate.requestedAt : certificate.issuedAt)}</TableCell>
                            <TableCell>
                              <Badge className={getStatusColor(certificate.approvalStatus)}>
                                <span className="flex items-center gap-1">
                                  {getStatusIcon(certificate.approvalStatus)}
                                  {certificate.approvalStatus}
                                </span>
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                {certificate.approvalStatus === "pending" && (
                                  <>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="text-green-600"
                                      onClick={() => openApproveDialog(certificate)}
                                      data-testid={`button-approve-certificate-${certificate.id}`}
                                    >
                                      <CheckCircle className="w-4 h-4 mr-1" />
                                      Approve
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="text-destructive"
                                      onClick={() => openRejectDialog(certificate)}
                                      data-testid={`button-reject-certificate-${certificate.id}`}
                                    >
                                      <XCircle className="w-4 h-4 mr-1" />
                                      Reject
                                    </Button>
                                  </>
                                )}
                                {certificate.approvalStatus === "approved" && certificate.certificateUrl && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    asChild
                                  >
                                    <a href={certificate.certificateUrl} target="_blank" rel="noopener noreferrer">
                                      <Download className="w-4 h-4 mr-1" />
                                      View
                                    </a>
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

      {/* Approve Confirmation Dialog */}
      <AlertDialog open={isApproveDialogOpen} onOpenChange={setIsApproveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve Certificate</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to approve this certificate for{" "}
              <span className="font-medium">
                {selectedCertificate?.user?.firstName} {selectedCertificate?.user?.lastName}
              </span>
               ? They will be able to download their personalized{" "}
               <span className="font-medium">{selectedCertificate?.cohort ? `${selectedCertificate.cohort.name} programme certificate` : selectedCertificate?.course?.title}</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleApprove}
              className="bg-primary text-primary-foreground"
              data-testid="button-confirm-approve-certificate"
            >
              {approveMutation.isPending ? "Approving..." : "Approve"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Confirmation Dialog */}
      <AlertDialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Certificate</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to reject this certificate request for{" "}
              <span className="font-medium">
                {selectedCertificate?.user?.firstName} {selectedCertificate?.user?.lastName}
              </span>
              ? This action can be reversed later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReject}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-reject-certificate"
            >
              {rejectMutation.isPending ? "Rejecting..." : "Reject"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
