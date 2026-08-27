import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "wouter";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight, Globe, Layers, Sparkles, Handshake, Target } from "lucide-react";
import coreHeroBanner from "@assets/AFARA_AA_1787817026358.png";
import dorewaHeroBanner from "@assets/Copy_of_Presentation_-_DOREWA_1787816454760.png";

type PublicCohort = {
  id: string;
  slug: string;
  name: string;
  displayName: string | null;
  cohortType: string;
  status: string;
  isOpen: boolean;
  description: string | null;
  tagline: string | null;
  partnershipNote: string | null;
  sponsor: string | null;
  geography: string | null;
  sector: string | null;
  logoUrl: string | null;
  heroImageUrl: string | null;
  eligibilityCriteria: string | null;
};

const STATUS_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
  draft: { label: "Coming Soon", variant: "outline" },
  open: { label: "Applications Open", variant: "default" },
  closed: { label: "Applications Closed", variant: "secondary" },
  archived: { label: "Past Cohort", variant: "outline" },
};

export default function CohortDetail() {
  const { slug } = useParams<{ slug: string }>();

  const { data, isLoading } = useQuery<{ cohort: PublicCohort | null }>({
    queryKey: ["/api/cohorts/by-slug", slug],
    queryFn: async () => {
      const res = await fetch(`/api/cohorts/by-slug/${encodeURIComponent(slug)}`);
      return res.json();
    },
    enabled: !!slug,
  });

  const cohort = data?.cohort ?? null;
  // Drafts aren't announced publicly yet — treat them like "not found" on the marketing page,
  // even though the same slug still resolves for the /apply flow.
  const isPubliclyVisible = cohort && cohort.status !== "draft";

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto space-y-6">
            <Skeleton className="h-10 w-2/3" />
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!isPubliclyVisible) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 py-24 px-4 sm:px-6 lg:px-8">
          <div className="max-w-xl mx-auto text-center">
            <h1 className="text-3xl font-bold mb-4" data-testid="text-cohort-not-found">Cohort not found</h1>
            <p className="text-muted-foreground mb-8">
              We couldn't find that cohort. It may not have been announced yet, or the link may be incorrect.
            </p>
            <Link href="/cohorts">
              <Button data-testid="button-back-to-cohorts">View All Cohorts</Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const statusCfg = STATUS_CONFIG[cohort.status] ?? { label: cohort.status, variant: "outline" as const };
  const isBrandedHero = cohort.slug === "core" || cohort.slug === "dorewa";
  const heroImageUrl =
    cohort.slug === "core"
      ? coreHeroBanner
      : cohort.slug === "dorewa"
        ? dorewaHeroBanner
        : (cohort.heroImageUrl ?? undefined);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <section className="relative py-20 px-4 sm:px-6 lg:px-8 bg-card">
          {isBrandedHero && heroImageUrl && (
            <div className="max-w-6xl mx-auto mb-12 overflow-hidden rounded-lg shadow-lg" data-testid={`${cohort.slug}-hero-banner`}>
              <img
                src={heroImageUrl}
                alt={`${cohort.displayName || cohort.name} hero banner`}
                className="block w-full aspect-[16/9] object-cover"
              />
            </div>
          )}
          <div className="max-w-5xl mx-auto">
            <div className="flex flex-wrap items-center gap-2 mb-6">
              <Badge variant={statusCfg.variant} data-testid="badge-cohort-status">{statusCfg.label}</Badge>
              {cohort.cohortType === "core" ? (
                <Badge variant="outline" className="gap-1"><Sparkles className="w-3 h-3" /> AFÁRÁ Core Cohort</Badge>
              ) : (
                <Badge variant="outline" className="gap-1"><Layers className="w-3 h-3" /> Sponsored Cohort</Badge>
              )}
            </div>

            {cohort.logoUrl && (
              <img src={cohort.logoUrl} alt={`${cohort.displayName || cohort.name} logo`} className="h-16 w-auto mb-6 object-contain" />
            )}

            <p className="text-sm font-semibold tracking-wide uppercase text-primary mb-2" data-testid="text-identity-hierarchy">
              An AFÁRÁ Africa Accelerator Cohort{cohort.sponsor ? ` — in collaboration with ${cohort.sponsor}` : ""}
            </p>
            <h1 className="text-5xl font-bold mb-4" data-testid="text-cohort-title">{cohort.displayName || cohort.name}</h1>
            {cohort.tagline && (
              <p className="text-xl text-muted-foreground max-w-3xl" data-testid="text-cohort-tagline">{cohort.tagline}</p>
            )}

            {!isBrandedHero && heroImageUrl && (
              <div className="mt-10 rounded-md overflow-hidden shadow-lg">
                <img src={heroImageUrl} alt={cohort.displayName || cohort.name} className="w-full h-80 object-cover" />
              </div>
            )}
          </div>
        </section>

        <section className="py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-10">
            <div className="md:col-span-2 space-y-8">
              {cohort.description && (
                <div>
                  <h2 className="text-2xl font-bold mb-3">About this Cohort</h2>
                  <p className="text-muted-foreground leading-relaxed whitespace-pre-line">{cohort.description}</p>
                </div>
              )}

              {cohort.partnershipNote && (
                <Card>
                  <CardContent className="pt-6 flex gap-4">
                    <Handshake className="w-6 h-6 text-primary flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold mb-1">Partnership</h3>
                      <p className="text-sm text-muted-foreground">{cohort.partnershipNote}</p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {cohort.eligibilityCriteria && (
                <div>
                  <h2 className="text-2xl font-bold mb-3">Eligibility</h2>
                  <p className="text-muted-foreground leading-relaxed whitespace-pre-line">{cohort.eligibilityCriteria}</p>
                </div>
              )}
            </div>

            <div className="space-y-6">
              {((cohort.geography && cohort.slug !== "dorewa") || cohort.sector || cohort.sponsor) && (
              <Card>
                <CardContent className="pt-6 space-y-4">
                  {cohort.geography && cohort.slug !== "dorewa" && (
                    <div className="flex items-start gap-3">
                      <Globe className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Geography</p>
                        <p className="text-sm text-muted-foreground">{cohort.geography}</p>
                      </div>
                    </div>
                  )}
                  {cohort.sector && (
                    <div className="flex items-start gap-3">
                      <Target className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Sector Focus</p>
                        <p className="text-sm text-muted-foreground">{cohort.sector}</p>
                      </div>
                    </div>
                  )}
                  {cohort.sponsor && (
                    <div className="flex items-start gap-3">
                      <Handshake className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Sponsor</p>
                        <p className="text-sm text-muted-foreground">{cohort.sponsor}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
              )}

              <Link href={`/apply/${cohort.slug}`}>
                <Button className="w-full" size="lg" data-testid="button-apply-to-cohort">
                  {cohort.isOpen ? "Apply Now" : "View Application"} <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              {!cohort.isOpen && (
                <p className="text-xs text-muted-foreground text-center">
                  Applications for this cohort are currently closed.
                </p>
              )}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
