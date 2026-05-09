import { ApifyClient } from "apify-client";
import { firstArrayDeep, normalizeLinkedInProfile } from "@/lib/profile-normalize";
import type { LinkedInProfile } from "@/lib/types";

type ApifyProfile = Record<string, unknown>;

const richNoCookieActorId = "harvestapi/linkedin-profile-scraper";
const fullSectionsNoCookieActorId = "apimaestro/linkedin-profile-full-sections-scraper";
const legacyNoCookieActorId = "yZnhB5JewWf9xSmoM";
const cookieActorId = "PEgClm7RgRD7YO94b";

export class ProfileImportError extends Error {
  constructor(
    message: string,
    public readonly code: "missing_token" | "empty_result" | "actor_failed"
  ) {
    super(message);
  }
}

function getActorIds() {
  const configuredActorId = process.env.APIFY_ACTOR_ID?.trim();
  const candidates = [
    configuredActorId,
    richNoCookieActorId,
    fullSectionsNoCookieActorId,
    legacyNoCookieActorId
  ].filter((actorId): actorId is string => Boolean(actorId));

  return Array.from(
    new Set(
      candidates.filter((actorId) => actorId !== cookieActorId && !actorId.startsWith("apify_api_"))
    )
  );
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

function splitListText(value: string) {
  return value
    .split(/\n|,|;|\u2022/g)
    .map((item) => item.replace(/^\s*[-\u2013\u2014]\s*/, "").trim())
    .filter((item) => item.length > 1);
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
  if (typeof value === "string") return splitListText(value).slice(0, 40);

  if (value && typeof value === "object" && !Array.isArray(value)) {
    const record = value as ApifyProfile;
    if (Array.isArray(record.elements)) return listText(record.elements, keys);
    if (Array.isArray(record.items)) return listText(record.items, keys);
    if (Array.isArray(record.values)) return listText(record.values, keys);
  }

  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      if (typeof item === "string") return item.trim();
      if (!item || typeof item !== "object") return "";

      const record = item as ApifyProfile;
      const parts = keys.length
        ? keys.map((key) => (normalizeKey(key) === "timeperiod" ? formatPeriod(record[key]) : asText(record[key])))
        : Object.values(record).map(asText);
      return parts.filter(Boolean).join(", ");
    })
    .filter(Boolean)
    .slice(0, 40);
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
  const nestedProfile = item.profile || item.data || item.result || item.person || item.linkedinProfile;
  const source = nestedProfile && typeof nestedProfile === "object" && !Array.isArray(nestedProfile)
    ? ({ ...item, ...(nestedProfile as ApifyProfile) } as ApifyProfile)
    : item;

  const linkedinId = firstText(source, ["profileId", "profile id", "publicIdentifier", "public identifier", "linkedinId", "linkedin id", "id"]) || profileUrl;
  const name =
    firstText(source, [
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
    firstDeepText(source, [
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
      firstDeepText(source, ["firstName", "first name", "first_name", "givenName", "given name"]),
      firstDeepText(source, ["lastName", "last name", "last_name", "familyName", "family name"])
    ]
      .filter(Boolean)
      .join(" ");

  const headline = firstDeepText(source, [
    "headline",
    "profileHeadline",
    "profile headline",
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
  const about = firstDeepText(source, ["about", "aboutText", "about text", "summary", "bio", "biography", "description"]);
  const photo = firstDeepText(source, [
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
  const location = firstDeepText(source, ["geoLocationName", "geo location name", "locationName", "location name", "location", "address", "geoLocation", "geo location"]);
  const country = firstDeepText(source, ["geoCountryName", "geo country name", "countryName", "country name", "country", "countryCode", "country code"]);
  const industry = firstDeepText(source, ["industryName", "industry name", "industry", "industryLabel", "industry label"]);
  const currentRole = firstDeepText(source, ["jobTitle", "job title", "currentRole", "current role", "currentPosition", "current position", "title", "position"]);
  const currentCompany = firstDeepText(source, ["companyName", "company name", "currentCompanyName", "current company name", "company", "organization"]);
  const experience = listText(firstArray(source, [
    "positions",
    "position",
    "currentPositions",
    "current positions",
    "pastPositions",
    "past positions",
    "experience",
    "experiences",
    "positionHistory",
    "position history",
    "workExperience",
    "work experience",
    "workExperienceDetails",
    "employmentHistory",
    "employment history"
  ]), [
    "title",
    "position",
    "jobTitle",
    "companyName",
    "company",
    "organization",
    "locationName",
    "location",
    "timePeriod",
    "dateRange",
    "dates",
    "duration",
    "description",
    "summary",
    "subComponents"
  ]);
  const education = listText(firstArray(source, ["education", "educations", "educationHistory", "education history", "schools", "school", "educationDetails", "education details"]), [
    "schoolName",
    "school",
    "title",
    "degreeName",
    "degree",
    "fieldOfStudy",
    "field",
    "major",
    "dateRange",
    "timePeriod",
    "dates",
    "description"
  ]);
  const rawSkills = firstArray(source, ["skills", "topSkills", "top skills", "skill", "skillSet", "skill set", "skillCategories", "skill categories"]);
  const skills = listText(rawSkills.length ? rawSkills : firstDeepText(source, ["skills", "topSkills", "top skills"]), ["name", "title", "text", "skillName", "skill"]);

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
    isStudent: Boolean(source.student),
    rawProfileText: JSON.stringify({ profileUrl, ...item }).slice(0, 50000),
    importSource: "scrape"
  };

  return normalizeLinkedInProfile(profile) || profile;
}

function profileSignalCount(profile: Partial<LinkedInProfile>) {
  return [
    profile.name && profile.name !== "LinkedIn Member",
    profile.headline,
    profile.about,
    profile.experience?.length,
    profile.education?.length,
    profile.skills?.length,
    profile.location,
    profile.currentRole,
    profile.currentCompany,
    profile.photo
  ].filter(Boolean).length;
}

function isUsableProfile(profile: Partial<LinkedInProfile>) {
  const sectionCount = [
    profile.headline,
    profile.about,
    profile.experience?.length,
    profile.education?.length,
    profile.skills?.length
  ].filter(Boolean).length;

  return sectionCount >= 2 || profileSignalCount(profile) >= 4;
}

function slugFromProfileUrl(profileUrl: string) {
  try {
    const url = new URL(profileUrl);
    const parts = url.pathname.split("/").filter(Boolean);
    const index = parts.findIndex((part) => part.toLowerCase() === "in");
    return index >= 0 ? parts[index + 1] || "" : "";
  } catch {
    const match = profileUrl.match(/linkedin\.com\/in\/([^/?#]+)/i);
    return match?.[1] || "";
  }
}

function getInputCandidates(profileUrl: string) {
  const profileSlug = slugFromProfileUrl(profileUrl);
  const baseOptions = {
    scrapeCompany: false,
    findContacts: false,
    findEmails: false
  };

  return [
    { urls: [profileUrl], ...baseOptions },
    { profileUrls: [profileUrl], ...baseOptions },
    { startUrls: [{ url: profileUrl }], ...baseOptions },
    { urls: [{ url: profileUrl }], ...baseOptions },
    { profileUrls: [{ url: profileUrl }], ...baseOptions },
    ...(profileSlug
      ? [
          { usernames: [profileSlug], ...baseOptions },
          { username: profileSlug, ...baseOptions }
        ]
      : [])
  ];
}

function inputShape(input: Record<string, unknown>) {
  return Object.keys(input).join(",");
}

export async function scrapeLinkedInProfile(profileUrl: string) {
  const token = process.env.APIFY_TOKEN;
  const actorIds = getActorIds();

  if (!token) {
    throw new ProfileImportError("Apify token is missing", "missing_token");
  }

  const client = new ApifyClient({ token });
  const inputs = getInputCandidates(profileUrl);
  let lastError: unknown;
  let bestProfile: Partial<LinkedInProfile> | null = null;
  let bestScore = 0;

  for (const actorId of actorIds) {
    for (const input of inputs) {
      try {
        const run = await client.actor(actorId).call(input);
        const { items } = await client.dataset(run.defaultDatasetId).listItems({ limit: 5 });
        const firstItem = items[0] as ApifyProfile | undefined;

        if (!firstItem) {
          lastError = new Error("Actor returned no dataset items");
          continue;
        }

        const profile = mapApifyProfile(firstItem, profileUrl);
        const score = profileSignalCount(profile);

        if (score > bestScore) {
          bestProfile = profile;
          bestScore = score;
        }

        if (isUsableProfile(profile)) return profile;

        lastError = new Error("Actor returned a weak profile payload");
        console.warn("Apify returned weak profile data", {
          actorId,
          inputShape: inputShape(input),
          score,
          fields: {
            headline: Boolean(profile.headline),
            about: Boolean(profile.about),
            experience: profile.experience?.length || 0,
            education: profile.education?.length || 0,
            skills: profile.skills?.length || 0
          }
        });
      } catch (error) {
        lastError = error;
        console.error("Apify actor attempt failed", {
          actorId,
          inputShape: inputShape(input),
          error
        });
      }
    }
  }

  if (bestProfile && isUsableProfile(bestProfile)) return bestProfile;

  console.error("Apify profile import did not return enough public profile data", {
    actorIds,
    bestScore,
    error: lastError
  });

  throw new ProfileImportError("Apify returned no usable profile data", bestProfile ? "empty_result" : "actor_failed");
}
