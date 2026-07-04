import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCaseRepository } from "@/src/lib/repositories/repositoryFactory";
import { verifyCitizenAuth } from "@/src/lib/auth/verifyAuth";

const ConfirmSchema = z.object({
  note: z.string().optional()
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
    const uid = auth?.uid || "anonymous";

    const confirmId = `ACT-${Date.now()}`;
    const newConfirmation = {
      id: confirmId,
      note: parsed.note || "Confirmed active today.",
      confirmedAt: new Date().toISOString(),
      confirmedByUid: uid
    };

    const timelineEvent = {
      id: `EV-ACT-${Date.now()}`,
      timestamp: new Date().toISOString(),
      title: "Active Status Confirmed",
      description: `A citizen verified that this issue is still present and unresolved as of today.`,
      type: "active_confirmation_added",
      actorName: "Citizen Reporter"
    };

    const corroboration = {
      id: `CORR-ACT-${Date.now()}`,
      filedAt: new Date().toISOString(),
      text: parsed.note || "Confirmed active today.",
      type: "timestamp",
      contributorName: "Citizen Reporter"
    };

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
      { ok: false, error: { code: "SERVER_ERROR", message: error.message } },
      { status: 500 }
    );
  }
}
