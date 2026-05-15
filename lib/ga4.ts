import { BetaAnalyticsDataClient } from "@google-analytics/data";

export interface GA4Stats {
  uniqueViewersToday: number;
  uniqueViewersYesterday: number;
  sessionsToday: number;
  sessionsYesterday: number;
  topVisitorPlaces: Array<[string, number]>;
  topVisitorPlatforms: Array<[string, number]>;
}

function getGoogleCredentials() {
  const credentialsJson =
    process.env.GOOGLE_SERVICE_ACCOUNT_JSON ??
    (process.env.GOOGLE_SERVICE_ACCOUNT_JSON_BASE64
      ? Buffer.from(process.env.GOOGLE_SERVICE_ACCOUNT_JSON_BASE64, "base64").toString("utf8")
      : null);

  if (!credentialsJson) return undefined;

  const credentials = JSON.parse(credentialsJson) as { private_key?: string };

  if (credentials.private_key) {
    credentials.private_key = credentials.private_key.replace(/\\n/g, "\n");
  }

  return credentials;
}

function placeLabel(city?: string, country?: string) {
  const cleanCity = city && city !== "(not set)" ? city : "";
  const cleanCountry = country && country !== "(not set)" ? country : "";
  if (cleanCity && cleanCountry) return `${cleanCity}, ${cleanCountry}`;
  return cleanCity || cleanCountry || "Unknown";
}

function platformLabel(source?: string) {
  const value = source?.trim() || "Direct / Unknown";
  const normalized = value.toLowerCase();
  if (normalized === "(direct)" || normalized === "(not set)" || normalized === "direct") return "Direct / Unknown";
  if (normalized.includes("linkedin")) return "LinkedIn";
  if (normalized.includes("twitter") || normalized === "x" || normalized.includes("t.co")) return "X";
  if (normalized.includes("instagram")) return "Instagram";
  if (normalized.includes("facebook")) return "Facebook";
  if (normalized.includes("google")) return "Google";
  if (normalized.includes("bing")) return "Bing";
  if (normalized.includes("reddit")) return "Reddit";
  if (normalized.includes("youtube") || normalized.includes("youtu.be")) return "YouTube";
  if (normalized.includes("whatsapp")) return "WhatsApp";
  return value;
}

function aggregatePairs(pairs: Array<[string, number]>, limit = 5) {
  const counts: Record<string, number> = {};
  for (const [label, count] of pairs) {
    counts[label] = (counts[label] ?? 0) + count;
  }
  return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, limit);
}

export async function getGA4Stats(date = "today"): Promise<GA4Stats | null> {
  const propertyId = process.env.GA4_PROPERTY_ID;

  if (!propertyId) return null;

  try {
    const credentials = getGoogleCredentials();
    const client = new BetaAnalyticsDataClient({ credentials, fallback: true });

    const [todayResponse, yesterdayResponse, placesResponse, platformsResponse] = await Promise.all([
      client.runReport({
        property: `properties/${propertyId}`,
        dateRanges: [{ startDate: date, endDate: date }],
        metrics: [{ name: "activeUsers" }, { name: "sessions" }],
      }),
      client.runReport({
        property: `properties/${propertyId}`,
        dateRanges: [{ startDate: "yesterday", endDate: "yesterday" }],
        metrics: [{ name: "activeUsers" }, { name: "sessions" }],
      }),
      client.runReport({
        property: `properties/${propertyId}`,
        dateRanges: [{ startDate: date, endDate: date }],
        dimensions: [{ name: "city" }, { name: "country" }],
        metrics: [{ name: "activeUsers" }],
        limit: 5,
        orderBys: [{ metric: { metricName: "activeUsers" }, desc: true }],
      }).catch(() => null),
      client.runReport({
        property: `properties/${propertyId}`,
        dateRanges: [{ startDate: date, endDate: date }],
        dimensions: [{ name: "sessionSource" }],
        metrics: [{ name: "activeUsers" }],
        limit: 5,
        orderBys: [{ metric: { metricName: "activeUsers" }, desc: true }],
      }).catch(() => null),
    ]);

    const todayRow = todayResponse[0].rows?.[0];
    const yestRow = yesterdayResponse[0].rows?.[0];

    return {
      uniqueViewersToday: parseInt(todayRow?.metricValues?.[0]?.value ?? "0"),
      uniqueViewersYesterday: parseInt(yestRow?.metricValues?.[0]?.value ?? "0"),
      sessionsToday: parseInt(todayRow?.metricValues?.[1]?.value ?? "0"),
      sessionsYesterday: parseInt(yestRow?.metricValues?.[1]?.value ?? "0"),
      topVisitorPlaces: (placesResponse?.[0].rows ?? []).map((row) => [
        placeLabel(row.dimensionValues?.[0]?.value ?? undefined, row.dimensionValues?.[1]?.value ?? undefined),
        parseInt(row.metricValues?.[0]?.value ?? "0"),
      ]),
      topVisitorPlatforms: aggregatePairs((platformsResponse?.[0].rows ?? []).map((row) => [
        platformLabel(row.dimensionValues?.[0]?.value ?? undefined),
        parseInt(row.metricValues?.[0]?.value ?? "0"),
      ])),
    };
  } catch (error) {
    console.error("Failed to fetch GA4 dashboard stats", error);
    return null;
  }
}
