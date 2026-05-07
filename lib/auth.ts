import type { NextAuthOptions } from "next-auth";
import { fetchLinkedInProfile } from "@/lib/linkedin";

type LinkedInOidcProfile = {
  sub?: string;
  name?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
  email?: string;
};

export const authOptions: NextAuthOptions = {
  providers: [
    {
      id: "linkedin",
      name: "LinkedIn",
      type: "oauth",
      clientId: process.env.LINKEDIN_CLIENT_ID || "",
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET || "",
      wellKnown: "https://www.linkedin.com/oauth/.well-known/openid-configuration",
      authorization: {
        params: {
          scope: "openid profile email"
        }
      },
      client: {
        token_endpoint_auth_method: "client_secret_post"
      },
      checks: ["state"],
      userinfo: {
        url: "https://api.linkedin.com/v2/userinfo"
      },
      profile(profile) {
        const oidcProfile = profile as LinkedInOidcProfile;

        return {
          id: oidcProfile.sub || oidcProfile.email || "linkedin-user",
          name: oidcProfile.name || `${oidcProfile.given_name || ""} ${oidcProfile.family_name || ""}`.trim() || "LinkedIn Member",
          email: oidcProfile.email,
          image: oidcProfile.picture
        };
      }
    }
  ],
  pages: {
    signIn: "/"
  },
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account?.access_token) {
        try {
          const linkedInProfile = await fetchLinkedInProfile(account.access_token);
          token.linkedinProfile = linkedInProfile;
          token.linkedinId = linkedInProfile.linkedinId;
          token.picture = linkedInProfile.photo || token.picture;
          token.name = linkedInProfile.name || token.name;
        } catch (error) {
          console.error("Unable to enrich LinkedIn token", error);
        }
      }

      return token;
    },
    async session({ session, token }) {
      session.user = {
        ...session.user,
        id: (token.linkedinId as string) || token.sub || "",
        linkedinProfile: token.linkedinProfile
      };
      return session;
    }
  },
  session: {
    strategy: "jwt"
  },
  secret: process.env.NEXTAUTH_SECRET
};
