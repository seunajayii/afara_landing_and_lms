import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight, Globe, Layers, Sparkles } from "lucide-react";
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
};

const STATUS_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
  open: { label: "Applications Open", variant: "default" },
  closed: { label: "Applications Closed", variant: "secondary" },
  archived: { label: "Past Cohort", variant: "outline" },
};

export default function Cohorts() {
  const { data: cohorts, isLoading } = useQuery<PublicCohort[]>({
    queryKey: ["/api/cohorts"],
    queryFn: async () => {
      const res = await fetch("/api/cohorts");
      return res.json();
    },
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <p className="text-sm font-semibold tracking-wide uppercase text-primary mb-3" data-testid="text-cohorts-eyebrow">
                AFÁRÁ Africa Accelerator
              </p>
              <h1 className="text-5xl font-bold mb-4" data-testid="text-cohorts-title">Our Cohorts</h1>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                AFÁRÁ runs a family of recurring cohorts under one accelerator — each with its own focus and partners, all sharing the same rigorous selection and support model.
              </p>
            </div>

            {isLoading && (
              <div className="grid md:grid-cols-2 gap-8">
                {[0, 1].map((i) => (
                  <Card key={i}>
                    <CardHeader>
                      <Skeleton className="h-6 w-2/3 mb-2" />
                      <Skeleton className="h-4 w-full" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-20 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {!isLoading && (!cohorts || cohorts.length === 0) && (
              <div className="text-center py-16 text-muted-foreground" data-testid="text-no-cohorts">
                No cohorts have been announced yet. Check back soon.
              </div>
            )}

            {!isLoading && cohorts && cohorts.length > 0 && (
              <div className="grid md:grid-cols-2 gap-8">
                {cohorts.map((cohort) => {
                  const statusCfg = STATUS_CONFIG[cohort.status] ?? { label: cohort.status, variant: "outline" as const };
                  const brandedImage = cohort.logoUrl
                    || cohort.heroImageUrl
                    || (cohort.slug === "core" ? coreHeroBanner : cohort.slug === "dorewa" ? dorewaHeroBanner : null);
                  return (
                    <Card key={cohort.id} className="flex flex-col md:flex-row overflow-hidden hover-elevate transition-all duration-300" data-testid={`card-cohort-${cohort.slug}`}>
                      <div className="w-full md:w-40 lg:w-48 md:flex-shrink-0 aspect-[16/9] md:aspect-square md:m-4 md:mr-0 overflow-hidden rounded-lg bg-primary/10">
                        {brandedImage ? (
                          <img
                            src={brandedImage}
                            alt={`${cohort.displayName || cohort.name} branded image`}
                            className={`w-full h-full ${cohort.logoUrl ? "object-contain p-5" : "object-cover"}`}
                          />
                        ) : (
                          <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-primary px-4 text-center text-primary-foreground">
                            {cohort.cohortType === "core" ? <Sparkles className="h-8 w-8" /> : <Layers className="h-8 w-8" />}
                            <span className="text-sm font-semibold">{cohort.displayName || cohort.name}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex min-w-0 flex-1 flex-col">
                        <CardHeader>
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant={statusCfg.variant} data-testid={`badge-status-${cohort.slug}`}>{statusCfg.label}</Badge>
                            {cohort.cohortType === "core" ? (
                              <Badge variant="outline" className="gap-1"><Sparkles className="w-3 h-3" /> AFÁRÁ Core</Badge>
                            ) : (
                              <Badge variant="outline" className="gap-1"><Layers className="w-3 h-3" /> Sponsored Cohort</Badge>
                            )}
                          </div>
                          <CardTitle className="text-2xl" data-testid={`text-cohort-name-${cohort.slug}`}>
                            {cohort.displayName || cohort.name}
                          </CardTitle>
                          {cohort.tagline && (
                            <CardDescription className="text-base">{cohort.tagline}</CardDescription>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">An AFÁRÁ Africa Accelerator Cohort{cohort.sponsor ? ` — in collaboration with ${cohort.sponsor}` : ""}</p>
                        </CardHeader>
                        <CardContent className="mt-auto flex flex-col gap-4">
                          {cohort.description && (
                            <p className="text-sm text-muted-foreground line-clamp-3">{cohort.description}</p>
                          )}
                          {cohort.geography && cohort.slug !== "dorewa" && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Globe className="w-4 h-4" />
                              <span>{cohort.geography}</span>
                            </div>
                          )}
                          <Link href={`/cohorts/${cohort.slug}`}>
                            <Button className="w-full" data-testid={`button-view-cohort-${cohort.slug}`}>
                              View Cohort <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                          </Link>
                        </CardContent>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
