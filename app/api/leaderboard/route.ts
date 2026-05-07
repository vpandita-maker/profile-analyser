import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import type { LeaderboardEntry } from "@/lib/types";

export const revalidate = 60;

const demoEntries: LeaderboardEntry[] = [
  { id: "1", rank: 1, name: "Aarav Mehta", headline: "Product Leader | B2B SaaS | Ex-founder", overallScore: 94, goal: "Hiring", geography: "India", seniority: "Executive" },
  { id: "2", rank: 2, name: "Maya Rao", headline: "Growth marketer scaling fintech products", overallScore: 91, goal: "Personal Brand", geography: "India", seniority: "Senior" },
  { id: "3", rank: 3, name: "Rohan Shah", headline: "Engineering manager building platform teams", overallScore: 88, goal: "Recruiting", geography: "US", seniority: "Senior" },
  { id: "4", rank: 4, name: "Nina Kapoor", headline: "Founder raising seed for climate intelligence", overallScore: 86, goal: "Fundraising", geography: "US", seniority: "Executive" },
  { id: "5", rank: 5, name: "Dev Iyer", headline: "Data analyst targeting product analytics roles", overallScore: 83, goal: "Job Search", geography: "India", seniority: "Mid-level" },
  { id: "6", rank: 6, name: "Sara Thomas", headline: "People leader hiring GTM teams", overallScore: 81, goal: "Hiring", geography: "Other", seniority: "Executive" },
  { id: "7", rank: 7, name: "Kabir Sethi", headline: "Student builder focused on ML systems", overallScore: 79, goal: "Job Search", geography: "India", seniority: "Student" },
  { id: "8", rank: 8, name: "Isha Menon", headline: "Brand strategist for founder-led companies", overallScore: 77, goal: "Personal Brand", geography: "US", seniority: "Senior" },
  { id: "9", rank: 9, name: "Ankit Bose", headline: "Sales leader opening enterprise accounts", overallScore: 75, goal: "Recruiting", geography: "India", seniority: "Senior" },
  { id: "10", rank: 10, name: "Leah Kim", headline: "Operator investing in early-stage teams", overallScore: 73, goal: "Fundraising", geography: "Other", seniority: "Executive" }
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const goal = searchParams.get("goal");
  const geography = searchParams.get("geography");
  const seniority = searchParams.get("seniority");
  const supabase = getSupabaseAdmin();

  if (supabase) {
    let query = supabase.from("leaderboard").select("*").eq("is_public", true).order("overall_score", { ascending: false }).limit(10);
    if (goal) query = query.eq("goal", goal);
    if (geography) query = query.eq("geography", geography);
    if (seniority) query = query.eq("seniority", seniority);

    const { data, error } = await query;
    if (!error && data) {
      return NextResponse.json({
        entries: data.map((entry, index) => ({
          id: entry.id,
          rank: index + 1,
          name: entry.name || "Anonymous",
          headline: entry.headline || "",
          profilePhotoUrl: entry.profile_photo_url,
          overallScore: entry.overall_score || 0,
          goal: entry.goal || "",
          geography: entry.geography || "",
          seniority: entry.seniority || ""
        })),
        userRank: null
      });
    }
  }

  const filtered = demoEntries
    .filter((entry) => (!goal || entry.goal === goal) && (!geography || entry.geography === geography) && (!seniority || entry.seniority === seniority))
    .map((entry, index) => ({ ...entry, rank: index + 1 }));

  return NextResponse.json({ entries: filtered, userRank: 23 });
}
