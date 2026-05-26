import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { Footer } from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { GraduationCap, Users, Briefcase, TrendingUp, Lightbulb, Flame, Leaf, Truck, Wifi, ArrowRight } from "lucide-react";
import solarImage from "@assets/generated_images/African_solar_farm_infrastructure_d819497d.png";

export default function Home() {
  const programPillars = [
    {
      icon: GraduationCap,
      title: "Capacity Building",
      description: "Comprehensive courses on project development, financial structuring, and regulatory compliance."
    },
    {
      icon: Users,
      title: "Project Support",
      description: "Participants receive expert support across transaction structuring, legal and financial advisory, project management, ESG, technical guidance, fundraising, and feasibility and market studies."
    },
    {
      icon: Briefcase,
      title: "Funding Access",
      description: "Connect with investors, lenders, development finance institutions, and capital partners."
    },
    {
      icon: TrendingUp,
      title: "Business Development",
      description: "Strategic support to take your venture from concept to bankable project."
    }
  ];

  const stats = [
    { value: "50+", label: "Women-Led Ventures to Support" },
    { value: "15+", label: "African Countries to Reach" },
    { value: "$1B+", label: "Target Funding Pipeline" },
    { value: "200+", label: "Mentorship Hours to Deliver" }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <Hero />
      
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Why AFÁRÁ?</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              The name "AFÁRÁ" comes from the Yoruba word meaning "bridge"—symbolizing connection, transition, and opportunity. We help women move from aspiration to execution in Africa's energy and infrastructure sectors.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {programPillars.map((pillar, i) => (
              <Card key={i} className="hover-elevate transition-all duration-300">
                <CardContent className="pt-6">
                  <div className="w-12 h-12 rounded-md bg-primary/10 flex items-center justify-center mb-4">
                    <pillar.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-bold text-lg mb-2">{pillar.title}</h3>
                  <p className="text-muted-foreground text-sm">{pillar.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-primary text-primary-foreground">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {stats.map((stat, i) => (
              <div key={i} data-testid={`stat-${i}`}>
                <p className="text-4xl md:text-5xl font-bold mb-2">{stat.value}</p>
                <p className="text-sm md:text-base opacity-90">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* As Seen In */}
      <section className="py-14 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: '#f5f0e8' }}>
        <div className="max-w-5xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-10">
            AFÁRÁ in the Press
          </h2>
          <div className="flex flex-col md:flex-row items-stretch justify-center">
            {[
              {
                publication: 'BusinessDay',
                headline: 'Africa accelerator targets $1bn to back women-led energy projects',
                date: 'May 24, 2026',
                url: 'https://businessday.ng/energy/article/africa-accelerator-targets-1bn-to-back-women-led-energy-projects/',
              },
              {
                publication: 'Platforms Africa',
                headline: 'AFARA Launches an Africa wide Accelerator In Lagos To Build Bankable Women-Led Energy Projects',
                date: 'May 24, 2026',
                url: 'https://platformsafrica.com/2026/05/24/afara-launches-an-africa-wide-accelerator-in-lagos-to-build-bankable-women-led-energy-projects/',
              },
              {
                publication: 'Daily Champion',
                headline: 'AFARA launches an Africa-wide accelerator in Lagos to build bankable Women-Led Energy Projects',
                date: 'May 21, 2026',
                url: 'https://championnews.com.ng/2026/05/21/afara-launches-an-africa-wide-accelerator-in-lagos-to-build-bankable-women-led-energy-projects/',
              },
              {
                publication: 'ThisDay Live',
                headline: 'AFARA Unveils Africa-wide Accelerator to Build Bankable Women-Led Energy Projects',
                date: 'May 25, 2026',
                url: 'https://www.thisdaylive.com/2026/05/25/afara-unveils-africa-wide-accelerator-to-build-bankable-women-led-energy-projects/',
              },
            ].map((item, i, arr) => (
              <div key={i} className="flex flex-row md:flex-col items-stretch">
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${item.publication}: ${item.headline}`}
                  className="group flex flex-col justify-between px-8 py-2 md:py-0 text-left flex-1"
                  data-testid={`press-item-${i}`}
                >
                  <div>
                    <p className="font-bold mb-2 group-hover:underline transition-all" style={{ fontSize: '1.1rem', color: '#1a3a2a' }}>
                      {item.publication}
                    </p>
                    <p className="mb-2 line-clamp-2" style={{ fontSize: '0.85rem', color: '#555' }}>
                      {item.headline}
                    </p>
                    <p className="mb-3" style={{ fontSize: '0.75rem', color: '#888' }}>
                      {item.date}
                    </p>
                  </div>
                  <p className="text-xs font-medium" style={{ color: '#1a3a2a' }}>
                    Read article &rarr;
                  </p>
                </a>
                {i < arr.length - 1 && (
                  <>
                    <div className="hidden md:block self-stretch w-px my-2" style={{ backgroundColor: '#d6d0c4' }} />
                    <hr className="block md:hidden my-6 w-full" style={{ borderColor: '#d6d0c4' }} />
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="relative">
              <img
                src={solarImage}
                alt="African solar infrastructure project"
                className="rounded-md shadow-lg w-full"
              />
            </div>
            <div>
              <h2 className="text-4xl font-bold mb-6">
                Who We Support
              </h2>
              <p className="text-lg text-muted-foreground mb-6">
                AFÁRÁ is designed for female infrapreneurs and business leaders who are building or scaling ventures in:
              </p>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
                    <Flame className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <div>
                    <span className="font-semibold">Gas & Power</span>
                    <p className="text-sm text-muted-foreground">Gas-to-power infrastructure, refinery operations, and gas utilisation</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
                    <Lightbulb className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <div>
                    <span className="font-semibold">Renewable Energy</span>
                    <p className="text-sm text-muted-foreground">Solar, wind, battery storage, distributed generation, and mini-grids</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
                    <Leaf className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <div>
                    <span className="font-semibold">Clean Energy Access</span>
                    <p className="text-sm text-muted-foreground">Clean cooking solutions and last-mile energy delivery</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
                    <Truck className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <div>
                    <span className="font-semibold">Transport & Logistics</span>
                    <p className="text-sm text-muted-foreground">Roads, rail, ports, and logistics infrastructure</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
                    <Wifi className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <div>
                    <span className="font-semibold">Digital & Communications Infrastructure</span>
                    <p className="text-sm text-muted-foreground">Telecoms networks and digital connectivity projects</p>
                  </div>
                </li>
              </ul>
              <Link href="/program">
                <Button size="lg" data-testid="button-learn-more">
                  Learn More About the Program
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-card">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to Bridge the Gap?</h2>
          <p className="text-lg text-muted-foreground mb-8">
            Join a community of ambitious women infrapreneurs transforming Africa's energy and infrastructure landscape. Access training, mentorship, and funding opportunities.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/apply">
              <Button size="lg" data-testid="button-apply-now">
                Apply Now
              </Button>
            </Link>
            <Link href="/lms/dashboard">
              <Button size="lg" variant="outline" data-testid="button-member-login">
                Member Login
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
