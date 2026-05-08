import { NextResponse } from "next/server";
import { extractPdfText } from "@/lib/pdf-text";
import { parseProfileText } from "@/lib/profile-import";

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file");

  try {
    let text = "";

    if (file instanceof File && file.size > 0) {
      if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
        return NextResponse.json({ error: "Please upload a PDF file." }, { status: 400 });
      }

      if (file.size > 8 * 1024 * 1024) {
        return NextResponse.json({ error: "PDF must be under 8MB." }, { status: 400 });
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      text = await extractPdfText(buffer);
    } else {
      return NextResponse.json({ error: "Please upload your LinkedIn profile PDF." }, { status: 400 });
    }

    if (!text.trim()) {
      return NextResponse.json(
        {
          error: "Could not read profile text from this PDF. On your LinkedIn profile, open Resources and choose Save to PDF, then upload that file."
        },
        { status: 400 }
      );
    }

    const profile = parseProfileText(text);
    return NextResponse.json({ profile, characterCount: text.length });
  } catch (error) {
    console.error("Profile import failed", error);
    return NextResponse.json({ error: "Could not read this profile PDF. Download it again from LinkedIn Resources, then upload the new file." }, { status: 500 });
  }
}
