import { useState } from "react";
import { AdminSidebar } from "@/components/AdminSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart2,
  Brain,
  Sparkles,
  Loader2,
  TrendingUp,
  Users,
  Globe,
  Zap,
  CheckCircle,
  RefreshCw,
  Plus,
  PlayCircle,
  X,
  FolderOpen,
  Download,
  ListFilter,
  LockOpen,
  LockKeyhole,
} from "lucide-react";
import type { Application, ApplicationEvaluation, Cohort } from "@shared/schema";

const RECOMMENDATION_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; color: string }> = {
  strong_yes: { label: "Strong Yes", variant: "default", color: "bg-green-600" },
  yes: { label: "Yes", variant: "default", color: "bg-green-400" },
  maybe: { label: "Maybe", variant: "secondary", color: "bg-yellow-500" },
  no: { label: "No", variant: "destructive", color: "bg-red-500" },
};

interface CohortData {
  applications: Application[];
  evaluations: ApplicationEvaluation[];
  cohorts: Cohort[];
}

function ScoreHistogram({ evaluations }: { evaluations: ApplicationEvaluation[] }) {
  const buckets = [
    { label: "0–19", min: 0, max: 19 },
    { label: "20–39", min: 20, max: 39 },
    { label: "40–59", min: 40, max: 59 },
    { label: "60–79", min: 60, max: 79 },
    { label: "80–100", min: 80, max: 100 },
  ];
  const counts = buckets.map((b) => ({
    ...b,
    count: evaluations.filter((e) => e.overallScore >= b.min && e.overallScore <= b.max).length,
  }));
  const maxCount = Math.max(...counts.map((c) => c.count), 1);
  return (
    <div className="flex items-end gap-2 h-32">
      {counts.map((b) => (
        <div key={b.label} className="flex-1 flex flex-col items-center gap-1">
          <span className="text-xs font-medium text-foreground">{b.count}</span>
          <div
            className="w-full rounded-t-sm bg-primary/80 transition-all"
            style={{ height: `${Math.max(4, (b.count / maxCount) * 96)}px` }}
          />
          <span className="text-xs text-muted-foreground">{b.label}</span>
        </div>
      ))}
    </div>
  );
}

function DimensionAvgBar({ label, scores }: { label: string; scores: number[] }) {
  const avg = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="text-xs font-semibold">{avg}/100</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div className="h-full rounded-full bg-primary/70 transition-all" style={{ width: `${avg}%` }} />
      </div>
    </div>
  );
}

type RankedItem = { eval: ApplicationEvaluation; app: Application };

function exportCSV(items: RankedItem[], filename: string) {
  const headers = [
    "Rank", "Name", "Email", "Company", "Country", "Sector",
    "Overall Score", "Recommendation",
    "Leadership", "Business Viability", "Market & Scale", "Energy & Infra", "Program Readiness",
  ];
  const rows = items.map((item, idx) => [
    idx + 1,
    `${item.app.firstName} ${item.app.lastName}`,
    item.app.email ?? "",
    item.app.companyName || item.app.companyLegalName || "",
    item.app.countryOfOperation || item.app.companyCountry || "",
    item.app.primarySector || "",
    item.eval.overallScore,
    RECOMMENDATION_CONFIG[item.eval.recommendation]?.label || item.eval.recommendation,
    item.eval.leadershipScore,
    item.eval.businessViabilityScore,
    item.eval.marketScaleScore,
    item.eval.energyInfraImpactScore,
    item.eval.programReadinessScore,
  ]);
  const csv = [headers, ...rows]
    .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function CandidateRow({ item, rank }: { item: RankedItem; rank: number }) {
  const rec = RECOMMENDATION_CONFIG[item.eval.recommendation];
  return (
    <div
      className="flex flex-wrap items-center gap-3 p-3 rounded-md bg-muted/30"
      data-testid={`row-candidate-${item.eval.id}`}
    >
      <span className="text-sm font-mono text-muted-foreground w-6 text-right flex-shrink-0">
        {rank}.
      </span>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm">
          {item.app.firstName} {item.app.lastName}
        </div>
        <div className="text-xs text-muted-foreground truncate">
          {item.app.companyName || item.app.companyLegalName || "—"} ·{" "}
          {item.app.countryOfOperation || item.app.companyCountry || "—"} ·{" "}
          {item.app.primarySector || "—"}
        </div>
      </div>
      <div className="flex items-center gap-3 flex-shrink-0 text-xs text-muted-foreground">
        <span title="Leadership">L:{item.eval.leadershipScore}</span>
        <span title="Business Viability">B:{item.eval.businessViabilityScore}</span>
        <span title="Market & Scale">M:{item.eval.marketScaleScore}</span>
        <span title="Energy & Infra">E:{item.eval.energyInfraImpactScore}</span>
        <span title="Program Readiness">P:{item.eval.programReadinessScore}</span>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className="text-lg font-bold text-primary">{item.eval.overallScore}</span>
        {rec && <Badge variant={rec.variant} className="text-xs">{rec.label}</Badge>}
      </div>
    </div>
  );
}

function CandidateListTab({
  items,
  exportName,
  emptyText,
}: {
  items: RankedItem[];
  exportName: string;
  emptyText: string;
}) {
  if (items.length === 0) {
    return (
      <div className="py-10 text-center text-sm text-muted-foreground italic">{emptyText}</div>
    );
  }
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center mb-3">
        <span className="text-xs text-muted-foreground">{items.length} candidate{items.length !== 1 ? "s" : ""}</span>
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5"
          onClick={() => exportCSV(items, exportName)}
          data-testid={`button-export-${exportName}`}
        >
          <Download className="h-3.5 w-3.5" />
          Export CSV
        </Button>
      </div>
      {items.map((item, idx) => (
        <CandidateRow key={item.eval.id} item={item} rank={idx + 1} />
      ))}
    </div>
  );
}

