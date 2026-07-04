// src/lib/location/locationFormatting.ts

export function getConfidenceLabel(accuracyMeters: number | null): "High confidence" | "Medium confidence" | "Approximate location" | "Location not detected" {
  if (accuracyMeters === null || accuracyMeters === undefined) return "Location not detected";
  if (accuracyMeters <= 25) return "High confidence";
  if (accuracyMeters <= 75) return "Medium confidence";
  return "Approximate location";
}

export function getConfidenceBody(accuracyMeters: number | null): string {
  if (accuracyMeters === null || accuracyMeters === undefined) {
    return "Type a landmark or address manually.";
  }
  if (accuracyMeters <= 25) {
    return "GPS is close. Add a landmark if needed.";
  }
  if (accuracyMeters <= 75) {
    return "Location is nearby. Add a landmark for better routing.";
  }
  return "GPS is approximate. Add a landmark before filing.";
}
