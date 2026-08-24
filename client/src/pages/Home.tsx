import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { Footer } from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { GraduationCap, Users, Briefcase, TrendingUp, Lightbulb, Flame, Leaf, Truck, Wifi, ArrowRight, CalendarDays, MapPin, SunMedium, Network, Banknote, LineChart, Presentation, Handshake } from "lucide-react";
import solarImage from "@assets/generated_images/African_solar_farm_infrastructure_d819497d.png";
import dorewaFounderImage from "@assets/generated_images/African_woman_entrepreneur_portrait_f0a967a8.png";
import dorewaLogo from "@assets/0_Logos_(1)_1787573268326.png";
import dorewaPartnerMark from "@assets/0_Logos_1787573273293.png";

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

  const dorewaSupport = [
    { icon: Handshake, label: "Business advisory" },
    { icon: Network, label: "Peer learning & founder network" },
    { icon: Presentation, label: "Expert sessions" },
    { icon: LineChart, label: "Investment readiness" },
    { icon: Banknote, label: "Financial modelling & bankability" },
    { icon: TrendingUp, label: "Scaling support" },
    { icon: CalendarDays, label: "Demo Day" },
    { icon: SunMedium, label: "Investor Showcase" },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <Hero />

      {/* DOREWA — a distinct Nigeria-focused programme under the AFÁRÁ brand */}
      <section
        id="dorewa"
        className="relative overflow-hidden border-y border-[#dfcdb5] bg-[#f3eadb] text-[#173c35]"
      >
        <div
          className="pointer-events-none absolute -right-28 -top-32 h-80 w-80 rounded-full border-[32px] border-[#d87b4a]/15"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -bottom-36 -left-20 h-72 w-72 rounded-full border-[26px] border-[#d5a13c]/20"
          aria-hidden="true"
        />
        <div className="relative mx-auto grid max-w-7xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[1.05fr_.95fr] lg:items-center lg:px-8 lg:py-24">
          <div>
            <div className="mb-8 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
              <div className="h-24 w-24 shrink-0 overflow-hidden rounded-2xl border border-[#173c35]/15 bg-[#004d26] shadow-sm">
                <img
                  src={dorewaLogo}
                  alt="DOREWA"
                  className="h-full w-full object-contain"
                  data-testid="img-dorewa-logo-home"
                />
              </div>
              <div className="h-20 w-full max-w-[20rem] overflow-hidden rounded-full border border-[#173c35]/15 bg-[#004d26] shadow-sm sm:w-80">
                <img
                  src={dorewaPartnerMark}
                  alt="An Afará and Kingdom of the Netherlands initiative"
                  className="h-full w-full object-cover"
                  data-testid="img-dorewa-partner-mark-home"
                />
              </div>
            </div>

            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.22em] text-[#c4653b]">
              A Nigeria-focused programme
            </p>
            <h2 className="max-w-2xl text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl">
              The Women-Led
              <span className="block text-[#c4653b]">Agri-Energy Accelerator</span>
            </h2>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-[#49675d]">
              DOREWA is a 16-week accelerator for 25 women-led early and growth-stage
              companies shaping the future of renewable energy and the renewable
              energy + agriculture nexus in Nigeria.
            </p>

            <div className="mt-8 flex flex-wrap gap-3 text-sm font-semibold text-[#36594f]">
              <span className="inline-flex items-center gap-2 rounded-full border border-[#cbb99f] bg-[#faf5ec] px-4 py-2">
                <CalendarDays className="h-4 w-4 text-[#c4653b]" aria-hidden="true" />
                16 weeks
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-[#cbb99f] bg-[#faf5ec] px-4 py-2">
                <Users className="h-4 w-4 text-[#c4653b]" aria-hidden="true" />
                25 companies
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-[#cbb99f] bg-[#faf5ec] px-4 py-2">
                <MapPin className="h-4 w-4 text-[#c4653b]" aria-hidden="true" />
                Nigeria
              </span>
            </div>

            <Button
              asChild
              size="lg"
              className="mt-9 rounded-none border border-[#173c35] bg-[#d87b4a] px-7 text-[#173c35] shadow-[5px_5px_0_#173c35] hover:bg-[#e3915e] hover:shadow-[3px_3px_0_#173c35]"
              data-testid="button-apply-dorewa"
            >
              <Link href="/dorewa/apply">
                Apply for DOREWA
                <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
          </div>

          <div className="relative">
            <div className="absolute -inset-3 rotate-2 border border-[#d5a13c]/60" aria-hidden="true" />
            <div className="relative overflow-hidden border-8 border-[#173c35] bg-[#173c35]">
              <img
                src={dorewaFounderImage}
                alt="Woman entrepreneur standing beside renewable energy infrastructure"
                className="aspect-[4/5] w-full object-cover"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#173c35] via-[#173c35]/80 to-transparent px-6 pb-6 pt-20">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#e8ad50]">Build. Bank. Scale.</p>
                <p className="mt-2 max-w-xs text-xl font-semibold leading-snug text-[#faf5ec]">
                  A stronger future for women-led agri-energy businesses.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative border-t border-[#d9c5aa] bg-[#e9ddca]/75">
          <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
            <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#c4653b]">What founders receive</p>
                <h3 className="mt-2 text-2xl font-bold sm:text-3xl">Support that moves businesses forward.</h3>
              </div>
              <p className="max-w-sm text-sm leading-relaxed text-[#56746a]">
                From sharper models to a room full of aligned capital partners, DOREWA is built for momentum.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-px overflow-hidden border border-[#d4c0a6] bg-[#d4c0a6] sm:grid-cols-4">
              {dorewaSupport.map(({ icon: Icon, label }) => (
                <div key={label} className="flex min-h-24 items-center gap-3 bg-[#f3eadb] px-4 py-4 sm:px-5">
                  <Icon className="h-5 w-5 shrink-0 text-[#c4653b]" aria-hidden="true" />
                  <span className="text-sm font-semibold leading-snug text-[#36594f]">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
      
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
      <section className="py-14 px-4 sm:px-6 lg:px-8 bg-muted/40">
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
                    <p className="font-bold mb-2 text-foreground group-hover:underline transition-all" style={{ fontSize: '1.1rem' }}>
                      {item.publication}
                    </p>
                    <p className="mb-2 line-clamp-2 text-muted-foreground text-sm">
                      {item.headline}
                    </p>
                    <p className="mb-3 text-muted-foreground text-xs">
                      {item.date}
                    </p>
                  </div>
                  <p className="text-xs font-medium text-foreground">
                    Read article &rarr;
                  </p>
                </a>
                {i < arr.length - 1 && (
                  <>
                    <div className="hidden md:block self-stretch w-px my-2 bg-border" />
                    <hr className="block md:hidden my-6 w-full border-border" />
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
