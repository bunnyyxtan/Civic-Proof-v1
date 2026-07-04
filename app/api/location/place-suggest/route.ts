// app/api/location/place-suggest/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const RequestSchema = z.object({
  query: z.string(),
  nearLatitude: z.number().optional(),
  nearLongitude: z.number().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = RequestSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({
        ok: false,
        error: {
          code: "INVALID_REQUEST",
          message: "Query is required string.",
        }
      }, { status: 400 });
    }

    const { query, nearLatitude, nearLongitude } = result.data;
    const apiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.GOOGLE_API_KEY;

    if (!apiKey || !query.trim()) {
      return NextResponse.json({
        ok: true,
        data: { suggestions: [] }
      });
    }

    // Call real Google Places Autocomplete API server-side
    let url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(query)}&key=${encodeURIComponent(apiKey)}`;
    if (nearLatitude !== undefined && nearLongitude !== undefined) {
      url += `&location=${nearLatitude},${nearLongitude}&radius=10000`; // 10km bias
    }

    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Google Places Autocomplete API responded with status ${res.status}`);
    }

    const data = await res.json();
    if (data.status !== "OK" || !data.predictions) {
      return NextResponse.json({
        ok: true,
        data: { suggestions: [] }
      });
    }

    const suggestions = data.predictions.map((pred: any) => ({
      label: pred.description,
      placeId: pred.place_id,
      mainText: pred.structured_formatting?.main_text || "",
      secondaryText: pred.structured_formatting?.secondary_text || "",
    }));

    return NextResponse.json({
      ok: true,
      data: { suggestions }
    });

  } catch (err: any) {
    console.error("Place suggestion error:", err);
    return NextResponse.json({
      ok: true,
      data: { suggestions: [] }
    }); // Fail gracefully with empty suggestions
  }
}
