import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import heroBackground from "@assets/AFARA_Back_ground_1766234995095.png";

export function Hero() {
  return (
    <section className="relative min-h-[700px] flex items-center">
      <div className="absolute inset-0 z-0">
        <img
          src={heroBackground}
          alt="African woman infrapreneur in energy sector"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/75 to-black/50" />
      </div>

      <div className="relative z-10 w-full px-6 sm:px-10 lg:px-16 py-24">
        <div className="max-w-xl">
          <h1 className="text-2xl md:text-3xl font-bold mb-8 text-white leading-relaxed">
            Empowering Women to Build
            <span className="block mt-3 bg-gradient-to-r from-primary to-chart-2 bg-clip-text text-transparent">
              Africa's Future
            </span>
          </h1>
          <p className="text-base md:text-lg text-gray-200 mb-10 max-w-lg leading-relaxed">
            AFÁRÁ is a business accelerator supporting female-owned and led African companies in the Energy and Infrastructure space. From feasibility to funding, we bridge the gap.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link href="/program">
              <Button size="lg" data-testid="button-explore-program">
                Explore Program
              </Button>
            </Link>
            <Link href="/lms/dashboard">
              <Button size="lg" variant="outline" className="backdrop-blur-sm bg-white/10 text-white border-white/30 hover:bg-white/20" data-testid="button-access-lms">
                Access LMS
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
