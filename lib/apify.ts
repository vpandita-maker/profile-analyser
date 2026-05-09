import { ApifyClient } from "apify-client";
import { firstArrayDeep, normalizeLinkedInProfile } from "@/lib/profile-normalize";
import type { LinkedInProfile } from "@/lib/types";

type ApifyProfile = Record<string, unknown>;

const noCookieActorId = "yZnhB5JewWf9xSmoM";
const cookieActorId = "PEgClm7RgRD7YO94b";

export class ProfileImportError extends Error {
  constructor(
    message: string,
    public readonly code: "missing_token" | "empty_result" | "actor_failed"
  ) {
    super(message);
  }
}

function getActorId() {
  const configuredActorId = process.env.APIFY_ACTOR_ID?.trim();

  if (!configuredActorId || configuredActorId === cookieActorId || configuredActorId.startsWith("apify_api_")) {
    return noCookieActorId;
  }

  return configuredActorId;
}

function formatPeriod(period: unknown): string {
  if (!period || typeof period !== "object") return "";

  const record = period as ApifyProfile;
  const start = record.startDate as ApifyProfile | undefined;
  const end = record.endDate as ApifyProfile | undefined;
  const formatDate = (date?: ApifyProfile) => [asText(date?.month), asText(date?.year)].filter(Boolean).join("/");
  const startText = formatDate(start);
  const endText = formatDate(end) || "Present";

  if (!startText && !endText) return "";
  return [startText, endText].filter(Boolean).join(" to ");
}

function asText(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number") return String(value);
  if (Array.isArray(value)) return value.map(asText).filter(Boolean).join(", ");
  if (value && typeof value === "object" && "text" in value) return asText((value as { text?: unknown }).text);
  if (value && typeof value === "object" && "name" in value) return asText((value as { name?: unknown }).name);
  if (value && typeof value === "object" && "value" in value) return asText((value as { value?: unknown }).value);
  return "";
}

function normalizeKey(key: string) {
  return key.replace(/[\s_-]/g, "").toLowerCase();
}

function firstText(item: ApifyProfile, keys: string[]) {
  const targets = new Set(keys.map(normalizeKey));

  for (const [key, value] of Object.entries(item)) {
    if (targets.has(normalizeKey(key))) {
      const text = asText(value);
      if (text) return text;
    }
  }

  return "";
}

function deepText(value: unknown, keys: string[], depth = 0): string {
  if (depth > 8 || !value) return "";

  if (Array.isArray(value)) {
    for (const item of value) {
      const text = deepText(item, keys, depth + 1);
      if (text) return text;
    }
    return "";
  }

  if (typeof value !== "object") return "";

  const record = value as ApifyProfile;
  const direct = firstText(record, keys);
  if (direct) return direct;

  for (const entryValue of Object.values(record)) {
    const text = deepText(entryValue, keys, depth + 1);
    if (text) return text;
  }

  return "";
}

function firstDeepText(item: ApifyProfile, keys: string[]) {
  for (const key of keys) {
    const value = asText(item[key]);
    if (value) return value;
  }

  return deepText(item, keys);
}

function listText(value: unknown, keys: string[] = []) {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      if (typeof item === "string") return item.trim();
      if (!item || typeof item !== "object") return "";

      const record = item as ApifyProfile;
      const parts = keys.length
        ? keys.map((key) => (key === "timePeriod" ? formatPeriod(record[key]) : asText(record[key])))
        : Object.values(record).map(asText);
      return parts.filter(Boolean).join(", ");
    })
    .filter(Boolean)
    .slice(0, 30);
}

function firstArray(item: ApifyProfile, keys: string[]) {
  const nested = firstArrayDeep(item, keys);
  if (nested.length) return nested;

  for (const key of keys) {
    const value = item[key];
    if (Array.isArray(value) && value.length) return value;
  }

  return [];
}

