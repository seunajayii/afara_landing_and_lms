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
  Check
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
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

export default function Apply() {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

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
      if (data.id) {
        setDraftId(data.id);
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
    onError: () => {
      toast({
        title: "Submission Failed",
        description: "There was an error submitting your application. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSaveDraft = () => {
    const data = form.getValues();
    saveDraftMutation.mutate({ ...data, currentStep });
  };

  const handleNext = async () => {
    if (currentStep < 7) {
      setCurrentStep(currentStep + 1);
      window.scrollTo(0, 0);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      window.scrollTo(0, 0);
    }
  };

  const handleSubmit = () => {
    const data = form.getValues();
    submitMutation.mutate(data);
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
                <h1 className="text-3xl font-bold mb-4">Application Submitted!</h1>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Thank you for applying to the AFARA Accelerator program. Our team will review your application and contact you within 2-3 weeks.
                </p>
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
        return <PreviewSection form={form} />;
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
            <form>
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
                <Input type="email" placeholder="your@email.com" {...field} data-testid="input-email" />
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
            <FormLabel>Revenue Streams</FormLabel>
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
              <FormLabel>Project Location</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Nairobi, Kenya" {...field} data-testid="input-project-location" />
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

function PreviewSection({ form }: { form: ReturnType<typeof useForm<ApplicationFormData>> }) {
  const values = form.getValues();

  const renderValue = (value: unknown) => {
    if (value === undefined || value === null || value === "") {
      return <span className="text-muted-foreground italic">Not provided</span>;
    }
    if (typeof value === "boolean") {
      return value ? "Yes" : "No";
    }
    if (Array.isArray(value)) {
      return value.length > 0 ? value.join(", ") : <span className="text-muted-foreground italic">None selected</span>;
    }
    return String(value);
  };

  return (
    <div className="space-y-6">
      <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
        <p className="text-sm">
          Please review your application before submitting. You can go back to any section to make changes.
        </p>
      </div>

      <div className="space-y-6">
        {/* Personal Info */}
        <div>
          <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
            <User className="w-4 h-4" /> Personal Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div><span className="font-medium">Name:</span> {values.firstName} {values.lastName}</div>
            <div><span className="font-medium">Email:</span> {values.email}</div>
            <div><span className="font-medium">Phone:</span> {renderValue(values.phone)}</div>
            <div><span className="font-medium">LinkedIn:</span> {renderValue(values.linkedinUrl)}</div>
            <div><span className="font-medium">Country of Operation:</span> {renderValue(values.countryOfOperation)}</div>
            <div><span className="font-medium">Company / Project:</span> {renderValue(values.companyName)}</div>
            <div><span className="font-medium">Role:</span> {renderValue(values.roleInCompany)}</div>
          </div>
          {values.personalStatement && (
            <div className="mt-2 text-sm">
              <span className="font-medium">Personal Statement:</span>
              <p className="mt-1 text-muted-foreground">{values.personalStatement}</p>
            </div>
          )}
          {values.videoEssayUrl && (
            <div className="mt-2 text-sm">
              <span className="font-medium">Video Essay:</span> {values.videoEssayUrl}
            </div>
          )}
        </div>

        <Separator />

        {/* Background */}
        <div>
          <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
            <Briefcase className="w-4 h-4" /> Background & Sector Experience
          </h3>
          <div className="space-y-2 text-sm">
            <div><span className="font-medium">Years of Experience:</span> {renderValue(values.yearsOfExperience)}</div>
            <div><span className="font-medium">Primary Sector:</span> {renderValue(values.primarySector)}</div>
            <div><span className="font-medium">Sub-sectors:</span> {renderValue(values.subSectors)}</div>
            <div><span className="font-medium">Led Teams:</span> {renderValue(values.hasLedTeams)}</div>
            <div><span className="font-medium">Project Experience:</span> {renderValue(values.hasProjectExperience)}</div>
          </div>
          {values.majorAchievements && (
            <div className="mt-2 text-sm">
              <span className="font-medium">Major Achievements:</span>
              <p className="mt-1 text-muted-foreground">{values.majorAchievements}</p>
            </div>
          )}
          {values.professionalBackground && (
            <div className="mt-2 text-sm">
              <span className="font-medium">Professional Journey:</span>
              <p className="mt-1 text-muted-foreground">{values.professionalBackground}</p>
            </div>
          )}
        </div>

        <Separator />

        {/* Business Overview */}
        <div>
          <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
            <Building2 className="w-4 h-4" /> Business / Project Overview
          </h3>
          <div className="space-y-2 text-sm">
            <div><span className="font-medium">Business Stage:</span> {renderValue(values.businessStage)}</div>
            <div><span className="font-medium">Target Market:</span> {renderValue(values.targetMarket)}</div>
            <div><span className="font-medium">Raising Funding:</span> {renderValue(values.isRaisingFunding)}</div>
          </div>
          {values.businessDescription && (
            <div className="mt-2 text-sm">
              <span className="font-medium">Business Description:</span>
              <p className="mt-1 text-muted-foreground">{values.businessDescription}</p>
            </div>
          )}
          {values.tractionEvidence && (
            <div className="mt-2 text-sm">
              <span className="font-medium">Traction Evidence:</span>
              <p className="mt-1 text-muted-foreground">{values.tractionEvidence}</p>
            </div>
          )}
          {values.growthPlans && (
            <div className="mt-2 text-sm">
              <span className="font-medium">Growth Plans:</span>
              <p className="mt-1 text-muted-foreground">{values.growthPlans}</p>
            </div>
          )}
        </div>

        <Separator />

        {/* Ownership */}
        <div>
          <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
            <Building2 className="w-4 h-4" /> Ownership & Operations
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div><span className="font-medium">Legal Name:</span> {renderValue(values.companyLegalName)}</div>
            <div><span className="font-medium">Country:</span> {renderValue(values.companyCountry)}</div>
            <div><span className="font-medium">Headquarters:</span> {renderValue(values.companyHeadquarters)}</div>
            <div><span className="font-medium">Incorporation Year:</span> {renderValue(values.incorporationYear)}</div>
            <div><span className="font-medium">Ownership %:</span> {renderValue(values.ownershipPercentage)}</div>
            <div><span className="font-medium">Proof of Registration:</span> {values.registrationProofUrl ? "Uploaded" : "Not provided"}</div>
          </div>
        </div>

        <Separator />

        {/* Financial */}
        <div>
          <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
            <FileText className="w-4 h-4" /> Financial Documentation
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div><span className="font-medium">Keeps Financial Records:</span> {renderValue(values.keepsFinancialRecords)}</div>
            <div><span className="font-medium">Can Provide Financials:</span> {values.canProvideFinancials === "yes" ? "Yes" : values.canProvideFinancials === "no" ? "No" : "Not answered"}</div>
            {values.canProvideFinancials === "yes" && <div><span className="font-medium">Financial Statements:</span> {values.financialStatementsUrl ? "Uploaded" : "Not provided"}</div>}
            <div><span className="font-medium">Tax Registered:</span> {values.isTaxRegistered === "yes" ? "Yes" : values.isTaxRegistered === "no" ? "No" : "Not answered"}</div>
            <div><span className="font-medium">Pitch Deck:</span> {values.pitchDeckUrl ? "Uploaded" : "Not provided"}</div>
            <div><span className="font-medium">Business Plan:</span> {values.businessPlanUrl ? "Uploaded" : "Not provided"}</div>
            <div><span className="font-medium">Inc. Certificate:</span> {values.incorporationCertificateUrl ? "Uploaded" : "Not provided"}</div>
          </div>
          {values.revenueStreams && (
            <div className="mt-2 text-sm">
              <span className="font-medium">Revenue Streams:</span>
              <p className="mt-1 text-muted-foreground">{values.revenueStreams}</p>
            </div>
          )}
        </div>

        <Separator />

        {/* Project Readiness */}
        <div>
          <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
            <Target className="w-4 h-4" /> Project Readiness & Impact
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div><span className="font-medium">Location:</span> {renderValue(values.projectLocation)}</div>
            <div><span className="font-medium">Sector:</span> {renderValue(values.projectSector)}</div>
            <div><span className="font-medium">Stage:</span> {renderValue(values.projectStage)}</div>
            <div><span className="font-medium">Documents:</span> {renderValue(values.projectDocuments)}</div>
            <div><span className="font-medium">Creates Women Opportunities:</span> {renderValue(values.createsWomenOpportunities)}</div>
          </div>
          {values.projectDescription && (
            <div className="mt-2 text-sm">
              <span className="font-medium">Project Description:</span>
              <p className="mt-1 text-muted-foreground">{values.projectDescription}</p>
            </div>
          )}
          {values.businessImpact && (
            <div className="mt-2 text-sm">
              <span className="font-medium">Business Impact:</span>
              <p className="mt-1 text-muted-foreground">{values.businessImpact}</p>
            </div>
          )}
          {values.primaryBeneficiaries && (
            <div className="mt-2 text-sm">
              <span className="font-medium">Primary Beneficiaries:</span>
              <p className="mt-1 text-muted-foreground">{values.primaryBeneficiaries}</p>
            </div>
          )}
        </div>

        <Separator />

        {/* Support Needs */}
        <div>
          <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
            <Handshake className="w-4 h-4" /> Support Needs
          </h3>
          <div className="space-y-2 text-sm">
            <div><span className="font-medium">Support Areas:</span> {renderValue(values.supportAreasNeeded)}</div>
            <div><span className="font-medium">Funding Required:</span> {renderValue(values.fundingRequired)}</div>
          </div>
          {values.mainChallenges && (
            <div className="mt-2 text-sm">
              <span className="font-medium">Main Challenges:</span>
              <p className="mt-1 text-muted-foreground">{values.mainChallenges}</p>
            </div>
          )}
        </div>

        <Separator />

        {/* Commitment */}
        <div>
          <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
            <HelpCircle className="w-4 h-4" /> Founder Commitment
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div><span className="font-medium">Hours per Week:</span> {renderValue(values.hoursPerWeek)}</div>
            <div><span className="font-medium">Open to Mentorship:</span> {renderValue(values.openToMentorship)}</div>
            <div><span className="font-medium">Commit to Program:</span> {renderValue(values.canCommitToProgram)}</div>
            <div><span className="font-medium">Attend Lagos Event:</span> {renderValue(values.canAttendLagosEvent)}</div>
            <div><span className="font-medium">Willing to Mentor Others:</span> {renderValue(values.willingToMentor)}</div>
          </div>
          {values.specificProgramOutcomes && (
            <div className="mt-2 text-sm">
              <span className="font-medium">Specific Outcomes Sought:</span>
              <p className="mt-1 text-muted-foreground">{values.specificProgramOutcomes}</p>
            </div>
          )}
          {values.whyAfaraIsRight && (
            <div className="mt-2 text-sm">
              <span className="font-medium">Why AFÁRA:</span>
              <p className="mt-1 text-muted-foreground">{values.whyAfaraIsRight}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
