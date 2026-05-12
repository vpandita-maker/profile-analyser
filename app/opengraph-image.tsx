import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "iHeartLinkedIn | Free LinkedIn profile review";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #001E3C 0%, #003A6E 50%, #0A66C2 100%)",
          padding: "60px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "32px" }}>
          <div style={{
            width: "56px", height: "56px", borderRadius: "12px",
            background: "#0A66C2", border: "2px solid rgba(255,255,255,0.3)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "28px"
          }}>
            📊
          </div>
          <span style={{ fontSize: "36px", fontWeight: "900", color: "#ffffff" }}>
            iHeartLinkedIn
          </span>
        </div>

        <h1 style={{
          fontSize: "56px", fontWeight: "900", color: "#ffffff",
          textAlign: "center", lineHeight: 1.1, margin: "0 0 24px 0"
        }}>
          Get Recruited,{"\n"}Don't Just Apply.
        </h1>

        <p style={{
          fontSize: "24px", color: "rgba(255,255,255,0.75)",
          textAlign: "center", maxWidth: "800px", lineHeight: 1.5, margin: "0 0 40px 0"
        }}>
          Free AI-powered LinkedIn profile review tailored to your target role, industry, and dream company.
        </p>

        <div style={{
          background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)",
          borderRadius: "999px", padding: "12px 32px",
          fontSize: "20px", fontWeight: "700", color: "#ffffff"
        }}>
          iheartlinkedin.vercel.app
        </div>
      </div>
    ),
    { ...size }
  );
}
