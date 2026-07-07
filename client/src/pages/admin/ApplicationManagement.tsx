import { useState, useRef } from "react";
import { AdminSidebar } from "@/components/AdminSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  Search,
  Eye,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  Ban,
  Users,
  FileText,
  Building2,
  Mail,
  MapPin,
  Phone,
  Briefcase,
  TrendingUp,
  DollarSign,
  Zap,
  HeartHandshake,
  Star,
  Globe,
  ExternalLink,
  Link2,
  BarChart2,
  Target,
  Lightbulb,
  Calendar,
  Shield,
  Languages,
  Loader2,
  Brain,
  RefreshCw,
  Sparkles,
  AlertCircle,
  LockOpen,
  LockKeyhole,
} from "lucide-react";
import type { Application, ApplicationEvaluation, Cohort } from "@shared/schema";
import { format } from "date-fns";

function TableSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4, 5].map((i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  );
}

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  draft: { label: "Draft", variant: "secondary" },
  submitted: { label: "Submitted", variant: "default" },
  under_review: { label: "Under Review", variant: "outline" },
  accepted: { label: "Accepted", variant: "default" },
  rejected: { label: "Rejected", variant: "destructive" },
  waitlisted: { label: "Waitlisted", variant: "secondary" },
  disqualified: { label: "Disqualified", variant: "destructive" },
};

// ─── Language detection ──────────────────────────────────────────────────────

const LANG_LABELS: Record<string, string> = {
  en: "English", fr: "French", es: "Spanish",
  pt: "Portuguese", ar: "Arabic", sw: "Swahili",
};

function detectLanguage(text: string): string {
  if (!text || text.trim().length < 15) return "en";
  const t = text.toLowerCase();
  // Arabic script
  if (/[\u0600-\u06FF]/.test(text)) return "ar";
  // French: accent chars + common function words
  const frenchScore =
    ((/[àâäéèêëîïôùûüçœæ]/i.test(text)) ? 3 : 0) +
    (t.match(/\b(est|sont|avec|pour|dans|nous|vous|mais|donc|une|des|les|du|au|je|tu|il|elle|en|très|aussi|faire|aller|avoir|être|nous|notre|votre|tout|bien|même|plus|sans|sous|sur|par|qui|que|quoi|où|quand|comment)\b/g) || []).length;
  const esScore = (t.match(/\b(es|está|son|con|para|pero|porque|que|como|donde|yo|tú|muy|también|no|una|las|los|del|esto|ese|ese|aquí)\b/g) || []).length;
  const ptScore = (t.match(/\b(é|está|são|com|para|mas|porque|que|como|onde|eu|você|muito|também|não|uma|das|dos|isso|este)\b/g) || []).length;
  const maxScore = Math.max(frenchScore, esScore, ptScore);
  if (maxScore < 2) return "en";
  if (frenchScore >= esScore && frenchScore >= ptScore) return "fr";
  if (esScore >= ptScore) return "es";
  return "pt";
}

const TEXT_FIELDS: (keyof Application)[] = [
  "personalStatement","professionalBackground","keyResponsibilities","majorAchievements",
  "teamLeadershipExperience","projectExperience","businessDescription","problemBeingSolved",
  "tractionEvidence","targetMarket","scalabilityExplanation","growthPlans","revenueStreams",
  "projectDescription","projectedImpact","businessImpact","primaryBeneficiaries",
  "infrastructureGapContribution","womenOpportunitiesDescription","mainChallenges",
  "keyActivitiesForNextStage","specificProgramOutcomes","commitmentManagementPlan",
  "peerMentorshipImportance","whyAfaraIsRight","additionalInfo",
];

// ─── Helper components ──────────────────────────────────────────────────────

function YesNoBadge({ value }: { value: boolean | null | undefined }) {
  if (value == null) return <span className="text-muted-foreground text-sm">Not specified</span>;
  return (
    <Badge variant={value ? "default" : "secondary"}>
      {value ? "Yes" : "No"}
    </Badge>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">{children}</div>;
}

function FieldValue({ children, empty = "Not provided" }: { children?: React.ReactNode; empty?: string }) {
  if (!children || (typeof children === "string" && !children.trim())) {
    return <div className="text-sm text-muted-foreground italic">{empty}</div>;
  }
  return <div className="text-sm text-foreground">{children}</div>;
}

function LongText({ value }: { value: string | null | undefined }) {
  if (!value?.trim()) return <div className="text-sm text-muted-foreground italic">Not provided</div>;
  return (
    <div className="text-sm text-foreground whitespace-pre-wrap bg-muted/40 rounded-md px-3 py-2 leading-relaxed">
      {value}
    </div>
  );
}

function FileLink({ url, label }: { url: string | null | undefined; label: string }) {
  if (!url?.trim()) return <div className="text-sm text-muted-foreground italic">Not uploaded</div>;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 text-sm text-primary underline underline-offset-2 hover:opacity-80"
    >
      <ExternalLink className="h-3.5 w-3.5 flex-shrink-0" />
      {label}
    </a>
  );
}

