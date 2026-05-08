import { NextResponse } from "next/server";
import { z } from "zod";
import { scrapeLinkedInProfile } from "@/lib/apify";

const scrapeSchema = z.object({
  profileUrl: z
    .string()
    .url()
    .refine((value) => value.includes("linkedin.com/in/"), "Enter a valid LinkedIn profile URL.")
});

export async function POST(request: Request) {
  const parsed = scrapeSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a valid LinkedIn profile URL." }, { status: 400 });
  }

  try {
    const profile = await scrapeLinkedInProfile(parsed.data.profileUrl);
    return NextResponse.json({ profile });
  } catch (error) {
    console.error("LinkedIn scrape failed", error);
    return NextResponse.json(
      {
        error: "Could not import this profile automatically. Upload your saved PDF instead."
      },
      { status: 502 }
    );
  }
}
