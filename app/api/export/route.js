import { NextResponse } from "next/server";
import { spawn } from "child_process";
import fs from "fs/promises";
import path from "path";
import os from "os";
import crypto from "crypto";
import { getAuthenticatedUser } from "@/lib/authServer";
import { PRICING_RULES } from "@/config/pricing";
import { createJob, updateJobStatus, deductCreditsAtomically, refundCreditsAtomically } from "@/lib/db";

// In-memory file cache for processed exports (expires after 15 minutes)
const exportCache = new Map();

function cleanOldExports() {
  const now = Date.now();
  for (const [id, item] of exportCache.entries()) {
    if (now - item.timestamp > 15 * 60 * 1000) {
      exportCache.delete(id);
    }
  }
}

/**
 * Format seconds to SRT timestamp: 00:00:00,000
 */
function toSrtTime(sec) {
  const date = new Date(sec * 1000);
  const hh = String(Math.floor(sec / 3600)).padStart(2, '0');
  const mm = String(date.getUTCMinutes()).padStart(2, '0');
  const ss = String(date.getUTCSeconds()).padStart(2, '0');
  const ms = String(date.getUTCMilliseconds()).padStart(3, '0');
  return `${hh}:${mm}:${ss},${ms}`;
}

/**
 * Format seconds to VTT timestamp: 00:00:00.000
 */
function toVttTime(sec) {
  const srt = toSrtTime(sec);
  return srt.replace(',', '.');
}

/**
 * GET: Direct, native browser download handler with explicit Content-Disposition filename
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const requestedName = searchParams.get("name") || "telugu_reel_captioned.mp4";

    if (!id || !exportCache.has(id)) {
      return new NextResponse("Exported file expired or not found. Please render again.", {
        status: 404,
        headers: { "Content-Type": "text/plain; charset=utf-8" }
      });
    }

    const item = exportCache.get(id);
    const safeFilename = requestedName.endsWith(".mp4") ? requestedName : `${requestedName}.mp4`;

    return new NextResponse(item.buffer, {
      headers: {
        "Content-Type": "video/mp4",
        "Content-Disposition": `attachment; filename="${safeFilename}"; filename*=UTF-8''${encodeURIComponent(safeFilename)}`,
        "Content-Length": String(item.buffer.length),
        "Cache-Control": "no-cache, no-store, must-revalidate"
      }
    });
  } catch (err) {
    return new NextResponse("Download error: " + err.message, { status: 500 });
  }
}

/**
 * POST: Handles video transcoding via FFmpeg & Subtitle generation
 */
