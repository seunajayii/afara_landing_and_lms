import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  CheckCircle, 
  ArrowLeft, 
  ArrowRight, 
  Loader2, 
  Save, 
  Send,
  User,
  Briefcase,
  Building2,
  FileText,
  Target,
  Handshake,
  HelpCircle,
  Eye,
  Video,
  Upload,
  Paperclip,
  ChevronsUpDown,
  Check,
  Mail,
  RotateCcw,
  Search,
  ClipboardList,
  Pencil,
  ExternalLink,
  LockKeyhole,
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const COUNTRIES = [
  "Afghanistan","Albania","Algeria","Angola","Argentina","Armenia","Australia","Austria","Azerbaijan",
  "Bahrain","Bangladesh","Belarus","Belgium","Benin","Bolivia","Bosnia and Herzegovina","Botswana","Brazil","Bulgaria","Burkina Faso","Burundi",
  "Cambodia","Cameroon","Canada","Cape Verde","Central African Republic","Chad","Chile","China","Colombia","Comoros","Congo (Brazzaville)","Congo (DRC)","Costa Rica","Côte d'Ivoire","Croatia","Cuba","Cyprus","Czech Republic",
  "Denmark","Djibouti","Dominican Republic",
  "Ecuador","Egypt","El Salvador","Equatorial Guinea","Eritrea","Estonia","Eswatini","Ethiopia",
  "Finland","France","Gabon","Gambia","Georgia","Germany","Ghana","Greece","Guatemala","Guinea","Guinea-Bissau","Guyana",
  "Haiti","Honduras","Hungary",
  "Iceland","India","Indonesia","Iran","Iraq","Ireland","Israel","Italy",
  "Jamaica","Japan","Jordan",
  "Kazakhstan","Kenya","Kuwait","Kyrgyzstan",
  "Laos","Latvia","Lebanon","Lesotho","Liberia","Libya","Lithuania","Luxembourg",
  "Madagascar","Malawi","Malaysia","Maldives","Mali","Malta","Mauritania","Mauritius","Mexico","Moldova","Mongolia","Morocco","Mozambique","Myanmar",
  "Namibia","Nepal","Netherlands","New Zealand","Nicaragua","Niger","Nigeria","North Macedonia","Norway",
  "Oman",
  "Pakistan","Palestine","Panama","Papua New Guinea","Paraguay","Peru","Philippines","Poland","Portugal",
  "Qatar",
  "Romania","Russia","Rwanda",
  "Saudi Arabia","Senegal","Serbia","Sierra Leone","Singapore","Slovakia","Slovenia","Somalia","South Africa","South Sudan","Spain","Sri Lanka","Sudan","Sweden","Switzerland","Syria",
  "Taiwan","Tajikistan","Tanzania","Thailand","Togo","Trinidad and Tobago","Tunisia","Turkey","Turkmenistan",
  "Uganda","Ukraine","United Arab Emirates","United Kingdom","United States","Uruguay","Uzbekistan",
  "Venezuela","Vietnam",
  "Yemen","Zambia","Zimbabwe"
];

