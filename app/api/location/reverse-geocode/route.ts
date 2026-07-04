// app/api/location/reverse-geocode/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// Simple in-memory cache for Nominatim to prevent rate limits
const nominatimCache = new Map<string, any>();
let lastNominatimCall = 0;

const RequestSchema = z.object({
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  accuracyMeters: z.number().nullable().optional(),
  placeId: z.string().optional(),
});

function getConfidenceLabel(accuracy: number | null): "High confidence" | "Medium confidence" | "Approximate location" {
  if (accuracy === null || accuracy === undefined) return "Approximate location";
  if (accuracy <= 25) return "High confidence";
  if (accuracy <= 75) return "Medium confidence";
  return "Approximate location";
}

function createFallbackResponse(latitude: number | undefined, longitude: number | undefined, accuracyMeters: number | null | undefined) {
  return {
    ok: true,
    data: {
      formattedAddress: "",
      locality: null,
      sublocality: null,
      city: null,
      state: null,
      country: null,
      postalCode: null,
      shortLabel: "Location detected nearby",
      confidenceLabel: getConfidenceLabel(accuracyMeters || null),
      accuracyMeters: accuracyMeters || null,
      provider: "fallback" as const,
      rawCoordinates: { latitude: latitude || 0, longitude: longitude || 0 }
    }
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = RequestSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({
        ok: false,
        error: {
          code: "INVALID_REQUEST",
          message: "Provide either latitude and longitude, or placeId.",
        }
      }, { status: 400 });
    }

    const { latitude, longitude, accuracyMeters, placeId } = result.data;
    if (placeId === undefined && (latitude === undefined || longitude === undefined)) {
      return NextResponse.json({
        ok: false,
        error: {
          code: "INVALID_REQUEST",
          message: "Provide either latitude and longitude, or placeId.",
        }
      }, { status: 400 });
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.GOOGLE_API_KEY;

    if (!apiKey) {
      if (latitude !== undefined && longitude !== undefined) {
        // Fallback to Nominatim OSM with caching and rate limiting
        try {
          // Cache by rounding to ~11m (4 decimal places)
          const cacheKey = `${latitude.toFixed(4)},${longitude.toFixed(4)}`;
          const cached = nominatimCache.get(cacheKey);
          
          if (cached) {
            return NextResponse.json(cached);
          }
          
          // Rate limit check
          const now = Date.now();
          if (now - lastNominatimCall < 1000) {
            // Rate limited, return fallback
            return NextResponse.json(createFallbackResponse(latitude, longitude, accuracyMeters));
          }
          lastNominatimCall = now;

          const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`;
          const nomRes = await fetch(nominatimUrl, {
            headers: {
              "User-Agent": "CivicProof/1.0"
            }
          });
          if (nomRes.ok) {
            const nomData = await nomRes.json();
            if (nomData && nomData.address) {
              const addr = nomData.address;
              const formattedAddress = nomData.display_name || "";
              const sublocality = addr.suburb || addr.neighbourhood || addr.residential || null;
              const locality = addr.city || addr.town || addr.village || null;
              const city = addr.city || addr.town || addr.village || addr.county || null;
              const state = addr.state || null;
              const country = addr.country || null;
              const postalCode = addr.postcode || null;
              
              let shortLabel = "Location detected nearby";
              if (sublocality && city) {
                shortLabel = `${sublocality}, ${city}`;
              } else if (sublocality && state) {
                shortLabel = `${sublocality}, ${state}`;
              } else if (city && state) {
                shortLabel = `${city}, ${state}`;
              } else if (locality) {
                shortLabel = locality;
              } else if (city) {
                shortLabel = city;
              } else if (state) {
                shortLabel = state;
              } else if (formattedAddress) {
                const parts = formattedAddress.split(",");
                if (parts.length >= 2) {
                  shortLabel = `${parts[0].trim()}, ${parts[1].trim()}`;
                } else {
                  shortLabel = formattedAddress;
                }
              }
              
              const responseData = {
                ok: true,
                data: {
                  formattedAddress,
                  locality,
                  sublocality,
                  city,
                  state,
                  country,
                  postalCode,
                  shortLabel,
                  confidenceLabel: getConfidenceLabel(accuracyMeters || null),
                  accuracyMeters: accuracyMeters || null,
                  provider: "nominatim_osm" as const,
                  rawCoordinates: { latitude, longitude }
                }
              };
              
              // Store in cache
              nominatimCache.set(cacheKey, responseData);
              return NextResponse.json(responseData);
            }
          }
        } catch (e) {
          console.error("Nominatim fallback failed:", e);
        }
      }

      // Graceful fallback when API key is not configured and nominatim fails/not possible
      return NextResponse.json(createFallbackResponse(latitude, longitude, accuracyMeters));
    }

    // Call real Google Geocoding API server-side
    let url = "";
    if (placeId) {
      url = `https://maps.googleapis.com/maps/api/geocode/json?place_id=${encodeURIComponent(placeId)}&key=${encodeURIComponent(apiKey)}`;
    } else {
      url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${encodeURIComponent(apiKey)}`;
    }

    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Google API responded with status ${res.status}`);
    }

    const data = await res.json();
    if (data.status !== "OK" || !data.results || data.results.length === 0) {
      // Graceful fallback when geocoding fails or returns zero results
      return NextResponse.json({
        ok: true,
        data: {
          formattedAddress: "",
          locality: null,
          sublocality: null,
          city: null,
          state: null,
          country: null,
          postalCode: null,
          shortLabel: "Location detected nearby",
          confidenceLabel: getConfidenceLabel(accuracyMeters || null),
          accuracyMeters: accuracyMeters || null,
          provider: "fallback" as const,
          rawCoordinates: { latitude: latitude || 0, longitude: longitude || 0 }
        }
      });
    }

    // Parse components of the first result
    const bestResult = data.results[0];
    const components = bestResult.address_components || [];
    const formattedAddress = bestResult.formatted_address || "";
    const lat = bestResult.geometry?.location?.lat ?? latitude ?? 0;
    const lng = bestResult.geometry?.location?.lng ?? longitude ?? 0;

    let sublocality: string | null = null;
    let locality: string | null = null;
    let city: string | null = null;
    let state: string | null = null;
    let country: string | null = null;
    let postalCode: string | null = null;

    for (const comp of components) {
      const types = comp.types || [];
      if (types.includes("sublocality") || types.includes("sublocality_level_1") || types.includes("neighborhood")) {
        sublocality = comp.long_name;
      }
      if (types.includes("locality")) {
        locality = comp.long_name;
        city = comp.long_name;
      }
      if (!city && types.includes("administrative_area_level_2")) {
        city = comp.long_name; // Fallback city
      }
      if (types.includes("administrative_area_level_1")) {
        state = comp.long_name;
      }
      if (types.includes("country")) {
        country = comp.long_name;
      }
      if (types.includes("postal_code")) {
        postalCode = comp.long_name;
      }
    }

    // Construct a high-quality human readable shortLabel (e.g. "Raghubir Nagar, Delhi" or "Lucknow, Uttar Pradesh")
    let shortLabel = "Location detected nearby";
    if (sublocality && city) {
      shortLabel = `${sublocality}, ${city}`;
    } else if (sublocality && state) {
      shortLabel = `${sublocality}, ${state}`;
    } else if (city && state) {
      shortLabel = `${city}, ${state}`;
    } else if (locality) {
      shortLabel = locality;
    } else if (city) {
      shortLabel = city;
    } else if (state) {
      shortLabel = state;
    } else if (formattedAddress) {
      const parts = formattedAddress.split(",");
      if (parts.length >= 2) {
        shortLabel = `${parts[0].trim()}, ${parts[1].trim()}`;
      } else {
        shortLabel = formattedAddress;
      }
    }

    return NextResponse.json({
      ok: true,
      data: {
        formattedAddress,
        locality,
        sublocality,
        city,
        state,
        country,
        postalCode,
        shortLabel,
        confidenceLabel: getConfidenceLabel(accuracyMeters || null),
        accuracyMeters: accuracyMeters || null,
        provider: "google_geocoding" as const,
        rawCoordinates: { latitude: lat, longitude: lng }
      }
    });

  } catch (err: any) {
    console.error("Reverse geocoding error:", err);
    return NextResponse.json({
      ok: false,
      error: {
        code: "REVERSE_GEOCODING_FAILED",
        message: "Could not convert location into a readable address. Add a landmark manually."
      }
    }, { status: 500 });
  }
}
