import type { AnalysisItem, AnalysisResult, FixItem } from "@/lib/types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function cleanScore(value: unknown, fallback: number, max: number) {
  const score = typeof value === "number" && Number.isFinite(value) ? Math.round(value) : fallback;
  return Math.min(max, Math.max(1, score));
}

function cleanItem(value: unknown, fallbackTitle: string): AnalysisItem {
  const item = isRecord(value) ? value : {};
  const explanation = typeof item.explanation === "string" && item.explanation.trim() ? item.explanation : "This section needs more profile evidence before it can be judged clearly.";
  return {
    title: typeof item.title === "string" && item.title.trim() ? item.title : fallbackTitle,
    score: cleanScore(item.score, 5, 10),
    explanation,
    profileEvidence: typeof item.profileEvidence === "string" && item.profileEvidence.trim() ? item.profileEvidence : undefined,
    whyThisMattersForYou: typeof item.whyThisMattersForYou === "string" && item.whyThisMattersForYou.trim() ? item.whyThisMattersForYou : explanation
  };
}

function cleanFix(value: unknown, fallbackTitle: string): FixItem {
  const fix = isRecord(value) ? value : {};
  return {
    title: typeof fix.title === "string" && fix.title.trim() ? fix.title : fallbackTitle,
    current: typeof fix.current === "string" && fix.current.trim() ? fix.current : "Not enough current text was found.",
    recommended: typeof fix.recommended === "string" && fix.recommended.trim() ? fix.recommended : "Add a clearer role target, proof of impact, and keywords that match the jobs or internships you want.",
    whyMatters: typeof fix.whyMatters === "string" && fix.whyMatters.trim() ? fix.whyMatters : "Recruiters need a fast signal that your profile matches the opportunity you are targeting.",
    profileEvidence: typeof fix.profileEvidence === "string" && fix.profileEvidence.trim() ? fix.profileEvidence : undefined,
    difficulty: typeof fix.difficulty === "string" && fix.difficulty.trim() ? fix.difficulty : "Easy",
    scoreBump: typeof fix.scoreBump === "number" && fix.scoreBump > 0 ? Math.min(20, Math.round(fix.scoreBump)) : undefined
  };
}

function cleanItems(values: unknown, fallbackTitle: string) {
  return Array.isArray(values) ? values.map((value, index) => cleanItem(value, `${fallbackTitle} ${index + 1}`)) : [];
}

function cleanFixes(values: unknown, fallbackTitle: string) {
  return Array.isArray(values) ? values.map((value, index) => cleanFix(value, `${fallbackTitle} ${index + 1}`)) : [];
}

function fixFromWeakness(item: AnalysisItem, index: number): FixItem {
  const focus = item.title.toLowerCase();
  return {
    title: `Fix ${item.title}`,
    current: item.explanation,
    recommended: `Rewrite this part of your profile so it directly addresses ${focus} with clearer job or internship keywords, proof of work, measurable outcomes, and a stronger recruiter signal.`,
    whyMatters: `This matters because ${item.explanation}`,
    profileEvidence: item.profileEvidence,
    difficulty: index === 0 ? "Easy" : "Medium"
  };
}

const defaultFixes: FixItem[] = [
  {
    title: "Fix your headline",
    current: "Your headline does not give recruiters enough signal yet.",
    recommended: "Write a headline that names your target job or internship, the function you fit, and one proof point that makes you credible.",
    whyMatters: "Recruiters use the headline to decide whether your profile matches the search they are running.",
    difficulty: "Easy"
  },
  {
    title: "Fix your About section",
    current: "Your About section needs a sharper opening pitch.",
    recommended: "Open with your target role, your strongest relevant experience, the tools or domains you know, and the outcome you want next.",
    whyMatters: "The first two lines should make your fit obvious before someone scans your experience.",
    difficulty: "Medium"
  },
  {
    title: "Fix your experience proof",
    current: "Your experience needs clearer evidence of impact.",
    recommended: "Rewrite bullets with the action you took, the scope of work, the tool or method used, and the measurable result.",
    whyMatters: "Hiring teams need proof that you can do the work, not just a list of responsibilities.",
    difficulty: "Medium"
  }
];

export function normalizeAnalysis(value: AnalysisResult | null): AnalysisResult | null {
  if (!isRecord(value)) return null;
  const categoryScores: Record<string, unknown> = isRecord(value.categoryScores) ? value.categoryScores : {};
  const strengths = cleanItems(value.strengths, "Strength");
  const weaknesses = cleanItems(value.weaknesses, "Opportunity");
  const topFixes = cleanFixes(value.topFixes, "Fix");
  const secondaryFixes = cleanFixes(value.secondaryFixes, "Secondary fix");
  const generatedFixes = weaknesses.length ? weaknesses.map((item, index) => fixFromWeakness(item, index)) : defaultFixes;

  return {
    overallScore: cleanScore(value.overallScore, 70, 100),
    personalDiagnosis: typeof value.personalDiagnosis === "string" && value.personalDiagnosis.trim()
      ? value.personalDiagnosis
      : "Your profile has enough signal to evaluate, but the fastest improvement will come from making your target role, proof of impact, and recruiter keywords clearer.",
    categoryScores: {
      headline: cleanScore(categoryScores.headline, 5, 10),
      about: cleanScore(categoryScores.about, 5, 10),
      experience: cleanScore(categoryScores.experience, 5, 10),
      skills: cleanScore(categoryScores.skills, 5, 10),
      positioning: cleanScore(categoryScores.positioning, 5, 10)
    },
    strengths,
    weaknesses,
    topFixes: topFixes.length ? topFixes : generatedFixes.slice(0, 3),
    secondaryFixes: secondaryFixes.length ? secondaryFixes : generatedFixes.slice(3, 6)
  };
}
