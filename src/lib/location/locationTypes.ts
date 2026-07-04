// src/lib/location/locationTypes.ts

export interface LocationContext {
  latitude?: number;
  longitude?: number;
  accuracyMeters?: number;
  formattedAddress?: string;
  shortLabel?: string;
  locality?: string;
  city?: string;
  state?: string;
  country?: string;
  locationName: string; // User-facing, editable landmark/address
  locationSource: "gps" | "manual" | "gps_plus_manual" | "unknown";
  locationConfirmedByUser: boolean;
  geolocationCapturedAt?: string;
}

export interface ReverseGeocodeResponse {
  ok: boolean;
  data?: {
    formattedAddress: string;
    locality: string | null;
    sublocality: string | null;
    city: string | null;
    state: string | null;
    country: string | null;
    postalCode: string | null;
    shortLabel: string;
    confidenceLabel: "High confidence" | "Medium confidence" | "Approximate location";
    accuracyMeters: number | null;
    provider: "google_geocoding" | "fallback";
    rawCoordinates: {
      latitude: number;
      longitude: number;
    };
  };
  error?: {
    code: string;
    message: string;
  };
}

export interface PlaceSuggestionResponse {
  ok: boolean;
  data?: {
    suggestions: {
      label: string;
      placeId?: string;
      mainText?: string;
      secondaryText?: string;
    }[];
  };
}
