import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCaseRepository } from "@/src/lib/repositories/repositoryFactory";
import { verifyCitizenAuth } from "@/src/lib/auth/verifyAuth";

const ImpactSchema = z.object({
  note: z.string(),
  chips: z.array(z.string()).optional().default([]),
  citizenUid: z.string().optional()
});

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await req.json();
    const parsed = ImpactSchema.parse(body);

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
      id: `EV-IMP-${Date.now()}`,
      timestamp: new Date().toISOString(),
      label: "Impact Note Added",
      description: `A citizen logged how this case is impacting the community: "${parsed.note.substring(0, 50)}${parsed.note.length > 50 ? '...' : ''}"`,
      type: "impact_note_added",
      actor: "citizen" as const
    };

    let updatedCase = currentCase;

    if (uid === currentCase.createdByUid) {
      updatedCase = await repo.appendTimelineEvent(id, timelineEvent);
    } else {
      const corroboration = {
        id: `CORR-IMP-${Date.now()}`,
        reportedAt: new Date().toISOString(),
        citizenNote: parsed.note,
        contributorUid: uid,
        contributorName: "Citizen Reporter"
      };

      await repo.appendTimelineEvent(id, timelineEvent);
      updatedCase = await repo.addCorroboration(id, corroboration as any);
    }

    return NextResponse.json({
      ok: true,
      data: {
        case: updatedCase,
        event: timelineEvent
      }
    });
  } catch (error: any) {
    console.error("Error adding impact note:", error);
    return NextResponse.json(
      { ok: false, error: { code: "SERVER_ERROR", message: error.message } },
      { status: 500 }
    );
  }
}
