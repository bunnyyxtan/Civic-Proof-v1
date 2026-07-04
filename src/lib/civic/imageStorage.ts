// src/lib/civic/imageStorage.ts
// Shared server-side utility to save base64 and remote images as physical files

import fs from "fs";
import path from "path";
import { getSupabaseAdmin, isSupabaseConfigured } from "../supabase/supabaseClient";

interface ImagePayload {
  buffer: Buffer;
  mime: string;
  ext: string;
}

function extensionFromMime(mime: string): string {
  const ext = mime.split(";")[0].split("/")[1] || "jpg";
  return ext === "jpeg" ? "jpg" : ext;
}

async function getImagePayload(inputUrl: string): Promise<ImagePayload | null> {
  if (inputUrl.startsWith("data:image/")) {
    const parts = inputUrl.split(",");
    if (parts.length < 2) return null;

    const meta = parts[0];
    const base64Data = parts[1];
    const mime = meta.split(";")[0].split(":")[1] || "image/jpeg";
    return {
      buffer: Buffer.from(base64Data, "base64"),
      mime,
      ext: extensionFromMime(mime),
    };
  }

  if (inputUrl.startsWith("http")) {
    const res = await fetch(inputUrl);
    if (!res.ok) return null;

    const arrayBuffer = await res.arrayBuffer();
    const mime = res.headers.get("content-type") || "image/jpeg";
    return {
      buffer: Buffer.from(arrayBuffer),
      mime,
      ext: extensionFromMime(mime),
    };
  }

  return null;
}

async function saveImageToSupabase(inputUrl: string): Promise<string | null> {
  if (!isSupabaseConfigured()) return null;

  const client = getSupabaseAdmin();
  if (!client) return null;

  const payload = await getImagePayload(inputUrl);
  if (!payload) return null;

  const objectPath = `evidence-${Date.now()}-${Math.floor(Math.random() * 1000000)}.${payload.ext}`;
  const bucket = client.storage.from("evidence");
  const { error } = await bucket.upload(objectPath, payload.buffer, {
    contentType: payload.mime,
    upsert: true,
  });

  if (error) {
    throw new Error(error.message);
  }

  return bucket.getPublicUrl(objectPath).data.publicUrl;
}

/**
 * Saves a base64 data URL or a remote image URL to the active evidence storage.
 * Returns a Supabase public URL when configured, otherwise a relative local path.
 */
export async function saveImageLocally(inputUrl: string): Promise<string> {
  if (!inputUrl) return "";

  // If already saved as a relative upload path, return it directly
  if (inputUrl.startsWith("/uploads/")) {
    return inputUrl;
  }

  if (inputUrl.startsWith("data:image/") || inputUrl.startsWith("http")) {
    try {
      const supabaseUrl = await saveImageToSupabase(inputUrl);
      if (supabaseUrl) {
        return supabaseUrl;
      }
    } catch (err) {
      console.error("Failed to save image file to Supabase Storage:", err);
    }
  }

  const publicDir = path.join(process.cwd(), "public");
  const uploadsDir = path.join(publicDir, "uploads");

  try {
    // Ensure the public/uploads directory exists
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const payload = await getImagePayload(inputUrl);
    if (!payload) return inputUrl;

    const finalFilename = `evidence-${Date.now()}-${Math.floor(Math.random() * 1000000)}.${payload.ext}`;
    const filePath = path.join(uploadsDir, finalFilename);

    fs.writeFileSync(filePath, payload.buffer);
    return `/uploads/${finalFilename}`;
  } catch (err) {
    console.error("Failed to save image file locally:", err);
  }

  return inputUrl;
}
