import Image from "next/image";
import { UserRound } from "lucide-react";
import type { LinkedInProfile } from "@/lib/types";
import { Card } from "@/components/ui/Card";

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

function textValue(value: unknown) {
  if (typeof value === "string") return cleanText(value);
  if (typeof value === "number") return String(value);
  if (isRecord(value) && "text" in value) return textValue(value.text);
  return "";
}

function directText(value: unknown, keys: string[]) {
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

function deepText(value: unknown, keys: string[], depth = 0): string {
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

function parseRawProfile(profile: LinkedInProfile | null) {
  if (!profile?.rawProfileText) return null;

  try {
    return JSON.parse(profile.rawProfileText) as unknown;
  } catch {
    return null;
  }
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

export function ProfileCard({ profile }: { profile: LinkedInProfile | null }) {
  const rawProfile = parseRawProfile(profile);
  const rawName = nameFromRaw(rawProfile);
  const rawHeadline = headlineFromRaw(rawProfile);
  const rawPhoto = photoFromRaw(rawProfile);
  const displayName = !profile?.name || fallbackNames.has(profile.name) ? rawName || profile?.name || "LinkedIn Member" : profile.name;
  const displayHeadline = !profile?.headline || fallbackHeadlines.has(profile.headline) ? rawHeadline || profile?.headline || "Profile headline ready for optimization" : profile.headline;
  const displayPhoto = profile?.photo || rawPhoto;

  return (
    <Card className="sticky top-0 z-10 flex items-center gap-3 rounded-none border-x-0 border-t-0 bg-white/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-full bg-slate-100 text-slate-500">
        {displayPhoto ? (
          <Image src={displayPhoto} alt={displayName} width={48} height={48} className="h-full w-full object-cover" />
        ) : (
          <UserRound className="h-6 w-6" />
        )}
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-bold text-slate-950">{displayName}</p>
        <p className="line-clamp-2 text-xs leading-5 text-slate-500">{displayHeadline}</p>
      </div>
    </Card>
  );
}
