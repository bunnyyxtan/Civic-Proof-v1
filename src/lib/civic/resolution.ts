// src/lib/civic/resolution.ts
// Offline resolution verification engine

import { ResolutionVerification } from "./types";

export function buildMockResolutionVerification(
  originalDesc: string,
  resolutionPhotoUrl: string,
  citizenVerificationNote: string
): ResolutionVerification {
  const note = citizenVerificationNote.toLowerCase();
  
  const isFailure =
    note.includes("no") ||
    note.includes("not") ||
    note.includes("bad") ||
    note.includes("still") ||
    note.includes("half") ||
    note.includes("unresolved") ||
    note.includes("incomplete") ||
    note.includes("dirty") ||
    note.includes("terrible");

  if (isFailure) {
    return {
      beforeImageObservations: [
        "Original reported hazard is highly severe with significant environmental impact.",
        "Unresolved community indicators reported near pedestrian paths."
      ],
      afterImageObservations: [
        "Resolution photo reveals poor craftsmanship and remaining loose rubble on-site.",
        "Pavement is still damaged and water is pooling over the asphalt repair layers."
      ],
      repairLikely: false,
      confidence: 0.92,
      remainingConcerns: [
        "Surface flatness audit failed: high bump risk for two-wheeler transit.",
        "Silt accumulation has not been cleared from adjoining catch basins."
      ],
      recommendedStatus: "keep_open",
      forensicReasoning: "Forensic image analysis reveals remaining structural debris around the reported site. Citizen feedback confirms the asphalt patch was laid poorly and is already washing away under light rain runoff. Pedestrian walkway remains obstructed. Keeping case open."
    };
  }

  return {
    beforeImageObservations: [
      "Original report flagged deep structural damage and significant localized safety risks.",
      "High danger to vulnerable pedestrian groups noted."
    ],
    afterImageObservations: [
      "Resolution proof shows deep crater has been successfully filled and asphalt laid flat.",
      "Thorough cleanup completed: no debris or structural materials remaining on pavement."
    ],
    repairLikely: true,
    confidence: 0.98,
    remainingConcerns: [],
    recommendedStatus: "verified_resolved",
    forensicReasoning: "Visual inspection confirms potholes have been successfully filled and steam-rolled flat. Drainage clearance completed. Surface runoff is flowing correctly. Verified completed on-site by community physical audit. Case sealed."
  };
}
