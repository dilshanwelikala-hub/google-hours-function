exports.handler = async (event) => {
  const placeId = event.queryStringParameters.placeId;

  if (!placeId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Missing placeId" })
    };
  }

  const url =
    "https://maps.googleapis.com/maps/api/place/details/json" +
    "?place_id=" + placeId +
    "&fields=business_status,opening_hours,special_opening_hours" +
    "&key=" + process.env.GOOGLE_API_KEY;

  try {
    const res = await fetch(url);
    const json = await res.json();
    const place = json.result || {};

    const businessStatus = place.business_status || "UNKNOWN";

    /* ---------- TEMP / PERM CLOSED ---------- */
    if (
      businessStatus === "TEMPORARILY_CLOSED" ||
      businessStatus === "PERMANENTLY_CLOSED"
    ) {
      return {
        statusCode: 200,
        headers: {
          "Cache-Control": "public, max-age=21600"
        },
        body: JSON.stringify({
          businessStatus,
          isOpenNow: null,
          weekdayHours: [],
          specialHours: [],
          message:
            businessStatus === "TEMPORARILY_CLOSED"
              ? "Temporarily closed"
              : "Permanently closed"
        })
      };
    }

    /* ---------- OPENING HOURS ---------- */
    const weekdayHours =
      place.opening_hours?.weekday_text || [];

    const isOpenNow =
      typeof place.opening_hours?.open_now === "boolean"
        ? place.opening_hours.open_now
        : null;

    /* ---------- SPECIAL HOURS (HOLIDAYS / OVERRIDES) ---------- */
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
        "Cache-Control": "public, max-age=21600"
      },
      body: JSON.stringify({
        businessStatus,
        isOpenNow,
        weekdayHours,
        specialHours,
        message: "OK"
      })
    };

  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
