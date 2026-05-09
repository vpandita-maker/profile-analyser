import { NextResponse } from "next/server";
import { z } from "zod";
import { ProfileImportError, scrapeLinkedInProfile } from "@/lib/apify";

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

    if (error instanceof ProfileImportError) {
      const message =
        error.code === "missing_token"
          ? "Profile URL import is not set up yet. Add APIFY_TOKEN in Vercel and redeploy."
          : "Profile import failed at the scraper. Check your Apify run logs or try the saved PDF upload.";

      return NextResponse.json({ error: message, code: error.code }, { status: 502 });
    }

    return NextResponse.json(
      {
        error: "Could not import this profile automatically. Upload your saved PDF instead."
      },
      { status: 502 }
    );
  }
}
