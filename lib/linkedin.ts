import type { LinkedInProfile } from "@/lib/types";

type LinkedInMeResponse = {
  sub?: string;
  name?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
  locale?: string;
  email?: string;
  email_verified?: boolean;
};

export async function fetchLinkedInProfile(accessToken: string): Promise<LinkedInProfile> {
  const response = await fetch("https://api.linkedin.com/v2/userinfo", {
    headers: {
      Authorization: `Bearer ${accessToken}`
    },
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`LinkedIn profile request failed with ${response.status}`);
  }

  const data = (await response.json()) as LinkedInMeResponse;
  const name = data.name || `${data.given_name || ""} ${data.family_name || ""}`.trim();

  return {
    linkedinId: data.sub || data.email || "linkedin-user",
    name: name || "LinkedIn Member",
    headline: "",
    photo: data.picture,
    email: data.email,
    about: "",
    experience: [],
    skills: []
  };
}
