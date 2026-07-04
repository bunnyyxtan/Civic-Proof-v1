import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCaseRepository } from "@/src/lib/repositories/repositoryFactory";
import { verifyCitizenAuth } from "@/src/lib/auth/verifyAuth";

const EvidenceSchema = z.object({
  imageUrl: z.string().url().optional(),
  caption: z.string().optional(),
  type: z.literal("photo"),
  citizenUid: z.string().optional()
});

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await req.json();
    const parsed = EvidenceSchema.parse(body);

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
      id: `EV-EVD-${Date.now()}`,
      timestamp: new Date().toISOString(),
      label: "Evidence Added",
      description: `A citizen uploaded additional photo evidence to strengthen the case file.`,
      type: "evidence_added",
      actor: "citizen" as const
    };

    let updatedCase = currentCase;

    if (uid === currentCase.createdByUid) {
      updatedCase = await repo.appendTimelineEvent(id, timelineEvent);
    } else {
      const corroboration = {
        id: `CORR-${Date.now()}`,
        reportedAt: new Date().toISOString(),
        citizenNote: parsed.caption || "Verified same visual coordinates, still active.",
        contributorName: "Citizen Reporter",
        contributorUid: uid,
        imageDataUrl: parsed.imageUrl
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
    console.error("Error adding evidence:", error);
    return NextResponse.json(
      { ok: false, error: { code: "SERVER_ERROR", message: error.message } },
      { status: 500 }
    );
  }
}
