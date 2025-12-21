import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
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
import { CheckCircle, ArrowLeft, ArrowRight, Loader2 } from "lucide-react";

const applicationSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().optional(),
  country: z.string().min(1, "Country is required"),
  city: z.string().optional(),
  companyName: z.string().min(1, "Company name is required"),
  companyWebsite: z.string().optional(),
  jobTitle: z.string().min(1, "Job title is required"),
  industrySector: z.string().min(1, "Industry sector is required"),
  yearsInBusiness: z.coerce.number().min(0).optional(),
  numberOfEmployees: z.string().optional(),
  annualRevenue: z.string().optional(),
  businessDescription: z.string().min(20, "Please provide at least 20 characters"),
  challengesFaced: z.string().min(20, "Please provide at least 20 characters"),
  goalsForProgram: z.string().min(20, "Please provide at least 20 characters"),
  howDidYouHear: z.string().optional(),
  linkedinUrl: z.string().optional(),
  additionalInfo: z.string().optional(),
});

type ApplicationFormData = z.infer<typeof applicationSchema>;

const steps = [
  { id: 1, title: "Personal Information", description: "Your contact details" },
  { id: 2, title: "Company Details", description: "About your business" },
  { id: 3, title: "Business Profile", description: "Operations and scale" },
  { id: 4, title: "Program Goals", description: "Your objectives" },
];

const industrySectors = [
  "Energy - Renewable",
  "Energy - Oil & Gas",
  "Energy - Power Generation",
  "Infrastructure - Construction",
  "Infrastructure - Transportation",
  "Infrastructure - Water & Sanitation",
  "Infrastructure - Telecommunications",
  "Manufacturing",
  "Technology & Innovation",
  "Financial Services",
  "Other",
];

const employeeRanges = [
  "1-5",
  "6-10",
  "11-25",
  "26-50",
  "51-100",
  "101-250",
  "250+",
];

const revenueRanges = [
  "Pre-revenue",
  "Under $50,000",
  "$50,000 - $100,000",
  "$100,000 - $500,000",
  "$500,000 - $1M",
  "$1M - $5M",
  "$5M+",
];

const referralSources = [
  "Social Media",
  "Search Engine",
  "Referral from friend/colleague",
  "Industry Event",
  "News/Media",
  "Partner Organization",
  "Other",
];

