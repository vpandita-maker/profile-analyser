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
  return {
    title: typeof item.title === "string" && item.title.trim() ? item.title : fallbackTitle,
    score: cleanScore(item.score, 5, 10),
    explanation: typeof item.explanation === "string" && item.explanation.trim() ? item.explanation : "This section needs more profile evidence before it can be judged clearly."
  };
}

function cleanFix(value: unknown, fallbackTitle: string): FixItem {
  const fix = isRecord(value) ? value : {};
  return {
    title: typeof fix.title === "string" && fix.title.trim() ? fix.title : fallbackTitle,
    current: typeof fix.current === "string" && fix.current.trim() ? fix.current : "Not enough current text was found.",
    recommended: typeof fix.recommended === "string" && fix.recommended.trim() ? fix.recommended : "Add a clearer role target, proof of impact, and keywords that match the jobs or internships you want.",
    whyMatters: typeof fix.whyMatters === "string" && fix.whyMatters.trim() ? fix.whyMatters : "Recruiters need a fast signal that your profile matches the opportunity you are targeting.",
    difficulty: typeof fix.difficulty === "string" && fix.difficulty.trim() ? fix.difficulty : "Easy"
  };
}

function cleanItems(values: unknown, fallbackTitle: string) {
  return Array.isArray(values) ? values.map((value, index) => cleanItem(value, `${fallbackTitle} ${index + 1}`)) : [];
}

function cleanFixes(values: unknown, fallbackTitle: string) {
  return Array.isArray(values) ? values.map((value, index) => cleanFix(value, `${fallbackTitle} ${index + 1}`)) : [];
}

export function normalizeAnalysis(value: AnalysisResult | null): AnalysisResult | null {
  if (!isRecord(value)) return null;
  const categoryScores: Record<string, unknown> = isRecord(value.categoryScores) ? value.categoryScores : {};

  return {
    overallScore: cleanScore(value.overallScore, 70, 100),
    categoryScores: {
      headline: cleanScore(categoryScores.headline, 5, 10),
      about: cleanScore(categoryScores.about, 5, 10),
      experience: cleanScore(categoryScores.experience, 5, 10),
      skills: cleanScore(categoryScores.skills, 5, 10),
      positioning: cleanScore(categoryScores.positioning, 5, 10)
    },
    strengths: cleanItems(value.strengths, "Strength"),
    weaknesses: cleanItems(value.weaknesses, "Opportunity"),
    topFixes: cleanFixes(value.topFixes, "Fix"),
    secondaryFixes: cleanFixes(value.secondaryFixes, "Secondary fix")
  };
}