function BadgeList({ items }: { items: string[] | null | undefined }) {
  if (!items || items.length === 0) return <div className="text-sm text-muted-foreground italic">None specified</div>;
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <Badge key={item} variant="outline" className="text-xs font-normal">
          {item}
        </Badge>
      ))}
    </div>
  );
}

function SectionCard({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      </div>
      <Separator />
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function Grid2({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{children}</div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      {children}
    </div>
  );
}

// ─── AI Evaluation ───────────────────────────────────────────────────────────

const EVAL_RECOMMENDATION_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  strong_yes: { label: "Strong Yes", variant: "default" },
  yes: { label: "Yes", variant: "default" },
  maybe: { label: "Maybe", variant: "secondary" },
  no: { label: "No", variant: "destructive" },
};

function ScoreBar({ label, score }: { label: string; score: number }) {
  const pct = Math.max(0, Math.min(100, score));
  const color = pct >= 70 ? "bg-green-500" : pct >= 50 ? "bg-yellow-500" : "bg-red-500";
  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="text-xs font-semibold">{score}/100</span>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function AIEvaluationPanel({ applicationId }: { applicationId: string }) {
  const { toast } = useToast();

  const { data: evaluation, isLoading: isLoadingEval } = useQuery<ApplicationEvaluation | null>({
    queryKey: ["/api/admin/applications", applicationId, "evaluation"],
    queryFn: async () => {
      const res = await fetch(`/api/admin/applications/${applicationId}/evaluation`, { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch evaluation");
      return res.json();
    },
    retry: false,
  });

  const evaluateMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/admin/applications/${applicationId}/evaluate`, {});
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Evaluation failed");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/applications", applicationId, "evaluation"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/cohort-analytics"] });
      toast({ title: "Evaluation Complete", description: "AI evaluation saved successfully." });
    },
    onError: (error: any) => {
      toast({ title: "Evaluation Failed", description: error?.message || "AI evaluation failed", variant: "destructive" });
    },
  });

  const recConfig = evaluation ? EVAL_RECOMMENDATION_CONFIG[evaluation.recommendation] : null;

  return (
    <div className="border rounded-md p-4 space-y-4 bg-muted/20">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <Brain className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold">AI Evaluation</span>
          {evaluation && (
            <span className="text-xs text-muted-foreground">
              · {format(new Date(evaluation.evaluatedAt), "d MMM yyyy, h:mm a")}
            </span>
          )}
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => evaluateMutation.mutate()}
          disabled={evaluateMutation.isPending}
          data-testid="button-run-evaluation"
          className="gap-1.5"
        >
          {evaluateMutation.isPending ? (
            <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Evaluating…</>
          ) : evaluation ? (
            <><RefreshCw className="h-3.5 w-3.5" /> Re-evaluate</>
          ) : (
            <><Sparkles className="h-3.5 w-3.5" /> Run AI Evaluation</>
          )}
        </Button>
      </div>

      {isLoadingEval && (
        <div className="space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-1.5 w-full" />
          <Skeleton className="h-1.5 w-full" />
        </div>
      )}

      {!isLoadingEval && !evaluation && !evaluateMutation.isPending && (
        <p className="text-xs text-muted-foreground italic">
          No evaluation yet. Click "Run AI Evaluation" to generate an AI-powered assessment across 5 dimensions.
        </p>
      )}

      {evaluation && (
        <div className="space-y-4">
          {/* Overall score + recommendation */}
          <div className="flex items-center gap-4 flex-wrap">
            <div className="text-center min-w-[56px]">
              <div className="text-3xl font-bold text-primary leading-none">{evaluation.overallScore}</div>
              <div className="text-xs text-muted-foreground mt-0.5">/ 100</div>
            </div>
            {recConfig && (
              <Badge variant={recConfig.variant} className="text-sm px-3 py-1">
                {recConfig.label}
              </Badge>
            )}
          </div>

          {/* Summary */}
          {evaluation.summary && (
            <p className="text-sm text-foreground leading-relaxed">{evaluation.summary}</p>
          )}

          {/* Dimension scores */}
          <div className="space-y-2.5">
            <ScoreBar label="Leadership & Track Record" score={evaluation.leadershipScore} />
            <ScoreBar label="Business Viability" score={evaluation.businessViabilityScore} />
            <ScoreBar label="Market Opportunity & Scalability" score={evaluation.marketScaleScore} />
            <ScoreBar label="Energy & Infrastructure Impact" score={evaluation.energyInfraImpactScore} />
            <ScoreBar label="Program Readiness" score={evaluation.programReadinessScore} />
          </div>

          {/* Strengths and concerns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {evaluation.strengths && evaluation.strengths.length > 0 && (
              <div>
                <div className="text-xs font-semibold text-green-700 dark:text-green-400 uppercase tracking-wide mb-1.5">
                  Strengths
                </div>
                <ul className="space-y-1">
                  {evaluation.strengths.map((s, i) => (
                    <li key={i} className="text-xs text-foreground flex gap-1.5">
                      <CheckCircle className="h-3.5 w-3.5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {evaluation.concerns && evaluation.concerns.length > 0 && (
              <div>
                <div className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wide mb-1.5">
                  Concerns
                </div>
                <ul className="space-y-1">
                  {evaluation.concerns.map((c, i) => (
                    <li key={i} className="text-xs text-foreground flex gap-1.5">
                      <AlertCircle className="h-3.5 w-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <span>{c}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="text-xs text-muted-foreground">
            Model: {evaluation.evaluatedByModel}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Full application preview ────────────────────────────────────────────────

function ApplicationPreviewSheet({
  app,
  open,
  onClose,
  onUpdateStatus,
}: {
  app: Application | null;
  open: boolean;
  onClose: () => void;
  onUpdateStatus: (app: Application) => void;
}) {
  const [translatedApp, setTranslatedApp] = useState<Application | null>(null);
  const [showTranslated, setShowTranslated] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [detectedLang, setDetectedLang] = useState<string>("en");
  const lastTranslatedId = useRef<string | null>(null);

  const appLang = app ? detectLanguage(
    [app.personalStatement, app.businessDescription, app.problemBeingSolved]
      .filter(Boolean).join(" ")
  ) : "en";

  const handleTranslate = async () => {
    if (!app) return;
    if (showTranslated) { setShowTranslated(false); return; }
    if (translatedApp && lastTranslatedId.current === app.id) { setShowTranslated(true); return; }

    setIsTranslating(true);
    try {
      const values = TEXT_FIELDS.map((f) => (app[f] as string) || "");
      const res = await fetch("/api/admin/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ texts: values }),
      });
      if (!res.ok) throw new Error("Translation request failed");
      const data = await res.json();
      const results: { translated: string; detectedLang: string }[] = data.results;
      const detected = results.find((r) => r.detectedLang && r.detectedLang !== "en" && r.detectedLang !== "unknown")?.detectedLang || "en";
      setDetectedLang(detected);
      const translated = { ...app };
      TEXT_FIELDS.forEach((field, i) => {
        if (results[i]?.translated) (translated as any)[field] = results[i].translated;
      });
      setTranslatedApp(translated as Application);
      lastTranslatedId.current = app.id;
      setShowTranslated(true);
    } catch (e) {
      console.error("Translation failed", e);
    } finally {
      setIsTranslating(false);
    }
  };

  if (!app) return null;
  const displayApp = showTranslated && translatedApp ? translatedApp : app;

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-3xl overflow-y-auto flex flex-col gap-0 p-0"
      >
        {/* Header */}
        <SheetHeader className="px-6 pt-6 pb-4 border-b sticky top-0 bg-background z-10">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <SheetTitle className="text-lg font-semibold">
                {app.firstName} {app.lastName}
              </SheetTitle>
              <SheetDescription className="mt-0.5">
                {app.companyName || app.companyLegalName || "No company name"} &middot; {app.email}
              </SheetDescription>
            </div>
            <div className="flex flex-col items-end gap-1.5">
              <Badge variant={statusConfig[app.status]?.variant || "secondary"}>
                {statusConfig[app.status]?.label || app.status}
              </Badge>
              {cohortsData.length > 0 && (
                <Select
                  value={app.cohortId ?? ""}
                  onValueChange={(val) => assignCohortMutation.mutate({ appId: app.id, cohortId: val || null })}
                >
                  <SelectTrigger className="h-7 text-xs w-36" data-testid="select-cohort-assign">
                    <SelectValue placeholder="Assign cohort…" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No cohort</SelectItem>
                    {cohortsData.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <div className="text-xs text-muted-foreground space-y-0.5 text-right">
                {app.createdAt && (
                  <div>Started: {format(new Date(app.createdAt), "d MMM yyyy, h:mm a")}</div>
                )}
                {app.submittedAt && (
                  <div>Submitted: {format(new Date(app.submittedAt), "d MMM yyyy, h:mm a")}</div>
                )}
                {!app.submittedAt && (
                  <div className="italic">Not yet submitted</div>
                )}
              </div>
            </div>
          </div>
          <div className="pt-2 flex flex-wrap items-center gap-2">
            <Button size="sm" onClick={() => onUpdateStatus(app)} data-testid="button-sheet-update-status">
              Update Status / Add Notes
            </Button>
            {appLang !== "en" && (
              <Badge variant="outline" className="text-xs gap-1">
                <Languages className="h-3 w-3" />
                {LANG_LABELS[appLang] || appLang} detected
              </Badge>
            )}
            <Button
              size="sm"
              variant={showTranslated ? "default" : "outline"}
              onClick={handleTranslate}
              disabled={isTranslating}
              data-testid="button-translate"
              className="gap-1.5"
            >
              {isTranslating ? (
                <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Translating…</>
              ) : showTranslated ? (
                <><Languages className="h-3.5 w-3.5" /> Show original</>
              ) : (
                <><Languages className="h-3.5 w-3.5" /> Translate to English</>
              )}
            </Button>
          </div>
          {showTranslated && detectedLang !== "en" && (
            <div className="text-xs text-muted-foreground mt-1 italic">
              Translated from {LANG_LABELS[detectedLang] || detectedLang} · Text fields only
            </div>
          )}
        </SheetHeader>

        {/* Body */}
        <div className="px-6 py-6 space-y-8 flex-1">

          {/* AI Evaluation panel */}
          {app.status !== "draft" && <AIEvaluationPanel applicationId={app.id} />}

          {/* Review notes (if any) */}
          {app.reviewNotes && (
            <div className="bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 rounded-md p-4">
              <div className="text-xs font-semibold text-yellow-800 dark:text-yellow-300 uppercase tracking-wide mb-1">
                Review Notes
              </div>
              <p className="text-sm text-yellow-900 dark:text-yellow-200 whitespace-pre-wrap">{app.reviewNotes}</p>
            </div>
          )}

          {/* ── Section 1: Personal Information ── */}
          <SectionCard icon={Users} title="Personal Information">
            <Grid2>
              <Field label="First Name"><FieldValue>{app.firstName}</FieldValue></Field>
              <Field label="Last Name"><FieldValue>{app.lastName}</FieldValue></Field>
              <Field label="Email Address"><FieldValue>{app.email}</FieldValue></Field>
              <Field label="Phone Number"><FieldValue>{app.phone}</FieldValue></Field>
              <Field label="Country of Operation"><FieldValue>{app.countryOfOperation}</FieldValue></Field>
              <Field label="Company Name"><FieldValue>{app.companyName}</FieldValue></Field>
              <Field label="Role in Company"><FieldValue>{app.roleInCompany}</FieldValue></Field>
              {app.linkedinUrl && (
                <Field label="LinkedIn Profile">
                  <a
                    href={app.linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm text-primary underline underline-offset-2 hover:opacity-80"
                  >
                    <Link2 className="h-3.5 w-3.5 flex-shrink-0" />
                    View Profile
                  </a>
                </Field>
              )}
            </Grid2>
            <Field label="Personal Statement"><LongText value={displayApp.personalStatement} /></Field>
            {app.videoEssayUrl && (
              <Field label="Video Essay">
                <a
                  href={app.videoEssayUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-primary underline underline-offset-2 hover:opacity-80"
                >
                  <ExternalLink className="h-3.5 w-3.5 flex-shrink-0" />
                  Watch Video Essay
                </a>
              </Field>
            )}
          </SectionCard>

          {/* ── Section 2: Background & Sector ── */}
          <SectionCard icon={Briefcase} title="Background & Sector Experience">
            <Grid2>
              <Field label="Primary Sector"><FieldValue>{app.primarySector}</FieldValue></Field>
              <Field label="Years of Experience">
                <FieldValue>{app.yearsOfExperience != null ? `${app.yearsOfExperience} years` : undefined}</FieldValue>
              </Field>
              <Field label="Sector Specification"><FieldValue>{app.sectorSpecification}</FieldValue></Field>
              <Field label="Has Led Teams"><YesNoBadge value={app.hasLedTeams} /></Field>
              <Field label="Has Project Experience"><YesNoBadge value={app.hasProjectExperience} /></Field>
            </Grid2>
            <Field label="Sub-Sectors"><BadgeList items={app.subSectors} /></Field>
            {app.otherSubSector && (
              <Field label="Other Sub-Sector"><FieldValue>{app.otherSubSector}</FieldValue></Field>
            )}
            <Field label="Professional Background"><LongText value={displayApp.professionalBackground} /></Field>
            <Field label="Key Responsibilities"><LongText value={displayApp.keyResponsibilities} /></Field>
            <Field label="Major Achievements"><LongText value={displayApp.majorAchievements} /></Field>
            {app.hasLedTeams && (
              <Field label="Team Leadership Experience"><LongText value={displayApp.teamLeadershipExperience} /></Field>
            )}
            {app.hasProjectExperience && (
              <Field label="Project Experience"><LongText value={displayApp.projectExperience} /></Field>
            )}
          </SectionCard>

          {/* ── Section 3: Business Overview & Ownership ── */}
          <SectionCard icon={Building2} title="Business Overview & Ownership">
            <Grid2>
              <Field label="Company Legal Name"><FieldValue>{app.companyLegalName}</FieldValue></Field>
              <Field label="Country of Registration"><FieldValue>{app.companyCountry}</FieldValue></Field>
              <Field label="Headquarters"><FieldValue>{app.companyHeadquarters}</FieldValue></Field>
              <Field label="Incorporation Year">
                <FieldValue>{app.incorporationYear != null ? String(app.incorporationYear) : undefined}</FieldValue>
              </Field>
              <Field label="Ownership Percentage">
                <FieldValue>{app.ownershipPercentage != null ? `${app.ownershipPercentage}%` : undefined}</FieldValue>
              </Field>
              <Field label="Number of Shareholders">
                <FieldValue>{app.numberOfShareholders != null ? String(app.numberOfShareholders) : undefined}</FieldValue>
              </Field>
              <Field label="Shareholders Over 25%"><YesNoBadge value={app.shareholdersOver25Percent} /></Field>
              <Field label="Is Raising Funding"><YesNoBadge value={app.isRaisingFunding} /></Field>
              <Field label="Business Stage"><FieldValue>{app.businessStage}</FieldValue></Field>
            </Grid2>
            <Field label="Registration Proof">
              <FileLink url={app.registrationProofUrl} label="View Registration Document" />
            </Field>
            <Field label="Business Description"><LongText value={displayApp.businessDescription} /></Field>
            <Field label="Problem Being Solved"><LongText value={displayApp.problemBeingSolved} /></Field>
            <Field label="Traction Evidence"><LongText value={displayApp.tractionEvidence} /></Field>
            <Field label="Target Market"><LongText value={displayApp.targetMarket} /></Field>
            <Field label="Scalability Explanation"><LongText value={displayApp.scalabilityExplanation} /></Field>
            <Field label="Growth Plans"><LongText value={displayApp.growthPlans} /></Field>
          </SectionCard>

          {/* ── Section 4: Financial Documentation ── */}
          <SectionCard icon={DollarSign} title="Financial Documentation & Compliance">
            <Grid2>
              <Field label="Incorporated"><YesNoBadge value={app.isIncorporated} /></Field>
              <Field label="Tax Registered"><YesNoBadge value={app.isTaxRegistered} /></Field>
              <Field label="Keeps Financial Records"><YesNoBadge value={app.keepsFinancialRecords} /></Field>
              <Field label="Can Provide Financials"><YesNoBadge value={app.canProvideFinancials} /></Field>
            </Grid2>
            <Field label="Revenue Streams"><LongText value={displayApp.revenueStreams} /></Field>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Incorporation Certificate">
                <FileLink url={app.incorporationCertificateUrl} label="View Certificate" />
              </Field>
              <Field label="Pitch Deck">
                <FileLink url={app.pitchDeckUrl} label="View Pitch Deck" />
              </Field>
              <Field label="Business Plan">
                <FileLink url={app.businessPlanUrl} label="View Business Plan" />
              </Field>
              <Field label="Financial Statements">
                <FileLink url={app.financialStatementsUrl} label="View Financials" />
              </Field>
            </div>
          </SectionCard>

          {/* ── Section 5: Project Readiness & Impact ── */}
          <SectionCard icon={Zap} title="Project Readiness & Impact">
            <Grid2>
              <Field label="Project Location"><FieldValue>{app.projectLocation}</FieldValue></Field>
              <Field label="Project Sector"><FieldValue>{app.projectSector}</FieldValue></Field>
              <Field label="Project Stage"><FieldValue>{app.projectStage}</FieldValue></Field>
              <Field label="Current Status"><FieldValue>{app.projectCurrentStatus}</FieldValue></Field>
              <Field label="Creates Women Opportunities">
                <YesNoBadge value={app.createsWomenOpportunities} />
              </Field>
            </Grid2>
            <Field label="Project Documents"><BadgeList items={app.projectDocuments} /></Field>
            {app.otherProjectDocuments && (
              <Field label="Other Project Documents"><FieldValue>{app.otherProjectDocuments}</FieldValue></Field>
            )}
            <Field label="Project Description"><LongText value={displayApp.projectDescription} /></Field>
            <Field label="Projected Impact"><LongText value={displayApp.projectedImpact} /></Field>
            <Field label="Business Impact"><LongText value={displayApp.businessImpact} /></Field>
            <Field label="Primary Beneficiaries"><LongText value={displayApp.primaryBeneficiaries} /></Field>
            <Field label="Infrastructure Gap Contribution">
              <LongText value={displayApp.infrastructureGapContribution} />
            </Field>
            {app.createsWomenOpportunities && (
              <Field label="Women Opportunities Description">
                <LongText value={displayApp.womenOpportunitiesDescription} />
              </Field>
            )}
          </SectionCard>

          {/* ── Section 6: Support Needs ── */}
          <SectionCard icon={HeartHandshake} title="Support Needs & Project Advancement">
            <Grid2>
              <Field label="Funding Required"><FieldValue>{app.fundingRequired}</FieldValue></Field>
              <Field label="Expected Timeline"><FieldValue>{app.expectedTimeline}</FieldValue></Field>
            </Grid2>
            <Field label="Support Areas Needed"><BadgeList items={app.supportAreasNeeded} /></Field>
            {app.otherSupportArea && (
              <Field label="Other Support Area"><FieldValue>{app.otherSupportArea}</FieldValue></Field>
            )}
            <Field label="Main Challenges"><LongText value={displayApp.mainChallenges} /></Field>
            <Field label="Key Activities for Next Stage">
              <LongText value={displayApp.keyActivitiesForNextStage} />
            </Field>
            <Field label="Specific Program Outcomes">
              <LongText value={displayApp.specificProgramOutcomes} />
            </Field>
          </SectionCard>

          {/* ── Section 7: Founder Commitment ── */}
          <SectionCard icon={Star} title="Founder Commitment & Peer Support">
            <Grid2>
              <Field label="Hours Per Week Committed">
                <FieldValue>
                  {app.hoursPerWeek != null ? `${app.hoursPerWeek} hrs/week` : undefined}
                </FieldValue>
              </Field>
              <Field label="Open to Mentorship"><YesNoBadge value={app.openToMentorship} /></Field>
              <Field label="Can Commit to Full Program"><YesNoBadge value={app.canCommitToProgram} /></Field>
              <Field label="Can Attend Lagos Event"><YesNoBadge value={app.canAttendLagosEvent} /></Field>
              <Field label="Willing to Mentor Others"><YesNoBadge value={app.willingToMentor} /></Field>
            </Grid2>
            <Field label="Commitment Management Plan">
              <LongText value={displayApp.commitmentManagementPlan} />
            </Field>
            <Field label="Peer Mentorship Importance">
              <LongText value={displayApp.peerMentorshipImportance} />
            </Field>
            <Field label="Why AFÁRÁ is Right for Her">
              <LongText value={displayApp.whyAfaraIsRight} />
            </Field>
          </SectionCard>

          {/* Additional info if present */}
          {app.additionalInfo && (
            <SectionCard icon={FileText} title="Additional Information">
              <LongText value={displayApp.additionalInfo} />
            </SectionCard>
          )}

          {/* Metadata footer */}
          <div className="pt-2 border-t text-xs text-muted-foreground flex flex-wrap gap-4">
            <span>ID: <span className="font-mono">{app.id}</span></span>
            {app.updatedAt && (
              <span>Last saved: {format(new Date(app.updatedAt), "d MMM yyyy, h:mm a")}</span>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

export default function ApplicationManagement() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [langFilter, setLangFilter] = useState("all");
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<string>("submitted");
  const [reviewNotes, setReviewNotes] = useState("");

  const { data: applications = [], isLoading } = useQuery<Application[]>({
    queryKey: ["/api/applications"],
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, reviewNotes }: { id: string; status: string; reviewNotes: string }) => {
      const response = await apiRequest("PATCH", `/api/admin/applications/${id}`, {
        status,
        reviewNotes,
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update application");
      }
      return response.json();
    },
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ["/api/applications"] });
      toast({ title: "Application Updated", description: "The application status has been updated." });
      setIsStatusDialogOpen(false);
      // Update selected so preview reflects new status/notes immediately
      if (selectedApplication) {
        setSelectedApplication({ ...selectedApplication, status: newStatus as any, reviewNotes });
      }
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error?.message || "Failed to update application", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/applications/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/applications"] });
      toast({ title: "Application Deleted", description: "The application has been deleted." });
      setSelectedApplication(null);
      setIsPreviewOpen(false);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete application.", variant: "destructive" });
    },
  });

  const { data: cohortsData = [] } = useQuery<Cohort[]>({
    queryKey: ["/api/admin/cohorts"],
  });

  const assignCohortMutation = useMutation({
    mutationFn: async ({ appId, cohortId }: { appId: string; cohortId: string | null }) => {
      const response = await apiRequest("PATCH", `/api/admin/applications/${appId}/cohort`, { cohortId });
      if (!response.ok) throw new Error("Failed to assign cohort");
      return response.json();
    },
    onSuccess: (_data, { appId, cohortId }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/applications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/cohort-analytics"] });
      if (selectedApplication?.id === appId) {
        setSelectedApplication({ ...selectedApplication, cohortId: cohortId ?? undefined } as any);
      }
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to assign cohort.", variant: "destructive" });
    },
  });

  const toggleOpenMutation = useMutation({
    mutationFn: async ({ id, open }: { id: string; open: boolean }) => {
      const res = await apiRequest("POST", `/api/admin/cohorts/${id}/set-open`, { open });
      if (!res.ok) throw new Error("Failed to update");
      return res.json() as Promise<Cohort>;
    },
    onSuccess: (cohort: Cohort) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/cohorts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/cohort-analytics"] });
      toast({
        title: cohort.isOpen
          ? `Applications opened — ${cohort.name}`
          : `Applications closed — ${cohort.name}`,
      });
    },
    onError: () => toast({ title: "Failed to update cohort status", variant: "destructive" }),
  });

  const openCohort = cohortsData.find((c) => c.isOpen) ?? null;

  const filteredApplications = applications.filter((app) => {
    const matchesSearch =
      app.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.companyLegalName?.toLowerCase().includes(searchQuery.toLowerCase());

    const appLang = detectLanguage(
      [app.personalStatement, app.businessDescription, app.problemBeingSolved].filter(Boolean).join(" ")
    );
    const matchesLang =
      langFilter === "all" ||
      (langFilter === "en" && appLang === "en") ||
      (langFilter === "non-en" && appLang !== "en") ||
      langFilter === appLang;

    if (activeTab === "all") return matchesSearch && matchesLang;
    if (activeTab === "pending") return matchesSearch && matchesLang && (app.status === "submitted" || app.status === "under_review");
    return matchesSearch && matchesLang && app.status === activeTab;
  });

  const stats = {
    total: applications.length,
    pending: applications.filter((a) => a.status === "submitted" || a.status === "under_review").length,
    accepted: applications.filter((a) => a.status === "accepted").length,
    rejected: applications.filter((a) => a.status === "rejected").length,
    disqualified: applications.filter((a) => a.status === "disqualified").length,
  };

  const openPreview = (app: Application) => {
    setSelectedApplication(app);
    setIsPreviewOpen(true);
  };

  const openStatusDialog = (app: Application) => {
    setSelectedApplication(app);
    setNewStatus(app.status);
    setReviewNotes(app.reviewNotes || "");
    setIsStatusDialogOpen(true);
  };

  const handleUpdateStatus = () => {
    if (selectedApplication && newStatus) {
      updateStatusMutation.mutate({ id: selectedApplication.id, status: newStatus, reviewNotes });
    }
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen">
      <AdminSidebar />
      <main className="flex-1 p-6 bg-background overflow-auto">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Application Management</h1>
              <p className="text-muted-foreground mt-1">Review and manage program applications</p>
            </div>

            {/* Cohort open/close control */}
            {cohortsData.length > 0 && (
              <div
                className={`flex items-center gap-3 rounded-md border px-4 py-2.5 text-sm ${
                  openCohort
                    ? "border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/30"
                    : "border-muted-foreground/20 bg-muted/40"
                }`}
                data-testid="banner-cohort-status"
              >
                <div className="flex items-center gap-2">
                  {openCohort
                    ? <LockOpen className="h-4 w-4 text-green-600 flex-shrink-0" />
                    : <LockKeyhole className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  }
                  <div>
                    <span className={`font-medium ${openCohort ? "text-green-800 dark:text-green-300" : "text-foreground"}`}>
                      {openCohort ? `Applications open — ${openCohort.name}` : "Applications closed"}
                    </span>
                    {!openCohort && cohortsData.length > 0 && (
                      <span className="text-muted-foreground ml-1">— select a cohort to open below</span>
                    )}
                  </div>
                </div>
                {openCohort ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5 flex-shrink-0"
                    disabled={toggleOpenMutation.isPending}
                    onClick={() => toggleOpenMutation.mutate({ id: openCohort.id, open: false })}
                    data-testid="button-close-applications"
                  >
                    {toggleOpenMutation.isPending
                      ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      : <LockKeyhole className="h-3.5 w-3.5" />
                    }
                    Close Applications
                  </Button>
                ) : (
                  <div className="flex flex-wrap gap-1.5 flex-shrink-0">
                    {cohortsData.map((c) => (
                      <Button
                        key={c.id}
                        size="sm"
                        variant="outline"
                        className="gap-1.5"
                        disabled={toggleOpenMutation.isPending}
                        onClick={() => toggleOpenMutation.mutate({ id: c.id, open: true })}
                        data-testid={`button-open-cohort-${c.id}`}
                      >
                        {toggleOpenMutation.isPending
                          ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          : <LockOpen className="h-3.5 w-3.5" />
                        }
                        Open {c.name}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
                <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="text-total-applications">{stats.total}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
                <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600" data-testid="text-pending-applications">{stats.pending}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
                <CardTitle className="text-sm font-medium">Accepted</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600" data-testid="text-accepted-applications">{stats.accepted}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
                <CardTitle className="text-sm font-medium">Rejected</CardTitle>
                <XCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600" data-testid="text-rejected-applications">{stats.rejected}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
                <CardTitle className="text-sm font-medium">Disqualified</CardTitle>
                <Ban className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600" data-testid="text-disqualified-applications">{stats.disqualified}</div>
              </CardContent>
            </Card>
          </div>

          {/* Table */}
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <CardTitle>Applications</CardTitle>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative w-full sm:w-56">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search applications..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                      data-testid="input-search-applications"
                    />
                  </div>
                  <Select value={langFilter} onValueChange={setLangFilter}>
                    <SelectTrigger className="w-40 gap-1" data-testid="select-lang-filter">
                      <Languages className="h-3.5 w-3.5 text-muted-foreground" />
                      <SelectValue placeholder="Language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All languages</SelectItem>
                      <SelectItem value="en">English only</SelectItem>
                      <SelectItem value="non-en">Non-English</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                      <SelectItem value="es">Spanish</SelectItem>
                      <SelectItem value="pt">Portuguese</SelectItem>
                      <SelectItem value="ar">Arabic</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="mb-4">
                  <TabsTrigger value="all" data-testid="tab-all">All ({applications.length})</TabsTrigger>
                  <TabsTrigger value="pending" data-testid="tab-pending">Pending ({stats.pending})</TabsTrigger>
                  <TabsTrigger value="accepted" data-testid="tab-accepted">Accepted ({stats.accepted})</TabsTrigger>
                  <TabsTrigger value="rejected" data-testid="tab-rejected">Rejected ({stats.rejected})</TabsTrigger>
                  <TabsTrigger value="disqualified" data-testid="tab-disqualified">Disqualified ({stats.disqualified})</TabsTrigger>
                </TabsList>

                <TabsContent value={activeTab}>
                  {isLoading ? (
                    <TableSkeleton />
                  ) : filteredApplications.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">No applications found</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Applicant</TableHead>
                            <TableHead>Company</TableHead>
                            <TableHead>Sector</TableHead>
                            <TableHead>Started</TableHead>
                            <TableHead>Submitted</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredApplications.map((app) => (
                            <TableRow key={app.id} data-testid={`row-application-${app.id}`}>
                              <TableCell>
                                <div>
                                  <div className="font-medium flex flex-wrap items-center gap-1.5">
                                    {app.firstName} {app.lastName}
                                    {(() => {
                                      const lang = detectLanguage(
                                        [app.personalStatement, app.businessDescription, app.problemBeingSolved].filter(Boolean).join(" ")
                                      );
                                      if (lang === "en") return null;
                                      return (
                                        <Badge variant="outline" className="text-xs font-normal gap-1 py-0">
                                          <Languages className="h-2.5 w-2.5" />
                                          {LANG_LABELS[lang] || lang}
                                        </Badge>
                                      );
                                    })()}
                                  </div>
                                  <div className="text-sm text-muted-foreground">{app.email}</div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="font-medium">{app.companyLegalName || app.companyName || "N/A"}</div>
                                <div className="text-sm text-muted-foreground">{app.companyCountry || ""}</div>
                              </TableCell>
                              <TableCell>{app.primarySector || "N/A"}</TableCell>
                              <TableCell>
                                <div className="text-sm">
                                  {app.createdAt ? format(new Date(app.createdAt), "MMM d, yyyy") : "—"}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {app.createdAt ? format(new Date(app.createdAt), "h:mm a") : ""}
                                </div>
                              </TableCell>
                              <TableCell>
                                {app.submittedAt ? format(new Date(app.submittedAt), "MMM d, yyyy") : "—"}
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-col gap-1 items-start">
                                  <Badge variant={statusConfig[app.status]?.variant || "secondary"}>
                                    {statusConfig[app.status]?.label || app.status}
                                  </Badge>
                                  {app.cohortId && (
                                    <span className="text-xs text-muted-foreground">
                                      {cohortsData.find((c) => c.id === app.cohortId)?.name ?? ""}
                                    </span>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => openPreview(app)}
                                    data-testid={`button-view-${app.id}`}
                                    title="View full application"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={() => openStatusDialog(app)}
                                    data-testid={`button-status-${app.id}`}
                                  >
                                    Update Status
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => {
                                      if (window.confirm(`Delete application from ${app.firstName} ${app.lastName}?`)) {
                                        deleteMutation.mutate(app.id);
                                      }
                                    }}
                                    disabled={deleteMutation.isPending}
                                    data-testid={`button-delete-${app.id}`}
                                    title="Delete application"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Full application preview sheet */}
      <ApplicationPreviewSheet
        app={selectedApplication}
        open={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        onUpdateStatus={(app) => {
          setIsPreviewOpen(false);
          openStatusDialog(app);
        }}
      />

      {/* Update status dialog */}
      <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Application Status</DialogTitle>
            <DialogDescription>
              Change the status for {selectedApplication?.firstName} {selectedApplication?.lastName}'s application
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger data-testid="select-new-status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="under_review">Under Review</SelectItem>
                  <SelectItem value="accepted">Accepted</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="waitlisted">Waitlisted</SelectItem>
                  <SelectItem value="disqualified">Disqualified</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Review Notes</label>
              <Textarea
                placeholder="Add notes about this application..."
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                className="min-h-[100px]"
                data-testid="textarea-review-notes"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsStatusDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleUpdateStatus}
              disabled={updateStatusMutation.isPending}
              data-testid="button-save-status"
            >
              {updateStatusMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
