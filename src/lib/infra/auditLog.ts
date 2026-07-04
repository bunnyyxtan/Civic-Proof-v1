// src/lib/infra/auditLog.ts

export interface AuditEvent {
  eventType: string;
  caseId?: string;
  citizenUid?: string;
  route?: string;
  provider?: string;
  severity: "info" | "warning" | "error";
  metadata?: Record<string, any>;
}

/**
 * Logs an event to the console.
 */
export async function logAuditEvent(event: AuditEvent): Promise<boolean> {
  const timestamp = new Date().toISOString();
  
  const record = {
    ...event,
    timestamp,
  };

  console.log(`[AUDIT] [${event.severity.toUpperCase()}] ${event.eventType}:`, JSON.stringify(record));
  return true;
}