export async function POST(request) {
  try {
    const contentType = request.headers.get("content-type") || "";

    // 1. Video Transcode (Browser recorded frames & audio -> Genuine H.264/AAC MP4)
    if (contentType.includes("multipart/form-data")) {
      const { authenticated, user } = getAuthenticatedUser(request);
      if (!authenticated || !user) {
        return NextResponse.json(
          { ok: false, error: "Please sign in to export captioned videos.", code: "AUTH_REQUIRED" },
          { status: 401 }
        );
      }

      const cost = PRICING_RULES.calculateExportCost();
      let jobId = null;
      let deduction = null;
      try {
        jobId = createJob({
          userId: user.id,
          jobType: "export",
          creditsCost: cost
        });
        deduction = deductCreditsAtomically(user.id, cost, "job", jobId);
      } catch (creditErr) {
        return NextResponse.json(
          {
            ok: false,
            error: creditErr.message || "Insufficient credits",
            code: "INSUFFICIENT_CREDITS",
            cost,
            currentBalance: user.credits_balance
          },
          { status: 402 }
        );
      }

      try {
        const formData = await request.formData();
        const videoFile = formData.get("video") || formData.get("file");
        const filename = formData.get("filename") || "telugu_reel";

        if (!videoFile) {
          throw new Error("No video provided for export");
        }

        const buffer = Buffer.from(await videoFile.arrayBuffer());
        const tempId = crypto.randomBytes(8).toString("hex");
        const inputExt = videoFile.name?.endsWith(".mp4") ? ".mp4" : ".webm";
        const inputPath = path.join(os.tmpdir(), `tc_input_${tempId}${inputExt}`);
        const outputPath = path.join(os.tmpdir(), `tc_output_${tempId}.mp4`);

        await fs.writeFile(inputPath, buffer);

        // Execute FFmpeg to create standard H.264 (yuv420p) + AAC (192k) MP4 with faststart
        await new Promise((resolve, reject) => {
          const ffmpegArgs = [
            "-y",
            "-i", inputPath,
            "-c:v", "libx264",
            "-pix_fmt", "yuv420p",
            "-preset", "ultrafast",
            "-crf", "22",
            "-c:a", "aac",
            "-b:a", "192k",
            "-movflags", "+faststart",
            outputPath
          ];

          const proc = spawn("ffmpeg", ffmpegArgs);
          let stderr = "";
          proc.stderr.on("data", chunk => {
            stderr += chunk.toString();
          });

          proc.on("close", code => {
            if (code === 0) {
              resolve();
            } else {
              console.error("FFmpeg transcode error details:", stderr);
              reject(new Error(`FFmpeg exited with code ${code}`));
            }
          });

          proc.on("error", err => {
            reject(err);
          });
        });

        const mp4Buffer = await fs.readFile(outputPath);

        // Clean up temporary files
        await fs.unlink(inputPath).catch(() => {});
        await fs.unlink(outputPath).catch(() => {});

        const safeBaseName = String(filename).trim().replace(/[^a-zA-Z0-9_-]/g, "_") || "telugu_reel";
        const safeFilename = `${safeBaseName}_captioned.mp4`;

        const fileId = crypto.randomBytes(12).toString("hex");
        cleanOldExports();
        exportCache.set(fileId, {
          buffer: mp4Buffer,
          filename: safeFilename,
          mime: "video/mp4",
          timestamp: Date.now()
        });

        updateJobStatus(jobId, "completed");

        return NextResponse.json({
          ok: true,
          fileId,
          filename: safeFilename,
          downloadUrl: `/api/export?id=${fileId}&name=${encodeURIComponent(safeFilename)}`,
          creditsUsed: cost,
          creditsRemaining: deduction.newBalance
        });
      } catch (err) {
        console.warn("Video export failed, refunding credits:", err.message);
        refundCreditsAtomically(user.id, cost, "refund", jobId);
        updateJobStatus(jobId, "failed", err.message);
        return NextResponse.json(
          { ok: false, error: err.message || "Video export transcode failed. Credits refunded." },
          { status: 500 }
        );
      }
    }

    // 2. Handle Subtitle Text Export (SRT / VTT)
    const { segments, format, scriptMode, filename: subFilename } = await request.json();

    if (!segments || !Array.isArray(segments)) {
      return NextResponse.json({ ok: false, error: "Missing segments" }, { status: 400 });
    }

    const safeSubBase = String(subFilename || "telugu_reel").trim().replace(/[^a-zA-Z0-9_-]/g, "_");

    if (format === "srt") {
      let srtContent = "";
      segments.forEach((seg, i) => {
        const text = scriptMode === "romanized" && seg.romanizedText ? seg.romanizedText : seg.text;
        srtContent += `${i + 1}\n`;
        srtContent += `${toSrtTime(seg.start)} --> ${toSrtTime(seg.end)}\n`;
        srtContent += `${text}\n\n`;
      });

      const outName = `${safeSubBase}_subtitles.srt`;
      return new NextResponse(srtContent, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Content-Disposition": `attachment; filename="${outName}"; filename*=UTF-8''${encodeURIComponent(outName)}`
        }
      });
    }

    if (format === "vtt") {
      let vttContent = "WEBVTT\n\n";
      segments.forEach((seg, i) => {
        const text = scriptMode === "romanized" && seg.romanizedText ? seg.romanizedText : seg.text;
        vttContent += `${toVttTime(seg.start)} --> ${toVttTime(seg.end)}\n`;
        vttContent += `${text}\n\n`;
      });

      const outName = `${safeSubBase}_subtitles.vtt`;
      return new NextResponse(vttContent, {
        headers: {
          "Content-Type": "text/vtt; charset=utf-8",
          "Content-Disposition": `attachment; filename="${outName}"; filename*=UTF-8''${encodeURIComponent(outName)}`
        }
      });
    }

    return NextResponse.json({
      ok: true,
      message: "Export configuration valid"
    });
  } catch (err) {
    console.error("Export API error:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