export function mapApifyProfile(item: ApifyProfile, profileUrl: string): Partial<LinkedInProfile> {
  const linkedinId = firstText(item, ["profileId", "profile id", "publicIdentifier", "public identifier", "id"]) || profileUrl;
  const name =
    firstText(item, [
      "fullName",
      "full name",
      "full_name",
      "profileName",
      "profile name",
      "profile_name",
      "displayName",
      "display name",
      "display_name",
      "memberName",
      "member name",
      "personName",
      "person name",
      "profileFullName",
      "profile full name",
      "name"
    ]) ||
    firstDeepText(item, [
      "fullName",
      "full name",
      "full_name",
      "profileName",
      "profile name",
      "profile_name",
      "displayName",
      "display name",
      "display_name",
      "memberName",
      "member name",
      "personName",
      "person name",
      "profileFullName",
      "profile full name"
    ]) ||
    [
      firstDeepText(item, ["firstName", "first name", "first_name", "givenName", "given name"]),
      firstDeepText(item, ["lastName", "last name", "last_name", "familyName", "family name"])
    ]
      .filter(Boolean)
      .join(" ");

  const headline = firstDeepText(item, [
    "headline",
    "occupation",
    "subTitle",
    "subtitle",
    "primarySubtitle",
    "primary subtitle",
    "profileSubTitle",
    "profile sub title",
    "profileSubtitle",
    "profile subtitle",
    "currentPosition",
    "current position",
    "currentJobTitle",
    "current job title",
    "currentRole",
    "current role",
    "position",
    "jobTitle",
    "job title",
    "profession",
    "tagline"
  ]);
  const about = firstDeepText(item, ["about", "aboutText", "about text", "summary", "bio", "biography", "description"]);
  const photo = firstDeepText(item, [
    "pictureUrl",
    "picture url",
    "profilePicture",
    "profile picture",
    "profilePictureUrl",
    "profile picture url",
    "profilePic",
    "profilePicUrl",
    "profile pic url",
    "profileImage",
    "profile image",
    "profileImageUrl",
    "profile image url",
    "photo",
    "photoUrl",
    "photo url",
    "avatar",
    "avatarUrl",
    "avatar url",
    "image",
    "imageUrl",
    "image url"
  ]);
  const location = firstDeepText(item, ["geoLocationName", "geo location name", "locationName", "location name", "location", "address", "geoLocation", "geo location"]);
  const country = firstDeepText(item, ["geoCountryName", "geo country name", "countryName", "country name", "country", "countryCode", "country code"]);
  const industry = firstDeepText(item, ["industryName", "industry name", "industry", "industryLabel", "industry label"]);
  const currentRole = firstDeepText(item, ["jobTitle", "job title", "currentRole", "current role", "currentPosition", "current position", "title"]);
  const currentCompany = firstDeepText(item, ["companyName", "company name", "currentCompanyName", "current company name", "company"]);
  const experience = listText(firstArray(item, ["positions", "experience", "experiences", "positionHistory"]), [
    "title",
    "jobTitle",
    "companyName",
    "company",
    "locationName",
    "location",
    "timePeriod",
    "dateRange",
    "duration",
    "description"
  ]);
  const education = listText(firstArray(item, ["education", "educations", "educationHistory", "education history", "schools", "school"]), [
    "schoolName",
    "school",
    "degreeName",
    "degree",
    "fieldOfStudy",
    "dateRange",
    "timePeriod",
    "description"
  ]);
  const skills = listText(firstArray(item, ["skills", "topSkills", "top skills", "skillSet", "skill set"]), ["name", "title", "text", "skillName", "skill"]);

  const profile: LinkedInProfile = {
    linkedinId,
    profileUrl,
    name: name || "LinkedIn Member",
    headline,
    photo,
    about,
    experience,
    education,
    skills,
    location,
    country,
    city: location,
    industry,
    currentRole,
    currentCompany,
    isStudent: Boolean(item.student),
    rawProfileText: JSON.stringify({ profileUrl, ...item }).slice(0, 50000),
    importSource: "scrape"
  };

  return normalizeLinkedInProfile(profile) || profile;
}

export async function scrapeLinkedInProfile(profileUrl: string) {
  const token = process.env.APIFY_TOKEN;
  const actorId = getActorId();

  if (!token) {
    throw new ProfileImportError("Apify token is missing", "missing_token");
  }

  const client = new ApifyClient({ token });
  let run;
  const inputs = [
    {
      urls: [profileUrl],
      scrapeCompany: false
    },
    {
      urls: [{ url: profileUrl }],
      scrapeCompany: false
    }
  ];
  let lastError: unknown;

  for (const input of inputs) {
    try {
      run = await client.actor(actorId).call(input);
      break;
    } catch (error) {
      lastError = error;
      console.error("Apify actor attempt failed", {
        actorId,
        inputShape: Array.isArray(input.urls) && typeof input.urls[0] === "string" ? "string_urls" : "object_urls",
        error
      });
    }
  }

  if (!run) {
    console.error("Apify actor failed", { actorId, error: lastError });
    throw new ProfileImportError("Apify actor failed", "actor_failed");
  }

  const { items } = await client.dataset(run.defaultDatasetId).listItems();
  const firstItem = items[0] as ApifyProfile | undefined;

  if (!firstItem) {
    throw new ProfileImportError("Apify returned no profile data", "empty_result");
  }

  return mapApifyProfile(firstItem, profileUrl);
}
