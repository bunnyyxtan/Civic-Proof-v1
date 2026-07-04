// src/lib/infra/deadLetter.ts

export interface DeadLetterRecord {
  route: string;
  operation: string;
  errorMessage: string;
  caseId?: string;
  payload?: any;
  retryable?: boolean;
}

/**
 * Persists failed API/engine actions to operations triage.
 * Redacts large media blobs.
 */
export async function logDeadLetter(record: DeadLetterRecord): Promise<boolean> {
  const timestamp = new Date().toISOString();
  
  // Safely scrub any heavy media strings
  let cleanPayload = undefined;
  if (record.payload) {
    try {
      cleanPayload = JSON.parse(JSON.stringify(record.payload, (key, value) => {
        if (typeof value === "string" && (value.startsWith("data:") || value.length > 5000)) {
          return `[REDACTED_LARGE_DATA_OR_MEDIA: length ${value.length}]`;
        }
        return value;
      }));
    } catch (e) {
      cleanPayload = "[PAYLOAD_SERIALIZATION_FAILED]";
    }
  }

  const data = {
    route: record.route,
    operation: record.operation,
    errorMessage: record.errorMessage,
    caseId: record.caseId,
    payload: cleanPayload,
    retryable: record.retryable ?? false,
    timestamp,
  };

  console.error(`[DEAD_LETTER_FALLBACK] Error in ${record.operation}:`, JSON.stringify(data));
  return true;
}
