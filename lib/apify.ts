import { ApifyClient } from "apify-client";
import type { LinkedInProfile } from "@/lib/types";

type ApifyProfile = Record<string, unknown>;

function asText(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number") return String(value);
  if (value && typeof value === "object" && "text" in value) return asText((value as { text?: unknown }).text);
  return "";
}

function firstText(item: ApifyProfile, keys: string[]) {
  for (const key of keys) {
    const value = asText(item[key]);
    if (value) return value;
  }

  return "";
}

function listText(value: unknown, keys: string[] = []) {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      if (typeof item === "string") return item.trim();
      if (!item || typeof item !== "object") return "";

      const record = item as ApifyProfile;
      const parts = keys.length ? keys.map((key) => asText(record[key])) : Object.values(record).map(asText);
      return parts.filter(Boolean).join(", ");
    })
    .filter(Boolean)
    .slice(0, 30);
}

function firstArray(item: ApifyProfile, keys: string[]) {
  for (const key of keys) {
    const value = item[key];
    if (Array.isArray(value) && value.length) return value;
  }

  return [];
}

export function mapApifyProfile(item: ApifyProfile, profileUrl: string): Partial<LinkedInProfile> {
  const name =
    firstText(item, ["fullName", "name", "title"]) ||
    [firstText(item, ["firstName", "first_name"]), firstText(item, ["lastName", "last_name"])].filter(Boolean).join(" ");

  const headline = firstText(item, ["headline", "subTitle", "subtitle", "occupation", "currentPosition"]);
  const about = firstText(item, ["about", "summary", "bio", "description"]);
  const photo = firstText(item, ["profilePicture", "profilePic", "profilePicUrl", "profileImage", "image"]);
  const experience = listText(firstArray(item, ["positions", "experience", "experiences", "positionHistory"]), [
    "title",
    "companyName",
    "company",
    "location",
    "dateRange",
    "duration",
    "description"
  ]);
  const education = listText(firstArray(item, ["education", "educations"]), ["schoolName", "school", "degreeName", "degree", "fieldOfStudy", "dateRange"]);
  const skills = listText(firstArray(item, ["skills", "topSkills"]), ["name", "title", "text"]);

  return {
    name: name || "LinkedIn Member",
    headline,
    photo,
    about,
    experience,
    education,
    skills,
    rawProfileText: JSON.stringify({ profileUrl, ...item }).slice(0, 12000),
    importSource: "scrape"
  };
}

export async function scrapeLinkedInProfile(profileUrl: string) {
  const token = process.env.APIFY_TOKEN;
  const cookie = process.env.APIFY_LINKEDIN_COOKIE;
  const actorId = process.env.APIFY_ACTOR_ID || "PEgClm7RgRD7YO94b";

  if (!token || !cookie) {
    throw new Error("Apify is not configured");
  }

  const client = new ApifyClient({ token });
  const run = await client.actor(actorId).call({
    cookie,
    urls: [profileUrl],
    minDelay: 15,
    maxDelay: 60,
    proxy: {
      useApifyProxy: true,
      apifyProxyCountry: "US"
    },
    findContacts: false,
    "findContacts.contactCompassToken": "",
    scrapeCompany: false
  });

  const { items } = await client.dataset(run.defaultDatasetId).listItems();
  const firstItem = items[0] as ApifyProfile | undefined;

  if (!firstItem) {
    throw new Error("Apify returned no profile data");
  }

  return mapApifyProfile(firstItem, profileUrl);
}