function CandidateLists({
  ranked,
  cohortLabel,
}: {
  ranked: RankedItem[];
  cohortLabel: string;
}) {
  const bestFits = ranked.filter((r) => r.eval.recommendation === "strong_yes" || r.eval.recommendation === "yes");
  const eligible = ranked.filter((r) => r.eval.recommendation !== "no");
  const noGo = ranked.filter((r) => r.eval.recommendation === "no");
  const slug = cohortLabel.toLowerCase().replace(/\s+/g, "-");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <ListFilter className="h-4 w-4 text-primary" />
          Candidate Lists
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="all">
          <TabsList className="mb-4">
            <TabsTrigger value="all" data-testid="tab-all-ranked">
              Top Ranked <Badge variant="secondary" className="ml-1.5 text-xs">{ranked.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="best" data-testid="tab-best-fits">
              Best Fits <Badge variant="secondary" className="ml-1.5 text-xs">{bestFits.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="eligible" data-testid="tab-eligible">
              Eligible Pool <Badge variant="secondary" className="ml-1.5 text-xs">{eligible.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="nogo" data-testid="tab-nogo">
              No Go <Badge variant="secondary" className="ml-1.5 text-xs">{noGo.length}</Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            <CandidateListTab
              items={ranked}
              exportName={`${slug}-top-ranked.csv`}
              emptyText="No evaluated candidates yet."
            />
          </TabsContent>
          <TabsContent value="best">
            <CandidateListTab
              items={bestFits}
              exportName={`${slug}-best-fits.csv`}
              emptyText="No Strong Yes or Yes recommendations yet."
            />
          </TabsContent>
          <TabsContent value="eligible">
            <CandidateListTab
              items={eligible}
              exportName={`${slug}-eligible-pool.csv`}
              emptyText="No eligible candidates (Strong Yes, Yes, or Maybe) yet."
            />
          </TabsContent>
          <TabsContent value="nogo">
            <CandidateListTab
              items={noGo}
              exportName={`${slug}-no-go.csv`}
              emptyText="No No recommendations yet."
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

export default function CohortAnalytics() {
  const { toast } = useToast();
  const qc = useQueryClient();

  const [selectedCohortId, setSelectedCohortId] = useState<string | null>(null);
  const [narrative, setNarrative] = useState<string | null>(null);
  const [isGeneratingNarrative, setIsGeneratingNarrative] = useState(false);
  const [showCreateCohort, setShowCreateCohort] = useState(false);
  const [newCohortName, setNewCohortName] = useState("");
  const [newCohortYear, setNewCohortYear] = useState("");

  const analyticsKey = ["/api/admin/cohort-analytics", selectedCohortId ?? "all"];

  const { data, isLoading, refetch, isFetching } = useQuery<CohortData>({
    queryKey: analyticsKey,
    queryFn: async () => {
      const url = selectedCohortId
        ? `/api/admin/cohort-analytics?cohortId=${encodeURIComponent(selectedCohortId)}`
        : "/api/admin/cohort-analytics";
      const res = await apiRequest("GET", url);
      return res.json();
    },
  });

  const cohorts = data?.cohorts ?? [];
  const applications = data?.applications ?? [];
  const allEvals = data?.evaluations ?? [];

  const appIds = new Set(applications.map((a) => a.id));
  const evaluations = allEvals.filter((e) => appIds.has(e.applicationId));
  const evalAppIds = new Set(evaluations.map((e) => e.applicationId));
  const submittedApps = applications.filter((a) => a.status !== "draft");
  const unevaluatedCount = submittedApps.filter((a) => !evalAppIds.has(a.id)).length;

  const createCohortMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/admin/cohorts", {
        name: newCohortName.trim(),
        year: newCohortYear ? parseInt(newCohortYear) : undefined,
      });
      if (!res.ok) throw new Error("Failed to create cohort");
      return res.json();
    },
    onSuccess: (cohort: Cohort) => {
      qc.invalidateQueries({ queryKey: ["/api/admin/cohort-analytics"] });
      setShowCreateCohort(false);
      setNewCohortName("");
      setNewCohortYear("");
      setSelectedCohortId(cohort.id);
      setNarrative(null);
      toast({ title: `Cohort "${cohort.name}" created` });
    },
    onError: () => toast({ title: "Failed to create cohort", variant: "destructive" }),
  });

  const deleteCohortMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/admin/cohorts/${id}`);
      if (!res.ok) throw new Error("Failed to delete cohort");
    },
    onSuccess: (_, id) => {
      if (selectedCohortId === id) {
        setSelectedCohortId(null);
        setNarrative(null);
      }
      qc.invalidateQueries({ queryKey: ["/api/admin/cohort-analytics"] });
      toast({ title: "Cohort deleted" });
    },
    onError: () => toast({ title: "Failed to delete cohort", variant: "destructive" }),
  });

  const toggleOpenMutation = useMutation({
    mutationFn: async ({ id, open }: { id: string; open: boolean }) => {
      const res = await apiRequest("POST", `/api/admin/cohorts/${id}/set-open`, { open });
      if (!res.ok) throw new Error("Failed to update cohort");
      return res.json() as Promise<Cohort>;
    },
    onSuccess: (cohort: Cohort) => {
      qc.invalidateQueries({ queryKey: ["/api/admin/cohort-analytics"] });
      toast({
        title: cohort.isOpen
          ? `Applications opened for "${cohort.name}"`
          : `Applications closed for "${cohort.name}"`,
      });
    },
    onError: () => toast({ title: "Failed to update cohort status", variant: "destructive" }),
  });

  const evaluateAllMutation = useMutation({
    mutationFn: async () => {
      const body = { force: true, ...(selectedCohortId ? { cohortId: selectedCohortId } : {}) };
      const res = await apiRequest("POST", "/api/admin/cohort-analytics/evaluate-all", body);
      if (!res.ok) throw new Error("Batch evaluation failed");
      return res.json();
    },
    onSuccess: (result: { evaluated: number; total: number; errors?: string[] }) => {
      qc.invalidateQueries({ queryKey: ["/api/admin/cohort-analytics"] });
      const msg = result.evaluated === 0
        ? "All applications already evaluated"
        : `Evaluated ${result.evaluated} of ${result.total} application${result.total !== 1 ? "s" : ""}`;
      toast({
        title: msg,
        description: result.errors?.length ? `${result.errors.length} failed — check server logs` : undefined,
      });
    },
    onError: (err: Error) => toast({ title: "Evaluation failed", description: err.message, variant: "destructive" }),
  });

  const evaluated = evaluations.length;
  const avgScore = evaluated > 0 ? Math.round(evaluations.reduce((sum, e) => sum + e.overallScore, 0) / evaluated) : 0;

  const recCounts = {
    strong_yes: evaluations.filter((e) => e.recommendation === "strong_yes").length,
    yes: evaluations.filter((e) => e.recommendation === "yes").length,
    maybe: evaluations.filter((e) => e.recommendation === "maybe").length,
    no: evaluations.filter((e) => e.recommendation === "no").length,
  };
  const shortlistCount = recCounts.strong_yes + recCounts.yes;

  const ranked: RankedItem[] = evaluations
    .slice()
    .sort((a, b) => b.overallScore - a.overallScore)
    .map((e) => ({ eval: e, app: applications.find((a) => a.id === e.applicationId) }))
    .filter((item): item is RankedItem => !!item.app);

  const sectorGroups: Record<string, ApplicationEvaluation[]> = {};
  evaluations.forEach((e) => {
    const app = applications.find((a) => a.id === e.applicationId);
    const sector = app?.primarySector || "Unknown";
    if (!sectorGroups[sector]) sectorGroups[sector] = [];
    sectorGroups[sector].push(e);
  });
  const sectorStats = Object.entries(sectorGroups)
    .map(([sector, evals]) => ({
      sector,
      count: evals.length,
      avgScore: Math.round(evals.reduce((s, e) => s + e.overallScore, 0) / evals.length),
    }))
    .sort((a, b) => b.avgScore - a.avgScore);

  const countryGroups: Record<string, number> = {};
  evaluations.forEach((e) => {
    const app = applications.find((a) => a.id === e.applicationId);
    const country = app?.countryOfOperation || app?.companyCountry || "Unknown";
    countryGroups[country] = (countryGroups[country] || 0) + 1;
  });
  const countryStats = Object.entries(countryGroups).sort((a, b) => b[1] - a[1]).slice(0, 10);

  const handleGenerateNarrative = async () => {
    if (evaluated === 0) return;
    setIsGeneratingNarrative(true);
    try {
      const payload = evaluations.map((e) => {
        const app = applications.find((a) => a.id === e.applicationId);
        return {
          applicantName: app ? `${app.firstName} ${app.lastName}` : "Unknown",
          company: app?.companyName || app?.companyLegalName || "N/A",
          country: app?.countryOfOperation || app?.companyCountry || "N/A",
          sector: app?.primarySector || "N/A",
          overallScore: e.overallScore,
          recommendation: e.recommendation,
        };
      });
      const res = await apiRequest("POST", "/api/admin/cohort-narrative", { evaluations: payload });
      if (!res.ok) throw new Error("Failed to generate narrative");
      const json = await res.json();
      setNarrative(json.narrative);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to generate cohort narrative";
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setIsGeneratingNarrative(false);
    }
  };

  const selectedCohort = cohorts.find((c) => c.id === selectedCohortId);

  return (
    <div className="flex flex-col md:flex-row min-h-screen">
      <AdminSidebar />
      <main className="flex-1 p-6 bg-background overflow-auto">
        <div className="max-w-6xl mx-auto space-y-6">

          {/* Page header */}
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
                <BarChart2 className="h-7 w-7 text-primary" />
                Cohort Analytics
              </h1>
              <p className="text-muted-foreground mt-1">
                {selectedCohort ? `Viewing: ${selectedCohort.name}` : "AI-powered insights across all evaluated applications"}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => evaluateAllMutation.mutate()}
                disabled={evaluateAllMutation.isPending}
                className="gap-1.5"
                data-testid="button-evaluate-all"
              >
                {evaluateAllMutation.isPending ? (
                  <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Evaluating…</>
                ) : unevaluatedCount > 0 ? (
                  <><PlayCircle className="h-3.5 w-3.5" /> Evaluate All ({unevaluatedCount} pending)</>
                ) : (
                  <><PlayCircle className="h-3.5 w-3.5" /> Evaluate All</>
                )}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => refetch()}
                disabled={isFetching}
                className="gap-1.5"
                data-testid="button-refresh"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>
          </div>

          {/* Cohort selector */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <FolderOpen className="h-4 w-4 text-primary" />
                Cohorts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  size="sm"
                  variant={selectedCohortId === null ? "default" : "outline"}
                  onClick={() => { setSelectedCohortId(null); setNarrative(null); }}
                  data-testid="button-cohort-all"
                >
                  All Applications
                </Button>

                {cohorts.map((c) => (
                  <div key={c.id} className="flex items-center gap-0.5">
                    <Button
                      size="sm"
                      variant={selectedCohortId === c.id ? "default" : "outline"}
                      onClick={() => { setSelectedCohortId(c.id); setNarrative(null); }}
                      data-testid={`button-cohort-${c.id}`}
                      className="gap-1.5"
                    >
                      {c.isOpen
                        ? <LockOpen className="h-3 w-3 text-green-600" />
                        : <LockKeyhole className="h-3 w-3 opacity-40" />
                      }
                      {c.name}
                      {c.year && <span className="opacity-60 text-xs">{c.year}</span>}
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      title={c.isOpen ? "Close applications" : "Open applications"}
                      onClick={() => toggleOpenMutation.mutate({ id: c.id, open: !c.isOpen })}
                      disabled={toggleOpenMutation.isPending}
                      data-testid={`button-toggle-open-${c.id}`}
                    >
                      {c.isOpen
                        ? <LockKeyhole className="h-3 w-3 text-amber-600" />
                        : <LockOpen className="h-3 w-3 text-green-600" />
                      }
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-muted-foreground"
                      onClick={() => {
                        if (window.confirm(`Delete cohort "${c.name}"? Applications in this cohort will become unassigned.`)) {
                          deleteCohortMutation.mutate(c.id);
                        }
                      }}
                      disabled={deleteCohortMutation.isPending}
                      data-testid={`button-delete-cohort-${c.id}`}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}

                {showCreateCohort ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <Input
                      placeholder="Cohort name (e.g. Cohort 1)"
                      value={newCohortName}
                      onChange={(e) => setNewCohortName(e.target.value)}
                      className="h-8 text-sm w-44"
                      autoFocus
                      data-testid="input-cohort-name"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && newCohortName.trim()) createCohortMutation.mutate();
                        if (e.key === "Escape") setShowCreateCohort(false);
                      }}
                    />
                    <Input
                      placeholder="Year"
                      value={newCohortYear}
                      onChange={(e) => setNewCohortYear(e.target.value)}
                      className="h-8 text-sm w-20"
                      type="number"
                      data-testid="input-cohort-year"
                    />
                    <Button
                      size="sm"
                      disabled={!newCohortName.trim() || createCohortMutation.isPending}
                      onClick={() => createCohortMutation.mutate()}
                      data-testid="button-save-cohort"
                    >
                      {createCohortMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Save"}
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-8 w-8"
                      onClick={() => { setShowCreateCohort(false); setNewCohortName(""); setNewCohortYear(""); }}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowCreateCohort(true)}
                    className="gap-1.5"
                    data-testid="button-new-cohort"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    New Cohort
                  </Button>
                )}
              </div>

              {cohorts.length === 0 && !showCreateCohort && (
                <p className="text-xs text-muted-foreground mt-3">
                  Create cohorts to organise applications by intake cycle (e.g. "Cohort 1 2024"). Assign applications from the Applications table.
                </p>
              )}
            </CardContent>
          </Card>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-28" />)}
            </div>
          ) : (
            <>
              {/* Key stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
                    <CardTitle className="text-sm font-medium">Applications</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold" data-testid="text-total-apps">{applications.length}</div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {evaluated} evaluated{unevaluatedCount > 0 ? `, ${unevaluatedCount} pending` : ""}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
                    <CardTitle className="text-sm font-medium">Avg AI Score</CardTitle>
                    <Brain className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-primary" data-testid="text-avg-score">
                      {evaluated > 0 ? avgScore : "—"}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">out of 100</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
                    <CardTitle className="text-sm font-medium">Shortlist</CardTitle>
                    <CheckCircle className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600" data-testid="text-shortlist">{shortlistCount}</div>
                    <p className="text-xs text-muted-foreground mt-0.5">Strong Yes + Yes</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
                    <CardTitle className="text-sm font-medium">Countries</CardTitle>
                    <Globe className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{Object.keys(countryGroups).length}</div>
                    <p className="text-xs text-muted-foreground mt-0.5">represented</p>
                  </CardContent>
                </Card>
              </div>

              {evaluated === 0 ? (
                <Card>
                  <CardContent className="py-16 text-center space-y-3">
                    <Brain className="h-10 w-10 text-muted-foreground mx-auto" />
                    <p className="text-muted-foreground font-medium">No evaluations yet</p>
                    <p className="text-sm text-muted-foreground">
                      Applications are evaluated automatically when submitted. You can also evaluate existing applications using the button above.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <>
                  {/* Recommendation breakdown + score histogram */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm font-medium">Recommendation Breakdown</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {(["strong_yes", "yes", "maybe", "no"] as const).map((rec) => {
                          const cfg = RECOMMENDATION_CONFIG[rec];
                          const count = recCounts[rec];
                          const pct = evaluated > 0 ? Math.round((count / evaluated) * 100) : 0;
                          return (
                            <div key={rec}>
                              <div className="flex items-center justify-between mb-1">
                                <Badge variant={cfg.variant} className="text-xs">{cfg.label}</Badge>
                                <span className="text-xs text-muted-foreground">{count} ({pct}%)</span>
                              </div>
                              <div className="h-2 bg-muted rounded-full overflow-hidden">
                                <div className={`h-full rounded-full ${cfg.color}`} style={{ width: `${pct}%` }} />
                              </div>
                            </div>
                          );
                        })}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm font-medium">Score Distribution</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ScoreHistogram evaluations={evaluations} />
                      </CardContent>
                    </Card>
                  </div>

                  {/* Dimension averages */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Zap className="h-4 w-4 text-primary" />
                        Average Dimension Scores
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <DimensionAvgBar label="Leadership & Track Record" scores={evaluations.map((e) => e.leadershipScore)} />
                      <DimensionAvgBar label="Business Viability" scores={evaluations.map((e) => e.businessViabilityScore)} />
                      <DimensionAvgBar label="Market Opportunity & Scalability" scores={evaluations.map((e) => e.marketScaleScore)} />
                      <DimensionAvgBar label="Energy & Infrastructure Impact" scores={evaluations.map((e) => e.energyInfraImpactScore)} />
                      <DimensionAvgBar label="Program Readiness" scores={evaluations.map((e) => e.programReadinessScore)} />
                    </CardContent>
                  </Card>

                  {/* Candidate Lists */}
                  <CandidateLists ranked={ranked} cohortLabel={selectedCohort?.name ?? "All"} />

                  {/* Sector and country breakdown */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm font-medium">By Sector</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {sectorStats.map(({ sector, count, avgScore }) => (
                          <div key={sector} className="flex items-center gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="text-sm truncate">{sector}</div>
                              <div className="text-xs text-muted-foreground">{count} applicant{count !== 1 ? "s" : ""}</div>
                            </div>
                            <div className="text-sm font-semibold text-primary">{avgScore} avg</div>
                          </div>
                        ))}
                        {sectorStats.length === 0 && <p className="text-sm text-muted-foreground italic">No sector data</p>}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                          <Globe className="h-4 w-4 text-muted-foreground" />
                          By Country
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {countryStats.map(([country, count]) => {
                          const pct = evaluated > 0 ? Math.round((count / evaluated) * 100) : 0;
                          return (
                            <div key={country}>
                              <div className="flex justify-between text-xs mb-0.5">
                                <span className="text-foreground">{country}</span>
                                <span className="text-muted-foreground">{count} ({pct}%)</span>
                              </div>
                              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                <div className="h-full rounded-full bg-primary/60" style={{ width: `${pct}%` }} />
                              </div>
                            </div>
                          );
                        })}
                        {countryStats.length === 0 && <p className="text-sm text-muted-foreground italic">No country data</p>}
                      </CardContent>
                    </Card>
                  </div>

                  {/* AI cohort narrative */}
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between gap-3 flex-wrap">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                          <Sparkles className="h-4 w-4 text-primary" />
                          AI Cohort Narrative
                        </CardTitle>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleGenerateNarrative}
                          disabled={isGeneratingNarrative}
                          data-testid="button-generate-narrative"
                          className="gap-1.5"
                        >
                          {isGeneratingNarrative ? (
                            <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Generating…</>
                          ) : narrative ? (
                            <><RefreshCw className="h-3.5 w-3.5" /> Regenerate</>
                          ) : (
                            <><Sparkles className="h-3.5 w-3.5" /> Generate Narrative</>
                          )}
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {narrative ? (
                        <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{narrative}</p>
                      ) : (
                        <p className="text-sm text-muted-foreground italic">
                          Generate an AI-written strategic summary of this cohort for the selection committee.
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
