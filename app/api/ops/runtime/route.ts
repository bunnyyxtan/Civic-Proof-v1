import { NextResponse } from "next/server";
import { getTextModelName, getMultimodalModelName, shouldUseAI } from "@/src/lib/ai/modelConfig";

export async function GET() {
  try {
    let gatewayHost = "";
    if (process.env.BTL_BASE_URL) {
      try {
        const url = new URL(process.env.BTL_BASE_URL);
        gatewayHost = url.host;
      } catch (e) {
        gatewayHost = process.env.BTL_BASE_URL;
      }
    }

    const aiConfigured = shouldUseAI();
    const textModel = getTextModelName();
    const visionModel = getMultimodalModelName();
    const voiceModel = process.env.VOICE_MODEL || "gemini (audio)";

    return NextResponse.json({
      ok: true,
      data: {
        provider: "BTL Runtime",
        gatewayHost,
        aiConfigured,
        textModel,
        visionModel,
        voiceModel,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
