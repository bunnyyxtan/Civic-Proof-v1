// app/api/voice/transcribe/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getVoiceClient } from "@/src/lib/ai/voiceClient";
import { shouldUseGemini, getGeminiApiKey, getMultimodalModelName } from "@/src/lib/ai/modelConfig";
import { Type } from "@google/genai";
// TODO(human): migrate voice after BTL audio model is granted.
import { AI_TIMEOUTS } from "@/src/lib/ai/aiTimeouts";
import { applyApiRateLimit } from "@/src/lib/infra/rateLimiter";

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  let failureReason = "";
  let failureCode = "";
  let mimeTypeUsed = "";
  let audioBytesApprox = 0;

  try {
    const rateLimit = await applyApiRateLimit(req, 20, 1);
    if (rateLimit) return NextResponse.json(rateLimit, { status: rateLimit.status });

    const body = await req.json();
    const { audioDataUrl, mimeType, voiceMode } = body;

    const rawMimeType = mimeType || "audio/webm";
    mimeTypeUsed = rawMimeType.split(';')[0];
    audioBytesApprox = audioDataUrl ? audioDataUrl.length : 0;

    const diagnostics = {
      hasGeminiKey: !!getGeminiApiKey(),
      mimeType: mimeTypeUsed,
      audioBytesApprox,
      provider: "gemini",
      model: getMultimodalModelName(),
      latencyMs: 0,
      timeoutUsed: AI_TIMEOUTS.transcription,
      fallbackUsed: false,
      failureReason: "",
      failureCode: ""
    };

    if (!audioDataUrl || audioBytesApprox < 200) {
      diagnostics.latencyMs = Date.now() - startTime;
      return NextResponse.json({
        ok: false,
        error: {
          code: "TRANSCRIPTION_ERROR",
          message: "No clear audio data provided."
        },
        ...(process.env.NODE_ENV === "development" ? { diagnostics } : {})
      }, { status: 400 });
    }

    if (!shouldUseGemini()) {
      diagnostics.provider = "none";
      diagnostics.hasGeminiKey = false;
      diagnostics.latencyMs = Date.now() - startTime;
      return NextResponse.json({
        ok: false,
        error: {
          code: "TRANSCRIPTION_UNAVAILABLE",
          message: "Voice transcription is unavailable right now. Type your note manually or retry."
        },
        ...(process.env.NODE_ENV === "development" ? { diagnostics } : {})
      }, { status: 503 });
    }

    const parts = audioDataUrl.split(",");
    const base64Data = parts[1] || parts[0];

    const ai = getVoiceClient();

    const systemInstruction = `You are an expert high-fidelity speech-to-text transcriber specializing in civic safety issues and local Indian contexts.
Your ONLY task is to transcribe the spoken words in the provided audio file.
Do NOT analyze the issue. Do NOT summarize. Do NOT generate a complaint or add any text not spoken in the audio.
Do NOT hallucinate or invent civic complaint text.

Dialect/Language Guidelines:
- If the selected voiceMode is 'hi-IN': Transcribe primarily Hindi speech. Preserve local place names. Use Devanagari when the user speaks Hindi unless the phrase is commonly written in English.
- If the selected voiceMode is 'en-IN': Transcribe Indian English. Preserve place names and civic terms.
- If the selected voiceMode is 'mixed-IN': Transcribe natural Hinglish/code-mixed speech. Preserve the user’s language choices. Do not translate everything into English unless the user spoke English.

Silence/Noise rule:
If the audio contains only silence, background noise, breathing, static, or no clear human speech, you must return an empty transcript "" and set emptySpeechDetected to true.`;

    const userPrompt = `Voice Mode: ${voiceMode || "mixed-IN"}. Transcribe this citizen voice note only. Do not summarize. Do not analyze the civic issue. Preserve the spoken language. If no clear speech exists, return empty transcript.`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), AI_TIMEOUTS.transcription);

    let response;
    try {
      response = await ai.models.generateContent({
        model: getMultimodalModelName(),
        contents: [
          {
            inlineData: {
              mimeType: mimeTypeUsed,
              data: base64Data
            }
          },
          {
            text: userPrompt
          }
        ],
        config: {
          systemInstruction: systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              transcript: {
                type: Type.STRING,
                description: "The transcription of the spoken words in the audio. Empty string if no human speech is detected.",
              },
              emptySpeechDetected: {
                type: Type.BOOLEAN,
                description: "True if the audio is silent, background noise, or no clear spoken words are present.",
              },
              languageMode: {
                type: Type.STRING,
                description: "The detected language mode.",
                enum: ["hi-IN", "en-IN", "mixed-IN", "unknown"]
              },
              confidence: {
                type: Type.STRING,
                description: "Confidence in the transcription.",
                enum: ["low", "medium", "high"]
              }
            },
            required: ["transcript", "emptySpeechDetected"]
          }
        }
      });
    } catch (err: any) {
      if (err.name === 'AbortError') {
        throw new Error("AI Timeout");
      }
      throw err;
    } finally {
      clearTimeout(timeoutId);
    }

    const responseText = response.text;
    if (!responseText) {
      throw new Error("Empty response from Gemini.");
    }

    const parsed = JSON.parse(responseText.trim());
    let transcript = (parsed.transcript || "").trim();
    let emptySpeechDetected = !!parsed.emptySpeechDetected || transcript === "";

    diagnostics.latencyMs = Date.now() - startTime;

    if (process.env.NODE_ENV === "development") {
      (NextResponse as any).diagnostics = diagnostics;
    }

    if (emptySpeechDetected) {
      return NextResponse.json({
        ok: true,
        data: {
          transcript: "",
          voiceMode: voiceMode,
          provider: "gemini",
          emptySpeechDetected: true,
          message: "No clear speech detected. Try again or type manually."
        },
        ...(process.env.NODE_ENV === "development" ? { diagnostics } : {})
      });
    }

    return NextResponse.json({
      ok: true,
      data: {
        transcript: transcript,
        voiceMode: voiceMode,
        provider: "gemini",
        emptySpeechDetected: false
      },
      ...(process.env.NODE_ENV === "development" ? { diagnostics } : {})
    });

  } catch (error: any) {
    console.error("Transcription endpoint error:", error);
    failureReason = error.message || "Unknown error";
    failureCode = "TRANSCRIPTION_ERROR";
    
    if (failureReason === "AI Timeout") {
      failureCode = "AI_TIMEOUT";
      failureReason = "Transcription took too long.";
    }

    const diagnostics = {
      hasGeminiKey: !!getGeminiApiKey(),
      mimeType: mimeTypeUsed,
      audioBytesApprox,
      provider: "gemini",
      model: getMultimodalModelName(),
      latencyMs: Date.now() - startTime,
      timeoutUsed: AI_TIMEOUTS.transcription,
      fallbackUsed: true,
      failureReason,
      failureCode
    };

    return NextResponse.json({
      ok: false,
      error: {
        code: failureCode,
        message: "Voice transcription is unavailable. Type your note manually or retry."
      },
      ...(process.env.NODE_ENV === "development" ? { diagnostics } : {})
    }, { status: 500 });
  }
}
