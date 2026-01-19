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
  Video
} from "lucide-react";

const applicationSchema = z.object({
  // Personal Section
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().optional(),
  personalStatement: z.string().optional(),
  videoEssayUrl: z.string().optional(),
  
  // Section 1: Applicant Background
  professionalBackground: z.string().optional(),
  yearsOfExperience: z.coerce.number().min(0).optional(),
  keyResponsibilities: z.string().optional(),
  hasProjectExperience: z.boolean().optional(),
  projectExperience: z.string().optional(),
  primarySector: z.string().optional(),
  sectorSpecification: z.string().optional(),
  subSectors: z.array(z.string()).optional(),
  otherSubSector: z.string().optional(),
  
  // Section 2: Business Ownership
  companyLegalName: z.string().optional(),
  companyCountry: z.string().optional(),
  companyHeadquarters: z.string().optional(),
  incorporationYear: z.coerce.number().min(1900).max(2030).optional(),
  ownershipPercentage: z.coerce.number().min(0).max(100).optional(),
  numberOfShareholders: z.coerce.number().min(0).optional(),
  shareholdersOver25Percent: z.boolean().optional(),
  
  // Section 3: Financial Documentation
  canProvideFinancials: z.boolean().optional(),
  isTaxRegistered: z.boolean().optional(),
  
  // Section 4: Project Readiness
  projectDescription: z.string().optional(),
  projectLocation: z.string().optional(),
  projectSector: z.string().optional(),
  projectCurrentStatus: z.string().optional(),
  projectStage: z.string().optional(),
  projectDocuments: z.array(z.string()).optional(),
  otherProjectDocuments: z.string().optional(),
  projectedImpact: z.string().optional(),
  
  // Section 5: Support Needs
  mainChallenges: z.string().optional(),
  supportAreasNeeded: z.array(z.string()).optional(),
  otherSupportArea: z.string().optional(),
  keyActivitiesForNextStage: z.string().optional(),
  fundingRequired: z.string().optional(),
  expectedTimeline: z.string().optional(),
  
  // Section 6: Founder Commitment
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
  "Gas",
  "Power generation or transmission",
  "Renewables",
  "Mini-grids or distributed generation",
  "Clean cooking",
  "Roads or rail",
  "Transport or logistics",
  "Ports",
  "Digital or communications infrastructure",
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
      personalStatement: "",
      videoEssayUrl: "",
      professionalBackground: "",
      yearsOfExperience: undefined,
      keyResponsibilities: "",
      hasProjectExperience: false,
      projectExperience: "",
      primarySector: "",
      sectorSpecification: "",
      subSectors: [],
      otherSubSector: "",
      companyLegalName: "",
      companyCountry: "",
      companyHeadquarters: "",
      incorporationYear: undefined,
      ownershipPercentage: undefined,
      numberOfShareholders: undefined,
      shareholdersOver25Percent: false,
      canProvideFinancials: false,
      isTaxRegistered: false,
      projectDescription: "",
      projectLocation: "",
      projectSector: "",
      projectCurrentStatus: "",
      projectStage: "",
      projectDocuments: [],
      otherProjectDocuments: "",
      projectedImpact: "",
      mainChallenges: "",
      supportAreasNeeded: [],
      otherSupportArea: "",
      keyActivitiesForNextStage: "",
      fundingRequired: "",
      expectedTimeline: "",
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
        const response = await apiRequest("PATCH", `/api/applications/${draftId}`, {
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
        const response = await apiRequest("PATCH", `/api/applications/${draftId}`, {
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
  const subSectors = form.watch("subSectors") || [];

  return (
    <div className="space-y-6">
      <FormField
        control={form.control}
        name="professionalBackground"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Professional Background</FormLabel>
            <FormDescription>
              Describe your professional background in the energy or infrastructure sector. Include your role, years of experience, and key responsibilities.
            </FormDescription>
            <FormControl>
              <Textarea 
                placeholder="Describe your experience, roles, and responsibilities..."
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
            <FormLabel>Years of Experience</FormLabel>
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

function BusinessSection({ form }: { form: ReturnType<typeof useForm<ApplicationFormData>> }) {
  return (
    <div className="space-y-6">
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
                <Input placeholder="e.g., Nigeria" {...field} data-testid="input-company-country" />
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
                <Input placeholder="e.g., Lagos" {...field} data-testid="input-company-headquarters" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

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

function FinancialSection({ form }: { form: ReturnType<typeof useForm<ApplicationFormData>> }) {
  return (
    <div className="space-y-6">
      <div className="p-4 bg-muted/50 rounded-lg">
        <p className="text-sm text-muted-foreground">
          This section helps us understand your company's financial documentation readiness and compliance status.
        </p>
      </div>

      <FormField
        control={form.control}
        name="canProvideFinancials"
        render={({ field }) => (
          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
            <FormControl>
              <Checkbox
                checked={field.value}
                onCheckedChange={field.onChange}
                data-testid="checkbox-can-provide-financials"
              />
            </FormControl>
            <div className="space-y-1 leading-none">
              <FormLabel>
                Are you able to provide management accounts or audited financial statements for the past two years?
              </FormLabel>
            </div>
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="isTaxRegistered"
        render={({ field }) => (
          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
            <FormControl>
              <Checkbox
                checked={field.value}
                onCheckedChange={field.onChange}
                data-testid="checkbox-tax-registered"
              />
            </FormControl>
            <div className="space-y-1 leading-none">
              <FormLabel>
                Is your company registered to pay tax?
              </FormLabel>
            </div>
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
                <Input placeholder="e.g., Lagos, Nigeria" {...field} data-testid="input-project-location" />
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
                Are you able to commit to our 3-day immersive, in-person event in Lagos, Nigeria?
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
        <div>
          <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
            <User className="w-4 h-4" /> Personal Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div><span className="font-medium">Name:</span> {values.firstName} {values.lastName}</div>
            <div><span className="font-medium">Email:</span> {values.email}</div>
            <div><span className="font-medium">Phone:</span> {renderValue(values.phone)}</div>
            <div><span className="font-medium">LinkedIn:</span> {renderValue(values.linkedinUrl)}</div>
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

        <div>
          <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
            <Briefcase className="w-4 h-4" /> Background & Sector Experience
          </h3>
          <div className="space-y-2 text-sm">
            <div><span className="font-medium">Years of Experience:</span> {renderValue(values.yearsOfExperience)}</div>
            <div><span className="font-medium">Primary Sector:</span> {renderValue(values.primarySector)}</div>
            <div><span className="font-medium">Sector Specification:</span> {renderValue(values.sectorSpecification)}</div>
            <div><span className="font-medium">Sub-sectors:</span> {renderValue(values.subSectors)}</div>
            <div><span className="font-medium">Has Project Experience:</span> {renderValue(values.hasProjectExperience)}</div>
          </div>
          {values.keyResponsibilities && (
            <div className="mt-2 text-sm">
              <span className="font-medium">Key Responsibilities:</span>
              <p className="mt-1 text-muted-foreground">{values.keyResponsibilities}</p>
            </div>
          )}
          {values.professionalBackground && (
            <div className="mt-2 text-sm">
              <span className="font-medium">Professional Background:</span>
              <p className="mt-1 text-muted-foreground">{values.professionalBackground}</p>
            </div>
          )}
        </div>

        <Separator />

        <div>
          <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
            <Building2 className="w-4 h-4" /> Business Ownership & Operations
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div><span className="font-medium">Company Name:</span> {renderValue(values.companyLegalName)}</div>
            <div><span className="font-medium">Country:</span> {renderValue(values.companyCountry)}</div>
            <div><span className="font-medium">Headquarters:</span> {renderValue(values.companyHeadquarters)}</div>
            <div><span className="font-medium">Incorporation Year:</span> {renderValue(values.incorporationYear)}</div>
            <div><span className="font-medium">Ownership %:</span> {renderValue(values.ownershipPercentage)}</div>
            <div><span className="font-medium">Other Shareholders:</span> {renderValue(values.numberOfShareholders)}</div>
          </div>
        </div>

        <Separator />

        <div>
          <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
            <FileText className="w-4 h-4" /> Financial Documentation
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div><span className="font-medium">Can Provide Financials:</span> {renderValue(values.canProvideFinancials)}</div>
            <div><span className="font-medium">Tax Registered:</span> {renderValue(values.isTaxRegistered)}</div>
          </div>
        </div>

        <Separator />

        <div>
          <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
            <Target className="w-4 h-4" /> Project Readiness
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div><span className="font-medium">Location:</span> {renderValue(values.projectLocation)}</div>
            <div><span className="font-medium">Sector:</span> {renderValue(values.projectSector)}</div>
            <div><span className="font-medium">Stage:</span> {renderValue(values.projectStage)}</div>
            <div><span className="font-medium">Documents:</span> {renderValue(values.projectDocuments)}</div>
          </div>
          {values.projectDescription && (
            <div className="mt-2 text-sm">
              <span className="font-medium">Project Description:</span>
              <p className="mt-1 text-muted-foreground">{values.projectDescription}</p>
            </div>
          )}
          {values.projectedImpact && (
            <div className="mt-2 text-sm">
              <span className="font-medium">Projected Impact:</span>
              <p className="mt-1 text-muted-foreground">{values.projectedImpact}</p>
            </div>
          )}
        </div>

        <Separator />

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

        <div>
          <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
            <HelpCircle className="w-4 h-4" /> Founder Commitment
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div><span className="font-medium">Commit to Program:</span> {renderValue(values.canCommitToProgram)}</div>
            <div><span className="font-medium">Attend Lagos Event:</span> {renderValue(values.canAttendLagosEvent)}</div>
            <div><span className="font-medium">Willing to Mentor:</span> {renderValue(values.willingToMentor)}</div>
          </div>
          {values.whyAfaraIsRight && (
            <div className="mt-2 text-sm">
              <span className="font-medium">Why AFARA:</span>
              <p className="mt-1 text-muted-foreground">{values.whyAfaraIsRight}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
