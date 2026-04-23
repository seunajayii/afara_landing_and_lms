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
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
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
import { Separator } from "@/components/ui/separator";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  Search,
  Eye,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  Users,
  FileText,
  Building2,
  Mail,
  MapPin,
  Phone,
  Briefcase,
  TrendingUp,
  DollarSign,
  Zap,
  HeartHandshake,
  Star,
  Globe,
  ExternalLink,
  Link2,
  BarChart2,
  Target,
  Lightbulb,
  Calendar,
  Shield,
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

// ─── Helper components ──────────────────────────────────────────────────────

function YesNoBadge({ value }: { value: boolean | null | undefined }) {
  if (value == null) return <span className="text-muted-foreground text-sm">Not specified</span>;
  return (
    <Badge variant={value ? "default" : "secondary"}>
      {value ? "Yes" : "No"}
    </Badge>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">{children}</div>;
}

function FieldValue({ children, empty = "Not provided" }: { children?: React.ReactNode; empty?: string }) {
  if (!children || (typeof children === "string" && !children.trim())) {
    return <div className="text-sm text-muted-foreground italic">{empty}</div>;
  }
  return <div className="text-sm text-foreground">{children}</div>;
}

function LongText({ value }: { value: string | null | undefined }) {
  if (!value?.trim()) return <div className="text-sm text-muted-foreground italic">Not provided</div>;
  return (
    <div className="text-sm text-foreground whitespace-pre-wrap bg-muted/40 rounded-md px-3 py-2 leading-relaxed">
      {value}
    </div>
  );
}

function FileLink({ url, label }: { url: string | null | undefined; label: string }) {
  if (!url?.trim()) return <div className="text-sm text-muted-foreground italic">Not uploaded</div>;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 text-sm text-primary underline underline-offset-2 hover:opacity-80"
    >
      <ExternalLink className="h-3.5 w-3.5 flex-shrink-0" />
      {label}
    </a>
  );
}

function BadgeList({ items }: { items: string[] | null | undefined }) {
  if (!items || items.length === 0) return <div className="text-sm text-muted-foreground italic">None specified</div>;
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <Badge key={item} variant="outline" className="text-xs font-normal">
          {item}
        </Badge>
      ))}
    </div>
  );
}

