import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import logoMark from "@assets/Afara_Logo_Mark__1775330139762.png";
import type { Application, ApplicationEvaluation, Cohort } from "@shared/schema";

interface CohortData {
  applications: Application[];
  evaluations: ApplicationEvaluation[];
  cohorts: Cohort[];
}

const REC_LABELS: Record<string, { label: string; color: string }> = {
  strong_yes: { label: "Strong Yes", color: "#16a34a" },
  yes:        { label: "Yes",         color: "#22c55e" },
  maybe:      { label: "Maybe",       color: "#ca8a04" },
  no:         { label: "No",          color: "#dc2626" },
};

const DIMENSIONS: { key: keyof ApplicationEvaluation; label: string }[] = [
  { key: "leadershipScore",        label: "Leadership & Track Record" },
  { key: "businessViabilityScore", label: "Business Viability" },
  { key: "marketScaleScore",       label: "Market Opportunity & Scalability" },
  { key: "energyInfraImpactScore", label: "Energy & Infrastructure Impact" },
  { key: "programReadinessScore",  label: "Program Readiness" },
];

const BRAND = "#034a21";
const BRAND_LIGHT = "#e8f5ee";

function avg(arr: number[]) {
  return arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0;
}

export default function CohortReport() {
  const params = new URLSearchParams(window.location.search);
  const cohortId = params.get("cohortId");
  const [narrative] = useState(() => sessionStorage.getItem("cohort-report-narrative") || "");
  const generatedAt = format(new Date(), "d MMMM yyyy, h:mm a");

  const { data, isLoading } = useQuery<CohortData>({
    queryKey: ["/api/admin/cohort-analytics", cohortId ?? "all"],
    queryFn: async () => {
      const url = cohortId
        ? `/api/admin/cohort-analytics?cohortId=${cohortId}`
        : "/api/admin/cohort-analytics";
      const res = await apiRequest("GET", url);
      return res.json();
    },
  });

  const cohorts        = data?.cohorts ?? [];
  const applications   = data?.applications ?? [];
  const allEvals       = data?.evaluations ?? [];
  const appIds         = new Set(applications.map((a) => a.id));
  const evaluations    = allEvals.filter((e) => appIds.has(e.applicationId));
  const evaluated      = evaluations.length;
  const selectedCohort = cohorts.find((c) => c.id === cohortId);
  const cohortLabel    = selectedCohort ? `${selectedCohort.name}${selectedCohort.year ? ` ${selectedCohort.year}` : ""}` : "All Cohorts";

  const avgScore     = avg(evaluations.map((e) => e.overallScore));
  const recCounts    = {
    strong_yes: evaluations.filter((e) => e.recommendation === "strong_yes").length,
    yes:        evaluations.filter((e) => e.recommendation === "yes").length,
    maybe:      evaluations.filter((e) => e.recommendation === "maybe").length,
    no:         evaluations.filter((e) => e.recommendation === "no").length,
  };
  const shortlist = recCounts.strong_yes + recCounts.yes;

  const countryGroups: Record<string, number> = {};
  evaluations.forEach((e) => {
    const app = applications.find((a) => a.id === e.applicationId);
    const c   = app?.countryOfOperation || app?.companyCountry || "Unknown";
    countryGroups[c] = (countryGroups[c] || 0) + 1;
  });
  const countryStats = Object.entries(countryGroups).sort((a, b) => b[1] - a[1]).slice(0, 10);

  const sectorGroups: Record<string, number[]> = {};
  evaluations.forEach((e) => {
    const app    = applications.find((a) => a.id === e.applicationId);
    const sector = app?.primarySector || "Unknown";
    if (!sectorGroups[sector]) sectorGroups[sector] = [];
    sectorGroups[sector].push(e.overallScore);
  });
  const sectorStats = Object.entries(sectorGroups)
    .map(([s, scores]) => ({ sector: s, count: scores.length, avgScore: avg(scores) }))
    .sort((a, b) => b.avgScore - a.avgScore);

  const ranked = evaluations
    .slice()
    .sort((a, b) => b.overallScore - a.overallScore)
    .map((e) => ({ eval: e, app: applications.find((a) => a.id === e.applicationId) }))
    .filter((item): item is { eval: ApplicationEvaluation; app: Application } => !!item.app);

  const scoreHistogram = [
    { label: "0–19",    min: 0,  max: 19  },
    { label: "20–39",   min: 20, max: 39  },
    { label: "40–59",   min: 40, max: 59  },
    { label: "60–79",   min: 60, max: 79  },
    { label: "80–100",  min: 80, max: 100 },
  ].map((b) => ({
    ...b,
    count: evaluations.filter((e) => e.overallScore >= b.min && e.overallScore <= b.max).length,
  }));
  const histMax = Math.max(...scoreHistogram.map((b) => b.count), 1);

  return (
    <>
      <style>{`
        @page { size: A4; margin: 15mm; }
        @media print {
          .no-print { display: none !important; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .page-break { page-break-before: always; }
        }
        body { font-family: 'Inter', -apple-system, sans-serif; color: #1a1a1a; background: white; }
        * { box-sizing: border-box; }
      `}</style>

      {/* Print / close toolbar */}
      <div className="no-print" style={{
        position: "sticky", top: 0, zIndex: 100, background: "#f8f9fa",
        borderBottom: "1px solid #e0e0e0", padding: "10px 24px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <span style={{ fontSize: 13, color: "#555" }}>
          Preview — click <strong>Print / Save as PDF</strong> to download
        </span>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => window.close()}
            style={{ padding: "7px 14px", fontSize: 13, borderRadius: 6, border: "1px solid #ccc", background: "white", cursor: "pointer" }}
          >
            Close
          </button>
          <button
            data-testid="button-print-report"
            onClick={() => window.print()}
            style={{ padding: "7px 18px", fontSize: 13, fontWeight: 600, borderRadius: 6, border: "none", background: BRAND, color: "white", cursor: "pointer" }}
          >
            Print / Save as PDF
          </button>
        </div>
      </div>

      {isLoading ? (
        <div style={{ padding: 64, textAlign: "center", color: "#888" }}>Loading report data…</div>
      ) : (
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 24px 64px" }}>

          {/* ── HEADER ─────────────────────────────────────── */}
          <div style={{
            background: BRAND, color: "white", borderRadius: 10,
            padding: "28px 32px", display: "flex", alignItems: "center",
            justifyContent: "space-between", marginBottom: 28,
          }}>
            <div>
              <div style={{ fontSize: 11, letterSpacing: 2, textTransform: "uppercase", opacity: 0.7, marginBottom: 4 }}>
                AFÁRÁ Accelerator · OPSB
              </div>
              <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700 }}>Application Analysis Report</h1>
              <div style={{ marginTop: 6, fontSize: 14, opacity: 0.85 }}>
                {cohortLabel} &nbsp;·&nbsp; Generated {generatedAt}
              </div>
            </div>
            <img src={logoMark} alt="AFÁRÁ" style={{ height: 72, opacity: 0.95, flexShrink: 0 }} />
          </div>

          {/* ── KEY STATS ──────────────────────────────────── */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 24 }}>
            {[
              { label: "Applications", value: applications.length, sub: `${evaluated} evaluated` },
              { label: "Avg AI Score",  value: evaluated > 0 ? avgScore : "—", sub: "out of 100", accent: true },
              { label: "Shortlisted",   value: shortlist, sub: "Strong Yes + Yes", green: true },
              { label: "Countries",     value: Object.keys(countryGroups).length, sub: "represented" },
            ].map(({ label, value, sub, accent, green }) => (
              <div key={label} style={{
                border: `1px solid #e8e8e8`, borderRadius: 8, padding: "16px 18px",
                background: "white",
              }}>
                <div style={{ fontSize: 11, color: "#777", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>{label}</div>
                <div style={{ fontSize: 28, fontWeight: 700, color: green ? "#16a34a" : accent ? BRAND : "#1a1a1a" }}>{value}</div>
                <div style={{ fontSize: 11, color: "#999", marginTop: 3 }}>{sub}</div>
              </div>
            ))}
          </div>

          {evaluated > 0 && (
            <>
              {/* ── REC BREAKDOWN + SCORE HISTOGRAM ─────────── */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>

                {/* Recommendation Breakdown */}
                <div style={{ border: "1px solid #e8e8e8", borderRadius: 8, padding: "18px 20px" }}>
                  <h3 style={{ margin: "0 0 14px", fontSize: 13, fontWeight: 600, color: "#333" }}>Recommendation Breakdown</h3>
                  {(["strong_yes", "yes", "maybe", "no"] as const).map((rec) => {
                    const { label, color } = REC_LABELS[rec];
                    const count = recCounts[rec];
                    const pct   = evaluated > 0 ? Math.round((count / evaluated) * 100) : 0;
                    return (
                      <div key={rec} style={{ marginBottom: 10 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                          <span style={{ fontWeight: 600, color }}>{label}</span>
                          <span style={{ color: "#666" }}>{count} ({pct}%)</span>
                        </div>
                        <div style={{ height: 8, background: "#f0f0f0", borderRadius: 4, overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 4 }} />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Score Distribution */}
                <div style={{ border: "1px solid #e8e8e8", borderRadius: 8, padding: "18px 20px" }}>
                  <h3 style={{ margin: "0 0 14px", fontSize: 13, fontWeight: 600, color: "#333" }}>Score Distribution</h3>
                  <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 100 }}>
                    {scoreHistogram.map((b) => (
                      <div key={b.label} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                        <span style={{ fontSize: 11, fontWeight: 600 }}>{b.count}</span>
                        <div style={{
                          width: "100%", borderRadius: "3px 3px 0 0",
                          background: BRAND,
                          height: `${Math.max(4, (b.count / histMax) * 72)}px`,
                          opacity: 0.85,
                        }} />
                        <span style={{ fontSize: 10, color: "#888" }}>{b.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* ── DIMENSION AVERAGES ────────────────────────── */}
              <div style={{ border: "1px solid #e8e8e8", borderRadius: 8, padding: "18px 20px", marginBottom: 20 }}>
                <h3 style={{ margin: "0 0 14px", fontSize: 13, fontWeight: 600, color: "#333" }}>Average Dimension Scores</h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 24px" }}>
                  {DIMENSIONS.map(({ key, label }) => {
                    const scores = evaluations.map((e) => (e[key] as number) ?? 0);
                    const a      = avg(scores);
                    return (
                      <div key={label}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 3 }}>
                          <span style={{ color: "#555" }}>{label}</span>
                          <span style={{ fontWeight: 700 }}>{a}/100</span>
                        </div>
                        <div style={{ height: 7, background: "#f0f0f0", borderRadius: 4, overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${a}%`, background: BRAND, opacity: 0.75, borderRadius: 4 }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ── TOP RANKED CANDIDATES ────────────────────── */}
              <div style={{ border: "1px solid #e8e8e8", borderRadius: 8, marginBottom: 20, overflow: "hidden" }}>
                <div style={{ background: BRAND_LIGHT, padding: "12px 20px", borderBottom: "1px solid #e8e8e8" }}>
                  <h3 style={{ margin: 0, fontSize: 13, fontWeight: 600, color: BRAND }}>Top Ranked Candidates</h3>
                </div>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: "#fafafa", borderBottom: "1px solid #e8e8e8" }}>
                      {["#", "Name", "Company", "Country", "Sector", "Score", "Recommendation"].map((h) => (
                        <th key={h} style={{ padding: "8px 12px", textAlign: "left", fontWeight: 600, color: "#555", fontSize: 11 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {ranked.slice(0, 20).map(({ eval: e, app: a }, i) => {
                      const rec = REC_LABELS[e.recommendation] ?? { label: e.recommendation, color: "#888" };
                      return (
                        <tr key={e.id} style={{ borderBottom: "1px solid #f0f0f0", background: i % 2 === 0 ? "white" : "#fafafa" }}>
                          <td style={{ padding: "8px 12px", color: "#999", fontWeight: 600 }}>{i + 1}</td>
                          <td style={{ padding: "8px 12px", fontWeight: 500 }}>{a.firstName} {a.lastName}</td>
                          <td style={{ padding: "8px 12px", color: "#555" }}>{a.companyName || a.companyLegalName || "—"}</td>
                          <td style={{ padding: "8px 12px", color: "#555" }}>{a.countryOfOperation || a.companyCountry || "—"}</td>
                          <td style={{ padding: "8px 12px", color: "#555" }}>{a.primarySector || "—"}</td>
                          <td style={{ padding: "8px 12px", fontWeight: 700, color: BRAND }}>{e.overallScore}</td>
                          <td style={{ padding: "8px 12px" }}>
                            <span style={{
                              display: "inline-block", padding: "2px 8px", borderRadius: 99,
                              fontSize: 10, fontWeight: 600, color: "white", background: rec.color,
                            }}>{rec.label}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {ranked.length > 20 && (
                  <div style={{ padding: "10px 20px", fontSize: 11, color: "#888", borderTop: "1px solid #f0f0f0" }}>
                    + {ranked.length - 20} additional candidates not shown
                  </div>
                )}
              </div>

              {/* ── SECTOR + COUNTRY ─────────────────────────── */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>

                {/* By Sector */}
                <div style={{ border: "1px solid #e8e8e8", borderRadius: 8, overflow: "hidden" }}>
                  <div style={{ background: BRAND_LIGHT, padding: "10px 16px", borderBottom: "1px solid #e8e8e8" }}>
                    <h3 style={{ margin: 0, fontSize: 12, fontWeight: 600, color: BRAND }}>By Sector</h3>
                  </div>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                    <thead>
                      <tr style={{ background: "#fafafa", borderBottom: "1px solid #efefef" }}>
                        <th style={{ padding: "6px 12px", textAlign: "left", fontWeight: 600, color: "#666" }}>Sector</th>
                        <th style={{ padding: "6px 12px", textAlign: "right", fontWeight: 600, color: "#666" }}>Applicants</th>
                        <th style={{ padding: "6px 12px", textAlign: "right", fontWeight: 600, color: "#666" }}>Avg Score</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sectorStats.map(({ sector, count, avgScore: s }, i) => (
                        <tr key={sector} style={{ borderBottom: "1px solid #f5f5f5", background: i % 2 === 0 ? "white" : "#fafafa" }}>
                          <td style={{ padding: "6px 12px" }}>{sector}</td>
                          <td style={{ padding: "6px 12px", textAlign: "right", color: "#666" }}>{count}</td>
                          <td style={{ padding: "6px 12px", textAlign: "right", fontWeight: 700, color: BRAND }}>{s}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* By Country */}
                <div style={{ border: "1px solid #e8e8e8", borderRadius: 8, overflow: "hidden" }}>
                  <div style={{ background: BRAND_LIGHT, padding: "10px 16px", borderBottom: "1px solid #e8e8e8" }}>
                    <h3 style={{ margin: 0, fontSize: 12, fontWeight: 600, color: BRAND }}>By Country</h3>
                  </div>
                  <div style={{ padding: "12px 16px" }}>
                    {countryStats.map(([country, count]) => {
                      const pct = evaluated > 0 ? Math.round((count / evaluated) * 100) : 0;
                      return (
                        <div key={country} style={{ marginBottom: 8 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 3 }}>
                            <span>{country}</span>
                            <span style={{ color: "#666" }}>{count} ({pct}%)</span>
                          </div>
                          <div style={{ height: 5, background: "#f0f0f0", borderRadius: 3, overflow: "hidden" }}>
                            <div style={{ height: "100%", width: `${pct}%`, background: BRAND, opacity: 0.7, borderRadius: 3 }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* ── AI NARRATIVE ──────────────────────────────── */}
              {narrative && (
                <div style={{ border: `1px solid ${BRAND}30`, borderRadius: 8, overflow: "hidden", marginBottom: 20 }}>
                  <div style={{ background: BRAND_LIGHT, padding: "12px 20px", borderBottom: `1px solid ${BRAND}20` }}>
                    <h3 style={{ margin: 0, fontSize: 13, fontWeight: 600, color: BRAND }}>AI Cohort Narrative</h3>
                  </div>
                  <div style={{ padding: "16px 20px", fontSize: 13, lineHeight: 1.7, color: "#333", whiteSpace: "pre-wrap" }}>
                    {narrative}
                  </div>
                </div>
              )}
            </>
          )}

          {/* ── FOOTER ────────────────────────────────────────── */}
          <div style={{
            marginTop: 32, paddingTop: 16, borderTop: "1px solid #e8e8e8",
            display: "flex", justifyContent: "space-between", alignItems: "center",
            fontSize: 10, color: "#aaa",
          }}>
            <span>AFÁRÁ Accelerator · Open Spaces & Bridges Advisory (OPSB)</span>
            <span>Confidential — {generatedAt}</span>
          </div>

        </div>
      )}
    </>
  );
}
