import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import entrepreneurImage from "@assets/generated_images/African_woman_entrepreneur_portrait_f0a967a8.png";

export function Hero() {
  return (
    <section className="relative min-h-[600px] flex items-center">
      <div className="absolute inset-0 z-0">
        <img
          src={entrepreneurImage}
          alt="African woman entrepreneur in energy sector"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/75 to-black/50" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="max-w-3xl">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 text-white">
            Empowering Women to Build
            <span className="block mt-2 bg-gradient-to-r from-primary to-chart-2 bg-clip-text text-transparent">
              Africa's Future
            </span>
          </h1>
          <p className="text-xl text-gray-200 mb-8 max-w-2xl">
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
