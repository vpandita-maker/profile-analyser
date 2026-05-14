import { NextResponse } from "next/server";
import { z } from "zod";
import { ProfileImportError, scrapeLinkedInProfile } from "@/lib/apify";

const rateMap = new Map<string, { count: number; reset: number }>();
function checkRate(ip: string, max: number, windowMs: number) {
  const now = Date.now();
  const rec = rateMap.get(ip);
  if (!rec || now > rec.reset) { rateMap.set(ip, { count: 1, reset: now + windowMs }); return true; }
  if (rec.count >= max) return false;
  rec.count++;
  return true;
}

const scrapeSchema = z.object({
  profileUrl: z
    .string()
    .url()
    .refine((value) => value.includes("linkedin.com/in/"), "Enter a valid LinkedIn profile URL.")
});

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
  if (!checkRate(ip, 10, 60_000)) {
    return NextResponse.json({ error: "Too many requests. Please wait a minute and try again." }, { status: 429 });
  }

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
          : "Could not import this profile. Check the URL and try again.";

      return NextResponse.json({ error: message, code: error.code }, { status: 502 });
    }

    return NextResponse.json(
      {
        error: "Could not import this profile automatically. Check the profile URL and try again."
      },
      { status: 502 }
    );
  }
}
