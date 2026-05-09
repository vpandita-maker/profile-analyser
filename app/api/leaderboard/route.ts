import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import type { LeaderboardEntry } from "@/lib/types";

export const revalidate = 60;

const demoEntries: LeaderboardEntry[] = [
  { id: "1", rank: 1, name: "Aarav Mehta", headline: "Product Manager candidate | B2B SaaS | Analytics projects", overallScore: 94, goal: "Job Search", geography: "India", seniority: "Mid level" },
  { id: "2", rank: 2, name: "Maya Rao", headline: "Data Analyst candidate | SQL | Python | Fintech dashboards", overallScore: 91, goal: "Job Search", geography: "India", seniority: "Entry level" },
  { id: "3", rank: 3, name: "Rohan Shah", headline: "Software Engineering intern candidate | React | Node | ML systems", overallScore: 88, goal: "Internship Search", geography: "US", seniority: "Student" },
  { id: "4", rank: 4, name: "Nina Kapoor", headline: "Consulting internship candidate | Market research | Strategy cases", overallScore: 86, goal: "Internship Search", geography: "US", seniority: "Student" },
  { id: "5", rank: 5, name: "Dev Iyer", headline: "Business Analyst candidate | Product analytics | CRM reporting", overallScore: 83, goal: "Job Search", geography: "India", seniority: "Mid level" },
  { id: "6", rank: 6, name: "Sara Thomas", headline: "Marketing intern candidate | Campaign analytics | Content ops", overallScore: 81, goal: "Internship Search", geography: "Other", seniority: "Student" },
  { id: "7", rank: 7, name: "Kabir Sethi", headline: "ML intern candidate | Python | Model evaluation | Research projects", overallScore: 79, goal: "Internship Search", geography: "India", seniority: "Student" },
  { id: "8", rank: 8, name: "Isha Menon", headline: "UX Research candidate | User interviews | SaaS case studies", overallScore: 77, goal: "Job Search", geography: "US", seniority: "Entry level" },
  { id: "9", rank: 9, name: "Ankit Bose", headline: "Sales Development candidate | Pipeline research | CRM hygiene", overallScore: 75, goal: "Job Search", geography: "India", seniority: "Entry level" },
  { id: "10", rank: 10, name: "Leah Kim", headline: "Operations internship candidate | Process improvement | Excel", overallScore: 73, goal: "Internship Search", geography: "Other", seniority: "Student" }
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
