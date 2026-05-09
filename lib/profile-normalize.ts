import type { LinkedInProfile } from "@/lib/types";

type UnknownRecord = Record<string, unknown>;

const fallbackNames = new Set(["LinkedIn Member", "Profile Member"]);
const fallbackHeadlines = new Set(["Profile headline ready for optimization", "Profile ready for review"]);

function isRecord(value: unknown): value is UnknownRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function normalizeKey(key: string) {
  return key.replace(/[\s_-]/g, "").toLowerCase();
}

function cleanText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function textValue(value: unknown): string {
  if (typeof value === "string") return cleanText(value);
  if (typeof value === "number") return String(value);
  if (isRecord(value) && "text" in value) return textValue(value.text);
  return "";
}

export function parseRawProfileText(rawProfileText?: string) {
  if (!rawProfileText) return null;

  try {
    return JSON.parse(rawProfileText) as unknown;
  } catch {
    return null;
  }
}

export function directText(value: unknown, keys: string[]) {
  if (!isRecord(value)) return "";

  const targets = new Set(keys.map(normalizeKey));
  for (const [key, entryValue] of Object.entries(value)) {
    if (targets.has(normalizeKey(key))) {
      const text = textValue(entryValue);
      if (text) return text;
    }
  }

  return "";
}

export function deepText(value: unknown, keys: string[], depth = 0): string {
  if (depth > 5 || !value) return "";

  const direct = directText(value, keys);
  if (direct) return direct;

  if (Array.isArray(value)) {
    for (const item of value) {
      const text = deepText(item, keys, depth + 1);
      if (text) return text;
    }
    return "";
  }

  if (!isRecord(value)) return "";

  for (const entryValue of Object.values(value)) {
    const text = deepText(entryValue, keys, depth + 1);
    if (text) return text;
  }

  return "";
}

function arrayValue(value: unknown) {
  if (Array.isArray(value)) return value;
  if (isRecord(value) && Array.isArray(value.elements)) return value.elements;
  if (isRecord(value) && Array.isArray(value.items)) return value.items;
  return [];
}

export function firstArrayDeep(value: unknown, keys: string[], depth = 0): unknown[] {
  if (depth > 5 || !value) return [];

  if (Array.isArray(value)) {
    for (const item of value) {
      const nested = firstArrayDeep(item, keys, depth + 1);
      if (nested.length) return nested;
    }
    return [];
  }

  if (!isRecord(value)) return [];

  const targets = new Set(keys.map(normalizeKey));
  for (const [key, entryValue] of Object.entries(value)) {
    if (targets.has(normalizeKey(key))) {
      const array = arrayValue(entryValue);
      if (array.length) return array;
    }
  }

  for (const entryValue of Object.values(value)) {
    const nested = firstArrayDeep(entryValue, keys, depth + 1);
    if (nested.length) return nested;
  }

  return [];
}

function formatPeriod(period: unknown) {
  if (!isRecord(period)) return "";

  const start = isRecord(period.startDate) ? period.startDate : undefined;
  const end = isRecord(period.endDate) ? period.endDate : undefined;
  const formatDate = (date?: UnknownRecord) => [textValue(date?.month), textValue(date?.year)].filter(Boolean).join("/");
  const startText = formatDate(start);
  const endText = formatDate(end) || "Present";

  return [startText, endText].filter(Boolean).join(" to ");
}

export function listText(value: unknown, keys: string[] = []) {
  const values = arrayValue(value);

  return values
    .map((item) => {
      if (typeof item === "string") return cleanText(item);
      if (!isRecord(item)) return "";

      const parts = keys.length
        ? keys.map((key) => (normalizeKey(key) === "timeperiod" ? formatPeriod(item[key]) : textValue(item[key])))
        : Object.values(item).map(textValue);

      return parts.filter(Boolean).join(", ");
    })
    .filter(Boolean)
    .slice(0, 40);
}

function isFallbackName(value?: string) {
  return !value || fallbackNames.has(value);
}

function isFallbackHeadline(value?: string) {
  return !value || fallbackHeadlines.has(value);
}

function nameFromRaw(rawProfile: unknown) {
  const fullName =
    directText(rawProfile, ["fullName", "full name", "profileName", "profile name", "displayName", "display name", "name"]) ||
    deepText(rawProfile, ["fullName", "full name", "profileName", "profile name", "displayName", "display name"]);

  if (fullName) return fullName;

  const firstName = deepText(rawProfile, ["firstName", "first name", "first_name", "givenName", "given name"]);
  const lastName = deepText(rawProfile, ["lastName", "last name", "last_name", "familyName", "family name"]);
  return [firstName, lastName].filter(Boolean).join(" ");
}

