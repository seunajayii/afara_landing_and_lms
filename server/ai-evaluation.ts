import OpenAI from "openai";
import type { Application } from "@shared/schema";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

export const EVAL_MODEL = "gpt-4o";

export interface EvaluationResult {
  overallScore: number;
  leadershipScore: number;
  businessViabilityScore: number;
  marketScaleScore: number;
  energyInfraImpactScore: number;
  programReadinessScore: number;
  summary: string;
  strengths: string[];
  concerns: string[];
  recommendation: "strong_yes" | "yes" | "maybe" | "no";
}

function buildPrompt(app: Application): string {
  const lines: string[] = [];

  lines.push(`APPLICANT: ${app.firstName} ${app.lastName}`);
  lines.push(`Role: ${app.roleInCompany || "N/A"} at ${app.companyName || app.companyLegalName || "N/A"}`);
  lines.push(`Country: ${app.countryOfOperation || app.companyCountry || "N/A"}`);
  lines.push(`Sector: ${app.primarySector || "N/A"}${app.subSectors?.length ? ` (${app.subSectors.join(", ")})` : ""}`);
  lines.push(`Years of Experience: ${app.yearsOfExperience ?? "N/A"}`);
  lines.push(`Business Stage: ${app.businessStage || "N/A"}`);
  lines.push(`Incorporation Year: ${app.incorporationYear ?? "N/A"}`);
  lines.push(`Ownership %: ${app.ownershipPercentage ?? "N/A"}%`);
  lines.push(`Has Led Teams: ${app.hasLedTeams ?? "N/A"}`);
  lines.push(`Has Project Experience: ${app.hasProjectExperience ?? "N/A"}`);
  lines.push(`Is Incorporated: ${app.isIncorporated ?? "N/A"}`);
  lines.push(`Is Tax Registered: ${app.isTaxRegistered ?? "N/A"}`);
  lines.push(`Keeps Financial Records: ${app.keepsFinancialRecords ?? "N/A"}`);
  lines.push(`Is Raising Funding: ${app.isRaisingFunding ?? "N/A"}`);
  lines.push(`Funding Required: ${app.fundingRequired || "N/A"}`);
  lines.push(`Expected Timeline: ${app.expectedTimeline || "N/A"}`);
  lines.push(`Hours/Week Committed: ${app.hoursPerWeek ?? "N/A"}`);
  lines.push(`Can Commit to Full Program: ${app.canCommitToProgram ?? "N/A"}`);
  lines.push(`Can Attend Lagos Event: ${app.canAttendLagosEvent ?? "N/A"}`);
  lines.push(`Open to Mentorship: ${app.openToMentorship ?? "N/A"}`);
  lines.push(`Willing to Mentor Others: ${app.willingToMentor ?? "N/A"}`);
  lines.push(`Creates Women Opportunities: ${app.createsWomenOpportunities ?? "N/A"}`);

  if (app.personalStatement) lines.push(`\nPERSONAL STATEMENT:\n${app.personalStatement}`);
  if (app.professionalBackground) lines.push(`\nPROFESSIONAL BACKGROUND:\n${app.professionalBackground}`);
  if (app.keyResponsibilities) lines.push(`\nKEY RESPONSIBILITIES:\n${app.keyResponsibilities}`);
  if (app.majorAchievements) lines.push(`\nMAJOR ACHIEVEMENTS:\n${app.majorAchievements}`);
  if (app.teamLeadershipExperience) lines.push(`\nTEAM LEADERSHIP EXPERIENCE:\n${app.teamLeadershipExperience}`);
  if (app.projectExperience) lines.push(`\nPROJECT EXPERIENCE:\n${app.projectExperience}`);
  if (app.businessDescription) lines.push(`\nBUSINESS DESCRIPTION:\n${app.businessDescription}`);
  if (app.problemBeingSolved) lines.push(`\nPROBLEM BEING SOLVED:\n${app.problemBeingSolved}`);
  if (app.tractionEvidence) lines.push(`\nTRACTION EVIDENCE:\n${app.tractionEvidence}`);
  if (app.targetMarket) lines.push(`\nTARGET MARKET:\n${app.targetMarket}`);
  if (app.scalabilityExplanation) lines.push(`\nSCALABILITY:\n${app.scalabilityExplanation}`);
  if (app.growthPlans) lines.push(`\nGROWTH PLANS:\n${app.growthPlans}`);
  if (app.revenueStreams) lines.push(`\nREVENUE STREAMS:\n${app.revenueStreams}`);
  if (app.projectDescription) lines.push(`\nPROJECT DESCRIPTION:\n${app.projectDescription}`);
  if (app.projectedImpact) lines.push(`\nPROJECTED IMPACT:\n${app.projectedImpact}`);
  if (app.businessImpact) lines.push(`\nBUSINESS IMPACT:\n${app.businessImpact}`);
  if (app.primaryBeneficiaries) lines.push(`\nPRIMARY BENEFICIARIES:\n${app.primaryBeneficiaries}`);
  if (app.infrastructureGapContribution) lines.push(`\nINFRASTRUCTURE GAP CONTRIBUTION:\n${app.infrastructureGapContribution}`);
  if (app.womenOpportunitiesDescription) lines.push(`\nWOMEN OPPORTUNITIES:\n${app.womenOpportunitiesDescription}`);
  if (app.mainChallenges) lines.push(`\nMAIN CHALLENGES:\n${app.mainChallenges}`);
  if (app.keyActivitiesForNextStage) lines.push(`\nKEY ACTIVITIES NEXT STAGE:\n${app.keyActivitiesForNextStage}`);
  if (app.specificProgramOutcomes) lines.push(`\nSPECIFIC PROGRAM OUTCOMES:\n${app.specificProgramOutcomes}`);
  if (app.commitmentManagementPlan) lines.push(`\nCOMMITMENT MANAGEMENT PLAN:\n${app.commitmentManagementPlan}`);
  if (app.peerMentorshipImportance) lines.push(`\nPEER MENTORSHIP IMPORTANCE:\n${app.peerMentorshipImportance}`);
  if (app.whyAfaraIsRight) lines.push(`\nWHY AFÁRÁ IS RIGHT:\n${app.whyAfaraIsRight}`);
  if (app.additionalInfo) lines.push(`\nADDITIONAL INFO:\n${app.additionalInfo}`);

  return lines.join("\n");
}

