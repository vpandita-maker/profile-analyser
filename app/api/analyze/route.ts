import { NextResponse } from "next/server";
import { z } from "zod";
import { normalizeAnalysis } from "@/lib/analysis";
import { analyzeLinkedInProfile } from "@/lib/claude";
import { getSupabaseAdmin } from "@/lib/supabase";
import type { ContextAnswers, LinkedInProfile } from "@/lib/types";

const analyzeSchema = z.object({
  linkedinId: z.string().min(1),
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

export async function POST(request: Request) {
  const body = analyzeSchema.parse(await request.json());
  const profile: LinkedInProfile = {
    linkedinId: body.linkedinId,
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
  };
  const contextAnswers = body.contextAnswers as unknown as ContextAnswers;
  if (!["Job Search", "Internship Search"].includes(contextAnswers.goal)) {
    contextAnswers.goal = "Job Search";
  }
  const rawAnalysis = await analyzeLinkedInProfile(profile, contextAnswers);
  const analysis = normalizeAnalysis(rawAnalysis) || rawAnalysis;
  const supabase = getSupabaseAdmin();
  const userId = profile.linkedinId;
  let analysisId = crypto.randomUUID();

  if (supabase) {
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

  }

  return NextResponse.json({ analysis, analysisId });
}