function headlineFromRaw(rawProfile: unknown) {
  return (
    directText(rawProfile, ["headline", "occupation", "subTitle", "subtitle", "currentPosition", "current position", "jobTitle", "job title"]) ||
    deepText(rawProfile, ["headline", "occupation", "subTitle", "subtitle", "currentPosition", "current position", "jobTitle", "job title"])
  );
}

function photoFromRaw(rawProfile: unknown) {
  return deepText(rawProfile, ["pictureUrl", "picture url", "profilePicture", "profile picture", "profilePicUrl", "profile pic url", "profileImage", "profile image", "image"]);
}

function aboutFromRaw(rawProfile: unknown) {
  return directText(rawProfile, ["about", "summary", "bio", "description"]) || deepText(rawProfile, ["about", "summary", "bio"]);
}

function profileIdFromRaw(rawProfile: unknown) {
  return directText(rawProfile, ["profileId", "profile id", "publicIdentifier", "public identifier", "linkedinId", "linkedin id", "id"]) || deepText(rawProfile, ["profileId", "profile id", "publicIdentifier", "public identifier"]);
}

export function normalizeLinkedInProfile(profile: LinkedInProfile | null): LinkedInProfile | null {
  if (!profile) return null;

  const rawProfile = parseRawProfileText(profile.rawProfileText);
  const rawExperience = firstArrayDeep(rawProfile, ["positions", "positionHistory", "position history", "experience", "experiences", "workExperience", "work experience"]);
  const rawEducation = firstArrayDeep(rawProfile, ["education", "educations", "schools"]);
  const rawSkills = firstArrayDeep(rawProfile, ["skills", "topSkills", "top skills"]);
  const rawName = nameFromRaw(rawProfile);
  const rawHeadline = headlineFromRaw(rawProfile);
  const rawPhoto = photoFromRaw(rawProfile);
  const rawAbout = aboutFromRaw(rawProfile);
  const rawLocation = directText(rawProfile, ["geoLocationName", "geo location name", "locationName", "location name", "location"]) || deepText(rawProfile, ["geoLocationName", "geo location name", "locationName", "location name", "location"]);
  const rawCountry = directText(rawProfile, ["geoCountryName", "geo country name", "countryName", "country name", "country", "countryCode", "country code"]) || deepText(rawProfile, ["geoCountryName", "geo country name", "countryName", "country name", "country", "countryCode", "country code"]);
  const rawIndustry = directText(rawProfile, ["industryName", "industry name", "industry", "industryLabel", "industry label"]) || deepText(rawProfile, ["industryName", "industry name", "industry", "industryLabel", "industry label"]);
  const rawCurrentRole = directText(rawProfile, ["jobTitle", "job title", "currentRole", "current role", "currentPosition", "current position", "title"]) || deepText(rawProfile, ["jobTitle", "job title", "currentRole", "current role", "currentPosition", "current position", "title"]);
  const rawCurrentCompany = directText(rawProfile, ["companyName", "company name", "currentCompanyName", "current company name", "company"]);
  const rawLinkedInId = profileIdFromRaw(rawProfile);

  return {
    ...profile,
    linkedinId: profile.linkedinId || rawLinkedInId || "profile-user",
    name: isFallbackName(profile.name) ? rawName || profile.name || "LinkedIn Member" : profile.name,
    headline: isFallbackHeadline(profile.headline) ? rawHeadline || profile.headline : profile.headline,
    photo: profile.photo || rawPhoto,
    about: profile.about || rawAbout,
    experience:
      profile.experience?.length
        ? profile.experience
        : listText(rawExperience, ["title", "jobTitle", "companyName", "company", "locationName", "location", "timePeriod", "dateRange", "duration", "description", "summary"]),
    education: profile.education?.length ? profile.education : listText(rawEducation, ["schoolName", "school", "degreeName", "degree", "fieldOfStudy", "dateRange", "timePeriod"]),
    skills: profile.skills?.length ? profile.skills : listText(rawSkills, ["name", "title", "text", "skillName", "skill"]),
    location: profile.location || rawLocation,
    country: profile.country || rawCountry,
    city: profile.city || profile.location || rawLocation,
    industry: profile.industry || rawIndustry,
    currentRole: profile.currentRole || rawCurrentRole,
    currentCompany: profile.currentCompany || rawCurrentCompany
  };
}