function CountrySelect({ value, onChange, placeholder = "Select a country", testId }: {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  testId?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
          data-testid={testId}
        >
          {value || <span className="text-muted-foreground">{placeholder}</span>}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput placeholder="Search country..." />
          <CommandList>
            <CommandEmpty>No country found.</CommandEmpty>
            <CommandGroup>
              {COUNTRIES.map((country) => (
                <CommandItem
                  key={country}
                  value={country}
                  onSelect={(val) => {
                    onChange(val === value ? "" : val);
                    setOpen(false);
                  }}
                >
                  <Check className={cn("mr-2 h-4 w-4", value === country ? "opacity-100" : "opacity-0")} />
                  {country}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

const applicationSchema = z.object({
  // Personal Section
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().optional(),
  countryOfOperation: z.string().optional(),
  companyName: z.string().optional(),
  roleInCompany: z.string().optional(),
  personalStatement: z.string().optional(),
  videoEssayUrl: z.string().optional(),
  
  // Section 1: Applicant Background
  professionalBackground: z.string().optional(),
  yearsOfExperience: z.coerce.number().min(0).optional(),
  keyResponsibilities: z.string().optional(),
  majorAchievements: z.string().optional(),
  hasLedTeams: z.boolean().optional(),
  teamLeadershipExperience: z.string().optional(),
  hasProjectExperience: z.boolean().optional(),
  projectExperience: z.string().optional(),
  primarySector: z.string().optional(),
  sectorSpecification: z.string().optional(),
  subSectors: z.array(z.string()).optional(),
  otherSubSector: z.string().optional(),
  
  // Section 2: Business Overview & Scalability
  businessDescription: z.string().optional(),
  problemBeingSolved: z.string().optional(),
  businessStage: z.string().optional(),
  tractionEvidence: z.string().optional(),
  targetMarket: z.string().optional(),
  scalabilityExplanation: z.string().optional(),
  growthPlans: z.string().optional(),
  isRaisingFunding: z.boolean().optional(),
  
  // Section 2b: Business Ownership
  companyLegalName: z.string().optional(),
  companyCountry: z.string().optional(),
  companyHeadquarters: z.string().optional(),
  incorporationYear: z.coerce.number().min(1900).max(2030).optional(),
  ownershipPercentage: z.coerce.number().min(0).max(100).optional(),
  numberOfShareholders: z.coerce.number().min(0).optional(),
  shareholdersOver25Percent: z.boolean().optional(),
  
  // Section 2: Business Ownership
  registrationProofUrl: z.string().optional(),

  // Section 3: Financial Documentation
  isIncorporated: z.boolean().optional(),
  incorporationCertificateUrl: z.string().optional(),
  revenueStreams: z.string().optional(),
  keepsFinancialRecords: z.boolean().optional(),
  pitchDeckUrl: z.string().optional(),
  businessPlanUrl: z.string().optional(),
  canProvideFinancials: z.enum(["yes", "no"]).optional(),
  financialStatementsUrl: z.string().optional(),
  isTaxRegistered: z.enum(["yes", "no"]).optional(),
  
  // Section 4: Project Readiness
  projectDescription: z.string().optional(),
  projectLocation: z.string().optional(),
  projectSector: z.string().optional(),
  projectCurrentStatus: z.string().optional(),
  projectStage: z.string().optional(),
  projectDocuments: z.array(z.string()).optional(),
  otherProjectDocuments: z.string().optional(),
  projectedImpact: z.string().optional(),
  
  // Section 4b: Business Impact
  businessImpact: z.string().optional(),
  primaryBeneficiaries: z.string().optional(),
  infrastructureGapContribution: z.string().optional(),
  createsWomenOpportunities: z.boolean().optional(),
  womenOpportunitiesDescription: z.string().optional(),
  
  // Section 5: Support Needs
  mainChallenges: z.string().optional(),
  supportAreasNeeded: z.array(z.string()).optional(),
  otherSupportArea: z.string().optional(),
  keyActivitiesForNextStage: z.string().optional(),
  fundingRequired: z.string().optional(),
  expectedTimeline: z.string().optional(),
  
  // Section 6: Founder Commitment
  specificProgramOutcomes: z.string().optional(),
  hoursPerWeek: z.coerce.number().min(0).max(168).optional(),
  openToMentorship: z.boolean().optional(),
  canCommitToProgram: z.boolean().optional(),
  canAttendLagosEvent: z.boolean().optional(),
  commitmentManagementPlan: z.string().optional(),
  willingToMentor: z.boolean().optional(),
  peerMentorshipImportance: z.string().optional(),
  
  // Final Question
  whyAfaraIsRight: z.string().optional(),
  linkedinUrl: z.string().optional(),
});

type ApplicationFormData = z.infer<typeof applicationSchema>;

const steps = [
  { id: 0, title: "Personal", description: "About yourself", icon: User },
  { id: 1, title: "Background", description: "Sector experience", icon: Briefcase },
  { id: 2, title: "Business", description: "Ownership & operations", icon: Building2 },
  { id: 3, title: "Financial", description: "Documentation", icon: FileText },
  { id: 4, title: "Project", description: "Readiness & status", icon: Target },
  { id: 5, title: "Support", description: "Needs & advancement", icon: Handshake },
  { id: 6, title: "Commitment", description: "Program & mentorship", icon: HelpCircle },
  { id: 7, title: "Preview", description: "Review & submit", icon: Eye },
];

const subSectorOptions = [
  "Gas-to-power infrastructure",
  "Refinery operations",
  "Gas utilisation",
  "Solar",
  "Wind",
  "Battery storage",
  "Distributed generation",
  "Mini-grids",
  "Clean cooking solutions",
  "Last-mile energy delivery",
  "Roads",
  "Rail",
  "Ports",
  "Logistics infrastructure",
  "Telecoms networks",
  "Digital connectivity",
];

const projectDocumentOptions = [
  "Business plan",
  "Feasibility study",
  "Financial model",
  "Technical or engineering studies",
  "Implementation or execution plan",
  "Offtake or supply agreements",
  "Permits or approvals in progress",
];

const supportAreaOptions = [
  "Technical feasibility/partnership",
  "Fractional CFO",
  "Fractional COO",
  "Fractional Legal",
  "Project Management Support",
  "Legal",
  "Financial advisory / structuring",
  "ESG or compliance",
  "Corporate Governance",
  "Funding access",
  "Financial modelling support",
];

const projectStageOptions = [
  "Early development",
  "Feasibility completed",
  "Advanced development",
  "Operational with scale-up potential",
];

const getStoredToken = (email: string): string | null => {
  try { return localStorage.getItem(`afara_draft_token:${email.toLowerCase().trim()}`); } catch { return null; }
};
const storeToken = (email: string, token: string): void => {
  try { localStorage.setItem(`afara_draft_token:${email.toLowerCase().trim()}`, token); } catch {}
};

export default function Apply() {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [resumeToken, setResumeToken] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showResumeDialog, setShowResumeDialog] = useState(false);
  const [pendingDraft, setPendingDraft] = useState<any>(null);
  const [appMode, setAppMode] = useState<"select" | "form">("select");
  const [resumeEmail, setResumeEmail] = useState("");
  const [isCheckingDraft, setIsCheckingDraft] = useState(false);

  const { data: openCohortData, isLoading: isLoadingCohort } = useQuery<{ cohort: { id: string; name: string; year: number | null } | null }>({
    queryKey: ["/api/cohorts/open"],
    queryFn: async () => {
      const res = await fetch("/api/cohorts/open");
      return res.json();
    },
    staleTime: 60_000,
  });
  const applicationsOpen = !isLoadingCohort && openCohortData?.cohort != null;
  const [draftLookupError, setDraftLookupError] = useState("");
  const [draftNeedsEmailLink, setDraftNeedsEmailLink] = useState(false);
  const [statusEmail, setStatusEmail] = useState("");
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [statusResult, setStatusResult] = useState<{ status: string; submittedAt: string | null; updatedAt: string | null } | null>(null);
  const [statusError, setStatusError] = useState("");

  // Handle magic-link resume from email: ?token=...&email=...
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get("token");
    const urlEmail = params.get("email");
    if (urlToken && urlEmail) {
      storeToken(urlEmail, urlToken);
      setResumeToken(urlToken);
      setResumeEmail(urlEmail);
      setAppMode("select");
    }
  }, []);

  const form = useForm<ApplicationFormData>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      countryOfOperation: "",
      companyName: "",
      roleInCompany: "",
      personalStatement: "",
      videoEssayUrl: "",
      professionalBackground: "",
      yearsOfExperience: undefined,
      keyResponsibilities: "",
      majorAchievements: "",
      hasLedTeams: false,
      teamLeadershipExperience: "",
      hasProjectExperience: false,
      projectExperience: "",
      primarySector: "",
      sectorSpecification: "",
      subSectors: [],
      otherSubSector: "",
      businessDescription: "",
      problemBeingSolved: "",
      businessStage: "",
      tractionEvidence: "",
      targetMarket: "",
      scalabilityExplanation: "",
      growthPlans: "",
      isRaisingFunding: false,
      companyLegalName: "",
      companyCountry: "",
      companyHeadquarters: "",
      incorporationYear: undefined,
      ownershipPercentage: undefined,
      numberOfShareholders: undefined,
      shareholdersOver25Percent: false,
      registrationProofUrl: "",
      isIncorporated: false,
      incorporationCertificateUrl: "",
      revenueStreams: "",
      keepsFinancialRecords: false,
      pitchDeckUrl: "",
      businessPlanUrl: "",
      canProvideFinancials: undefined,
      financialStatementsUrl: "",
      isTaxRegistered: undefined,
      projectDescription: "",
      projectLocation: "",
      projectSector: "",
      projectCurrentStatus: "",
      projectStage: "",
      projectDocuments: [],
      otherProjectDocuments: "",
      projectedImpact: "",
      businessImpact: "",
      primaryBeneficiaries: "",
      infrastructureGapContribution: "",
      createsWomenOpportunities: false,
      womenOpportunitiesDescription: "",
      mainChallenges: "",
      supportAreasNeeded: [],
      otherSupportArea: "",
      keyActivitiesForNextStage: "",
      fundingRequired: "",
      expectedTimeline: "",
      specificProgramOutcomes: "",
      hoursPerWeek: undefined,
      openToMentorship: false,
      canCommitToProgram: false,
      canAttendLagosEvent: false,
      commitmentManagementPlan: "",
      willingToMentor: false,
      peerMentorshipImportance: "",
      whyAfaraIsRight: "",
      linkedinUrl: "",
    },
  });

  const saveDraftMutation = useMutation({
    mutationFn: async (data: ApplicationFormData & { currentStep: number }) => {
      const cleanedData = Object.fromEntries(
        Object.entries(data).map(([key, value]) => [
          key,
          value === "" ? undefined : value
        ])
      );
      
      if (draftId) {
        const response = await apiRequest("PATCH", `/api/applications/${draftId}/save`, {
          ...cleanedData,
          status: "draft",
          resumeToken: resumeToken || undefined,
        });
        return response.json();
      } else {
        const response = await apiRequest("POST", "/api/applications", {
          ...cleanedData,
          status: "draft",
        });
        return response.json();
      }
    },
    onSuccess: (data) => {
      if (data.id) setDraftId(data.id);
      if (data.resumeToken && data.email) {
        storeToken(data.email, data.resumeToken);
        setResumeToken(data.resumeToken);
      }
      setLastSaved(new Date());
      toast({
        title: "Progress Saved",
        description: "Your application has been saved. You can continue later.",
      });
    },
    onError: () => {
      toast({
        title: "Save Failed",
        description: "Could not save your progress. Please try again.",
        variant: "destructive",
      });
    },
  });

  const submitMutation = useMutation({
    mutationFn: async (data: ApplicationFormData) => {
      const cleanedData = Object.fromEntries(
        Object.entries(data).map(([key, value]) => [
          key,
          value === "" ? undefined : value
        ])
      );
      
      if (draftId) {
        const response = await apiRequest("PATCH", `/api/applications/${draftId}/save`, {
          ...cleanedData,
          status: "submitted",
          submittedAt: new Date().toISOString(),
          resumeToken: resumeToken || undefined,
        });
        return response.json();
      } else {
        const response = await apiRequest("POST", "/api/applications", {
          ...cleanedData,
          status: "submitted",
        });
        return response.json();
      }
    },
    onSuccess: () => {
      setIsSubmitted(true);
      toast({
        title: "Application Submitted",
        description: "Thank you for applying to AFARA! We will review your application and get back to you soon.",
      });
    },
    onError: (error: unknown) => {
      if (error instanceof Error && error.message.startsWith("409:")) {
        setIsSubmitted(true);
        setAlreadySubmitted(true);
        return;
      }
      const msg = error instanceof Error ? error.message : String(error);
      const isSizeError =
        msg.includes("413") ||
        msg.toLowerCase().includes("payload too large") ||
        msg.toLowerCase().includes("request entity too large") ||
        msg.toLowerCase().includes("size limit") ||
        msg.toLowerCase().includes("too large");
      toast({
        title: "Submission Failed",
        description: isSizeError
          ? "Your submission is too large. This is usually caused by very long text answers or invalid links. Please shorten your longest responses and try again."
          : "There was an error submitting your application. Please check your internet connection and try again. If the problem persists, save your draft and contact support.",
        variant: "destructive",
      });
    },
  });

  const handleSaveDraft = () => {
    const data = form.getValues();
    saveDraftMutation.mutate({ ...data, currentStep });
  };

  const checkForDraft = async (email: string) => {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return;
    if (draftId) return;
    try {
      const storedTok = getStoredToken(email);
      const tokenParam = storedTok ? `&token=${encodeURIComponent(storedTok)}` : "";
      const response = await fetch(`/api/applications/draft?email=${encodeURIComponent(email)}${tokenParam}`);
      if (response.ok) {
        const draft = await response.json();
        if (draft?.id) {
          if (storedTok && draft.email) {
            // Full data returned — can resume directly
            setPendingDraft(draft);
            setResumeToken(storedTok);
            setShowResumeDialog(true);
          }
          // If no token, silently skip auto-resume — user can use the explicit "Find My Draft" flow
        }
      }
    } catch {
      // No draft found — that's fine, continue normally
    }
  };

  const handleResumeDraftFrom = (d: any) => {
    form.reset({
      firstName: d.firstName || "",
      lastName: d.lastName || "",
      email: d.email || "",
      phone: d.phone || "",
      countryOfOperation: d.countryOfOperation || "",
      companyName: d.companyName || "",
      roleInCompany: d.roleInCompany || "",
      personalStatement: d.personalStatement || "",
      videoEssayUrl: d.videoEssayUrl || "",
      professionalBackground: d.professionalBackground || "",
      yearsOfExperience: d.yearsOfExperience ?? undefined,
      keyResponsibilities: d.keyResponsibilities || "",
      majorAchievements: d.majorAchievements || "",
      hasLedTeams: d.hasLedTeams ?? false,
      teamLeadershipExperience: d.teamLeadershipExperience || "",
      hasProjectExperience: d.hasProjectExperience ?? false,
      projectExperience: d.projectExperience || "",
      primarySector: d.primarySector || "",
      sectorSpecification: d.sectorSpecification || "",
      subSectors: d.subSectors || [],
      otherSubSector: d.otherSubSector || "",
      businessDescription: d.businessDescription || "",
      problemBeingSolved: d.problemBeingSolved || "",
      businessStage: d.businessStage || "",
      tractionEvidence: d.tractionEvidence || "",
      targetMarket: d.targetMarket || "",
      scalabilityExplanation: d.scalabilityExplanation || "",
      growthPlans: d.growthPlans || "",
      isRaisingFunding: d.isRaisingFunding ?? false,
      companyLegalName: d.companyLegalName || "",
      companyCountry: d.companyCountry || "",
      companyHeadquarters: d.companyHeadquarters || "",
      incorporationYear: d.incorporationYear ?? undefined,
      ownershipPercentage: d.ownershipPercentage ?? undefined,
      numberOfShareholders: d.numberOfShareholders ?? undefined,
      shareholdersOver25Percent: d.shareholdersOver25Percent ?? false,
      registrationProofUrl: d.registrationProofUrl || "",
      isIncorporated: d.isIncorporated ?? false,
      incorporationCertificateUrl: d.incorporationCertificateUrl || "",
      revenueStreams: d.revenueStreams || "",
      keepsFinancialRecords: d.keepsFinancialRecords ?? false,
      pitchDeckUrl: d.pitchDeckUrl || "",
      businessPlanUrl: d.businessPlanUrl || "",
      canProvideFinancials: d.canProvideFinancials === true ? "yes" : d.canProvideFinancials === false ? "no" : undefined,
      financialStatementsUrl: d.financialStatementsUrl || "",
      isTaxRegistered: d.isTaxRegistered === true ? "yes" : d.isTaxRegistered === false ? "no" : undefined,
      projectDescription: d.projectDescription || "",
      projectLocation: d.projectLocation || "",
      projectSector: d.projectSector || "",
      projectCurrentStatus: d.projectCurrentStatus || "",
      projectStage: d.projectStage || "",
      projectDocuments: d.projectDocuments || [],
      otherProjectDocuments: d.otherProjectDocuments || "",
      projectedImpact: d.projectedImpact || "",
      businessImpact: d.businessImpact || "",
      primaryBeneficiaries: d.primaryBeneficiaries || "",
      infrastructureGapContribution: d.infrastructureGapContribution || "",
      createsWomenOpportunities: d.createsWomenOpportunities ?? false,
      womenOpportunitiesDescription: d.womenOpportunitiesDescription || "",
      mainChallenges: d.mainChallenges || "",
      supportAreasNeeded: d.supportAreasNeeded || [],
      otherSupportArea: d.otherSupportArea || "",
      keyActivitiesForNextStage: d.keyActivitiesForNextStage || "",
      fundingRequired: d.fundingRequired || "",
      expectedTimeline: d.expectedTimeline || "",
      specificProgramOutcomes: d.specificProgramOutcomes || "",
      hoursPerWeek: d.hoursPerWeek ?? undefined,
      openToMentorship: d.openToMentorship ?? false,
      canCommitToProgram: d.canCommitToProgram ?? false,
      canAttendLagosEvent: d.canAttendLagosEvent ?? false,
      commitmentManagementPlan: d.commitmentManagementPlan || "",
      willingToMentor: d.willingToMentor ?? false,
      peerMentorshipImportance: d.peerMentorshipImportance || "",
      whyAfaraIsRight: d.whyAfaraIsRight || "",
      linkedinUrl: d.linkedinUrl || "",
    });
    setDraftId(d.id);
    if (typeof d.currentStep === "number" && d.currentStep > 0 && d.currentStep < 7) {
      setCurrentStep(d.currentStep);
    }
    setShowResumeDialog(false);
    setPendingDraft(null);
    toast({
      title: "Application Resumed",
      description: "Your saved progress has been loaded. Continue from where you left off.",
    });
  };

  const handleResumeDraft = () => {
    if (!pendingDraft) return;
    handleResumeDraftFrom(pendingDraft);
  };

  const handleCheckDraft = async () => {
    const email = resumeEmail.trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setDraftLookupError("Please enter a valid email address.");
      return;
    }
    setIsCheckingDraft(true);
    setDraftLookupError("");
    setDraftNeedsEmailLink(false);
    try {
      const storedTok = getStoredToken(email);
      const tokenParam = storedTok ? `&token=${encodeURIComponent(storedTok)}` : "";
      const response = await fetch(`/api/applications/draft?email=${encodeURIComponent(email)}${tokenParam}`);
      if (response.ok) {
        const draft = await response.json();
        if (draft?.id) {
          if (storedTok && draft.email) {
            // Full data returned via valid token
            setResumeToken(storedTok);
            setPendingDraft(draft);
            handleResumeDraftFrom(draft);
            setAppMode("form");
            return;
          } else {
            // Draft found but no token on this device — show guidance
            setDraftNeedsEmailLink(true);
            return;
          }
        }
      }
      setDraftLookupError("No saved draft found for this email. You can start a new application instead.");
    } catch {
      setDraftLookupError("Unable to look up your draft. Please try again.");
    } finally {
      setIsCheckingDraft(false);
    }
  };

  const handleCheckStatus = async () => {
    const email = statusEmail.trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setStatusError("Please enter a valid email address.");
      return;
    }
    setIsCheckingStatus(true);
    setStatusError("");
    setStatusResult(null);
    try {
      const storedTok = getStoredToken(email);
      if (!storedTok) {
        setStatusError("To check your status, please use the link in the progress email we sent when you saved your application.");
        return;
      }
      const response = await fetch(`/api/applications/status?email=${encodeURIComponent(email)}&token=${encodeURIComponent(storedTok)}`);
      if (response.ok) {
        const data = await response.json();
        setStatusResult(data);
      } else if (response.status === 403) {
        setStatusError("To check your status, please use the link in the progress email we sent when you saved your application.");
      } else {
        setStatusError("No application found for this email address.");
      }
    } catch {
      setStatusError("Unable to check your status. Please try again.");
    } finally {
      setIsCheckingStatus(false);
    }
  };

  const handleNext = () => {
    if (currentStep < 7) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      window.scrollTo(0, 0);
      const data = form.getValues();
      if (data.email && data.firstName && data.lastName) {
        saveDraftMutation.mutate({ ...data, currentStep: nextStep });
      }
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      window.scrollTo(0, 0);
    }
  };

  const handleSubmit = () => {
    form.handleSubmit((data) => {
      submitMutation.mutate(data);
    })();
  };

  const progressPercent = ((currentStep + 1) / steps.length) * 100;

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 py-16">
          <div className="container max-w-2xl mx-auto px-4">
            <Card className="text-center">
              <CardContent className="pt-12 pb-12">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
                  <CheckCircle className="w-10 h-10 text-primary" />
                </div>
                {alreadySubmitted ? (
                  <>
                    <h1 className="text-3xl font-bold mb-4">Application Already Submitted</h1>
                    <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                      You have already submitted an application with this email address. Our team will review your application and contact you within 2-3 weeks.
                    </p>
                  </>
                ) : (
                  <>
                    <h1 className="text-3xl font-bold mb-4">Application Submitted!</h1>
                    <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                      Thank you for applying to the AFARA Accelerator program. Our team will review your application and contact you within 2-3 weeks.
                    </p>
                  </>
                )}
                <Button asChild>
                  <a href="/">Return Home</a>
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (appMode === "select") {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 py-16 bg-muted/30">
          <div className="container max-w-3xl mx-auto px-4">
            <div className="text-center mb-10">
              <h1 className="text-4xl font-bold mb-3" data-testid="text-apply-gateway-title">
                AFÁRA Accelerator Application
              </h1>
              <p className="text-muted-foreground text-lg max-w-xl mx-auto">
                Apply to join Africa's leading accelerator for women-led businesses in energy and infrastructure.
              </p>
            </div>

            {/* Applications closed banner */}
            {!isLoadingCohort && !applicationsOpen && (
              <div
                className="mb-6 flex items-start gap-3 rounded-md border border-muted-foreground/20 bg-muted/50 px-4 py-3 text-sm text-muted-foreground"
                data-testid="banner-applications-closed"
              >
                <LockKeyhole className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
                <div>
                  <span className="font-medium text-foreground">Applications are currently closed.</span>
                  {" "}New applications for this cohort are not being accepted at this time. You may still check your application status or complete a previously saved draft below.
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Start New Application */}
              <Card
                className={`flex flex-col ${applicationsOpen ? "hover-elevate cursor-pointer" : "opacity-60"}`}
                data-testid="card-start-new"
                onClick={() => applicationsOpen && setAppMode("form")}
              >
                <CardHeader className="flex flex-col items-center text-center gap-3 pb-4">
                  <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                    {applicationsOpen
                      ? <FileText className="w-7 h-7 text-primary" />
                      : <LockKeyhole className="w-7 h-7 text-muted-foreground" />
                    }
                  </div>
                  <div>
                    <CardTitle className="text-xl">Start a New Application</CardTitle>
                    <CardDescription className="mt-1">
                      {applicationsOpen
                        ? "Begin a fresh application for the AFÁRA programme. You can save your progress at any time and return later."
                        : "Applications are currently closed. Please check back when the next cohort opens."
                      }
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="mt-auto pt-0 flex justify-center pb-6">
                  <Button
                    onClick={(e) => { e.stopPropagation(); if (applicationsOpen) setAppMode("form"); }}
                    disabled={!applicationsOpen}
                    data-testid="button-start-new-application"
                  >
                    {applicationsOpen ? (
                      <>Start Application <ArrowRight className="w-4 h-4 ml-2" /></>
                    ) : (
                      <>Applications Closed <LockKeyhole className="w-4 h-4 ml-2" /></>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Resume a Draft */}
              <Card className="flex flex-col" data-testid="card-resume-draft">
                <CardHeader className="flex flex-col items-center text-center gap-3 pb-4">
                  <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                    <RotateCcw className="w-7 h-7 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Complete a Saved Draft</CardTitle>
                    <CardDescription className="mt-1">
                      Already started an application? Enter the email address you used to retrieve your saved progress.
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col gap-3 mt-auto pb-6">
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="email"
                      placeholder="your@email.com"
                      value={resumeEmail}
                      onChange={(e) => { setResumeEmail(e.target.value); setDraftLookupError(""); setDraftNeedsEmailLink(false); }}
                      onKeyDown={(e) => { if (e.key === "Enter") handleCheckDraft(); }}
                      className="pl-9"
                      data-testid="input-resume-email"
                    />
                  </div>
                  {draftLookupError && (
                    <p className="text-sm text-destructive" data-testid="text-draft-lookup-error">{draftLookupError}</p>
                  )}
                  {draftNeedsEmailLink && (
                    <p className="text-sm text-muted-foreground" data-testid="text-draft-needs-email-link">
                      We found your saved draft. To resume it, use the link in the progress email we sent when you last saved your application.
                    </p>
                  )}
                  <Button
                    variant="outline"
                    onClick={handleCheckDraft}
                    disabled={isCheckingDraft}
                    data-testid="button-find-draft"
                  >
                    {isCheckingDraft ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <RotateCcw className="w-4 h-4 mr-2" />
                    )}
                    Find My Draft
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Status Check */}
            <div className="mt-8">
              <Separator className="mb-8" />
              <div className="max-w-xl mx-auto">
                <div className="flex items-center gap-2 mb-4">
                  <ClipboardList className="w-5 h-5 text-muted-foreground" />
                  <h2 className="font-semibold text-base">Check your application status</h2>
                </div>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="email"
                      placeholder="Enter your email address"
                      value={statusEmail}
                      onChange={(e) => { setStatusEmail(e.target.value); setStatusError(""); setStatusResult(null); }}
                      onKeyDown={(e) => { if (e.key === "Enter") handleCheckStatus(); }}
                      className="pl-9"
                      data-testid="input-status-email"
                    />
                  </div>
                  <Button
                    variant="outline"
                    onClick={handleCheckStatus}
                    disabled={isCheckingStatus}
                    data-testid="button-check-status"
                  >
                    {isCheckingStatus ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Search className="w-4 h-4" />
                    )}
                    <span className="ml-2">Check Status</span>
                  </Button>
                </div>

                {statusError && (
                  <p className="mt-3 text-sm text-destructive" data-testid="text-status-error">{statusError}</p>
                )}

                {statusResult && (() => {
                  const statusConfig: Record<string, { label: string; description: string; color: string }> = {
                    draft: {
                      label: "Draft in Progress",
                      description: "You have an unfinished application. Use 'Complete a Saved Draft' above to pick up where you left off.",
                      color: "text-amber-700 bg-amber-50 border-amber-200 dark:text-amber-400 dark:bg-amber-950/30 dark:border-amber-800",
                    },
                    submitted: {
                      label: "Submitted — Awaiting Review",
                      description: "Your application has been received. Our team will be in touch within 2–3 weeks.",
                      color: "text-blue-700 bg-blue-50 border-blue-200 dark:text-blue-400 dark:bg-blue-950/30 dark:border-blue-800",
                    },
                    under_review: {
                      label: "Under Review",
                      description: "Your application is currently being reviewed by the AFÁRA selection committee.",
                      color: "text-indigo-700 bg-indigo-50 border-indigo-200 dark:text-indigo-400 dark:bg-indigo-950/30 dark:border-indigo-800",
                    },
                    accepted: {
                      label: "Accepted",
                      description: "Congratulations! Your application has been accepted to the AFÁRA programme. Check your email for next steps.",
                      color: "text-green-700 bg-green-50 border-green-200 dark:text-green-400 dark:bg-green-950/30 dark:border-green-800",
                    },
                    rejected: {
                      label: "Application Unsuccessful",
                      description: "Thank you for applying. Unfortunately your application was not successful at this time. We encourage you to apply in future cycles.",
                      color: "text-muted-foreground bg-muted/40 border-border",
                    },
                    waitlisted: {
                      label: "Waitlisted",
                      description: "Your application is on the waitlist. We will contact you if a place becomes available.",
                      color: "text-orange-700 bg-orange-50 border-orange-200 dark:text-orange-400 dark:bg-orange-950/30 dark:border-orange-800",
                    },
                    disqualified: {
                      label: "Application Ineligible",
                      description: "Unfortunately your application does not meet the current eligibility criteria for the AFÁRÁ programme. Please check your email for more details.",
                      color: "text-muted-foreground bg-muted/40 border-border",
                    },
                  };
                  const cfg = statusConfig[statusResult.status] ?? {
                    label: statusResult.status,
                    description: "Please contact us if you have questions about your application.",
                    color: "text-muted-foreground bg-muted/40 border-border",
                  };
                  return (
                    <div className={`mt-4 p-4 rounded-md border ${cfg.color}`} data-testid="panel-status-result">
                      <p className="font-semibold text-sm mb-1" data-testid="text-status-label">{cfg.label}</p>
                      <p className="text-sm opacity-90">{cfg.description}</p>
                      {statusResult.submittedAt && (
                        <p className="text-xs mt-2 opacity-70">
                          Submitted: {new Date(statusResult.submittedAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
                        </p>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return <PersonalSection form={form} />;
      case 1:
        return <BackgroundSection form={form} />;
      case 2:
        return <BusinessSection form={form} />;
      case 3:
        return <FinancialSection form={form} />;
      case 4:
        return <ProjectSection form={form} />;
      case 5:
        return <SupportSection form={form} />;
      case 6:
        return <CommitmentSection form={form} />;
      case 7:
        return <PreviewSection form={form} onEditSection={setCurrentStep} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 py-8 bg-muted/30">
        <div className="container max-w-4xl mx-auto px-4">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold mb-2" data-testid="text-apply-title">
              AFARA Accelerator Application
            </h1>
            <p className="text-muted-foreground">
              Complete all sections to submit your application. Your progress is saved automatically.
            </p>
          </div>

          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">
                Step {currentStep + 1} of {steps.length}: {steps[currentStep].title}
              </span>
              {lastSaved && (
                <span className="text-xs text-muted-foreground">
                  Last saved: {lastSaved.toLocaleTimeString()}
                </span>
              )}
            </div>
            <Progress value={progressPercent} className="h-2" />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-4 mb-6">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = index === currentStep;
              const isCompleted = index < currentStep;
              
              return (
                <button
                  type="button"
                  key={step.id}
                  onClick={() => setCurrentStep(index)}
                  className={`flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                    isActive 
                      ? "bg-primary text-primary-foreground" 
                      : isCompleted 
                        ? "bg-primary/10 text-primary" 
                        : "bg-muted text-muted-foreground"
                  }`}
                  data-testid={`button-step-${index}`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{step.title}</span>
                </button>
              );
            })}
          </div>

          <Form {...form}>
            <form onSubmit={(e) => e.preventDefault()}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {(() => { const Icon = steps[currentStep].icon; return <Icon className="w-5 h-5" />; })()}
                    {steps[currentStep].title}
                  </CardTitle>
                  <CardDescription>{steps[currentStep].description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {renderStepContent()}
                </CardContent>
              </Card>

              <div className="flex items-center justify-between mt-6 gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={currentStep === 0}
                  data-testid="button-previous"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Previous
                </Button>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleSaveDraft}
                    disabled={saveDraftMutation.isPending}
                    data-testid="button-save-draft"
                  >
                    {saveDraftMutation.isPending ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    Save Progress
                  </Button>

                  {currentStep === 7 ? (
                    <Button
                      type="button"
                      onClick={handleSubmit}
                      disabled={submitMutation.isPending}
                      data-testid="button-submit"
                    >
                      {submitMutation.isPending ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4 mr-2" />
                      )}
                      Submit Application
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      onClick={handleNext}
                      data-testid="button-next"
                    >
                      Next
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  )}
                </div>
              </div>
            </form>
          </Form>
        </div>
      </main>
      <Footer />

      <Dialog open={showResumeDialog} onOpenChange={setShowResumeDialog}>
        <DialogContent data-testid="dialog-resume-application">
          <DialogHeader>
            <DialogTitle>Resume Saved Application</DialogTitle>
            <DialogDescription>
              We found a saved draft for this email address. Would you like to continue from where you left off, or start a fresh application?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 flex-col sm:flex-row">
            <Button
              variant="outline"
              onClick={() => { setShowResumeDialog(false); setPendingDraft(null); }}
              data-testid="button-start-fresh"
            >
              Start Fresh
            </Button>
            <Button onClick={handleResumeDraft} data-testid="button-resume-draft">
              Resume Application
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PersonalSection({ form }: { form: ReturnType<typeof useForm<ApplicationFormData>> }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="firstName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>First Name *</FormLabel>
              <FormControl>
                <Input placeholder="Enter your first name" {...field} data-testid="input-first-name" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="lastName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Last Name *</FormLabel>
              <FormControl>
                <Input placeholder="Enter your last name" {...field} data-testid="input-last-name" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email Address *</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="your@email.com"
                  {...field}
                  data-testid="input-email"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone Number</FormLabel>
              <FormControl>
                <Input placeholder="+234 xxx xxx xxxx" {...field} data-testid="input-phone" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="countryOfOperation"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Country of Operation</FormLabel>
              <FormControl>
                <CountrySelect
                  value={field.value || ""}
                  onChange={field.onChange}
                  placeholder="Select a country"
                  testId="input-country-of-operation"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="roleInCompany"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Role in Company</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Founder & CEO" {...field} data-testid="input-role-in-company" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="companyName"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Company / Project Name</FormLabel>
            <FormControl>
              <Input placeholder="Enter your company or project name" {...field} data-testid="input-company-name" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="linkedinUrl"
        render={({ field }) => (
          <FormItem>
            <FormLabel>LinkedIn Profile URL</FormLabel>
            <FormControl>
              <Input placeholder="https://linkedin.com/in/yourprofile" {...field} data-testid="input-linkedin" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="personalStatement"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Personal Statement</FormLabel>
            <FormDescription>
              In 150 words, tell us about yourself - your passions, values, and family if you wish to share.
            </FormDescription>
            <FormControl>
              <Textarea 
                placeholder="Share your story, what drives you, and what matters most to you..."
                className="min-h-[150px]"
                {...field} 
                data-testid="input-personal-statement"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="p-4 border rounded-lg bg-muted/50">
        <div className="flex items-center gap-2 mb-3">
          <Video className="w-5 h-5 text-primary" />
          <h4 className="font-medium">Video Essay (Optional)</h4>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Share a video about yourself and your business. Upload to YouTube, Vimeo, or any video platform and paste the link below.
        </p>
        <FormField
          control={form.control}
          name="videoEssayUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Video URL</FormLabel>
              <FormControl>
                <Input 
                  placeholder="https://youtube.com/watch?v=... or https://vimeo.com/..."
                  {...field} 
                  data-testid="input-video-essay"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}

function BackgroundSection({ form }: { form: ReturnType<typeof useForm<ApplicationFormData>> }) {
  const hasProjectExperience = form.watch("hasProjectExperience");
  const hasLedTeams = form.watch("hasLedTeams");
  const subSectors = form.watch("subSectors") || [];

  return (
    <div className="space-y-6">
      <FormField
        control={form.control}
        name="professionalBackground"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Professional Journey</FormLabel>
            <FormDescription>
              Describe your professional journey in the energy or infrastructure sector.
            </FormDescription>
            <FormControl>
              <Textarea 
                placeholder="Describe your experience, roles, and professional journey..."
                className="min-h-[120px]"
                {...field} 
                data-testid="input-professional-background"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="yearsOfExperience"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Years of Experience in Energy / Infrastructure</FormLabel>
            <FormControl>
              <Input 
                type="number" 
                placeholder="e.g., 5" 
                {...field} 
                onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                data-testid="input-years-experience"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="majorAchievements"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Major Achievements</FormLabel>
            <FormDescription>
              Highlight up to 3 major achievements — projects delivered, deals closed, or impact created.
            </FormDescription>
            <FormControl>
              <Textarea 
                placeholder="1. …&#10;2. …&#10;3. …"
                className="min-h-[120px]"
                {...field} 
                data-testid="input-major-achievements"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="keyResponsibilities"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Key Responsibilities</FormLabel>
            <FormDescription>
              Describe your main responsibilities in your current or most recent role.
            </FormDescription>
            <FormControl>
              <Textarea 
                placeholder="List your key responsibilities..."
                className="min-h-[100px]"
                {...field} 
                data-testid="input-key-responsibilities"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="hasLedTeams"
        render={({ field }) => (
          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
            <FormControl>
              <Checkbox
                checked={field.value}
                onCheckedChange={field.onChange}
                data-testid="checkbox-has-led-teams"
              />
            </FormControl>
            <div className="space-y-1 leading-none">
              <FormLabel>
                Have you led teams or managed large-scale projects?
              </FormLabel>
            </div>
          </FormItem>
        )}
      />

      {hasLedTeams && (
        <FormField
          control={form.control}
          name="teamLeadershipExperience"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Team / Project Leadership Experience</FormLabel>
              <FormDescription>
                Please explain your experience leading teams or managing large-scale projects.
              </FormDescription>
              <FormControl>
                <Textarea 
                  placeholder="Describe your leadership and project management experience..."
                  className="min-h-[120px]"
                  {...field} 
                  data-testid="input-team-leadership-experience"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      <FormField
        control={form.control}
        name="hasProjectExperience"
        render={({ field }) => (
          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
            <FormControl>
              <Checkbox
                checked={field.value}
                onCheckedChange={field.onChange}
                data-testid="checkbox-has-project-experience"
              />
            </FormControl>
            <div className="space-y-1 leading-none">
              <FormLabel>
                Have you developed, executed, financed, or managed an energy or infrastructure project?
              </FormLabel>
            </div>
          </FormItem>
        )}
      />

      {hasProjectExperience && (
        <FormField
          control={form.control}
          name="projectExperience"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Project Experience</FormLabel>
              <FormDescription>
                Briefly describe up to two relevant projects and your role in each.
              </FormDescription>
              <FormControl>
                <Textarea 
                  placeholder="Describe your project experience..."
                  className="min-h-[120px]"
                  {...field} 
                  data-testid="input-project-experience"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      <FormField
        control={form.control}
        name="primarySector"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Primary Sector</FormLabel>
            <FormDescription>Which sector best describes your experience and current project?</FormDescription>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger data-testid="select-primary-sector">
                  <SelectValue placeholder="Select your primary sector" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="energy">Energy</SelectItem>
                <SelectItem value="infrastructure">Infrastructure</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="sectorSpecification"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Please specify your sector focus</FormLabel>
            <FormControl>
              <Input 
                placeholder="e.g., Solar energy, Road construction..."
                {...field} 
                data-testid="input-sector-specification"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="subSectors"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Sub-sectors</FormLabel>
            <FormDescription>Select all that apply to your experience.</FormDescription>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {subSectorOptions.map((option) => (
                <div key={option} className="flex items-center space-x-2">
                  <Checkbox
                    id={`subsector-${option}`}
                    checked={subSectors.includes(option)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        field.onChange([...subSectors, option]);
                      } else {
                        field.onChange(subSectors.filter((s) => s !== option));
                      }
                    }}
                    data-testid={`checkbox-subsector-${option.toLowerCase().replace(/\s+/g, '-')}`}
                  />
                  <Label htmlFor={`subsector-${option}`} className="text-sm">{option}</Label>
                </div>
              ))}
            </div>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="otherSubSector"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Other Sub-sector</FormLabel>
            <FormControl>
              <Input 
                placeholder="If other, please specify..."
                {...field} 
                data-testid="input-other-subsector"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}

const businessStageOptions = [
  "Pilot",
  "Early traction",
  "Revenue generating",
  "Growth / scaling",
];

function BusinessSection({ form }: { form: ReturnType<typeof useForm<ApplicationFormData>> }) {
  const isRaisingFunding = form.watch("isRaisingFunding");

  return (
    <div className="space-y-6">
      {/* Business Overview */}
      <div className="p-4 bg-muted/50 rounded-lg">
        <p className="text-sm font-medium text-muted-foreground">Business / Project Overview</p>
      </div>

      <FormField
        control={form.control}
        name="businessDescription"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Describe Your Business / Project</FormLabel>
            <FormDescription>What do you do and who do you serve?</FormDescription>
            <FormControl>
              <Textarea 
                placeholder="Describe what your business does and who it serves..."
                className="min-h-[120px]"
                {...field} 
                data-testid="input-business-description"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="problemBeingSolved"
        render={({ field }) => (
          <FormItem>
            <FormLabel>What Problem Are You Solving?</FormLabel>
            <FormControl>
              <Textarea 
                placeholder="Describe the core problem your business addresses..."
                className="min-h-[100px]"
                {...field} 
                data-testid="input-problem-being-solved"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="businessStage"
        render={({ field }) => (
          <FormItem>
            <FormLabel>What Stage Is Your Business?</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger data-testid="select-business-stage">
                  <SelectValue placeholder="Select your business stage" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {businessStageOptions.map((stage) => (
                  <SelectItem key={stage} value={stage}>{stage}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="tractionEvidence"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Evidence of Traction</FormLabel>
            <FormDescription>Share evidence such as revenue figures, number of customers/users, contracts or partnerships.</FormDescription>
            <FormControl>
              <Textarea 
                placeholder="e.g., Revenue: $50k/year, 200 customers, 3 signed contracts..."
                className="min-h-[100px]"
                {...field} 
                data-testid="input-traction-evidence"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Scalability & Growth */}
      <div className="p-4 bg-muted/50 rounded-lg mt-2">
        <p className="text-sm font-medium text-muted-foreground">Scalability &amp; Growth</p>
      </div>

      <FormField
        control={form.control}
        name="targetMarket"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Target Market &amp; Its Size</FormLabel>
            <FormDescription>What is your target market and how large is it?</FormDescription>
            <FormControl>
              <Textarea 
                placeholder="Describe your target market and estimated market size..."
                className="min-h-[100px]"
                {...field} 
                data-testid="input-target-market"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="scalabilityExplanation"
        render={({ field }) => (
          <FormItem>
            <FormLabel>What Makes Your Solution Scalable?</FormLabel>
            <FormControl>
              <Textarea 
                placeholder="Explain the scalability of your business model or solution..."
                className="min-h-[100px]"
                {...field} 
                data-testid="input-scalability-explanation"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="growthPlans"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Growth Plans for the Next 2–3 Years</FormLabel>
            <FormControl>
              <Textarea 
                placeholder="Describe your growth plans and key milestones over the next 2–3 years..."
                className="min-h-[100px]"
                {...field} 
                data-testid="input-growth-plans"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="isRaisingFunding"
        render={({ field }) => (
          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
            <FormControl>
              <Checkbox
                checked={field.value}
                onCheckedChange={field.onChange}
                data-testid="checkbox-is-raising-funding"
              />
            </FormControl>
            <div className="space-y-1 leading-none">
              <FormLabel>
                Are you currently raising funding or planning to?
              </FormLabel>
            </div>
          </FormItem>
        )}
      />

      {/* Business Ownership */}
      <div className="p-4 bg-muted/50 rounded-lg mt-2">
        <p className="text-sm font-medium text-muted-foreground">Business Ownership &amp; Operations</p>
      </div>

      <FormField
        control={form.control}
        name="companyLegalName"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Legal Name of Company</FormLabel>
            <FormControl>
              <Input placeholder="Enter your company's legal name" {...field} data-testid="input-company-legal-name" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="companyCountry"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Country of Registration</FormLabel>
              <FormControl>
                <CountrySelect
                  value={field.value || ""}
                  onChange={field.onChange}
                  placeholder="Select a country"
                  testId="input-company-country"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="companyHeadquarters"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Headquarters Location</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Nairobi" {...field} data-testid="input-company-headquarters" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FileUploadField
        label="Proof of Registration"
        description="Upload a scanned copy of your certificate of incorporation or business registration document (PDF or image, max 250 KB)."
        fieldName="registrationProofUrl"
        form={form}
        accept=".pdf,.jpg,.jpeg,.png"
        testId="upload-registration-proof"
        maxSizeKB={250}
      />

      <FormField
        control={form.control}
        name="incorporationYear"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Year of Incorporation</FormLabel>
            <FormControl>
              <Input 
                type="number" 
                placeholder="e.g., 2020" 
                {...field}
                onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                data-testid="input-incorporation-year"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="ownershipPercentage"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Your Ownership Percentage</FormLabel>
            <FormDescription>What percentage of the company do you personally own?</FormDescription>
            <FormControl>
              <Input 
                type="number" 
                placeholder="e.g., 51" 
                min="0"
                max="100"
                {...field}
                onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                data-testid="input-ownership-percentage"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="numberOfShareholders"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Number of Other Shareholders</FormLabel>
            <FormControl>
              <Input 
                type="number" 
                placeholder="e.g., 2" 
                {...field}
                onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                data-testid="input-number-shareholders"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="shareholdersOver25Percent"
        render={({ field }) => (
          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
            <FormControl>
              <Checkbox
                checked={field.value}
                onCheckedChange={field.onChange}
                data-testid="checkbox-shareholders-over-25"
              />
            </FormControl>
            <div className="space-y-1 leading-none">
              <FormLabel>
                Do any other shareholders own up to 25% or more of the company?
              </FormLabel>
            </div>
          </FormItem>
        )}
      />
    </div>
  );
}

function FileUploadField({
  label,
  description,
  fieldName,
  form,
  accept = ".pdf,.doc,.docx,.jpg,.jpeg,.png",
  testId,
  maxSizeKB,
}: {
  label: string;
  description?: string;
  fieldName: keyof ApplicationFormData;
  form: ReturnType<typeof useForm<ApplicationFormData>>;
  accept?: string;
  testId: string;
  maxSizeKB?: number;
}) {
  const [uploading, setUploading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [sizeError, setSizeError] = useState<string | null>(null);
  const currentValue = form.watch(fieldName) as string | undefined;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSizeError(null);
    if (maxSizeKB && file.size > maxSizeKB * 1024) {
      setSizeError(`File is too large. Maximum size is ${maxSizeKB} KB.`);
      e.target.value = "";
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/applications/upload-file", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) throw new Error("Upload failed");
      const data = await response.json();
      form.setValue(fieldName, data.fileUrl as any);
      setFileName(data.fileName);
    } catch {
      // ignore silently
    } finally {
      setUploading(false);
    }
  };

  return (
    <FormField
      control={form.control}
      name={fieldName}
      render={() => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          {description && <FormDescription>{description}</FormDescription>}
          <FormControl>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <label
                  htmlFor={testId}
                  className="flex items-center gap-2 px-3 py-2 rounded-md border border-input text-sm cursor-pointer hover-elevate"
                >
                  {uploading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4" />
                  )}
                  {uploading ? "Uploading…" : "Choose file"}
                </label>
                <input
                  id={testId}
                  type="file"
                  accept={accept}
                  onChange={handleFileChange}
                  className="hidden"
                  data-testid={testId}
                />
                {(fileName || currentValue) && (
                  <span className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Paperclip className="w-3 h-3" />
                    {fileName || "File uploaded"}
                  </span>
                )}
              </div>
              {sizeError && (
                <p className="text-sm font-medium text-destructive">{sizeError}</p>
              )}
            </div>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

function FinancialSection({ form }: { form: ReturnType<typeof useForm<ApplicationFormData>> }) {
  const canProvideFinancials = form.watch("canProvideFinancials");
  return (
    <div className="space-y-6">
      <div className="p-4 bg-muted/50 rounded-lg">
        <p className="text-sm text-muted-foreground">
          This section helps us understand your company's financial documentation readiness and compliance status.
        </p>
      </div>

      <FormField
        control={form.control}
        name="revenueStreams"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Business Model</FormLabel>
            <FormDescription>
              Describe how your business generates revenue today (or plans to).
            </FormDescription>
            <FormControl>
              <Textarea 
                placeholder="e.g., Product sales, service contracts, licensing fees..."
                className="min-h-[100px]"
                {...field} 
                data-testid="input-revenue-streams"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="keepsFinancialRecords"
        render={({ field }) => (
          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
            <FormControl>
              <Checkbox
                checked={field.value}
                onCheckedChange={field.onChange}
                data-testid="checkbox-keeps-financial-records"
              />
            </FormControl>
            <div className="space-y-1 leading-none">
              <FormLabel>
                Does your business keep regular financial records (accounts, bookkeeping)?
              </FormLabel>
            </div>
          </FormItem>
        )}
      />

      <FileUploadField
        label="Pitch Deck (optional)"
        description="Upload your pitch deck if available (PDF, max 1000 KB)."
        fieldName="pitchDeckUrl"
        form={form}
        accept=".pdf,.ppt,.pptx"
        testId="upload-pitch-deck"
        maxSizeKB={1000}
      />

      <FileUploadField
        label="Business Plan (optional)"
        description="Upload your business plan if available (PDF or Word, max 1000 KB)."
        fieldName="businessPlanUrl"
        form={form}
        accept=".pdf,.doc,.docx"
        testId="upload-business-plan"
        maxSizeKB={1000}
      />

      <FormField
        control={form.control}
        name="canProvideFinancials"
        render={({ field }) => (
          <FormItem className="space-y-3">
            <FormLabel>Are you able to provide management accounts or audited financial statements for the past two years?</FormLabel>
            <FormControl>
              <RadioGroup
                onValueChange={field.onChange}
                value={field.value}
                className="flex gap-6"
                data-testid="radio-can-provide-financials"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="yes" id="financials-yes" data-testid="radio-financials-yes" />
                  <Label htmlFor="financials-yes">Yes</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no" id="financials-no" data-testid="radio-financials-no" />
                  <Label htmlFor="financials-no">No</Label>
                </div>
              </RadioGroup>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {canProvideFinancials === "yes" && (
        <FileUploadField
          label="Financial Statements"
          description="Upload management accounts or audited financial statements (PDF or image, max 1000 KB)."
          fieldName="financialStatementsUrl"
          form={form}
          accept=".pdf,.jpg,.jpeg,.png"
          testId="upload-financial-statements"
          maxSizeKB={1000}
        />
      )}

      <FormField
        control={form.control}
        name="isTaxRegistered"
        render={({ field }) => (
          <FormItem className="space-y-3">
            <FormLabel>Is your company registered to pay tax?</FormLabel>
            <FormControl>
              <RadioGroup
                onValueChange={field.onChange}
                value={field.value}
                className="flex gap-6"
                data-testid="radio-is-tax-registered"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="yes" id="tax-yes" data-testid="radio-tax-yes" />
                  <Label htmlFor="tax-yes">Yes</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no" id="tax-no" data-testid="radio-tax-no" />
                  <Label htmlFor="tax-no">No</Label>
                </div>
              </RadioGroup>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}

function ProjectSection({ form }: { form: ReturnType<typeof useForm<ApplicationFormData>> }) {
  const projectDocuments = form.watch("projectDocuments") || [];

  return (
    <div className="space-y-6">
      <FormField
        control={form.control}
        name="projectDescription"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Project Description</FormLabel>
            <FormDescription>
              Describe the energy or infrastructure project you are submitting to AFARA. Include location, sector, and current status.
            </FormDescription>
            <FormControl>
              <Textarea 
                placeholder="Describe your project in detail..."
                className="min-h-[150px]"
                {...field} 
                data-testid="input-project-description"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="projectLocation"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Project Country</FormLabel>
              <FormControl>
                <CountrySelect
                  value={field.value || ""}
                  onChange={field.onChange}
                  placeholder="Select a country"
                  testId="input-project-location"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="projectSector"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Project Sector</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Renewable Energy" {...field} data-testid="input-project-sector" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="projectStage"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Project Stage</FormLabel>
            <FormDescription>What stage is the project currently at?</FormDescription>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger data-testid="select-project-stage">
                  <SelectValue placeholder="Select project stage" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {projectStageOptions.map((stage) => (
                  <SelectItem key={stage} value={stage}>{stage}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="projectDocuments"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Available Project Documents</FormLabel>
            <FormDescription>Which of the following documents do you currently have?</FormDescription>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {projectDocumentOptions.map((doc) => (
                <div key={doc} className="flex items-center space-x-2">
                  <Checkbox
                    id={`doc-${doc}`}
                    checked={projectDocuments.includes(doc)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        field.onChange([...projectDocuments, doc]);
                      } else {
                        field.onChange(projectDocuments.filter((d) => d !== doc));
                      }
                    }}
                    data-testid={`checkbox-doc-${doc.toLowerCase().replace(/\s+/g, '-')}`}
                  />
                  <Label htmlFor={`doc-${doc}`} className="text-sm">{doc}</Label>
                </div>
              ))}
            </div>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="otherProjectDocuments"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Other Documents</FormLabel>
            <FormControl>
              <Input 
                placeholder="List any other relevant documents..."
                {...field} 
                data-testid="input-other-documents"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="projectedImpact"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Projected Impact</FormLabel>
            <FormDescription>What is the projected impact of this project?</FormDescription>
            <FormControl>
              <Textarea 
                placeholder="Describe the expected social, economic, and environmental impact..."
                className="min-h-[120px]"
                {...field} 
                data-testid="input-projected-impact"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Business Impact */}
      <div className="p-4 bg-muted/50 rounded-lg">
        <p className="text-sm font-medium text-muted-foreground">Social &amp; Sustainable Impact</p>
      </div>

      <FormField
        control={form.control}
        name="businessImpact"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Business Impact</FormLabel>
            <FormDescription>
              How does your business / project positively impact people's lives and communities?
            </FormDescription>
            <FormControl>
              <Textarea 
                placeholder="Describe the positive impact your business has on communities and society..."
                className="min-h-[120px]"
                {...field} 
                data-testid="input-business-impact"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="primaryBeneficiaries"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Primary Beneficiaries</FormLabel>
            <FormDescription>Who are the primary beneficiaries of your work and how many does it reach?</FormDescription>
            <FormControl>
              <Textarea 
                placeholder="e.g., Rural households in Northern Kenya — approx. 5,000 people..."
                className="min-h-[100px]"
                {...field} 
                data-testid="input-primary-beneficiaries"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="infrastructureGapContribution"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Contribution to Closing Infrastructure Gaps</FormLabel>
            <FormDescription>How does your work contribute to closing infrastructure gaps in Africa?</FormDescription>
            <FormControl>
              <Textarea 
                placeholder="Describe how your project addresses infrastructure deficits..."
                className="min-h-[100px]"
                {...field} 
                data-testid="input-infrastructure-gap"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="createsWomenOpportunities"
        render={({ field }) => (
          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
            <FormControl>
              <Checkbox
                checked={field.value}
                onCheckedChange={field.onChange}
                data-testid="checkbox-creates-women-opportunities"
              />
            </FormControl>
            <div className="space-y-1 leading-none">
              <FormLabel>
                Does your business create economic opportunities specifically for women?
              </FormLabel>
            </div>
          </FormItem>
        )}
      />

      {form.watch("createsWomenOpportunities") && (
        <FormField
          control={form.control}
          name="womenOpportunitiesDescription"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Describe the Opportunities Created for Women</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Describe how your business creates economic opportunities for women..."
                  className="min-h-[100px]"
                  {...field} 
                  data-testid="input-women-opportunities"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}
    </div>
  );
}

function SupportSection({ form }: { form: ReturnType<typeof useForm<ApplicationFormData>> }) {
  const supportAreas = form.watch("supportAreasNeeded") || [];

  return (
    <div className="space-y-6">
      <FormField
        control={form.control}
        name="mainChallenges"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Main Challenges</FormLabel>
            <FormDescription>
              What are the main challenges currently limiting the progress of your project?
            </FormDescription>
            <FormControl>
              <Textarea 
                placeholder="Describe the key obstacles you're facing..."
                className="min-h-[120px]"
                {...field} 
                data-testid="input-main-challenges"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="supportAreasNeeded"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Areas of Support Needed</FormLabel>
            <FormDescription>What 3 major areas of support are you seeking from AFARA? (Select up to 3)</FormDescription>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {supportAreaOptions.map((area) => (
                <div key={area} className="flex items-center space-x-2">
                  <Checkbox
                    id={`support-${area}`}
                    checked={supportAreas.includes(area)}
                    onCheckedChange={(checked) => {
                      if (checked && supportAreas.length < 3) {
                        field.onChange([...supportAreas, area]);
                      } else if (!checked) {
                        field.onChange(supportAreas.filter((a) => a !== area));
                      }
                    }}
                    disabled={!supportAreas.includes(area) && supportAreas.length >= 3}
                    data-testid={`checkbox-support-${area.toLowerCase().replace(/\s+/g, '-')}`}
                  />
                  <Label htmlFor={`support-${area}`} className="text-sm">{area}</Label>
                </div>
              ))}
            </div>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="otherSupportArea"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Other Support Needed</FormLabel>
            <FormControl>
              <Input 
                placeholder="If other, please specify..."
                {...field} 
                data-testid="input-other-support"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="keyActivitiesForNextStage"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Key Activities for Next Stage</FormLabel>
            <FormDescription>
              Please outline the key activities required to move your project to the next stage.
            </FormDescription>
            <FormControl>
              <Textarea 
                placeholder="List the key activities and milestones..."
                className="min-h-[120px]"
                {...field} 
                data-testid="input-key-activities"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="fundingRequired"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Funding Required</FormLabel>
            <FormDescription>
              What level of funding or investment is required to advance this project?
            </FormDescription>
            <FormControl>
              <Input 
                placeholder="e.g., $500,000 - $1M"
                {...field} 
                data-testid="input-funding-required"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="expectedTimeline"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Expected Timeline</FormLabel>
            <FormDescription>
              What is your expected timeline for reaching key milestones over the next 12 to 24 months?
            </FormDescription>
            <FormControl>
              <Textarea 
                placeholder="Describe your milestone timeline..."
                className="min-h-[100px]"
                {...field} 
                data-testid="input-expected-timeline"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}

function CommitmentSection({ form }: { form: ReturnType<typeof useForm<ApplicationFormData>> }) {
  return (
    <div className="space-y-6">
      <FormField
        control={form.control}
        name="specificProgramOutcomes"
        render={({ field }) => (
          <FormItem>
            <FormLabel>What Specific Outcomes Do You Hope to Achieve from This Program?</FormLabel>
            <FormDescription>
              Be specific — what skills, networks, deals, or milestones do you want to reach?
            </FormDescription>
            <FormControl>
              <Textarea 
                placeholder="e.g., Secure seed funding, close my first enterprise contract, build my advisory board..."
                className="min-h-[120px]"
                {...field} 
                data-testid="input-specific-outcomes"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="hoursPerWeek"
        render={({ field }) => (
          <FormItem>
            <FormLabel>How Many Hours Per Week Can You Dedicate to the Program?</FormLabel>
            <FormControl>
              <Input 
                type="number" 
                placeholder="e.g., 10" 
                {...field} 
                onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                data-testid="input-hours-per-week"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="openToMentorship"
        render={({ field }) => (
          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
            <FormControl>
              <Checkbox
                checked={field.value}
                onCheckedChange={field.onChange}
                data-testid="checkbox-open-to-mentorship"
              />
            </FormControl>
            <div className="space-y-1 leading-none">
              <FormLabel>
                Are you open to receiving mentorship from experienced professionals during the program?
              </FormLabel>
            </div>
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="canCommitToProgram"
        render={({ field }) => (
          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
            <FormControl>
              <Checkbox
                checked={field.value}
                onCheckedChange={field.onChange}
                data-testid="checkbox-commit-program"
              />
            </FormControl>
            <div className="space-y-1 leading-none">
              <FormLabel>
                Are you able to commit time to a six-month accelerator program, including workshops and mentoring sessions?
              </FormLabel>
            </div>
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="canAttendLagosEvent"
        render={({ field }) => (
          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
            <FormControl>
              <Checkbox
                checked={field.value}
                onCheckedChange={field.onChange}
                data-testid="checkbox-attend-lagos"
              />
            </FormControl>
            <div className="space-y-1 leading-none">
              <FormLabel>
                Are you able to commit to our 2-day immersive, in-person event in Nairobi, Kenya?
              </FormLabel>
            </div>
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="commitmentManagementPlan"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Commitment Management</FormLabel>
            <FormDescription>
              Please describe how you plan to manage this commitment alongside your existing responsibilities.
            </FormDescription>
            <FormControl>
              <Textarea 
                placeholder="Describe how you will balance program participation with your other commitments..."
                className="min-h-[120px]"
                {...field} 
                data-testid="input-commitment-plan"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="willingToMentor"
        render={({ field }) => (
          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
            <FormControl>
              <Checkbox
                checked={field.value}
                onCheckedChange={field.onChange}
                data-testid="checkbox-willing-mentor"
              />
            </FormControl>
            <div className="space-y-1 leading-none">
              <FormLabel>
                Are you willing to mentor and support at least two women-owned energy or infrastructure businesses over a three-year period after completing the program?
              </FormLabel>
            </div>
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="peerMentorshipImportance"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Peer Mentorship Importance</FormLabel>
            <FormDescription>
              Why is peer mentorship important to you?
            </FormDescription>
            <FormControl>
              <Textarea 
                placeholder="Share your thoughts on the value of peer mentorship..."
                className="min-h-[120px]"
                {...field} 
                data-testid="input-mentorship-importance"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <Separator />

      <FormField
        control={form.control}
        name="whyAfaraIsRight"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Why AFARA?</FormLabel>
            <FormDescription>
              Why do you believe AFARA is the right program for you and your project at this stage?
            </FormDescription>
            <FormControl>
              <Textarea 
                placeholder="Explain why AFARA is the right fit for you and your project..."
                className="min-h-[150px]"
                {...field} 
                data-testid="input-why-afara"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}

function PreviewSection({
  form,
  onEditSection,
}: {
  form: ReturnType<typeof useForm<ApplicationFormData>>;
  onEditSection: (step: number) => void;
}) {
  const values = form.getValues();

  // ── Display primitives ───────────────────────────────────────────────────
  const BooleanBadge = ({ value }: { value: boolean | undefined | null }) => {
    if (value === undefined || value === null)
      return <span className="text-muted-foreground italic text-sm">Not answered</span>;
    return (
      <Badge variant={value ? "default" : "secondary"} className="text-xs font-medium">
        {value ? "Yes" : "No"}
      </Badge>
    );
  };

  const ArrayBadges = ({ value }: { value: string[] | undefined }) => {
    if (!value || value.length === 0)
      return <span className="text-muted-foreground italic text-sm">None selected</span>;
    return (
      <div className="flex flex-wrap gap-1">
        {value.map((v, i) => (
          <Badge key={i} variant="outline" className="text-xs">
            {v}
          </Badge>
        ))}
      </div>
    );
  };

  const FieldVal = ({ value }: { value: unknown }) => {
    if (value === undefined || value === null || value === "")
      return <span className="text-muted-foreground italic text-sm">Not provided</span>;
    if (typeof value === "boolean") return <BooleanBadge value={value} />;
    if (Array.isArray(value)) return <ArrayBadges value={value as string[]} />;
    return <span className="text-sm">{String(value)}</span>;
  };

  // A standard label + value pair
  const F = ({
    label,
    value,
    wide = false,
  }: {
    label: string;
    value: unknown;
    wide?: boolean;
  }) => (
    <div className={wide ? "col-span-full" : ""}>
      <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
      <FieldVal value={value} />
    </div>
  );

  // Long narrative text block — only renders if non-empty
  const TextBlock = ({ label, value }: { label: string; value: string | undefined | null }) => {
    if (!value) return null;
    return (
      <div className="col-span-full">
        <p className="text-xs text-muted-foreground mb-1">{label}</p>
        <p className="text-sm leading-relaxed bg-muted/40 rounded-md px-3 py-2 whitespace-pre-wrap">
          {value}
        </p>
      </div>
    );
  };

  // File upload indicator
  const FileF = ({ label, url }: { label: string; url: string | undefined | null }) => (
    <div>
      <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
      {url ? (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-primary flex items-center gap-1 hover:underline"
        >
          <Paperclip className="w-3 h-3" />
          Document uploaded
          <ExternalLink className="w-3 h-3 opacity-60" />
        </a>
      ) : (
        <span className="text-muted-foreground italic text-sm">Not uploaded</span>
      )}
    </div>
  );

  // Reusable section card wrapper
  const SectionCard = ({
    step,
    icon: Icon,
    title,
    children,
  }: {
    step: number;
    icon: React.ElementType;
    title: string;
    children: React.ReactNode;
  }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3 pb-3 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Icon className="w-4 h-4 text-primary" />
          </div>
          <CardTitle className="text-base">{title}</CardTitle>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onEditSection(step)}
          data-testid={`button-edit-section-${step}`}
        >
          <Pencil className="w-3 h-3 mr-1.5" />
          Edit section
        </Button>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">{children}</div>
      </CardContent>
    </Card>
  );

  // Sub-section divider inside a card
  const SubHeading = ({ label }: { label: string }) => (
    <div className="col-span-full border-t pt-4 mt-1">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
        {label}
      </p>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Banner */}
      <div className="p-4 bg-primary/5 rounded-md border border-primary/20">
        <p className="text-sm font-medium text-primary mb-0.5">Review your application</p>
        <p className="text-sm text-muted-foreground">
          Check every section carefully. Use the Edit buttons to go back and make changes before
          you submit.
        </p>
      </div>

      {/* ── Section 1: Personal Information ─────────────────────────────── */}
      <SectionCard step={0} icon={User} title="Personal Information">
        <F label="First Name" value={values.firstName} />
        <F label="Last Name" value={values.lastName} />
        <F label="Email Address" value={values.email} />
        <F label="Phone Number" value={values.phone} />
        <F label="LinkedIn Profile URL" value={values.linkedinUrl} />
        <F label="Country of Operation" value={values.countryOfOperation} />
        <F label="Company / Project Name" value={values.companyName} />
        <F label="Role in Company" value={values.roleInCompany} />
        <TextBlock label="Personal Statement" value={values.personalStatement} />
        <TextBlock label="Video Essay URL" value={values.videoEssayUrl} />
      </SectionCard>

      {/* ── Section 2: Background & Sector ──────────────────────────────── */}
      <SectionCard step={1} icon={Briefcase} title="Background & Sector Experience">
        <F
          label="Years of Professional Experience"
          value={
            values.yearsOfExperience !== undefined ? `${values.yearsOfExperience} years` : undefined
          }
        />
        <F label="Primary Sector" value={values.primarySector} />
        <F label="Sector Specification" value={values.sectorSpecification} />
        <F label="Sub-sectors" value={values.subSectors} wide />
        <F label="Other Sub-sector" value={values.otherSubSector} />
        <F label="Has Led Teams" value={values.hasLedTeams} />
        <F label="Has Direct Project Experience" value={values.hasProjectExperience} />
        <TextBlock label="Professional Background" value={values.professionalBackground} />
        <TextBlock label="Key Responsibilities" value={values.keyResponsibilities} />
        <TextBlock label="Major Achievements" value={values.majorAchievements} />
        {values.hasLedTeams && (
          <TextBlock label="Team Leadership Experience" value={values.teamLeadershipExperience} />
        )}
        {values.hasProjectExperience && (
          <TextBlock label="Project Experience Details" value={values.projectExperience} />
        )}
      </SectionCard>

      {/* ── Section 3: Business Overview & Ownership ────────────────────── */}
      <SectionCard step={2} icon={Building2} title="Business Overview & Ownership">
        <F label="Business Stage" value={values.businessStage} />
        <F label="Target Market" value={values.targetMarket} />
        <F label="Currently Raising Funding" value={values.isRaisingFunding} />
        <TextBlock label="Business Description" value={values.businessDescription} />
        <TextBlock label="Problem Being Solved" value={values.problemBeingSolved} />
        <TextBlock label="Traction Evidence" value={values.tractionEvidence} />
        <TextBlock label="Scalability Explanation" value={values.scalabilityExplanation} />
        <TextBlock label="Growth Plans" value={values.growthPlans} />

        <SubHeading label="Ownership & Legal Details" />
        <F label="Company Legal Name" value={values.companyLegalName} />
        <F label="Country of Registration" value={values.companyCountry} />
        <F label="Headquarters Location" value={values.companyHeadquarters} />
        <F label="Year of Incorporation" value={values.incorporationYear} />
        <F
          label="Founder Ownership %"
          value={
            values.ownershipPercentage !== undefined
              ? `${values.ownershipPercentage}%`
              : undefined
          }
        />
        <F label="Number of Shareholders" value={values.numberOfShareholders} />
        <F label="Shareholders Holding Over 25%" value={values.shareholdersOver25Percent} />
        <FileF label="Proof of Registration / Ownership" url={values.registrationProofUrl} />
      </SectionCard>

      {/* ── Section 4: Financial Documentation ──────────────────────────── */}
      <SectionCard step={3} icon={FileText} title="Financial Documentation">
        <F label="Business Formally Incorporated" value={values.isIncorporated} />
        <F label="Keeps Formal Financial Records" value={values.keepsFinancialRecords} />
        <F
          label="Can Provide Financial Statements"
          value={
            values.canProvideFinancials === "yes"
              ? true
              : values.canProvideFinancials === "no"
              ? false
              : undefined
          }
        />
        <F
          label="Registered for Tax"
          value={
            values.isTaxRegistered === "yes"
              ? true
              : values.isTaxRegistered === "no"
              ? false
              : undefined
          }
        />
        <TextBlock label="Revenue Streams / Business Model" value={values.revenueStreams} />

        <SubHeading label="Uploaded Documents" />
        <FileF label="Incorporation Certificate" url={values.incorporationCertificateUrl} />
        <FileF label="Pitch Deck" url={values.pitchDeckUrl} />
        <FileF label="Business Plan" url={values.businessPlanUrl} />
        <FileF label="Financial Statements" url={values.financialStatementsUrl} />
      </SectionCard>

      {/* ── Section 5: Project Readiness & Impact ───────────────────────── */}
      <SectionCard step={4} icon={Target} title="Project Readiness & Impact">
        <F label="Project Location" value={values.projectLocation} />
        <F label="Project Sector" value={values.projectSector} />
        <F label="Project Stage" value={values.projectStage} />
        <F label="Current Project Status" value={values.projectCurrentStatus} />
        <F label="Creates Opportunities for Women" value={values.createsWomenOpportunities} />
        <F label="Supporting Documents" value={values.projectDocuments} wide />
        <TextBlock label="Project Description" value={values.projectDescription} />
        <TextBlock label="Projected Impact" value={values.projectedImpact} />
        <TextBlock label="Business / Social Impact" value={values.businessImpact} />
        <TextBlock label="Primary Beneficiaries" value={values.primaryBeneficiaries} />
        <TextBlock
          label="Contribution to Infrastructure Gap"
          value={values.infrastructureGapContribution}
        />
        {values.createsWomenOpportunities && (
          <TextBlock
            label="Women Opportunities — Details"
            value={values.womenOpportunitiesDescription}
          />
        )}
      </SectionCard>

      {/* ── Section 6: Support Needs ─────────────────────────────────────── */}
      <SectionCard step={5} icon={Handshake} title="Support Needs & Programme Fit">
        <F label="Funding Required" value={values.fundingRequired} />
        <F label="Expected Timeline" value={values.expectedTimeline} />
        <F label="Support Areas Needed" value={values.supportAreasNeeded} wide />
        <F label="Other Support Area" value={values.otherSupportArea} />
        <TextBlock label="Main Challenges" value={values.mainChallenges} />
        <TextBlock label="Key Activities for Next Stage" value={values.keyActivitiesForNextStage} />
      </SectionCard>

      {/* ── Section 7: Founder Commitment ───────────────────────────────── */}
      <SectionCard step={6} icon={HelpCircle} title="Founder Commitment">
        <F
          label="Hours Available per Week"
          value={
            values.hoursPerWeek !== undefined ? `${values.hoursPerWeek} hours` : undefined
          }
        />
        <F label="Open to Mentorship" value={values.openToMentorship} />
        <F label="Can Commit to Full Programme" value={values.canCommitToProgram} />
        <F label="Can Attend Lagos Event" value={values.canAttendLagosEvent} />
        <F label="Willing to Mentor Other Founders" value={values.willingToMentor} />
        <TextBlock
          label="Specific Programme Outcomes Sought"
          value={values.specificProgramOutcomes}
        />
        <TextBlock
          label="Commitment Management Plan"
          value={values.commitmentManagementPlan}
        />
        <TextBlock
          label="Importance of Peer Mentorship"
          value={values.peerMentorshipImportance}
        />
        <TextBlock label="Why AFÁRA is Right for You" value={values.whyAfaraIsRight} />
      </SectionCard>
    </div>
  );
}
