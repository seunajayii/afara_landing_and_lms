import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";
import {
  ArrowRight,
  Globe2,
  Leaf,
  MapPin,
  Network,
  Sparkles,
  Sprout,
  Users,
} from "lucide-react";
import solarImage from "@assets/generated_images/African_solar_farm_infrastructure_d819497d.png";
import dorewaFounderImage from "@assets/generated_images/African_woman_entrepreneur_portrait_f0a967a8.png";
import dorewaLogo from "@assets/0_Logos_(1)_1787573268326.png";
import dorewaPartnerMark from "@assets/0_Logos_1787573273293.png";

const programmes = [
  {
    eyebrow: "Pan-African accelerator",
    title: "AFÁRÁ Africa Accelerator",
    description:
      "For women-led ventures building transformative energy and infrastructure projects across Africa.",
    details: [
      { icon: Globe2, label: "Africa-wide" },
      { icon: Network, label: "Energy & infrastructure" },
      { icon: Users, label: "Women-led ventures" },
    ],
    image: solarImage,
    imageAlt: "African solar infrastructure project",
    imageClassName: "object-cover",
    action: "Explore AFÁRÁ",
    actionHref: "/program",
    applyLabel: "Apply to AFÁRÁ",
    applyHref: "/apply",
    cardClassName: "bg-card",
  },
  {
    eyebrow: "Nigeria-focused accelerator",
    title: "DOREWA",
    description:
      "A 16-week programme for 25 women-led companies working in renewable energy and the renewable energy + agriculture nexus in Nigeria.",
    details: [
      { icon: MapPin, label: "Nigeria" },
      { icon: Leaf, label: "Renewable energy + agriculture" },
      { icon: Sprout, label: "16 weeks · 25 companies" },
    ],
    image: dorewaFounderImage,
    imageAlt: "Woman entrepreneur standing beside renewable energy infrastructure",
    imageClassName: "object-cover",
    action: "Explore DOREWA",
    actionHref: "/dorewa/apply",
    applyLabel: "Apply for DOREWA",
    applyHref: "/dorewa/apply",
    cardClassName: "bg-[#173c35] text-[#f9f3e9]",
  },
];

export default function Programs() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main>
        <section className="relative overflow-hidden border-b bg-muted/30 px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <div className="pointer-events-none absolute -right-24 -top-32 h-96 w-96 rounded-full border-[36px] border-primary/10" aria-hidden="true" />
          <div className="pointer-events-none absolute -bottom-40 -left-20 h-80 w-80 rounded-full border-[28px] border-chart-2/10" aria-hidden="true" />
          <div className="relative mx-auto max-w-4xl text-center">
            <div className="mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Sparkles className="h-6 w-6" aria-hidden="true" />
            </div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Choose your pathway</p>
            <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-6xl">Explore our programs</h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
              Two accelerator pathways. One shared ambition: helping women-led businesses turn bold ideas into bankable, scalable impact.
            </p>
          </div>
        </section>

        <section className="px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-2">
            {programmes.map((programme) => (
              <Card
                key={programme.title}
                className={`overflow-hidden border-0 shadow-lg ${programme.cardClassName}`}
              >
                <div className="relative h-64 overflow-hidden">
                  <img
                    src={programme.image}
                    alt={programme.imageAlt}
                    className={`h-full w-full ${programme.imageClassName}`}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
                  {programme.title === "DOREWA" && (
                    <div className="absolute left-5 top-5 flex h-16 w-16 items-center justify-center overflow-hidden rounded-xl border border-white/20 bg-[#004d26] shadow-lg">
                      <img src={dorewaLogo} alt="DOREWA" className="h-full w-full object-contain" />
                    </div>
                  )}
                </div>
                <CardContent className="p-7 sm:p-9">
                  <p className={`text-xs font-bold uppercase tracking-[0.18em] ${programme.title === "DOREWA" ? "text-[#e8ad50]" : "text-primary"}`}>
                    {programme.eyebrow}
                  </p>
                  <h2 className="mt-3 text-3xl font-bold sm:text-4xl">{programme.title}</h2>
                  <p className={`mt-4 min-h-20 leading-relaxed ${programme.title === "DOREWA" ? "text-[#d6e0d8]" : "text-muted-foreground"}`}>
                    {programme.description}
                  </p>
                  <div className="mt-7 grid gap-3 border-y border-current/10 py-5 sm:grid-cols-3">
                    {programme.details.map(({ icon: Icon, label }) => (
                      <div key={label} className="flex items-start gap-2 text-sm font-semibold">
                        <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${programme.title === "DOREWA" ? "text-[#e8ad50]" : "text-primary"}`} aria-hidden="true" />
                        <span>{label}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-7 flex flex-wrap gap-3">
                    <Button
                      asChild
                      className={programme.title === "DOREWA" ? "rounded-none bg-[#d87b4a] text-[#173c35] hover:bg-[#e3915e]" : "rounded-none"}
                    >
                      <Link href={programme.actionHref}>
                        {programme.action}
                        <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                      </Link>
                    </Button>
                    <Button
                      asChild
                      variant="outline"
                      className={programme.title === "DOREWA" ? "rounded-none border-[#d6e0d8]/40 bg-transparent text-[#f9f3e9] hover:bg-white/10 hover:text-white" : "rounded-none"}
                    >
                      <Link href={programme.applyHref}>{programme.applyLabel}</Link>
                    </Button>
                  </div>
                  {programme.title === "DOREWA" && (
                    <div className="mt-7 flex items-center gap-3 border-t border-white/10 pt-5">
                      <div className="h-10 w-40 overflow-hidden rounded-full border border-white/10 bg-[#004d26]">
                        <img src={dorewaPartnerMark} alt="An Afará and Kingdom of the Netherlands initiative" className="h-full w-full object-cover" />
                      </div>
                      <span className="text-xs text-[#b7cbc0]">An Afará x Kingdom of the Netherlands initiative</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="border-t bg-card px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold sm:text-4xl">Not sure which program is right for you?</h2>
            <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
              Start with the pathway that best matches your geography, sector, and current growth ambition. Both programmes are designed to help women-led businesses build, fund, and scale.
            </p>
            <Button asChild variant="outline" size="lg" className="mt-8 rounded-none">
              <Link href="/contact">
                Talk to the AFÁRÁ team
                <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}