import { BetaAnalyticsDataClient } from "@google-analytics/data";

export interface GA4Stats {
  visitorsToday: number;
  visitorsYesterday: number;
  sessionsToday: number;
  sessionsYesterday: number;
}

export async function getGA4Stats(): Promise<GA4Stats | null> {
  const propertyId = process.env.GA4_PROPERTY_ID;
  const credentialsJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;

  if (!propertyId || !credentialsJson) return null;

  try {
    const credentials = JSON.parse(credentialsJson);
    const client = new BetaAnalyticsDataClient({ credentials });

    const [response] = await client.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [
        { startDate: "today", endDate: "today" },
        { startDate: "yesterday", endDate: "yesterday" },
      ],
      metrics: [{ name: "activeUsers" }, { name: "sessions" }],
      dimensions: [{ name: "dateRange" }],
    });

    const rows = response.rows ?? [];
    const todayRow = rows.find((r) => r.dimensionValues?.[0]?.value === "date_range_0");
    const yestRow = rows.find((r) => r.dimensionValues?.[0]?.value === "date_range_1");

    return {
      visitorsToday: parseInt(todayRow?.metricValues?.[0]?.value ?? "0"),
      visitorsYesterday: parseInt(yestRow?.metricValues?.[0]?.value ?? "0"),
      sessionsToday: parseInt(todayRow?.metricValues?.[1]?.value ?? "0"),
      sessionsYesterday: parseInt(yestRow?.metricValues?.[1]?.value ?? "0"),
    };
  } catch {
    return null;
  }
}
