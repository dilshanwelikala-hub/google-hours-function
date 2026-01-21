export async function handler(event) {
  const placeId = event.queryStringParameters?.placeId;

  if (!placeId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Missing placeId" }),
    };
  }

  const API_KEY = process.env.GOOGLE_API_KEY;

  const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=opening_hours,business_status,formatted_address,name,special_hours&key=${API_KEY}`;

  try {
    const res = await fetch(url);
    const data = await res.json();

    if (data.status !== "OK") {
      return {
        statusCode: 500,
        body: JSON.stringify(data),
      };
    }

    const openingHours = data.result.opening_hours?.weekday_text || [];
    const businessStatus = data.result.business_status || "UNKNOWN";
    const specialHours = data.result.special_hours || [];

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=86400",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        hours: openingHours,
        businessStatus,
        specialHours,
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
}
