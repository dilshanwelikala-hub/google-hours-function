export async function handler(event) {
  const placeId = event.queryStringParameters?.placeId;

  if (!placeId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Missing placeId" }),
    };
  }

  const API_KEY = process.env.GOOGLE_API_KEY;

  const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=business_status,opening_hours,special_opening_hours&key=${API_KEY}`;

  try {
    const res = await fetch(url);
    const data = await res.json();
    const place = data.result || {};

    const businessStatus = place.business_status || "UNKNOWN";

    // Safely get weekday hours (empty if missing)
    const hours = place.opening_hours?.weekday_text || [];

    // Optional: special hours (holidays / exceptions)
    const specialHours =
      place.special_opening_hours?.special_days?.map(day => ({
        date: day.date,
        isClosed: day.closed === true,
        openTime: day.open_time || null,
        closeTime: day.close_time || null
      })) || [];

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=86400", // 24h caching
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        hours,             // ✅ old format for your embeds
        businessStatus,    // "OPERATIONAL", "TEMPORARILY_CLOSED", etc.
        specialHours,      // optional
        message: businessStatus === "UNKNOWN" ? "Hours unavailable" : "OK"
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
}
