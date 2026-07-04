// app/api/jobs/escalation-scan/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getCaseRepository } from "@/src/lib/repositories/repositoryFactory";
import { getSilenceClock } from "@/src/lib/civic/silenceClock";
import { logAuditEvent } from "@/src/lib/infra/auditLog";
import { TimelineEvent } from "@/src/lib/civic/types";

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate request using CRON_SECRET bearer token
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret) {
      return NextResponse.json({ success: false, error: "Unauthorized. Server configuration error." }, { status: 500 });
    }

    if (!authHeader || !authHeader.startsWith("Bearer ") || authHeader.substring(7) !== cronSecret) {
      await logAuditEvent({
        eventType: "escalation_scan_auth_failed",
        severity: "warning",
        route: "/api/jobs/escalation-scan",
        metadata: { hasHeader: !!authHeader }
      });
      return NextResponse.json({ success: false, error: "Unauthorized. Valid CRON_SECRET is required." }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    // Allow overriding referenceDate for deterministic historical testing
    const referenceDate = body.referenceDate || new Date().toISOString();

    const repository = getCaseRepository();
    const cases = await repository.listCases();

    let scanned = 0;
    let markedEscalationReady = 0;
    let skipped = 0;

    for (const issue of cases) {
      scanned++;
      
      // Skip resolved cases or those under review
      if (issue.status === "verified_resolved" || issue.status === "resolution_review") {
        skipped++;
        continue;
      }

      // Compute current Silence Clock
      const clock = getSilenceClock(issue, referenceDate);

      if (clock.isOverdue) {
        // Ensure idempotency: verify SLA breach has not already been appended
        const alreadyFlagged = issue.timeline.some(
          (event) => event.type === "sla_breach" || event.label?.includes("SLA Breach") || event.description?.includes("Silence Clock flagged")
        );

        if (!alreadyFlagged) {
          const newEvent: TimelineEvent = {
            id: `EV-BREACH-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
            type: "sla_breach",
            label: "Administrative SLA Breach Detected",
            description: `Official Silence Clock flagged this case as overdue. Days elapsed without action: ${clock.daysSilent} days. SLA Target: ${clock.slaDays} days.`,
            timestamp: new Date().toISOString(),
            actor: "system",
          };

          // Transition case to overdue status and append timeline audit event
          const patch = {
            status: "overdue" as const,
            timeline: [...issue.timeline, newEvent],
            updatedAt: new Date().toISOString(),
          };

          await repository.updateCase(issue.id, patch);
          markedEscalationReady++;

          await logAuditEvent({
            eventType: "sla_breach_detected",
            caseId: issue.id,
            severity: "warning",
            route: "/api/jobs/escalation-scan",
            metadata: { daysSilent: clock.daysSilent, slaDays: clock.slaDays }
          });
        } else {
          skipped++;
        }
      } else {
        skipped++;
      }
    }

    await logAuditEvent({
      eventType: "escalation_scan_completed",
      severity: "info",
      route: "/api/jobs/escalation-scan",
      metadata: { scanned, markedEscalationReady, skipped }
    });

    return NextResponse.json({
      ok: true,
      data: {
        scanned,
        markedEscalationReady,
        skipped,
        timestamp: new Date().toISOString(),
      },
    });

  } catch (err: any) {
    console.error("POST /api/jobs/escalation-scan failed:", err);
    return NextResponse.json({ success: false, error: err.message || "Escalation scan failed" }, { status: 500 });
  }
}
