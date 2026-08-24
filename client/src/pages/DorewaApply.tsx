import { Link } from "wouter";
import { ArrowLeft, ArrowRight, CalendarDays, CheckCircle2, MapPin, Sprout, Users } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";

const applicationSteps = [
  "Review the DOREWA programme focus and eligibility",
  "Complete the full secure application in the AFÁRÁ portal",
  "The team reviews your application and contacts shortlisted founders",
];

export default function DorewaApply() {
  return (
    <div className="min-h-screen bg-[#f3eadb] text-[#173c35]">
      <Navbar />
      <main>
        <section className="relative overflow-hidden bg-[#173c35] px-4 py-16 text-[#f9f3e9] sm:px-6 lg:px-8 lg:py-24">
          <div className="pointer-events-none absolute -right-20 -top-32 h-80 w-80 rounded-full border-[30px] border-[#d87b4a]/30" aria-hidden="true" />
          <div className="relative mx-auto max-w-7xl">
            <a href="/#dorewa" className="inline-flex items-center gap-2 text-sm font-semibold text-[#dcb77b] hover:text-white">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Back to DOREWA
            </a>
            <div className="mt-12 max-w-3xl">
              <div className="mb-6 inline-flex items-center gap-3 text-[#e8ad50]">
                <Sprout className="h-6 w-6" aria-hidden="true" />
                <span className="text-xl font-bold tracking-[0.16em]">DOREWA</span>
              </div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#d87b4a]">The Women-Led Agri-Energy Accelerator</p>
              <h1 className="mt-4 text-4xl font-bold leading-tight sm:text-6xl">Start your DOREWA application.</h1>
              <p className="mt-6 max-w-2xl text-lg leading-relaxed text-[#d6e0d8]">
                DOREWA is a 16-week accelerator for 25 women-led early and growth-stage
                companies working in renewable energy and the renewable energy + agriculture nexus in Nigeria.
              </p>
              <div className="mt-8 flex flex-wrap gap-3 text-sm font-semibold text-[#d6e0d8]">
                <span className="inline-flex items-center gap-2"><Users className="h-4 w-4 text-[#e8ad50]" aria-hidden="true" />25 companies</span>
                <span className="inline-flex items-center gap-2"><MapPin className="h-4 w-4 text-[#e8ad50]" aria-hidden="true" />Nigeria</span>
                <span className="inline-flex items-center gap-2"><CalendarDays className="h-4 w-4 text-[#e8ad50]" aria-hidden="true" />16-week programme</span>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl gap-12 px-4 py-14 sm:px-6 lg:grid-cols-[.72fr_1.28fr] lg:px-8 lg:py-20">
          <aside className="lg:pt-8">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#c4653b]">A partnership programme</p>
            <h2 className="mt-4 text-3xl font-bold leading-tight">Built for Nigeria’s next generation of agri-energy leaders.</h2>
            <p className="mt-5 leading-relaxed text-[#56746a]">
              DOREWA is an Afará x Kingdom of the Netherlands initiative. The programme combines advisory, peer learning, expert sessions, investment readiness, financial modelling, scaling support, Demo Day, and an Investor Showcase.
            </p>
            <div className="mt-8 border-l-2 border-[#d87b4a] pl-5 text-sm italic leading-relaxed text-[#56746a]">
              Have your company profile, business information, and growth plans ready before you begin.
            </div>
          </aside>

          <div id="dorewa-application-form" className="border border-[#dbc6a9] bg-[#faf5ec] p-6 shadow-[8px_8px_0_#d87b4a] sm:p-10">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#c4653b]">Apply for DOREWA</p>
            <h2 className="mt-2 text-3xl font-bold">Ready to take the next step?</h2>
            <p className="mt-3 max-w-2xl leading-relaxed text-[#56746a]">
              Start with the secure AFÁRÁ application portal. It collects the detail the team needs to understand your business, traction, financial readiness, and growth plans.
            </p>

            <ol className="mt-8 space-y-5">
              {applicationSteps.map((step, index) => (
                <li key={step} className="flex items-start gap-4">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#173c35] text-xs font-bold text-[#faf5ec]">
                    {index + 1}
                  </span>
                  <span className="pt-0.5 text-sm font-semibold leading-relaxed text-[#36594f]">{step}</span>
                </li>
              ))}
            </ol>

            <Button asChild size="lg" className="mt-10 w-full rounded-none bg-[#d87b4a] text-[#173c35] hover:bg-[#e3915e]" data-testid="button-continue-dorewa-application">
              <Link href="/apply?programme=dorewa">
                Continue to application
                <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
            <p className="mt-4 flex items-center gap-2 text-center text-xs leading-relaxed text-[#789087]">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-[#2b765b]" aria-hidden="true" />
              Your application is completed in the established secure AFÁRÁ portal.
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}