const SYSTEM_PROMPT = `You are a senior program selection expert for AFÁRÁ, a business accelerator supporting female-owned and led African companies in the Energy and Infrastructure sector. AFÁRÁ is an initiative of Open Spaces & Bridges Advisory (OPSB).

Your task is to evaluate a program application and return a structured JSON assessment. Be rigorous, fair, and specific. Base your analysis solely on the content provided.

SCORING DIMENSIONS (each 0–100):
1. **Leadership & Track Record** — Evidence of leadership roles, team management, professional achievements, and personal drive.
2. **Business Viability** — Clarity of business model, revenue streams, traction, financial readiness, and stage of development.
3. **Market Opportunity & Scalability** — Size and clarity of target market, scalability potential, and growth strategy.
4. **Energy & Infrastructure Impact** — Relevance and depth of impact on energy/infrastructure sector in Africa; alignment with AFÁRÁ's mission.
5. **Program Readiness** — Time commitment, openness to mentorship, articulation of what they need and how AFÁRÁ specifically fits.

OVERALL SCORE: Weighted average — Leadership 20%, Business Viability 25%, Market/Scale 20%, Energy/Infra Impact 20%, Program Readiness 15%.

RECOMMENDATION:
- "strong_yes": Exceptional candidate, clear fit, scores generally 80+
- "yes": Good candidate, clear fit, scores generally 65–79
- "maybe": Promising but gaps remain, scores generally 50–64
- "no": Does not meet program criteria or readiness threshold, below 50

Return ONLY valid JSON with this exact structure:
{
  "overallScore": <integer 0-100>,
  "leadershipScore": <integer 0-100>,
  "businessViabilityScore": <integer 0-100>,
  "marketScaleScore": <integer 0-100>,
  "energyInfraImpactScore": <integer 0-100>,
  "programReadinessScore": <integer 0-100>,
  "summary": "<2–3 sentence narrative summary of the applicant and their fit>",
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "concerns": ["<concern 1>", "<concern 2>"],
  "recommendation": "<strong_yes|yes|maybe|no>"
}`;

