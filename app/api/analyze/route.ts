import { NextResponse } from "next/server";
import { z } from "zod";
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
    skills: body.skills
  };
  const contextAnswers = body.contextAnswers as unknown as ContextAnswers;
  if (!["Job Search", "Internship Search"].includes(contextAnswers.goal)) {
    contextAnswers.goal = "Job Search";
  }
  const analysis = await analyzeLinkedInProfile(profile, contextAnswers);
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

    await supabase.from("leaderboard").upsert(
      {
        user_id: userId,
        linkedin_id: profile.linkedinId,
        name: profile.name,
        headline: profile.headline || "",
        profile_photo_url: profile.photo || "",
        overall_score: analysis.overallScore,
        goal: contextAnswers.goal,
        geography: contextAnswers.geography,
        seniority: contextAnswers.seniority,
        is_public: false
      },
      { onConflict: "user_id" }
    );
  }

  return NextResponse.json({ analysis, analysisId });
}
