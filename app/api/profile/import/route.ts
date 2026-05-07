import { NextResponse } from "next/server";
import { extractPdfText } from "@/lib/pdf-text";
import { parseProfileText } from "@/lib/profile-import";

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file");
  const pastedText = formData.get("text");

  try {
    let text = typeof pastedText === "string" ? pastedText : "";

    if (file instanceof File && file.size > 0) {
      if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
        return NextResponse.json({ error: "Please upload a PDF file." }, { status: 400 });
      }

      if (file.size > 8 * 1024 * 1024) {
        return NextResponse.json({ error: "PDF must be under 8MB." }, { status: 400 });
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      text = await extractPdfText(buffer);
    }

    if (!text.trim()) {
      return NextResponse.json(
        {
          error: "Could not find readable profile text in this PDF. Try pasting your profile text instead."
        },
        { status: 400 }
      );
    }

    const profile = parseProfileText(text);
    return NextResponse.json({ profile, characterCount: text.length });
  } catch (error) {
    console.error("Profile import failed", error);
    return NextResponse.json({ error: "Could not read this profile file. Try pasting your profile text instead." }, { status: 500 });
  }
}
