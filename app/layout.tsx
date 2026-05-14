import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "iHeartLinkedIn | Free LinkedIn Profile Review Tool",
  description: "Free AI-powered LinkedIn profile review. Get a personalized fix roadmap tailored to your role, industry & dream company. Get recruited, don't just apply.",
  openGraph: {
    title: "iHeartLinkedIn | Free LinkedIn Profile Review Tool",
    description: "Transform your LinkedIn profile into a recruiter magnet. Get a personalized roadmap to maximize visibility and inbound recruiter outreach.",
    url: "https://iheartlinkedin.app",
    siteName: "iHeartLinkedIn",
    type: "website",
    images: [{ url: "https://iheartlinkedin.app/opengraph-image", width: 1200, height: 630 }]
  },
  twitter: {
    card: "summary_large_image",
    title: "iHeartLinkedIn | Free LinkedIn Profile Review Tool",
    description: "Transform your LinkedIn profile into a recruiter magnet. Get a personalized roadmap to maximize visibility and inbound recruiter outreach.",
    images: ["https://iheartlinkedin.app/opengraph-image"]
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
