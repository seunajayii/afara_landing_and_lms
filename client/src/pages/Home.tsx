import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { Footer } from "@/components/Footer";
import { ServiceCard } from "@/components/ServiceCard";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Building2, Scale, Users, Lightbulb } from "lucide-react";
import entrepreneurImage from "@assets/generated_images/African_woman_entrepreneur_portrait_f0a967a8.png";

export default function Home() {
  const services = [
    {
      icon: Building2,
      title: "Project Advisory",
      description: "From concept to capital—we guide the entire development process, ensuring technical and financial viability."
    },
    {
      icon: Scale,
      title: "Regulatory Strategy",
      description: "Navigating policy with confidence—we demystify early-stage regulatory hurdles to boost bankability."
    },
    {
      icon: Users,
      title: "Team Selection",
      description: "Curating capable, aligned project teams through hands-on selection and procurement support."
    },
    {
      icon: Lightbulb,
      title: "Funding Strategy",
      description: "We shape funding strategies and connect projects to the right capital partners via our extensive network."
    }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <Hero />
      
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Our Core Services</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Empowering project sponsors, entrepreneurs, and investors with strategic guidance and access to funding partnerships.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map((service, i) => (
              <ServiceCard key={i} {...service} />
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-card">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold mb-6">
                Introducing <span className="bg-gradient-to-r from-chart-1 to-chart-2 bg-clip-text text-transparent">AFÁRÁ</span>
              </h2>
              <p className="text-lg text-muted-foreground mb-6">
                An entrepreneurship accelerator for African women in energy & infrastructure. Supporting 50 women-led ventures with funding, technical expertise, and regulatory guidance.
              </p>
              <p className="text-muted-foreground mb-8">
                The name "AFÁRÁ" comes from the Yoruba word meaning "bridge"—symbolizing connection, transition, and opportunity. We help women move from feasibility to funding, from aspiration to execution.
              </p>
              <Link href="/afara">
                <Button size="lg" data-testid="button-learn-about-afara">
                  Learn About AFÁRÁ
                </Button>
              </Link>
            </div>
            <div className="relative">
              <img
                src={entrepreneurImage}
                alt="African woman entrepreneur"
                className="rounded-xl shadow-lg w-full"
              />
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
