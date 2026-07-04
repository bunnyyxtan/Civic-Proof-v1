import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCaseRepository } from "@/src/lib/repositories/repositoryFactory";
import { verifyCitizenAuth } from "@/src/lib/auth/verifyAuth";

const ConfirmSchema = z.object({
  note: z.string().optional(),
  citizenUid: z.string().optional()
});

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await req.json();
    const parsed = ConfirmSchema.parse(body);

    const repo = getCaseRepository();
    const currentCase = await repo.getCaseById(id);
    
    if (!currentCase) {
      return NextResponse.json(
        { ok: false, error: { code: "NOT_FOUND", message: "Case not found" } },
        { status: 404 }
      );
    }

    const auth = await verifyCitizenAuth(req);
    const uid = auth?.uid || parsed.citizenUid || "anonymous";

    const timelineEvent = {
      id: `EV-ACT-${Date.now()}`,
      timestamp: new Date().toISOString(),
      label: "Active Status Confirmed",
      description: `A citizen verified that this issue is still present and unresolved as of today.`,
      type: "active_confirmation_added",
      actor: "citizen" as const
    };

    // A citizen cannot corroborate their own report.
    if (uid === currentCase.createdByUid) {
      return NextResponse.json(
        { ok: false, error: { code: "OWN_CASE", message: "You can't confirm your own report — corroboration must come from other citizens." } },
        { status: 400 }
      );
    }

    // Each citizen can confirm a case as active only once.
    const alreadyConfirmed = (currentCase.corroborations || []).some(
      (c: any) => c.contributorUid === uid
    );
    if (alreadyConfirmed) {
      return NextResponse.json(
        { ok: false, error: { code: "ALREADY_CONFIRMED", message: "You've already confirmed this case is active." } },
        { status: 409 }
      );
    }

    const corroboration = {
      id: `CORR-ACT-${Date.now()}`,
      reportedAt: new Date().toISOString(),
      citizenNote: parsed.note || "Confirmed active today.",
      contributorUid: uid,
      contributorName: "Verified Neighbor"
    };

    await repo.appendTimelineEvent(id, timelineEvent);
    const updatedCase = await repo.addCorroboration(id, corroboration as any);

    return NextResponse.json({
      ok: true,
      data: {
        case: updatedCase,
        event: timelineEvent
      }
    });
  } catch (error: any) {
    console.error("Error adding active confirmation:", error);
    return NextResponse.json(
      { ok: false, error: { code: "SERVER_ERROR", message: error?.message || "Server error" } },
      { status: 500 }
    );
  }
}
