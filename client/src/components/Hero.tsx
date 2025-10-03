import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import heroImage from "@assets/generated_images/African_bridge_infrastructure_sunset_d6e78169.png";

export function Hero() {
  return (
    <section className="relative min-h-[600px] flex items-center">
      <div className="absolute inset-0 z-0">
        <img
          src={heroImage}
          alt="African infrastructure"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/80 to-background/40" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="max-w-3xl">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            Bridging Ideas to
            <span className="block mt-2 bg-gradient-to-r from-primary to-chart-2 bg-clip-text text-transparent">
              Infrastructure
            </span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl">
            Leading advisory catalyst for transformative, bankable energy and infrastructure projects that drive inclusive development across Africa.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link href="/services">
              <Button size="lg" data-testid="button-our-services">
                Our Services
              </Button>
            </Link>
            <Link href="/track-record">
              <Button size="lg" variant="outline" className="backdrop-blur-sm bg-background/50" data-testid="button-view-track-record">
                View Track Record
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
