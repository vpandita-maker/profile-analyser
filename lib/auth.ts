import type { NextAuthOptions } from "next-auth";
import LinkedInProvider from "next-auth/providers/linkedin";
import { fetchLinkedInProfile } from "@/lib/linkedin";

export const authOptions: NextAuthOptions = {
  providers: [
    LinkedInProvider({
      clientId: process.env.LINKEDIN_CLIENT_ID || "",
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET || "",
      authorization: {
        params: {
          scope: "openid profile email"
        }
      },
      userinfo: "https://api.linkedin.com/v2/userinfo",
      profile(profile) {
        const oidcProfile = profile as unknown as {
          sub?: string;
          name?: string;
          given_name?: string;
          family_name?: string;
          picture?: string;
          email?: string;
        };

        return {
          id: oidcProfile.sub || oidcProfile.email || "linkedin-user",
          name: oidcProfile.name || `${oidcProfile.given_name || ""} ${oidcProfile.family_name || ""}`.trim() || "LinkedIn Member",
          email: oidcProfile.email,
          image: oidcProfile.picture
        };
      }
    })
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