function SectionCard({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      </div>
      <Separator />
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function Grid2({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{children}</div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      {children}
    </div>
  );
}

// ─── Full application preview ────────────────────────────────────────────────

function ApplicationPreviewSheet({
  app,
  open,
  onClose,
  onUpdateStatus,
}: {
  app: Application | null;
  open: boolean;
  onClose: () => void;
  onUpdateStatus: (app: Application) => void;
}) {
  if (!app) return null;

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-3xl overflow-y-auto flex flex-col gap-0 p-0"
      >
        {/* Header */}
        <SheetHeader className="px-6 pt-6 pb-4 border-b sticky top-0 bg-background z-10">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <SheetTitle className="text-lg font-semibold">
                {app.firstName} {app.lastName}
              </SheetTitle>
              <SheetDescription className="mt-0.5">
                {app.companyName || app.companyLegalName || "No company name"} &middot; {app.email}
              </SheetDescription>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant={statusConfig[app.status]?.variant || "secondary"}>
                {statusConfig[app.status]?.label || app.status}
              </Badge>
              {app.submittedAt && (
                <span className="text-xs text-muted-foreground">
                  Submitted {format(new Date(app.submittedAt), "d MMM yyyy")}
                </span>
              )}
            </div>
          </div>
          <div className="pt-2">
            <Button size="sm" onClick={() => onUpdateStatus(app)} data-testid="button-sheet-update-status">
              Update Status / Add Notes
            </Button>
          </div>
        </SheetHeader>

        {/* Body */}
        <div className="px-6 py-6 space-y-8 flex-1">

          {/* Review notes (if any) */}
          {app.reviewNotes && (
            <div className="bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 rounded-md p-4">
              <div className="text-xs font-semibold text-yellow-800 dark:text-yellow-300 uppercase tracking-wide mb-1">
                Review Notes
              </div>
              <p className="text-sm text-yellow-900 dark:text-yellow-200 whitespace-pre-wrap">{app.reviewNotes}</p>
            </div>
          )}

          {/* ── Section 1: Personal Information ── */}
          <SectionCard icon={Users} title="Personal Information">
            <Grid2>
              <Field label="First Name"><FieldValue>{app.firstName}</FieldValue></Field>
              <Field label="Last Name"><FieldValue>{app.lastName}</FieldValue></Field>
              <Field label="Email Address"><FieldValue>{app.email}</FieldValue></Field>
              <Field label="Phone Number"><FieldValue>{app.phone}</FieldValue></Field>
              <Field label="Country of Operation"><FieldValue>{app.countryOfOperation}</FieldValue></Field>
              <Field label="Company Name"><FieldValue>{app.companyName}</FieldValue></Field>
              <Field label="Role in Company"><FieldValue>{app.roleInCompany}</FieldValue></Field>
              {app.linkedinUrl && (
                <Field label="LinkedIn Profile">
                  <a
                    href={app.linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm text-primary underline underline-offset-2 hover:opacity-80"
                  >
                    <Link2 className="h-3.5 w-3.5 flex-shrink-0" />
                    View Profile
                  </a>
                </Field>
              )}
            </Grid2>
            <Field label="Personal Statement"><LongText value={app.personalStatement} /></Field>
            {app.videoEssayUrl && (
              <Field label="Video Essay">
                <a
                  href={app.videoEssayUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-primary underline underline-offset-2 hover:opacity-80"
                >
                  <ExternalLink className="h-3.5 w-3.5 flex-shrink-0" />
                  Watch Video Essay
                </a>
              </Field>
            )}
          </SectionCard>

          {/* ── Section 2: Background & Sector ── */}
          <SectionCard icon={Briefcase} title="Background & Sector Experience">
            <Grid2>
              <Field label="Primary Sector"><FieldValue>{app.primarySector}</FieldValue></Field>
              <Field label="Years of Experience">
                <FieldValue>{app.yearsOfExperience != null ? `${app.yearsOfExperience} years` : undefined}</FieldValue>
              </Field>
              <Field label="Sector Specification"><FieldValue>{app.sectorSpecification}</FieldValue></Field>
              <Field label="Has Led Teams"><YesNoBadge value={app.hasLedTeams} /></Field>
              <Field label="Has Project Experience"><YesNoBadge value={app.hasProjectExperience} /></Field>
            </Grid2>
            <Field label="Sub-Sectors"><BadgeList items={app.subSectors} /></Field>
            {app.otherSubSector && (
              <Field label="Other Sub-Sector"><FieldValue>{app.otherSubSector}</FieldValue></Field>
            )}
            <Field label="Professional Background"><LongText value={app.professionalBackground} /></Field>
            <Field label="Key Responsibilities"><LongText value={app.keyResponsibilities} /></Field>
            <Field label="Major Achievements"><LongText value={app.majorAchievements} /></Field>
            {app.hasLedTeams && (
              <Field label="Team Leadership Experience"><LongText value={app.teamLeadershipExperience} /></Field>
            )}
            {app.hasProjectExperience && (
              <Field label="Project Experience"><LongText value={app.projectExperience} /></Field>
            )}
          </SectionCard>

          {/* ── Section 3: Business Overview & Ownership ── */}
          <SectionCard icon={Building2} title="Business Overview & Ownership">
            <Grid2>
              <Field label="Company Legal Name"><FieldValue>{app.companyLegalName}</FieldValue></Field>
              <Field label="Country of Registration"><FieldValue>{app.companyCountry}</FieldValue></Field>
              <Field label="Headquarters"><FieldValue>{app.companyHeadquarters}</FieldValue></Field>
              <Field label="Incorporation Year">
                <FieldValue>{app.incorporationYear != null ? String(app.incorporationYear) : undefined}</FieldValue>
              </Field>
              <Field label="Ownership Percentage">
                <FieldValue>{app.ownershipPercentage != null ? `${app.ownershipPercentage}%` : undefined}</FieldValue>
              </Field>
              <Field label="Number of Shareholders">
                <FieldValue>{app.numberOfShareholders != null ? String(app.numberOfShareholders) : undefined}</FieldValue>
              </Field>
              <Field label="Shareholders Over 25%"><YesNoBadge value={app.shareholdersOver25Percent} /></Field>
              <Field label="Is Raising Funding"><YesNoBadge value={app.isRaisingFunding} /></Field>
              <Field label="Business Stage"><FieldValue>{app.businessStage}</FieldValue></Field>
            </Grid2>
            <Field label="Registration Proof">
              <FileLink url={app.registrationProofUrl} label="View Registration Document" />
            </Field>
            <Field label="Business Description"><LongText value={app.businessDescription} /></Field>
            <Field label="Problem Being Solved"><LongText value={app.problemBeingSolved} /></Field>
            <Field label="Traction Evidence"><LongText value={app.tractionEvidence} /></Field>
            <Field label="Target Market"><LongText value={app.targetMarket} /></Field>
            <Field label="Scalability Explanation"><LongText value={app.scalabilityExplanation} /></Field>
            <Field label="Growth Plans"><LongText value={app.growthPlans} /></Field>
          </SectionCard>

          {/* ── Section 4: Financial Documentation ── */}
          <SectionCard icon={DollarSign} title="Financial Documentation & Compliance">
            <Grid2>
              <Field label="Incorporated"><YesNoBadge value={app.isIncorporated} /></Field>
              <Field label="Tax Registered"><YesNoBadge value={app.isTaxRegistered} /></Field>
              <Field label="Keeps Financial Records"><YesNoBadge value={app.keepsFinancialRecords} /></Field>
              <Field label="Can Provide Financials"><YesNoBadge value={app.canProvideFinancials} /></Field>
            </Grid2>
            <Field label="Revenue Streams"><LongText value={app.revenueStreams} /></Field>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Incorporation Certificate">
                <FileLink url={app.incorporationCertificateUrl} label="View Certificate" />
              </Field>
              <Field label="Pitch Deck">
                <FileLink url={app.pitchDeckUrl} label="View Pitch Deck" />
              </Field>
              <Field label="Business Plan">
                <FileLink url={app.businessPlanUrl} label="View Business Plan" />
              </Field>
              <Field label="Financial Statements">
                <FileLink url={app.financialStatementsUrl} label="View Financials" />
              </Field>
            </div>
          </SectionCard>

          {/* ── Section 5: Project Readiness & Impact ── */}
          <SectionCard icon={Zap} title="Project Readiness & Impact">
            <Grid2>
              <Field label="Project Location"><FieldValue>{app.projectLocation}</FieldValue></Field>
              <Field label="Project Sector"><FieldValue>{app.projectSector}</FieldValue></Field>
              <Field label="Project Stage"><FieldValue>{app.projectStage}</FieldValue></Field>
              <Field label="Current Status"><FieldValue>{app.projectCurrentStatus}</FieldValue></Field>
              <Field label="Creates Women Opportunities">
                <YesNoBadge value={app.createsWomenOpportunities} />
              </Field>
            </Grid2>
            <Field label="Project Documents"><BadgeList items={app.projectDocuments} /></Field>
            {app.otherProjectDocuments && (
              <Field label="Other Project Documents"><FieldValue>{app.otherProjectDocuments}</FieldValue></Field>
            )}
            <Field label="Project Description"><LongText value={app.projectDescription} /></Field>
            <Field label="Projected Impact"><LongText value={app.projectedImpact} /></Field>
            <Field label="Business Impact"><LongText value={app.businessImpact} /></Field>
            <Field label="Primary Beneficiaries"><LongText value={app.primaryBeneficiaries} /></Field>
            <Field label="Infrastructure Gap Contribution">
              <LongText value={app.infrastructureGapContribution} />
            </Field>
            {app.createsWomenOpportunities && (
              <Field label="Women Opportunities Description">
                <LongText value={app.womenOpportunitiesDescription} />
              </Field>
            )}
          </SectionCard>

          {/* ── Section 6: Support Needs ── */}
          <SectionCard icon={HeartHandshake} title="Support Needs & Project Advancement">
            <Grid2>
              <Field label="Funding Required"><FieldValue>{app.fundingRequired}</FieldValue></Field>
              <Field label="Expected Timeline"><FieldValue>{app.expectedTimeline}</FieldValue></Field>
            </Grid2>
            <Field label="Support Areas Needed"><BadgeList items={app.supportAreasNeeded} /></Field>
            {app.otherSupportArea && (
              <Field label="Other Support Area"><FieldValue>{app.otherSupportArea}</FieldValue></Field>
            )}
            <Field label="Main Challenges"><LongText value={app.mainChallenges} /></Field>
            <Field label="Key Activities for Next Stage">
              <LongText value={app.keyActivitiesForNextStage} />
            </Field>
            <Field label="Specific Program Outcomes">
              <LongText value={app.specificProgramOutcomes} />
            </Field>
          </SectionCard>

          {/* ── Section 7: Founder Commitment ── */}
          <SectionCard icon={Star} title="Founder Commitment & Peer Support">
            <Grid2>
              <Field label="Hours Per Week Committed">
                <FieldValue>
                  {app.hoursPerWeek != null ? `${app.hoursPerWeek} hrs/week` : undefined}
                </FieldValue>
              </Field>
              <Field label="Open to Mentorship"><YesNoBadge value={app.openToMentorship} /></Field>
              <Field label="Can Commit to Full Program"><YesNoBadge value={app.canCommitToProgram} /></Field>
              <Field label="Can Attend Lagos Event"><YesNoBadge value={app.canAttendLagosEvent} /></Field>
              <Field label="Willing to Mentor Others"><YesNoBadge value={app.willingToMentor} /></Field>
            </Grid2>
            <Field label="Commitment Management Plan">
              <LongText value={app.commitmentManagementPlan} />
            </Field>
            <Field label="Peer Mentorship Importance">
              <LongText value={app.peerMentorshipImportance} />
            </Field>
            <Field label="Why AFÁRÁ is Right for Her">
              <LongText value={app.whyAfaraIsRight} />
            </Field>
          </SectionCard>

          {/* Additional info if present */}
          {app.additionalInfo && (
            <SectionCard icon={FileText} title="Additional Information">
              <LongText value={app.additionalInfo} />
            </SectionCard>
          )}

          {/* Metadata footer */}
          <div className="pt-2 border-t text-xs text-muted-foreground flex flex-wrap gap-4">
            <span>Application ID: <span className="font-mono">{app.id}</span></span>
            {app.createdAt && (
              <span>Created: {format(new Date(app.createdAt), "d MMM yyyy, HH:mm")}</span>
            )}
            {app.updatedAt && (
              <span>Last updated: {format(new Date(app.updatedAt), "d MMM yyyy, HH:mm")}</span>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

export default function ApplicationManagement() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<string>("submitted");
  const [reviewNotes, setReviewNotes] = useState("");

  const { data: applications = [], isLoading } = useQuery<Application[]>({
    queryKey: ["/api/applications"],
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, reviewNotes }: { id: string; status: string; reviewNotes: string }) => {
      const response = await apiRequest("PATCH", `/api/admin/applications/${id}`, {
        status,
        reviewNotes,
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update application");
      }
      return response.json();
    },
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ["/api/applications"] });
      toast({ title: "Application Updated", description: "The application status has been updated." });
      setIsStatusDialogOpen(false);
      // Update selected so preview reflects new status/notes immediately
      if (selectedApplication) {
        setSelectedApplication({ ...selectedApplication, status: newStatus as any, reviewNotes });
      }
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error?.message || "Failed to update application", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/applications/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/applications"] });
      toast({ title: "Application Deleted", description: "The application has been deleted." });
      setSelectedApplication(null);
      setIsPreviewOpen(false);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete application.", variant: "destructive" });
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
    pending: applications.filter((a) => a.status === "submitted" || a.status === "under_review").length,
    accepted: applications.filter((a) => a.status === "accepted").length,
    rejected: applications.filter((a) => a.status === "rejected").length,
  };

  const openPreview = (app: Application) => {
    setSelectedApplication(app);
    setIsPreviewOpen(true);
  };

  const openStatusDialog = (app: Application) => {
    setSelectedApplication(app);
    setNewStatus(app.status);
    setReviewNotes(app.reviewNotes || "");
    setIsStatusDialogOpen(true);
  };

  const handleUpdateStatus = () => {
    if (selectedApplication && newStatus) {
      updateStatusMutation.mutate({ id: selectedApplication.id, status: newStatus, reviewNotes });
    }
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen">
      <AdminSidebar />
      <main className="flex-1 p-6 bg-background overflow-auto">
        <div className="max-w-7xl mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Application Management</h1>
            <p className="text-muted-foreground mt-1">Review and manage program applications</p>
          </div>

          {/* Stats */}
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

          {/* Table */}
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
                    <div className="text-center py-8 text-muted-foreground">No applications found</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Applicant</TableHead>
                            <TableHead>Company</TableHead>
                            <TableHead>Sector</TableHead>
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
                                <div className="font-medium">{app.companyLegalName || app.companyName || "N/A"}</div>
                                <div className="text-sm text-muted-foreground">{app.companyCountry || ""}</div>
                              </TableCell>
                              <TableCell>{app.primarySector || "N/A"}</TableCell>
                              <TableCell>
                                {app.submittedAt ? format(new Date(app.submittedAt), "MMM d, yyyy") : "—"}
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
                                    onClick={() => openPreview(app)}
                                    data-testid={`button-view-${app.id}`}
                                    title="View full application"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={() => openStatusDialog(app)}
                                    data-testid={`button-status-${app.id}`}
                                  >
                                    Update Status
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => {
                                      if (window.confirm(`Delete application from ${app.firstName} ${app.lastName}?`)) {
                                        deleteMutation.mutate(app.id);
                                      }
                                    }}
                                    disabled={deleteMutation.isPending}
                                    data-testid={`button-delete-${app.id}`}
                                    title="Delete application"
                                  >
                                    <Trash2 className="h-4 w-4" />
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

      {/* Full application preview sheet */}
      <ApplicationPreviewSheet
        app={selectedApplication}
        open={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        onUpdateStatus={(app) => {
          setIsPreviewOpen(false);
          openStatusDialog(app);
        }}
      />

      {/* Update status dialog */}
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
