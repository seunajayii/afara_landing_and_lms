import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ServiceCard } from "@/components/ServiceCard";
import { Building2, Scale, Users, Lightbulb, TrendingUp, Briefcase } from "lucide-react";

export default function Services() {
  const services = [
    {
      icon: Building2,
      title: "Projects, Transaction Advisory & Structuring",
      description: "From concept to capital—we guide the entire development process, ensuring technical and financial viability."
    },
    {
      icon: Scale,
      title: "Regulatory Strategy",
      description: "Navigating policy with confidence—we demystify early-stage regulatory hurdles to boost bankability."
    },
    {
      icon: Users,
      title: "Team Selection & Procurement",
      description: "Curating capable, aligned project teams through hands-on selection and procurement support."
    },
    {
      icon: Lightbulb,
      title: "Funding Strategy & Capital Matchmaking",
      description: "We shape funding strategies and connect projects to the right capital partners via our extensive network."
    },
    {
      icon: TrendingUp,
      title: "Market Entry Support",
      description: "Strategic guidance for entering new markets across Africa with comprehensive analysis and local partnerships."
    },
    {
      icon: Briefcase,
      title: "Capacity-Building Workshops",
      description: "Tailored training programs to enhance technical, financial, and governance capabilities for project success."
    }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-5xl font-bold mb-4">Our Services</h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Comprehensive advisory services for transformative energy and infrastructure projects across Africa.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service, i) => (
              <ServiceCard key={i} {...service} />
            ))}
          </div>

          <div className="mt-20 bg-card rounded-xl p-8 md:p-12">
            <h2 className="text-3xl font-bold mb-6">Our Approach</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div>
                <h3 className="font-bold text-lg mb-3 text-primary">Development Driven</h3>
                <p className="text-muted-foreground">Every project we support is anchored in sustainable development impact for African communities.</p>
              </div>
              <div>
                <h3 className="font-bold text-lg mb-3 text-primary">Strategic & Collaborative</h3>
                <p className="text-muted-foreground">We build partnerships across stakeholders to ensure projects achieve their full potential.</p>
              </div>
              <div>
                <h3 className="font-bold text-lg mb-3 text-primary">Gender Sensitive</h3>
                <p className="text-muted-foreground">Committed to advancing women's leadership in energy and infrastructure sectors.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
