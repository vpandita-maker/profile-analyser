import { NextResponse } from "next/server";
import { z } from "zod";
import { normalizeAnalysis } from "@/lib/analysis";
import { analyzeLinkedInProfile } from "@/lib/claude";
import { normalizeLinkedInProfile } from "@/lib/profile-normalize";
import { getSupabaseAdmin } from "@/lib/supabase";
import type { ContextAnswers, LinkedInProfile } from "@/lib/types";

const analyzeSchema = z.object({
  linkedinId: z.string().min(1),
  profileUrl: z.string().optional(),
  name: z.string().min(1),
  headline: z.string().optional(),
  photo: z.string().optional(),
  email: z.string().optional(),
  about: z.string().optional(),
  experience: z.array(z.string()).optional(),
  skills: z.array(z.string()).optional(),
  education: z.array(z.string()).optional(),
  location: z.string().optional(),
  country: z.string().optional(),
  city: z.string().optional(),
  industry: z.string().optional(),
  currentRole: z.string().optional(),
  currentCompany: z.string().optional(),
  isStudent: z.boolean().optional(),
  rawProfileText: z.string().optional(),
  importSource: z.literal("scrape").optional(),
  contextAnswers: z.record(z.unknown())
});

const rateMap = new Map<string, { count: number; reset: number }>();
function checkRate(ip: string, max: number, windowMs: number) {
  const now = Date.now();
  const rec = rateMap.get(ip);
  if (!rec || now > rec.reset) { rateMap.set(ip, { count: 1, reset: now + windowMs }); return true; }
  if (rec.count >= max) return false;
  rec.count++;
  return true;
}

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
  if (!checkRate(ip, 5, 60_000)) {
    return NextResponse.json({ error: "Too many requests. Please wait a minute and try again." }, { status: 429 });
  }

  let body: z.infer<typeof analyzeSchema>;
  try {
    body = analyzeSchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid request data." }, { status: 400 });
  }
  const profile = normalizeLinkedInProfile({
    linkedinId: body.linkedinId,
    profileUrl: body.profileUrl,
    name: body.name,
    headline: body.headline,
    photo: body.photo,
    email: body.email,
    about: body.about,
    experience: body.experience,
    skills: body.skills,
    education: body.education,
    location: body.location,
    country: body.country,
    city: body.city,
    industry: body.industry,
    currentRole: body.currentRole,
    currentCompany: body.currentCompany,
    isStudent: body.isStudent,
    rawProfileText: body.rawProfileText,
    importSource: body.importSource
  } satisfies LinkedInProfile) as LinkedInProfile;
  const contextAnswers = body.contextAnswers as unknown as ContextAnswers;
  if (!["Job Search", "Internship Search"].includes(contextAnswers.goal)) {
    contextAnswers.goal = "Job Search";
  }

  let rawAnalysis;
  try {
    rawAnalysis = await analyzeLinkedInProfile(profile, contextAnswers);
  } catch (err) {
    console.error("Analysis failed", err);
    return NextResponse.json({ error: "Analysis could not be completed. Please try again." }, { status: 500 });
  }
  const analysis = normalizeAnalysis(rawAnalysis) || rawAnalysis;
  const supabase = getSupabaseAdmin();
  const userId = profile.linkedinId;
  let analysisId = crypto.randomUUID();
  let previousScore: number | null = null;

  if (supabase) {
    const { data: existing } = await supabase
      .from("analyses")
      .select("analysis_json")
      .eq("user_id", userId)
      .maybeSingle();

    const existingScore = (existing?.analysis_json as { overallScore?: number } | null)?.overallScore;
    if (typeof existingScore === "number") {
      previousScore = existingScore;
    }

    const { data, error } = await supabase
      .from("analyses")
      .upsert(
        {
          user_id: userId,
          linkedin_id: profile.linkedinId,
          analysis_json: analysis,
          invites_required: 1,
          invites_fulfilled: 0,
          is_unlocked: false
        },
        { onConflict: "user_id" }
      )
      .select("id")
      .single();

    if (!error && data?.id) {
      analysisId = data.id;
    }

    const overallScore = (analysis as { overallScore?: number }).overallScore ?? 0;
    await supabase.from("leaderboard").upsert(
      {
        user_id: userId,
        linkedin_id: profile.linkedinId,
        name: profile.name,
        headline: profile.headline || "",
        profile_photo_url: profile.photo || "",
        overall_score: overallScore,
        goal: contextAnswers.goal || "Job Search",
        geography: contextAnswers.geography || "Other",
        seniority: contextAnswers.seniority || "",
        industry: contextAnswers.industry || "",
        is_public: true
      },
      { onConflict: "user_id" }
    );

    await supabase.from("score_history").insert({ linkedin_id: userId, score: overallScore });

    const { data: historyRows } = await supabase
      .from("score_history")
      .select("score, created_at")
      .eq("linkedin_id", userId)
      .order("created_at", { ascending: false })
      .limit(5);

    const scoreHistory = (historyRows || []).reverse().map((h) => ({ score: h.score as number, date: h.created_at as string }));

    return NextResponse.json({ analysis, analysisId, profile, previousScore, scoreHistory });
  }

  return NextResponse.json({ analysis, analysisId, profile, previousScore, scoreHistory: [] });
}
