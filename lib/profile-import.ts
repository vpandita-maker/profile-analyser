import type { LinkedInProfile } from "@/lib/types";

const sectionMarkers = [
  "About",
  "Experience",
  "Education",
  "Skills",
  "Licenses & certifications",
  "Projects",
  "Volunteer experience",
  "Recommendations",
  "Honors & awards",
  "Publications",
  "Languages"
];

function cleanLines(text: string) {
  return text
    .replace(/\r/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function sectionText(lines: string[], marker: string) {
  const start = lines.findIndex((line) => line.toLowerCase() === marker.toLowerCase());
  if (start === -1) return "";

  const end = lines.findIndex((line, index) => index > start && sectionMarkers.some((item) => item.toLowerCase() === line.toLowerCase()));
  return lines.slice(start + 1, end === -1 ? undefined : end).join("\n").trim();
}

function splitItems(text: string, limit = 8) {
  return text
    .split(/\n{1,}|•/g)
    .map((item) => item.trim())
    .filter((item) => item.length > 2)
    .slice(0, limit);
}

export function parseProfileText(text: string): Partial<LinkedInProfile> {
  const normalizedText = text.replace(/\\n/g, "\n");
  const lines = cleanLines(normalizedText);
  const about = sectionText(lines, "About");
  const experienceText = sectionText(lines, "Experience");
  const educationText = sectionText(lines, "Education");
  const skillsText = sectionText(lines, "Skills");

  const firstUsefulLine = lines.find((line) => !sectionMarkers.includes(line) && !line.includes("@")) || "";
  const headline = lines.find((line, index) => index > 0 && line.length > 12 && !sectionMarkers.includes(line)) || firstUsefulLine;

  return {
    headline: headline.slice(0, 220),
    about: about.slice(0, 2500),
    experience: splitItems(experienceText, 12),
    education: splitItems(educationText, 6),
    skills: splitItems(skillsText.replace(/,/g, "\n"), 30),
    rawProfileText: normalizedText.slice(0, 12000)
  };
}
