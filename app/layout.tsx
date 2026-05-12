import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "iHeartLinkedIn | Free LinkedIn profile review",
  description: "Transform your LinkedIn profile into a recruiter magnet with iHeartLinkedIn. Our data driven platform analyzes your profile against your target role, industry, and company to deliver a personalized roadmap for improvement. Stop applying to jobs and get discovered by recruiters actively seeking talent like you. Whether you're targeting tech roles at FAANG companies, finance positions at top banks, or consulting opportunities, iHeartLinkedIn aligns every section of your profile to maximize visibility and inbound outreach.",
  openGraph: {
    title: "iHeartLinkedIn | Free LinkedIn profile review",
    description: "Transform your LinkedIn profile into a recruiter magnet. Get a personalized roadmap to maximize visibility and inbound recruiter outreach.",
    url: "https://iheartlinkedin.vercel.app",
    siteName: "iHeartLinkedIn",
    type: "website",
    images: [{ url: "/opengraph-image", width: 1200, height: 630 }]
  },
  twitter: {
    card: "summary_large_image",
    title: "iHeartLinkedIn | Free LinkedIn profile review",
    description: "Transform your LinkedIn profile into a recruiter magnet. Get a personalized roadmap to maximize visibility and inbound recruiter outreach."
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#f8fafc"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* eslint-disable-next-line @next/next/no-sync-scripts */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-RJ8W3KVJSV" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-RJ8W3KVJSV');
            `,
          }}
        />
      </head>
      <body className={inter.className}>
        <div className="phone-shell">
          <Providers>{children}</Providers>
        </div>
      </body>
    </html>
  );
}
