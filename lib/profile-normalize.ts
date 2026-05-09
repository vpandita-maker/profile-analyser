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

function titleCase(value: string) {
  return value
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function textValue(value: unknown): string {
  if (typeof value === "string") return cleanText(value);
  if (typeof value === "number") return String(value);
  if (Array.isArray(value)) return value.map(textValue).filter(Boolean).join(", ");
  if (isRecord(value) && "text" in value) return textValue(value.text);
  if (isRecord(value) && "name" in value) return textValue(value.name);
  if (isRecord(value) && "value" in value) return textValue(value.value);
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
  if (depth > 8 || !value) return "";

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
  if (depth > 8 || !value) return [];

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

export function isFallbackName(value?: string) {
  return !value || fallbackNames.has(value);
}

export function isFallbackHeadline(value?: string) {
  return !value || fallbackHeadlines.has(value);
}

function nameFromRaw(rawProfile: unknown) {
  const fullName =
    directText(rawProfile, [
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
    deepText(rawProfile, [
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
    ]);

  if (fullName) return fullName;

  const firstName = deepText(rawProfile, ["firstName", "first name", "first_name", "givenName", "given name"]);
  const lastName = deepText(rawProfile, ["lastName", "last name", "last_name", "familyName", "family name"]);
  return [firstName, lastName].filter(Boolean).join(" ");
}

function headlineFromRaw(rawProfile: unknown) {
  return (
    directText(rawProfile, [
      "headline",
      "profileHeadline",
      "profile headline",
      "occupation",
      "subTitle",
      "subtitle",
      "primarySubtitle",
      "primary subtitle",
      "currentPosition",
      "current position",
      "currentJobTitle",
      "current job title",
      "currentRole",
      "current role",
      "position",
      "profileSubTitle",
      "profile sub title",
      "profileSubtitle",
      "profile subtitle",
      "tagline",
      "jobTitle",
      "job title",
      "profession"
    ]) ||
    deepText(rawProfile, [
      "headline",
      "profileHeadline",
      "profile headline",
      "occupation",
      "subTitle",
      "subtitle",
      "primarySubtitle",
      "primary subtitle",
      "currentPosition",
      "current position",
      "currentJobTitle",
      "current job title",
      "currentRole",
      "current role",
      "position",
      "profileSubTitle",
      "profile sub title",
      "profileSubtitle",
      "profile subtitle",
      "tagline",
      "jobTitle",
      "job title",
      "profession"
    ])
  );
}

function photoFromRaw(rawProfile: unknown) {
  return deepText(rawProfile, [
    "pictureUrl",
    "picture url",
    "profilePicture",
    "profile picture",
    "profilePictureUrl",
    "profile picture url",
    "profilePic",
    "profile pic",
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
}

function aboutFromRaw(rawProfile: unknown) {
  return directText(rawProfile, ["about", "aboutText", "about text", "summary", "bio", "biography", "description"]) || deepText(rawProfile, ["about", "aboutText", "about text", "summary", "bio", "biography"]);
}

function profileIdFromRaw(rawProfile: unknown) {
  return directText(rawProfile, ["profileId", "profile id", "publicIdentifier", "public identifier", "linkedinId", "linkedin id", "id"]) || deepText(rawProfile, ["profileId", "profile id", "publicIdentifier", "public identifier"]);
}

function slugFromProfileUrl(value?: string) {
  if (!value) return "";

  try {
    const url = new URL(value);
    const parts = url.pathname.split("/").filter(Boolean);
    const index = parts.findIndex((part) => part.toLowerCase() === "in");
    return index >= 0 ? parts[index + 1] || "" : "";
  } catch {
    const match = value.match(/linkedin\.com\/in\/([^/?#]+)/i);
    return match?.[1] || "";
  }
}

function nameFromIdentifier(identifier?: string) {
  if (!identifier) return "";

  const withoutSuffixes = identifier
    .replace(/\b(real|official|profile)\b/gi, "")
    .replace(/[0-9]+/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[^a-zA-Z]+/g, " ")
    .trim();

  return withoutSuffixes ? titleCase(withoutSuffixes) : "";
}

function identifierFromLinkedInId(linkedinId?: string) {
  if (!linkedinId) return "";
  if (/^https?:\/\//i.test(linkedinId)) return slugFromProfileUrl(linkedinId);
  if (linkedinId.startsWith("urn:")) return "";
  if (linkedinId === "profile-user") return "";
  return linkedinId;
}

function headlineFromAbout(about?: string) {
  if (!about) return "";

  const sentence = about.split(/[.!?]/).map(cleanText).find(Boolean);
  if (!sentence) return "";

  return sentence.length > 110 ? `${sentence.slice(0, 107).trim()}...` : sentence;
}

export function normalizeLinkedInProfile(profile: LinkedInProfile | null): LinkedInProfile | null {
  if (!profile) return null;

  const rawProfile = parseRawProfileText(profile.rawProfileText);
  const rawProfileUrl = directText(rawProfile, ["profileUrl", "profile url", "url", "linkedinUrl", "linkedin url"]) || profile.profileUrl;
  const rawExperience = firstArrayDeep(rawProfile, [
    "positions",
    "positionHistory",
    "position history",
    "experiences",
    "experience",
    "workExperience",
    "work experience",
    "workHistory",
    "work history"
  ]);
  const rawEducation = firstArrayDeep(rawProfile, ["education", "educations", "educationHistory", "education history", "schools", "school"]);
  const rawSkills = firstArrayDeep(rawProfile, ["skills", "topSkills", "top skills", "skill", "skillSet", "skill set"]);
  const rawPublicIdentifier = directText(rawProfile, ["publicIdentifier", "public identifier", "profileSlug", "profile slug", "username"]);
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
  const profileSlug = slugFromProfileUrl(rawProfileUrl) || rawPublicIdentifier || identifierFromLinkedInId(profile.linkedinId);
  const derivedName = nameFromIdentifier(profileSlug);
  const about = profile.about || rawAbout;
  const headline = isFallbackHeadline(profile.headline) ? rawHeadline || headlineFromAbout(about) || profile.headline : profile.headline;

  return {
    ...profile,
    profileUrl: profile.profileUrl || rawProfileUrl,
    linkedinId: profile.linkedinId || rawLinkedInId || "profile-user",
    name: isFallbackName(profile.name) ? rawName || derivedName || profile.name || "LinkedIn Member" : profile.name,
    headline,
    photo: profile.photo || rawPhoto,
    about,
    experience:
      profile.experience?.length
        ? profile.experience
        : listText(rawExperience, ["title", "jobTitle", "companyName", "company", "locationName", "location", "timePeriod", "dateRange", "duration", "description", "summary"]),
    education: profile.education?.length
      ? profile.education
      : listText(rawEducation, ["schoolName", "school", "degreeName", "degree", "fieldOfStudy", "dateRange", "timePeriod", "description"]),
    skills: profile.skills?.length ? profile.skills : listText(rawSkills, ["name", "title", "text", "skillName", "skill"]),
    location: profile.location || rawLocation,
    country: profile.country || rawCountry,
    city: profile.city || profile.location || rawLocation,
    industry: profile.industry || rawIndustry,
    currentRole: profile.currentRole || rawCurrentRole,
    currentCompany: profile.currentCompany || rawCurrentCompany
  };
}
