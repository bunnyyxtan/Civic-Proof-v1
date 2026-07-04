// src/lib/civic/riskSignals.ts
// Deterministic civic risk signal extraction engine

/**
 * Extracts standard risk factors/harm signals from a citizen's note and location name.
 * This ensures that critical risk indicators are always captured regardless of AI output.
 */
export function extractCivicRiskSignals(text: string, locationName?: string): string[] {
  const combined = `${text || ""} ${locationName || ""}`.toLowerCase();
  const signals: string[] = [];

  // school, primary school, children, student, gate -> school children nearby
  if (
    combined.includes("school") ||
    combined.includes("primary school") ||
    combined.includes("children") ||
    combined.includes("student") ||
    combined.includes("gate")
  ) {
    signals.push("school children nearby");
  }

  // pedestrian, walk, footpath, sidewalk -> pedestrian fall risk
  if (
    combined.includes("pedestrian") ||
    combined.includes("walk") ||
    combined.includes("footpath") ||
    combined.includes("sidewalk")
  ) {
    signals.push("pedestrian fall risk");
  }

  // stagnant water, mosquito, breeding -> mosquito breeding risk
  if (
    combined.includes("stagnant water") ||
    combined.includes("stagnant") ||
    combined.includes("mosquito") ||
    combined.includes("breeding")
  ) {
    signals.push("mosquito breeding risk");
  }

  // contamination, dirty water, sewage, open drain -> contamination risk
  if (
    combined.includes("contamination") ||
    combined.includes("dirty water") ||
    combined.includes("sewage") ||
    combined.includes("open drain") ||
    combined.includes("drain")
  ) {
    signals.push("contamination risk");
  }

  // hospital -> hospital proximity
  if (combined.includes("hospital")) {
    signals.push("hospital proximity");
  }

  // junction, traffic, two-wheeler -> traffic/two-wheeler risk
  if (
    combined.includes("junction") ||
    combined.includes("traffic") ||
    combined.includes("two-wheeler") ||
    combined.includes("scooter") ||
    combined.includes("vehicle")
  ) {
    signals.push("traffic/two-wheeler risk");
  }

  // wheelchair, elderly -> vulnerable access risk
  if (
    combined.includes("wheelchair") ||
    combined.includes("elderly") ||
    combined.includes("vulnerable")
  ) {
    signals.push("vulnerable access risk");
  }

  return signals;
}
