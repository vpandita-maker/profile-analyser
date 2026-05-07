import type { DefaultSession } from "next-auth";
import type { LinkedInProfile } from "@/lib/types";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      linkedinProfile?: LinkedInProfile;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    linkedinId?: string;
    linkedinProfile?: LinkedInProfile;
  }
}
