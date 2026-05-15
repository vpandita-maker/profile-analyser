import { BetaAnalyticsDataClient } from "@google-analytics/data";

export interface GA4Stats {
  uniqueViewersToday: number;
  uniqueViewersYesterday: number;
  sessionsToday: number;
  sessionsYesterday: number;
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

export async function getGA4Stats(): Promise<GA4Stats | null> {
  const propertyId = process.env.GA4_PROPERTY_ID;

  if (!propertyId) return null;

  try {
    const credentials = getGoogleCredentials();
    const client = new BetaAnalyticsDataClient({ credentials, fallback: true });

    const [todayResponse, yesterdayResponse] = await Promise.all([
      client.runReport({
        property: `properties/${propertyId}`,
        dateRanges: [{ startDate: "today", endDate: "today" }],
        metrics: [{ name: "activeUsers" }, { name: "sessions" }],
      }),
      client.runReport({
        property: `properties/${propertyId}`,
        dateRanges: [{ startDate: "yesterday", endDate: "yesterday" }],
        metrics: [{ name: "activeUsers" }, { name: "sessions" }],
      }),
    ]);

    const todayRow = todayResponse[0].rows?.[0];
    const yestRow = yesterdayResponse[0].rows?.[0];

    return {
      uniqueViewersToday: parseInt(todayRow?.metricValues?.[0]?.value ?? "0"),
      uniqueViewersYesterday: parseInt(yestRow?.metricValues?.[0]?.value ?? "0"),
      sessionsToday: parseInt(todayRow?.metricValues?.[1]?.value ?? "0"),
      sessionsYesterday: parseInt(yestRow?.metricValues?.[1]?.value ?? "0"),
    };
  } catch (error) {
    console.error("Failed to fetch GA4 dashboard stats", error);
    return null;
  }
}