export default function Apply() {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const form = useForm<ApplicationFormData>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      country: "",
      city: "",
      companyName: "",
      companyWebsite: "",
      jobTitle: "",
      industrySector: "",
      yearsInBusiness: 0,
      numberOfEmployees: "",
      annualRevenue: "",
      businessDescription: "",
      challengesFaced: "",
      goalsForProgram: "",
      howDidYouHear: "",
      linkedinUrl: "",
      additionalInfo: "",
    },
  });

  const submitMutation = useMutation({
    mutationFn: async (data: ApplicationFormData) => {
      // Convert empty strings to undefined for optional fields
      const cleanedData = Object.fromEntries(
        Object.entries(data).map(([key, value]) => [
          key,
          value === "" ? undefined : value
        ])
      );
      const response = await apiRequest("POST", "/api/applications", cleanedData);
      return response.json();
    },
    onSuccess: () => {
      setIsSubmitted(true);
      toast({
        title: "Application Submitted",
        description: "Thank you for applying! We will review your application and get back to you soon.",
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

  const validateCurrentStep = async (): Promise<boolean> => {
    let fieldsToValidate: (keyof ApplicationFormData)[] = [];
    
    switch (currentStep) {
      case 1:
        fieldsToValidate = ["firstName", "lastName", "email", "country"];
        break;
      case 2:
        fieldsToValidate = ["companyName", "jobTitle", "industrySector"];
        break;
      case 3:
        fieldsToValidate = ["businessDescription"];
        break;
      case 4:
        fieldsToValidate = ["challengesFaced", "goalsForProgram"];
        break;
    }

    const result = await form.trigger(fieldsToValidate);
    return result;
  };

  const handleNext = async () => {
    const isValid = await validateCurrentStep();
    if (isValid && currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const onSubmit = (data: ApplicationFormData) => {
    submitMutation.mutate(data);
  };

  const progress = (currentStep / steps.length) * 100;

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 bg-background">
          <div className="container mx-auto px-4 py-16">
            <Card className="max-w-2xl mx-auto text-center">
              <CardHeader>
                <div className="mx-auto mb-4 w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="text-2xl">Application Submitted!</CardTitle>
                <CardDescription className="text-base">
                  Thank you for applying to the AFÁRÁ Accelerator Program
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  We have received your application and our team will review it carefully. 
                  You will receive an email confirmation shortly, and we will be in touch 
                  within 2-3 weeks regarding the next steps.
                </p>
                <div className="pt-4">
                  <Link href="/">
                    <Button data-testid="button-return-home">Return to Home</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-foreground mb-2">Apply to AFÁRÁ Accelerator</h1>
              <p className="text-muted-foreground">
                Join our program supporting female-owned African companies in Energy and Infrastructure
              </p>
            </div>

            <div className="mb-8">
              <div className="flex justify-between mb-2">
                {steps.map((step) => (
                  <div
                    key={step.id}
                    className={`flex-1 text-center ${
                      step.id === currentStep
                        ? "text-primary font-medium"
                        : step.id < currentStep
                        ? "text-primary/70"
                        : "text-muted-foreground"
                    }`}
                  >
                    <span className="text-sm hidden sm:inline">{step.title}</span>
                    <span className="text-sm sm:hidden">Step {step.id}</span>
                  </div>
                ))}
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            <Card>
              <CardHeader>
                <CardTitle>{steps[currentStep - 1].title}</CardTitle>
                <CardDescription>{steps[currentStep - 1].description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    {currentStep === 1 && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="firstName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>First Name *</FormLabel>
                                <FormControl>
                                  <Input placeholder="Enter your first name" {...field} data-testid="input-firstName" />
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
                                  <Input placeholder="Enter your last name" {...field} data-testid="input-lastName" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
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
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="country"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Country *</FormLabel>
                                <FormControl>
                                  <Input placeholder="Your country" {...field} data-testid="input-country" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="city"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>City</FormLabel>
                                <FormControl>
                                  <Input placeholder="Your city" {...field} data-testid="input-city" />
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
                      </div>
                    )}

                    {currentStep === 2 && (
                      <div className="space-y-4">
                        <FormField
                          control={form.control}
                          name="companyName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Company Name *</FormLabel>
                              <FormControl>
                                <Input placeholder="Your company name" {...field} data-testid="input-companyName" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="companyWebsite"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Company Website</FormLabel>
                              <FormControl>
                                <Input placeholder="https://yourcompany.com" {...field} data-testid="input-companyWebsite" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="jobTitle"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Your Role/Title *</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g., Founder & CEO" {...field} data-testid="input-jobTitle" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="industrySector"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Industry Sector *</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-industrySector">
                                    <SelectValue placeholder="Select your industry" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {industrySectors.map((sector) => (
                                    <SelectItem key={sector} value={sector}>
                                      {sector}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="yearsInBusiness"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Years in Business</FormLabel>
                              <FormControl>
                                <Input type="number" min="0" placeholder="0" {...field} data-testid="input-yearsInBusiness" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    )}

                    {currentStep === 3 && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="numberOfEmployees"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Number of Employees</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger data-testid="select-numberOfEmployees">
                                      <SelectValue placeholder="Select range" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {employeeRanges.map((range) => (
                                      <SelectItem key={range} value={range}>
                                        {range}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="annualRevenue"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Annual Revenue (USD)</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger data-testid="select-annualRevenue">
                                      <SelectValue placeholder="Select range" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {revenueRanges.map((range) => (
                                      <SelectItem key={range} value={range}>
                                        {range}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <FormField
                          control={form.control}
                          name="businessDescription"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Describe Your Business *</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Tell us about your company, what you do, and your unique value proposition..."
                                  className="min-h-[120px]"
                                  {...field}
                                  data-testid="textarea-businessDescription"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    )}

                    {currentStep === 4 && (
                      <div className="space-y-4">
                        <FormField
                          control={form.control}
                          name="challengesFaced"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>What challenges does your business currently face? *</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Describe the key challenges you're facing in growing your business..."
                                  className="min-h-[100px]"
                                  {...field}
                                  data-testid="textarea-challengesFaced"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="goalsForProgram"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>What do you hope to achieve through this program? *</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Tell us about your goals and what you expect to gain from the accelerator..."
                                  className="min-h-[100px]"
                                  {...field}
                                  data-testid="textarea-goalsForProgram"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="howDidYouHear"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>How did you hear about AFÁRÁ?</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-howDidYouHear">
                                    <SelectValue placeholder="Select an option" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {referralSources.map((source) => (
                                    <SelectItem key={source} value={source}>
                                      {source}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="additionalInfo"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Anything else you'd like us to know?</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Any additional information you'd like to share..."
                                  className="min-h-[80px]"
                                  {...field}
                                  data-testid="textarea-additionalInfo"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    )}

                    <div className="flex justify-between pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handlePrevious}
                        disabled={currentStep === 1}
                        data-testid="button-previous"
                      >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Previous
                      </Button>

                      {currentStep < 4 ? (
                        <Button type="button" onClick={handleNext} data-testid="button-next">
                          Next
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      ) : (
                        <Button type="submit" disabled={submitMutation.isPending} data-testid="button-submit">
                          {submitMutation.isPending ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Submitting...
                            </>
                          ) : (
                            "Submit Application"
                          )}
                        </Button>
                      )}
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
