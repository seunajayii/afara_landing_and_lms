import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { 
  GraduationCap, 
  Users, 
  Briefcase, 
  TrendingUp, 
  Award, 
  Globe, 
  CheckCircle,
  ArrowRight,
  Calendar
} from "lucide-react";
import solarImage from "@assets/generated_images/African_solar_farm_infrastructure_d819497d.png";

export default function Program() {
  const programPillars = [
    {
      icon: GraduationCap,
      title: "Capacity Building",
      description: "Comprehensive courses covering project development, financial structuring, regulatory compliance, and leadership skills.",
      features: ["Self-paced online modules", "Live workshops", "Expert-led masterclasses", "Practical case studies"]
    },
    {
      icon: Users,
      title: "Project Support",
      description: "Participants receive expert support across:",
      features: ["Transaction structuring and advisory", "Legal and financial advisory", "Project management advice", "ESG advisory", "Operational and management support", "Fundraising support", "Technical advisory", "Feasibility and market studies"]
    },
    {
      icon: Briefcase,
      title: "Funding Access",
      description: "Connect with investors, development finance institutions, and capital partners to fund your ventures.",
      features: ["Investor pitch preparation", "DFI introductions", "Grant opportunities", "Funding strategy support"]
    },
    {
      icon: TrendingUp,
      title: "Business Development",
      description: "Strategic support to take your venture from concept to bankable, scalable project.",
      features: ["Business model refinement", "Market analysis", "Partnership development", "Scale-up strategies"]
    }
  ];

  const programBenefits = [
    "Access to a curated network of investors and DFIs",
    "Comprehensive training on project development and finance",
    "Personalized mentorship from industry leaders",
    "Community of peer infrapreneurs for support and collaboration",
    "Technical assistance for regulatory and legal matters",
    "Certification upon program completion",
    "Alumni network and ongoing support",
    "Multiplier commitment to mentor future cohorts"
  ];

  const timeline = [
    { phase: "Application", duration: "2 weeks", description: "Submit your application and project proposal" },
    { phase: "Selection", duration: "3 weeks", description: "Review, interviews, and cohort selection" },
    { phase: "Foundation", duration: "8 weeks", description: "Core training modules and mentorship matching" },
    { phase: "Development", duration: "12 weeks", description: "Advanced training, project refinement, investor prep" },
    { phase: "Showcase", duration: "2 weeks", description: "Demo day and investor presentations" },
    { phase: "Graduation", duration: "Ongoing", description: "Alumni support and multiplier commitment" }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-5xl font-bold mb-4">The AFÁRÁ Program</h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              A comprehensive accelerator designed to support female infrapreneurs building transformative energy and infrastructure ventures across Africa.
            </p>
          </div>

          <div className="mb-20">
            <img
              src={solarImage}
              alt="African solar infrastructure"
              className="w-full rounded-md shadow-lg"
            />
          </div>
        </div>
      </section>

      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-card">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Program Pillars</h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Our holistic approach combines training, mentorship, funding access, and business development to give you everything you need to succeed.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {programPillars.map((pillar, i) => (
              <Card key={i} className="hover-elevate transition-all duration-300">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <pillar.icon className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg mb-2">{pillar.title}</h3>
                      <p className="text-muted-foreground text-sm mb-4">{pillar.description}</p>
                      <ul className="space-y-2">
                        {pillar.features.map((feature, j) => (
                          <li key={j} className="flex items-center gap-2 text-sm">
                            <CheckCircle className="w-4 h-4 text-primary" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            <div>
              <h2 className="text-4xl font-bold mb-6">Program Benefits</h2>
              <p className="text-lg text-muted-foreground mb-8">
                As an AFÁRÁ participant, you'll gain access to a comprehensive support system designed to help you build, fund, and scale your venture.
              </p>
              <ul className="space-y-4">
                {programBenefits.map((benefit, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h2 className="text-4xl font-bold mb-6">Program Milestones</h2>
              <div className="space-y-4">
                {timeline.map((item, i) => (
                  <div key={i} className="flex items-start gap-4 p-4 bg-card rounded-md border">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Calendar className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold">{item.phase}</h4>
                      </div>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-card">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8 text-center mb-16">
            <div>
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Globe className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">Pan-African</h3>
              <p className="text-muted-foreground">Supporting infrapreneurs across the continent</p>
            </div>
            <div>
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Award className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">$1B Target</h3>
              <p className="text-muted-foreground">Funding aspiration over 5 years</p>
            </div>
            <div>
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">50 Ventures</h3>
              <p className="text-muted-foreground">Women-led businesses to be supported</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to Join?</h2>
          <p className="text-lg text-muted-foreground mb-8">
            Are you a female infrapreneur building or scaling a venture in Africa's energy or infrastructure sectors? Apply to join the next AFÁRÁ cohort and access the support you need to succeed.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/contact">
              <Button size="lg" data-testid="button-apply-now">
                Apply Now
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link href="/lms/dashboard">
              <Button size="lg" variant="outline" data-testid="button-existing-member">
                Existing Member Login
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
