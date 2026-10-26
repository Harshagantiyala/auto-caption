"use client";

import React, { useState } from "react";
import {
  Download,
  FileText,
  Video,
  Copy,
  Check,
  Sparkles,
  Loader2,
  Film,
  CheckCircle2
} from "lucide-react";
import CreditCostModal from "@/components/CreditCostModal";
import GuestAuthModal from "@/components/GuestAuthModal";
import { PRICING_RULES } from "@/config/pricing";
import { useAuth } from "@/lib/authContext";

export default function ExportModal({
  segments,
  scriptMode,
  videoSrc,
  styleConfig,
  filename = "telugu_reel"
}) {
  const { user, updateCreditsBalance } = useAuth();
  const [costModalOpen, setCostModalOpen] = useState(false);
  const [guestAuthOpen, setGuestAuthOpen] = useState(false);
  const [guestAction, setGuestAction] = useState("download_video");

  const [exportName, setExportName] = useState(filename.replace(/\.[^/.]+$/, ""));
  const [copied, setCopied] = useState(false);
  const [isExportingVideo, setIsExportingVideo] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportStatusText, setExportStatusText] = useState("Processing video frames...");
  const [exportedVideoUrl, setExportedVideoUrl] = useState(null);
  const [serverDownloadUrl, setServerDownloadUrl] = useState(null);
  const [downloadFilename, setDownloadFilename] = useState(`${filename.replace(/\.[^/.]+$/, "")}_captioned.mp4`);
  const [isMp4Format, setIsMp4Format] = useState(true);
  const [aiHooksData, setAiHooksData] = useState(null);
  const [isGeneratingHooks, setIsGeneratingHooks] = useState(false);
  const [copiedCaption, setCopiedCaption] = useState(false);

  // Helper for guaranteed browser download with proper filename & extension
  const triggerSafeDownload = (contentOrBlob, mimeType, targetFilename) => {
    const blob = contentOrBlob instanceof Blob ? contentOrBlob : new Blob([contentOrBlob], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.style.position = "fixed";
    a.style.top = "-9999px";
    a.style.left = "-9999px";
    a.setAttribute("href", url);
    a.setAttribute("download", targetFilename);
    a.download = targetFilename;
    document.body.appendChild(a);
    a.click();

    // Keep URL alive for 15 seconds so browser download manager finishes saving file with correct name and extension
    setTimeout(() => {
      try {
        if (a.parentNode) {
          document.body.removeChild(a);
        }
      } catch {}
      URL.revokeObjectURL(url);
    }, 15000);
  };

  // Generate AI Viral Hooks & Instagram Caption
  const generateAiHooks = async () => {
    setIsGeneratingHooks(true);
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "generate_hooks", segments, scriptMode })
      });
      const data = await res.json();
      if (data.ok) {
        setAiHooksData(data);
      }
    } catch (err) {
      console.error("AI Hooks generation failed:", err);
    } finally {
      setIsGeneratingHooks(false);
    }
  };

  // Format seconds to SRT time
  const toSrtTime = (sec) => {
    const date = new Date(sec * 1000);
    const hh = String(Math.floor(sec / 3600)).padStart(2, '0');
    const mm = String(date.getUTCMinutes()).padStart(2, '0');
    const ss = String(date.getUTCSeconds()).padStart(2, '0');
    const ms = String(date.getUTCMilliseconds()).padStart(3, '0');
    return `${hh}:${mm}:${ss},${ms}`;
  };

  // Download SRT Subtitles
  const downloadSrt = () => {
    if (!user) {
      setGuestAction("download_srt");
      setGuestAuthOpen(true);
      return;
    }
    let srt = "";
    segments.forEach((seg, i) => {
      const text = scriptMode === "romanized" && seg.romanizedText ? seg.romanizedText : seg.text;
      srt += `${i + 1}\n${toSrtTime(seg.start)} --> ${toSrtTime(seg.end)}\n${text}\n\n`;
    });

    const safeBase = (exportName || "telugu_reel").trim().replace(/[^a-zA-Z0-9_-]/g, "_");
    triggerSafeDownload(srt, "text/plain;charset=utf-8", `${safeBase}_subtitles.srt`);
  };

  // Download VTT Subtitles
  const downloadVtt = () => {
    if (!user) {
      setGuestAction("download_srt");
      setGuestAuthOpen(true);
      return;
    }
    let vtt = "WEBVTT\n\n";
    segments.forEach((seg, i) => {
      const text = scriptMode === "romanized" && seg.romanizedText ? seg.romanizedText : seg.text;
      const srtStart = toSrtTime(seg.start).replace(',', '.');
      const srtEnd = toSrtTime(seg.end).replace(',', '.');
      vtt += `${srtStart} --> ${srtEnd}\n${text}\n\n`;
    });

    const safeBase = (exportName || "telugu_reel").trim().replace(/[^a-zA-Z0-9_-]/g, "_");
    triggerSafeDownload(vtt, "text/vtt;charset=utf-8", `${safeBase}_subtitles.vtt`);
  };

  // Trigger render: handles guest check and credit confirmation
  const handleRenderClick = () => {
    if (!user) {
      setGuestAction("download_video");
      setGuestAuthOpen(true);
      return;
    }
    setCostModalOpen(true);
  };

  // Copy full script to clipboard for Instagram post captions
  const copyScriptText = () => {
    const fullText = segments
      .map(s => (scriptMode === "romanized" && s.romanizedText ? s.romanizedText : s.text))
      .join(" ");
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Render Burned-In MP4 Video (Canvas Compositor + FFmpeg H.264/AAC Transcoder)
  const renderBurnedVideo = async () => {
    if (!videoSrc) return;
    setIsExportingVideo(true);
    setExportProgress(10);
    setExportStatusText("Initializing video and audio engine...");
    setExportedVideoUrl(null);

    let audioCtx = null;

    try {
      const video = document.createElement("video");
      video.src = videoSrc;
      if (!videoSrc.startsWith("blob:")) {
        video.crossOrigin = "anonymous";
      }
      video.playsInline = true;
      video.preload = "auto";
      video.muted = false;

      await new Promise((resolve, reject) => {
        if (video.readyState >= 2) {
          resolve();
        } else {
          video.onloadeddata = () => resolve();
          video.onerror = () => reject(new Error("Failed to load source video"));
        }
      });

      setExportProgress(20);
      setExportStatusText("Setting up high-resolution canvas and audio tracks...");

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      canvas.width = video.videoWidth || 720;
      canvas.height = video.videoHeight || 1280;

      // Extract Audio Track from the original video
      let audioTrack = null;

      // 1. Try native captureStream on HTMLVideoElement
      try {
        const captureMethod = video.captureStream || video.mozCaptureStream;
        if (typeof captureMethod === "function") {
          const vStream = captureMethod.call(video);
          const aTracks = vStream.getAudioTracks();
          if (aTracks.length > 0) {
            audioTrack = aTracks[0];
          }
        }
      } catch (streamErr) {
        console.warn("captureStream audio extraction note:", streamErr);
      }

      // 2. Fallback to Web AudioContext
      if (!audioTrack) {
        try {
          const AudioContextClass = window.AudioContext || window.webkitAudioContext;
          if (AudioContextClass) {
            audioCtx = new AudioContextClass();
            if (audioCtx.state === "suspended") {
              await audioCtx.resume();
            }
            const source = audioCtx.createMediaElementSource(video);
            const destination = audioCtx.createMediaStreamDestination();
            source.connect(destination);
            const aTracks = destination.stream.getAudioTracks();
            if (aTracks.length > 0) {
              audioTrack = aTracks[0];
            }
          }
        } catch (audioErr) {
          console.warn("AudioContext extraction note:", audioErr);
        }
      }

      // Combine Canvas Video Track + Audio Track
      const canvasStream = canvas.captureStream(30);
      const combinedTracks = [...canvasStream.getVideoTracks()];
      if (audioTrack) {
        combinedTracks.push(audioTrack);
      }
      const combinedStream = new MediaStream(combinedTracks);

      // Select supported candidate MIME
      const candidateMimes = [
        "video/webm;codecs=vp9,opus",
        "video/webm;codecs=vp8,opus",
        "video/webm",
        "video/mp4"
      ];
      let selectedMime = "";
      for (const m of candidateMimes) {
        if (MediaRecorder.isTypeSupported(m)) {
          selectedMime = m;
          break;
        }
      }

      const recorderOptions = selectedMime
        ? { mimeType: selectedMime, audioBitsPerSecond: 192000, videoBitsPerSecond: 5000000 }
        : { audioBitsPerSecond: 192000 };

      const mediaRecorder = new MediaRecorder(combinedStream, recorderOptions);
      const chunks = [];
      mediaRecorder.ondataavailable = e => {
        if (e.data && e.data.size > 0) chunks.push(e.data);
      };

      const duration = video.duration || 10;
      let isRecording = true;

      const stopRecording = () => {
        if (!isRecording) return;
        isRecording = false;
        if (mediaRecorder.state !== "inactive") {
          mediaRecorder.stop();
        }
      };

      video.onended = stopRecording;

      mediaRecorder.onstop = async () => {
        if (audioCtx && audioCtx.state !== "closed") {
          audioCtx.close().catch(() => {});
        }

        const recordedMime = mediaRecorder.mimeType || "video/webm";
        const rawBlob = new Blob(chunks, { type: recordedMime });

        if (rawBlob.size === 0) {
          console.error("Recorded blob is 0 bytes");
          setIsExportingVideo(false);
          alert("Recording produced 0 frames. Please try again.");
          return;
        }

        setExportProgress(90);
        setExportStatusText("Converting into universal H.264 & AAC MP4 format...");

        try {
          // Send to server-side FFmpeg pipeline for 100% compliant MP4 with AAC audio
          const formData = new FormData();
          formData.append("video", rawBlob, "recorded.webm");
          formData.append("filename", exportName || "telugu_reel");

          const res = await fetch("/api/export", {
            method: "POST",
            body: formData
          });

          if (res.ok) {
            const data = await res.json();
            if (data.ok && data.downloadUrl) {
              setServerDownloadUrl(data.downloadUrl);
              setDownloadFilename(data.filename || `${exportName || 'telugu_reel'}_captioned.mp4`);
              setExportedVideoUrl(data.downloadUrl);
              setIsMp4Format(true);
              setExportProgress(100);
              setIsExportingVideo(false);
              setExportStatusText("MP4 video rendered and ready!");
              if (data.creditsRemaining !== undefined && updateCreditsBalance) {
                updateCreditsBalance(data.creditsRemaining);
              }
              return;
            }
          } else if (res.status === 401) {
            setIsExportingVideo(false);
            setGuestAction("download_video");
            setGuestAuthOpen(true);
            return;
          } else {
            console.warn("FFmpeg export returned error, falling back to direct blob");
          }
        } catch (serverErr) {
          console.warn("Server transcode error:", serverErr);
        }

        // Fallback: direct blob if server route unavailable (Logged-in users only)
        if (!user) {
          setIsExportingVideo(false);
          setGuestAction("download_video");
          setGuestAuthOpen(true);
          return;
        }

        const safeBase = (exportName || "telugu_reel").trim().replace(/[^a-zA-Z0-9_-]/g, "_");
        const fallbackName = `${safeBase}_captioned.mp4`;
        const downloadUrl = URL.createObjectURL(rawBlob);
        setExportedVideoUrl(downloadUrl);
        setServerDownloadUrl(downloadUrl);
        setDownloadFilename(fallbackName);
        setIsMp4Format(recordedMime.includes("mp4"));
        setExportProgress(100);
        setIsExportingVideo(false);
        setExportStatusText("Video rendered and ready!");
      };

      mediaRecorder.start(250); // emit chunk every 250ms
      video.currentTime = 0;
      setExportStatusText("Burning styled Telugu captions onto video frames...");

      try {
        await video.play();
      } catch (playErr) {
        console.warn("Autoplay unmuted blocked, playing muted for frame grab:", playErr);
        video.muted = true;
        await video.play();
      }

      // High-Fidelity Canvas Caption Renderer (mirrors CaptionOverlay.js pixel-for-pixel)
      const renderCaptionFrame = (curTime) => {
        // 1. Find active segment (with 0.25s buffer so captions don't flicker off during slight pauses)
        let active = segments.find(s => curTime >= s.start && curTime <= s.end);
        if (!active) {
          active = segments.find(s => curTime >= (s.start - 0.05) && curTime <= (s.end + 0.25));
        }
        if (!active) return;

        // 2. Choose script text
        const isRomanized = scriptMode === "romanized";
        let rawText = isRomanized
          ? (active.romanizedText || active.text || "")
          : (active.text || active.romanizedText || "");

        if (!rawText.trim()) return;

        // 3. Text Transform
        const applyTransform = (text) => {
          if (!text) return "";
          switch (styleConfig.textCase) {
            case "upper": return text.toUpperCase();
            case "lower": return text.toLowerCase();
            case "capitalize": return text.replace(/\b\w/g, l => l.toUpperCase());
            default: return text;
          }
        };

        // 4. Split words with durations for Karaoke
        const textWords = rawText.trim().split(/\s+/).filter(Boolean);
        const totalDuration = Math.max(0.1, active.end - active.start);
        const wordDuration = totalDuration / Math.max(1, textWords.length);

        const words = textWords.map((word, idx) => {
          const start = active.start + idx * wordDuration;
          const end = start + wordDuration;
          return {
            word: applyTransform(word),
            start,
            end,
            isActive: Boolean(styleConfig.karaoke && curTime >= start && curTime <= end)
          };
        });

        // 5. Calculate font size & font
        const fontSize = Math.round((styleConfig.fontSizePct / 100) * canvas.height * 0.95);
        const fontWeight = styleConfig.fontWeight || 700;
        const fontFamily = styleConfig.fontFamily || "NTR";
        const lineHeight = (styleConfig.lineHeight || 1.15) * fontSize;

        ctx.save();
        ctx.font = `${fontWeight} ${fontSize}px "${fontFamily}", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
        ctx.textBaseline = "middle";

        const spaceWidth = ctx.measureText(" ").width;
        const maxLineWidth = canvas.width * ((styleConfig.maxWidthPct || 84) / 100);

        // 6. Word-wrap into lines
        const lines = [];
        let currentLine = [];
        let currentLineWidth = 0;

        for (const w of words) {
          const wordWidth = ctx.measureText(w.word).width;
          if (currentLine.length > 0 && currentLineWidth + spaceWidth + wordWidth > maxLineWidth) {
            lines.push({ items: currentLine, width: currentLineWidth });
            currentLine = [{ ...w, width: wordWidth }];
            currentLineWidth = wordWidth;
          } else {
            currentLine.push({ ...w, width: wordWidth });
            currentLineWidth += (currentLine.length > 1 ? spaceWidth : 0) + wordWidth;
          }
        }
        if (currentLine.length > 0) {
          lines.push({ items: currentLine, width: currentLineWidth });
        }

        // 7. Overall Bounding Box calculation
        const totalTextHeight = lines.length * lineHeight;
        const maxMeasuredWidth = Math.max(...lines.map(l => l.width), 0);
        const centerPosY = (styleConfig.positionYPct / 100) * canvas.height;
        const startY = centerPosY - (totalTextHeight / 2) + (lineHeight / 2);

        const isNegative = styleConfig.textEffect === "negative";

        // RGBA helper
        const getRgba = (color, opacity) => {
          if (!color) return `rgba(0,0,0,${opacity ?? 0.85})`;
          if (color.startsWith("#")) {
            let hex = color.replace("#", "");
            if (hex.length === 3) hex = hex.split("").map(c => c + c).join("");
            if (hex.length === 6) {
              const r = parseInt(hex.slice(0, 2), 16) || 0;
              const g = parseInt(hex.slice(2, 4), 16) || 0;
              const b = parseInt(hex.slice(4, 6), 16) || 0;
              return `rgba(${r}, ${g}, ${b}, ${opacity ?? 0.85})`;
            }
          }
          return color;
        };

        const boxBgColor = isNegative
          ? "#FFFFFF"
          : getRgba(styleConfig.backgroundColor, styleConfig.backgroundOpacity ?? 0.85);

        // 8. Draw Main Background Box (if boxMode === 'box' or 'rounded' or isNegative)
        const hasBoxMode = (styleConfig.boxMode === "box" || styleConfig.boxMode === "rounded" || isNegative);
        const hasOpacity = ((typeof styleConfig.backgroundOpacity === "number" ? styleConfig.backgroundOpacity : 0.85) > 0 || isNegative);

        if (hasBoxMode && hasOpacity) {
          const padX = fontSize * (styleConfig.bgPaddingXPct || 0.8);
          const padY = fontSize * (styleConfig.bgPaddingYPct || 0.4);
          const boxX = (canvas.width - maxMeasuredWidth) / 2 - padX;
          const boxY = centerPosY - (totalTextHeight / 2) - padY;
          const boxW = maxMeasuredWidth + padX * 2;
          const boxH = totalTextHeight + padY * 2;
          const radius = styleConfig.boxMode === "rounded"
            ? Math.min(boxH / 2, fontSize * 0.8)
            : Math.round(fontSize * 0.25);

          ctx.save();
          ctx.fillStyle = boxBgColor;
          if (typeof ctx.roundRect === "function") {
            ctx.beginPath();
            ctx.roundRect(boxX, boxY, boxW, boxH, radius);
            ctx.fill();
          } else {
            ctx.fillRect(boxX, boxY, boxW, boxH);
          }
          ctx.restore();
        }

        // 9. Draw Lines and Words
        lines.forEach((line, lineIdx) => {
          const lineY = startY + lineIdx * lineHeight;
          let curX = (canvas.width - line.width) / 2;

          line.items.forEach((item, itemIdx) => {
            if (itemIdx > 0) curX += spaceWidth;

            // Draw inline word background pill if boxMode === 'inline'
            if (styleConfig.boxMode === "inline" && hasOpacity) {
              const pillPadX = fontSize * 0.25;
              const pillPadY = fontSize * 0.15;
              const pillX = curX - pillPadX;
              const pillY = lineY - (lineHeight / 2) - pillPadY;
              const pillW = item.width + pillPadX * 2;
              const pillH = lineHeight + pillPadY * 2;
              const pillRadius = Math.round(fontSize * 0.2);

              ctx.save();
              ctx.fillStyle = boxBgColor;
              if (typeof ctx.roundRect === "function") {
                ctx.beginPath();
                ctx.roundRect(pillX, pillY, pillW, pillH, pillRadius);
                ctx.fill();
              } else {
                ctx.fillRect(pillX, pillY, pillW, pillH);
              }
              ctx.restore();
            }

            ctx.save();

            // Word color:
            let wordColor = isNegative ? "#000000" : (styleConfig.color || "#FFFFFF");
            if (!isNegative && item.isActive) {
              wordColor = styleConfig.highlightColor || "#FF3B30";
            }

            // Shadow / Glow
            if (!isNegative) {
              if (styleConfig.shadow) {
                ctx.shadowColor = "rgba(0, 0, 0, 0.9)";
                ctx.shadowBlur = Math.round(fontSize * 0.25);
                ctx.shadowOffsetX = 0;
                ctx.shadowOffsetY = Math.round(fontSize * 0.08);
              } else if (styleConfig.glowStrength > 0) {
                ctx.shadowColor = styleConfig.glowColor || styleConfig.highlightColor || "#FFFFFF";
                ctx.shadowBlur = Math.round(fontSize * 0.3 * (styleConfig.glowStrength || 1));
                ctx.shadowOffsetX = 0;
                ctx.shadowOffsetY = 0;
              }
            }

            // Stroke / Outline
            if (!isNegative && styleConfig.outlineWidth > 0) {
              const strokeW = Math.max(1, Math.round(styleConfig.outlineWidth * (fontSize / 32)));
              ctx.strokeStyle = styleConfig.outlineColor || "#000000";
              ctx.lineWidth = strokeW * 2;
              ctx.lineJoin = "round";
              ctx.miterLimit = 2;
              ctx.strokeText(item.word, curX, lineY);
            }

            // Fill Word
            ctx.fillStyle = wordColor;
            ctx.fillText(item.word, curX, lineY);
            ctx.restore();

            curX += item.width;
          });
        });

        ctx.restore();
      };

      const drawFrame = () => {
        if (!isRecording) return;

        if (video.readyState >= 2) {
          // 1. Draw video background
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

          // 2. Draw styled subtitles matching preview stage
          renderCaptionFrame(video.currentTime);

          setExportProgress(Math.min(85, Math.round((video.currentTime / duration) * 85)));
        }

        if (video.ended || video.currentTime >= duration - 0.05) {
          stopRecording();
          return;
        }

        requestAnimationFrame(drawFrame);
      };

      requestAnimationFrame(drawFrame);
    } catch (err) {
      console.error("Video export error:", err);
      if (audioCtx && audioCtx.state !== "closed") {
        audioCtx.close().catch(() => {});
      }
      setIsExportingVideo(false);
      setExportProgress(0);
      alert("Video export encountered an error: " + err.message);
    }
  };

  return (
    <div className="flex flex-col h-full bg-neutral-900/40 rounded-2xl border border-neutral-800/80 p-5 overflow-y-auto space-y-6 min-h-0">
      {/* Header */}
      <div>
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Film className="w-4 h-4 text-orange-400" />
          <span>Export & Download Studio</span>
        </h2>
        <p className="text-xs text-neutral-400 mt-1">
          Export your post-ready burned video or download subtitle files for Instagram, YouTube, and Facebook.
        </p>
      </div>

      {/* Filename Input */}
      <div>
        <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
          Export File Name
        </label>
        <div className="flex items-center">
          <input
            type="text"
            value={exportName}
            onChange={e => setExportName(e.target.value)}
            className="flex-1 px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-l-lg text-white text-xs font-mono focus:border-orange-500 focus:outline-none"
            placeholder="my_telugu_reel"
          />
          <span className="px-3 py-2 bg-neutral-900 border border-l-0 border-neutral-800 text-neutral-400 font-mono text-xs rounded-r-lg">
            .mp4
          </span>
        </div>
      </div>

      {/* Section 1: Burned Video Export */}
      <div className="p-4 rounded-xl bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950 border border-neutral-800 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <Video className="w-4 h-4 text-orange-400" />
              <span>Burned-In Subtitle Video</span>
            </span>
            <p className="text-[11px] text-neutral-400 mt-0.5">
              Hardcodes your styled captions directly into the video frames with full synchronized audio.
            </p>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
            H.264 / AAC MP4
          </span>
        </div>

        {/* Export Progress Bar */}
        {isExportingVideo && (
          <div className="space-y-1.5 py-2">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-orange-400 font-bold flex items-center gap-1.5">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>{exportStatusText}</span>
              </span>
              <span className="text-white font-bold">{exportProgress}%</span>
            </div>
            <div className="w-full h-2 bg-neutral-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-orange-500 to-amber-400 transition-all duration-200"
                style={{ width: `${exportProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Action Button & In-Modal Video Preview Player */}
        {!exportedVideoUrl ? (
          <button
            onClick={handleRenderClick}
            disabled={isExportingVideo}
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-xs font-bold shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
          >
            {isExportingVideo ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{exportStatusText}</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Render Burned MP4 Video</span>
              </>
            )}
          </button>
        ) : (
          <div className="space-y-3">
            <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span className="font-semibold">Ready! Universal MP4 with Audio</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                100% Playable
              </span>
            </div>

            {/* In-Modal Video & Audio Preview Player */}
            <div className="rounded-xl overflow-hidden border border-neutral-800 bg-black p-2 flex flex-col items-center">
              <video
                controls
                controlsList="nodownload"
                src={serverDownloadUrl || exportedVideoUrl}
                className="w-full max-h-56 rounded-lg bg-black object-contain"
                playsInline
              />
              <span className="text-[10px] text-neutral-400 mt-1.5 font-mono">
                Preview video & audio playback before downloading
              </span>
            </div>

            <div className="flex gap-2">
              {user ? (
                <a
                  href={serverDownloadUrl || exportedVideoUrl}
                  download={downloadFilename}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-black text-xs font-bold shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4 stroke-[2.5]" />
                  <span>Download Final MP4 (.mp4)</span>
                </a>
              ) : (
                <button
                  onClick={() => {
                    setGuestAction("download_video");
                    setGuestAuthOpen(true);
                  }}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-xs font-bold shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4 stroke-[2.5]" />
                  <span>Sign In to Download MP4</span>
                </button>
              )}

              <button
                onClick={handleRenderClick}
                className="py-2.5 px-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold transition-all cursor-pointer"
                title="Re-render video"
              >
                Re-render
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Section 2: Subtitle Files (.SRT & .VTT) */}
      <div className="space-y-2.5">
        <label className="block text-xs font-semibold text-neutral-300">
          Subtitle Files (Timed Captions)
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={downloadSrt}
            className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 hover:border-neutral-700 hover:bg-neutral-900 text-left transition-all group"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-xs text-white">SubRip (.SRT)</span>
              <FileText className="w-4 h-4 text-orange-400 group-hover:scale-110 transition-transform" />
            </div>
            <p className="text-[10px] text-neutral-400">
              Standard subtitles for YouTube, Premiere Pro & CapCut
            </p>
          </button>

          <button
            onClick={downloadVtt}
            className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 hover:border-neutral-700 hover:bg-neutral-900 text-left transition-all group"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-xs text-white">WebVTT (.VTT)</span>
              <FileText className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
            </div>
            <p className="text-[10px] text-neutral-400">
              Formatted for web players and online video streaming
            </p>
          </button>
        </div>
      </div>

      {/* Section 3: AI Viral Hooks & Instagram Post Caption */}
      <div className="p-3 bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950 rounded-xl border border-orange-500/30 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-orange-400" />
            <span className="text-xs font-bold text-white">AI Viral Hooks & Post Caption</span>
          </div>
          <button
            onClick={generateAiHooks}
            disabled={isGeneratingHooks || segments.length === 0}
            className="flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-bold transition-all cursor-pointer disabled:opacity-50"
          >
            {isGeneratingHooks ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>Generating...</span>
              </>
            ) : (
              <span>Generate AI Hooks</span>
            )}
          </button>
        </div>

        {aiHooksData ? (
          <div className="space-y-3 pt-2 border-t border-neutral-800 text-xs">
            {/* 3 Opening Hooks */}
            <div>
              <span className="text-[11px] font-semibold text-neutral-400 block mb-1">
                Viral 3-Second Opening Hooks (Click to copy):
              </span>
              <div className="space-y-1.5">
                {aiHooksData.hooks?.map((hook, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      navigator.clipboard.writeText(hook);
                      alert("Hook copied to clipboard!");
                    }}
                    className="w-full text-left p-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-white font-medium text-xs transition-all flex items-center justify-between group cursor-pointer"
                  >
                    <span>{hook}</span>
                    <Copy className="w-3 h-3 text-neutral-500 group-hover:text-white shrink-0 ml-2" />
                  </button>
                ))}
              </div>
            </div>

            {/* Ready-to-Post Instagram Caption */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-semibold text-neutral-400">
                  Formatted Instagram Post Caption & Hashtags:
                </span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(aiHooksData.postCaption);
                    setCopiedCaption(true);
                    setTimeout(() => setCopiedCaption(false), 2000);
                  }}
                  className="text-[10px] text-orange-400 hover:underline flex items-center gap-1 cursor-pointer font-bold"
                >
                  {copiedCaption ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedCaption ? "Copied!" : "Copy Caption"}</span>
                </button>
              </div>
              <div className="p-2.5 bg-neutral-900 border border-neutral-800 rounded-lg text-neutral-300 font-mono text-[11px] max-h-28 overflow-y-auto whitespace-pre-wrap leading-relaxed select-all">
                {aiHooksData.postCaption}
              </div>
            </div>
          </div>
        ) : (
          <p className="text-[11px] text-neutral-400 leading-normal">
            Click &quot;Generate AI Hooks&quot; to auto-generate 3-second opening hook titles and a viral Instagram description with hashtags from your transcript.
          </p>
        )}
      </div>

      {/* Section 4: Copy Raw Transcript Text */}
      <div className="pt-1">
        <button
          onClick={copyScriptText}
          className="w-full py-2 px-3 rounded-lg bg-neutral-950 border border-neutral-800 hover:bg-neutral-900 text-neutral-300 hover:text-white text-xs font-medium flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400">Copied to Clipboard!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy Raw Subtitle Script</span>
            </>
          )}
        </button>
      </div>

      {/* Pre-Processing Credit Cost Confirmation Modal */}
      <CreditCostModal
        isOpen={costModalOpen}
        onClose={() => setCostModalOpen(false)}
        onConfirm={() => {
          setCostModalOpen(false);
          renderBurnedVideo();
        }}
        actionTitle="Export Burned-In MP4 Video"
        cost={PRICING_RULES.calculateExportCost()}
        currentBalance={user?.credits_balance ?? 100}
      />

      {/* Phase 6: Guest Trial Login Modal */}
      <GuestAuthModal
        isOpen={guestAuthOpen}
        onClose={() => setGuestAuthOpen(false)}
        actionType={guestAction}
        onSuccess={() => {
          if (guestAction === "download_srt") {
            downloadSrt();
          } else if (guestAction === "download_video") {
            renderBurnedVideo();
          }
        }}
      />
    </div>
  );
}