export async function evaluateApplication(app: Application): Promise<EvaluationResult> {
  const applicationText = buildPrompt(app);

  const response = await openai.chat.completions.create({
    model: EVAL_MODEL,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: `Please evaluate this AFÁRÁ program application:\n\n${applicationText}`,
      },
    ],
    response_format: { type: "json_object" },
    temperature: 0.3,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error("No response from AI model");

  let parsed: EvaluationResult;
  try {
    parsed = JSON.parse(content) as EvaluationResult;
  } catch {
    throw new Error("Failed to parse AI evaluation response as JSON");
  }

  // Validate and clamp scores
  const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));
  parsed.overallScore = clamp(parsed.overallScore);
  parsed.leadershipScore = clamp(parsed.leadershipScore);
  parsed.businessViabilityScore = clamp(parsed.businessViabilityScore);
  parsed.marketScaleScore = clamp(parsed.marketScaleScore);
  parsed.energyInfraImpactScore = clamp(parsed.energyInfraImpactScore);
  parsed.programReadinessScore = clamp(parsed.programReadinessScore);

  if (!["strong_yes", "yes", "maybe", "no"].includes(parsed.recommendation)) {
    parsed.recommendation = "maybe";
  }
  if (!Array.isArray(parsed.strengths)) parsed.strengths = [];
  if (!Array.isArray(parsed.concerns)) parsed.concerns = [];
  if (typeof parsed.summary !== "string") parsed.summary = "";

  return parsed;
}

export async function generateCohortNarrative(
  evaluations: Array<{
    applicantName: string;
    company: string;
    country: string;
    sector: string;
    overallScore: number;
    recommendation: string;
  }>
): Promise<string> {
  const totalCount = evaluations.length;
  const strongYes = evaluations.filter((e) => e.recommendation === "strong_yes").length;
  const yes = evaluations.filter((e) => e.recommendation === "yes").length;
  const maybe = evaluations.filter((e) => e.recommendation === "maybe").length;
  const no = evaluations.filter((e) => e.recommendation === "no").length;
  const avgScore = totalCount > 0
    ? Math.round(evaluations.reduce((sum, e) => sum + e.overallScore, 0) / totalCount)
    : 0;

  const sectors = Array.from(new Set(evaluations.map((e) => e.sector).filter(Boolean)));
  const countries = Array.from(new Set(evaluations.map((e) => e.country).filter(Boolean)));

  const top = evaluations
    .filter((e) => e.recommendation === "strong_yes" || e.recommendation === "yes")
    .sort((a, b) => b.overallScore - a.overallScore)
    .slice(0, 5)
    .map((e) => `${e.applicantName} (${e.company}, ${e.country}) — ${e.overallScore}/100`)
    .join("\n");

  const prompt = `You are a program director for AFÁRÁ, a business accelerator for female-owned African companies in Energy & Infrastructure.

You have just completed AI-assisted screening of ${totalCount} applications. Here is the cohort summary:

Total applications screened: ${totalCount}
Average score: ${avgScore}/100
Recommendations:
  - Strong Yes: ${strongYes}
  - Yes: ${yes}
  - Maybe: ${maybe}
  - No: ${no}

Sectors represented: ${sectors.join(", ") || "N/A"}
Countries represented: ${countries.join(", ") || "N/A"}

Top-scoring candidates:
${top || "None yet"}

Write a concise 2–3 paragraph cohort narrative for the selection committee. Highlight the overall quality and diversity of the pool, note any patterns in sector or geography, and make a strategic recommendation about the shortlist. Be direct and professional.`;

  const response = await openai.chat.completions.create({
    model: EVAL_MODEL,
    messages: [{ role: "user", content: prompt }],
    temperature: 0.5,
    max_tokens: 500,
  });

  return response.choices[0]?.message?.content?.trim() ?? "";
}
