import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";

const inter = Inter({ subsets: ["latin"] });
const gaMeasurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? "G-RJ8W3KVJSV";

export const metadata: Metadata = {
  title: "iHeartLinkedIn | Free LinkedIn Profile Review Tool",
  description: "Free AI-powered LinkedIn profile review. Get a personalized fix roadmap tailored to your role, industry & dream company. Get recruited, don't just apply.",
  openGraph: {
    title: "iHeartLinkedIn | Free LinkedIn Profile Review Tool",
    description: "Transform your LinkedIn profile into a recruiter magnet. Get a personalized roadmap to maximize visibility and inbound recruiter outreach.",
    url: "https://iheartlinkedin.app",
    siteName: "iHeartLinkedIn",
    type: "website",
    images: [{ url: "https://iheartlinkedin.app/og-image.png", width: 3600, height: 1890 }]
  },
  twitter: {
    card: "summary_large_image",
    title: "iHeartLinkedIn | Free LinkedIn Profile Review Tool",
    description: "Transform your LinkedIn profile into a recruiter magnet. Get a personalized roadmap to maximize visibility and inbound recruiter outreach.",
    images: ["https://iheartlinkedin.app/og-image.png"]
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
        {gaMeasurementId && (
          <>
            {/* eslint-disable-next-line @next/next/no-sync-scripts */}
            <script async src={`https://www.googletagmanager.com/gtag/js?id=${gaMeasurementId}`} />
            <script
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', '${gaMeasurementId}');
                `,
              }}
            />
          </>
        )}
      </head>
      <body className={inter.className}>
        <div className="phone-shell">
          <Providers>{children}</Providers>
        </div>
      </body>
    </html>
  );
}
