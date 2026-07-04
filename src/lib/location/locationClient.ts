// src/lib/location/locationClient.ts

import { ReverseGeocodeResponse, PlaceSuggestionResponse } from "./locationTypes";

export async function fetchReverseGeocode(
  latitude: number,
  longitude: number,
  accuracyMeters?: number
): Promise<ReverseGeocodeResponse> {
  try {
    const response = await fetch("/api/location/reverse-geocode", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ latitude, longitude, accuracyMeters }),
    });
    return await response.json();
  } catch (err: any) {
    return {
      ok: false,
      error: {
        code: "REVERSE_GEOCODING_FAILED",
        message: err.message || "Could not convert location into a readable address. Add a landmark manually.",
      },
    };
  }
}

export async function fetchPlaceSuggestions(
  query: string,
  nearLatitude?: number,
  nearLongitude?: number
): Promise<PlaceSuggestionResponse> {
  try {
    const response = await fetch("/api/location/place-suggest", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query, nearLatitude, nearLongitude }),
    });
    return await response.json();
  } catch (err: any) {
    return {
      ok: false,
    };
  }
}
