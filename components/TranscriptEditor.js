"use client";

import React, { useRef, useEffect, useState } from "react";
import {
  Scissors,
  Merge,
  Plus,
  Trash2,
  Clock,
  Languages,
  Sparkles,
  Play,
  Wand2,
  Loader2,
  Check,
  Mic
} from "lucide-react";
import { teluguToRomanized } from "@/lib/transliterate";
import CreditCostModal from "@/components/CreditCostModal";
import GuestAuthModal from "@/components/GuestAuthModal";
import { PRICING_RULES } from "@/config/pricing";
import { useAuth } from "@/lib/authContext";

export default function TranscriptEditor({
  segments,
  setSegments,
  currentTime,
  onSeek,
  scriptMode,
  setScriptMode,
  isTranscribing = false,
  asrInfo = null,
  onRetranscribe,
  isPlaying = false,
  selectedLanguage = "auto",
  setSelectedLanguage = () => {}
}) {
  const activeCardRef = useRef(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiToast, setAiToast] = useState(null);

  // Auto-scroll active segment into view ONLY when video is actively playing and user is not typing
  useEffect(() => {
    const isEditing = typeof document !== "undefined" && document.activeElement && (document.activeElement.tagName === "INPUT" || document.activeElement.tagName === "TEXTAREA");
    if (isPlaying && !isEditing && activeCardRef.current) {
      activeCardRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest"
      });
    }
  }, [currentTime, isPlaying]);

  const { user, updateCreditsBalance } = useAuth();
  const [costModalOpen, setCostModalOpen] = useState(false);
  const [pendingAiAction, setPendingAiAction] = useState(null);
  const [guestAuthOpen, setGuestAuthOpen] = useState(false);

  // AI Actions: Auto-Emoji, Grammar Polish & Translate
  const handleAiAction = (actionType) => {
    if (actionType === "translate_telugu") {
      if (!user) {
        setGuestAuthOpen(true);
        return;
      }
      const maxEnd = (segments || []).reduce((max, s) => Math.max(max, s.end || 0), 0);
      const cost = PRICING_RULES.calculateTranslationCost(maxEnd, 1);
      setPendingAiAction({
        actionType,
        cost,
        durationSec: Math.ceil(maxEnd || 30)
      });
      setCostModalOpen(true);
      return;
    }
    executeAiAction(actionType);
  };

  const executeAiAction = async (actionType) => {
    setCostModalOpen(false);
    setIsAiLoading(true);
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: actionType, segments, scriptMode })
      });
      const data = await res.json();
      if (data.ok && data.segments) {
        setSegments(data.segments);
        if (actionType === "translate_telugu") {
          if (setScriptMode) setScriptMode("telugu");
          setAiToast("🇮🇳 Converted to Telugu Script!");
        } else if (actionType === "auto_emoji") {
          setAiToast("✨ Viral emojis added!");
        } else {
          setAiToast("🪄 Spellings & typos fixed!");
        }

        if (data.creditsRemaining !== undefined && updateCreditsBalance) {
          updateCreditsBalance(data.creditsRemaining);
        }

        setTimeout(() => setAiToast(null), 3000);
      } else if (data.error) {
        alert(data.error);
      }
    } catch (err) {
      console.error("AI action error:", err);
    } finally {
      setIsAiLoading(false);
      setPendingAiAction(null);
    }
  };

  // Global timing calibration: nudge all subtitle and word timestamps earlier or later
  const nudgeTiming = (offsetSec) => {
    setSegments(prev =>
      prev.map(seg => {
        const newStart = Math.max(0, Number(((seg.start || 0) + offsetSec).toFixed(2)));
        const newEnd = Math.max(newStart + 0.2, Number(((seg.end || 2) + offsetSec).toFixed(2)));
        const newWords = (seg.words || []).map(w => ({
          ...w,
          start: Math.max(0, Number(((w.start ?? seg.start) + offsetSec).toFixed(2))),
          end: Math.max(0.1, Number(((w.end ?? seg.end) + offsetSec).toFixed(2)))
        }));
        return {
          ...seg,
          start: newStart,
          end: newEnd,
          words: newWords
        };
      })
    );
    setAiToast(offsetSec < 0 ? `⚡ Sync: shifted ${offsetSec}s earlier` : `⏱️ Sync: shifted +${offsetSec}s later`);
    setTimeout(() => setAiToast(null), 2500);
  };

  // Update segment text with reactive sync to video and word chips (no seek interference)
  const updateSegmentText = (id, newText, isRomanized = false) => {
    // Auto-switch script mode to match the field being edited
    if (setScriptMode) {
      if (isRomanized && scriptMode !== "romanized") {
        setScriptMode("romanized");
      } else if (!isRomanized && scriptMode !== "telugu") {
        setScriptMode("telugu");
      }
    }

    // Update state with synchronized text, romanized translation, and word chips
    setSegments(prev =>
      prev.map(seg => {
        if (seg.id !== id) return seg;

        const nextTelugu = isRomanized ? (seg.text || "") : newText;
        const nextRomanized = isRomanized
          ? newText
          : (teluguToRomanized(newText) || seg.romanizedText || "");

        // Compute words dynamically so word chips and karaoke are always in sync
        const activeScriptText = isRomanized ? nextRomanized : nextTelugu;
        const textWords = (activeScriptText || "").trim().split(/\s+/).filter(Boolean);
        const segDuration = Math.max(0.1, (seg.end || 2) - (seg.start || 0));
        const wordDur = segDuration / Math.max(1, textWords.length);

        const updatedWords = textWords.map((w, idx) => ({
          word: isRomanized ? (seg.words?.[idx]?.word || w) : w,
          romanized: isRomanized ? w : teluguToRomanized(w),
          start: Number((seg.start + idx * wordDur).toFixed(2)),
          end: Number((seg.start + (idx + 1) * wordDur).toFixed(2))
        }));

        return {
          ...seg,
          text: nextTelugu,
          romanizedText: nextRomanized,
          words: updatedWords
        };
      })
    );
  };

  // Update segment timestamp and re-scale word timings
  const updateSegmentTime = (id, field, value) => {
    const num = value === "" ? 0 : parseFloat(value);
    if (isNaN(num)) return;
    setSegments(prev =>
      prev.map(seg => {
        if (seg.id !== id) return seg;
        const updated = { ...seg, [field]: num };
        if (updated.words && updated.words.length > 0) {
          const segDuration = Math.max(0.1, updated.end - updated.start);
          const wordDur = segDuration / updated.words.length;
          updated.words = updated.words.map((w, idx) => ({
            ...w,
            start: Number((updated.start + idx * wordDur).toFixed(2)),
            end: Number((updated.start + (idx + 1) * wordDur).toFixed(2))
          }));
        }
        return updated;
      })
    );
  };

  // Convert script for a single segment
  const autoConvertScript = (id) => {
    setSegments(prev =>
      prev.map(seg => {
        if (seg.id !== id) return seg;
        return {
          ...seg,
          romanizedText: teluguToRomanized(seg.text)
        };
      })
    );
  };

  // Convert all segments to Romanized
  const convertAllToRomanized = () => {
    setSegments(prev =>
      prev.map(seg => ({
        ...seg,
        romanizedText: teluguToRomanized(seg.text)
      }))
    );
  };

  // Split Segment
  const splitSegment = (id) => {
    const idx = segments.findIndex(s => s.id === id);
    if (idx === -1) return;
    const seg = segments[idx];
    const textWords = seg.text.split(" ").filter(Boolean);
    if (textWords.length < 2) return;

    const mid = Math.floor(textWords.length / 2);
    const leftText = textWords.slice(0, mid).join(" ");
    const rightText = textWords.slice(mid).join(" ");
    const midTime = Number(((seg.start + seg.end) / 2).toFixed(2));

    const leftSeg = {
      ...seg,
      id: `seg-${Date.now()}-1`,
      text: leftText,
      romanizedText: teluguToRomanized(leftText),
      end: midTime,
      words: seg.words?.slice(0, mid)
    };

    const rightSeg = {
      id: `seg-${Date.now()}-2`,
      start: midTime,
      end: seg.end,
      text: rightText,
      romanizedText: teluguToRomanized(rightText),
      words: seg.words?.slice(mid)
    };

    const updated = [...segments];
    updated.splice(idx, 1, leftSeg, rightSeg);
    setSegments(updated);
  };

  // Merge with next segment
  const mergeWithNext = (idx) => {
    if (idx >= segments.length - 1) return;
    const cur = segments[idx];
    const next = segments[idx + 1];

    const merged = {
      id: cur.id,
      start: cur.start,
      end: next.end,
      text: `${cur.text.trim()} ${next.text.trim()}`,
      romanizedText: `${(cur.romanizedText || '').trim()} ${(next.romanizedText || '').trim()}`,
      words: [...(cur.words || []), ...(next.words || [])]
    };

    const updated = [...segments];
    updated.splice(idx, 2, merged);
    setSegments(updated);
  };

  // Add new 2s segment
  const addSegment = () => {
    const lastSeg = segments[segments.length - 1];
    const start = lastSeg ? lastSeg.end + 0.1 : 0;
    const end = start + 2.5;

    const newSeg = {
      id: `seg-${Date.now()}`,
      start: Number(start.toFixed(2)),
      end: Number(end.toFixed(2)),
      text: "కొత్త వాక్యం రాయండి",
      romanizedText: "Kotha vakyam rayandi",
      words: [
        { word: "కొత్త", romanized: "Kotha", start: start, end: start + 0.8 },
        { word: "వాక్యం", romanized: "vakyam", start: start + 0.8, end: start + 1.6 },
        { word: "రాయండి", romanized: "rayandi", start: start + 1.6, end: end }
      ]
    };
    setSegments([...segments, newSeg]);
  };

  // Delete segment with complete freedom (if last line, reset to a fresh empty line)
  const deleteSegment = (id) => {
    setSegments(prev => {
      const remaining = prev.filter(s => s.id !== id);
      if (remaining.length === 0) {
        return [
          {
            id: `seg-${Date.now()}`,
            start: 0,
            end: 2.5,
            text: "",
            romanizedText: "",
            words: []
          }
        ];
      }
      return remaining;
    });
  };

  // Clear all segments at once
  const clearAllSegments = () => {
    setSegments([
      {
        id: `seg-${Date.now()}`,
        start: 0,
        end: 2.5,
        text: "",
        romanizedText: "",
        words: []
      }
    ]);
  };

  return (
    <div className="flex flex-col h-full bg-neutral-900/50 rounded-2xl border border-neutral-800 p-3 sm:p-4 overflow-hidden min-h-0">
      {/* Panel Top Header */}
      <div className="flex items-center justify-between pb-3 border-b border-neutral-800 shrink-0">
        <div>
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <span>Transcript Segments</span>
            <span className="text-[11px] font-mono bg-orange-500/20 text-orange-400 border border-orange-500/30 px-2 py-0.5 rounded-full font-bold">
              {segments.length} lines
            </span>
            {asrInfo && (
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold border ${
                  asrInfo.activeEngine === "gemini" || asrInfo.activeEngine === "groq" || asrInfo.activeEngine === "sarvam"
                    ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                    : "bg-neutral-800 text-neutral-400 border-neutral-700"
                }`}
                title={asrInfo.engineName}
              >
                {asrInfo.activeEngine === "gemini"
                  ? "✨ Gemini 2.5 Flash"
                  : asrInfo.activeEngine === "groq"
                  ? "⚡ Groq Whisper v3"
                  : asrInfo.activeEngine === "sarvam"
                  ? "🇮🇳 Sarvam AI"
                  : "⚡ Offline Engine"}
              </span>
            )}
          </h2>
          <p className="text-[11px] text-neutral-400 mt-0.5">
            Click segment to seek. Edit Telugu or Romanized scripts.
          </p>
        </div>

        {/* Global actions */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={clearAllSegments}
            className="flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg bg-neutral-900 hover:bg-rose-950/60 text-neutral-400 hover:text-rose-400 border border-neutral-800 hover:border-rose-800/40 font-medium transition-all cursor-pointer"
            title="Clear all captions and start fresh"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Clear All</span>
          </button>

          <button
            type="button"
            onClick={convertAllToRomanized}
            className="flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border border-neutral-700 font-medium transition-all cursor-pointer"
            title="Auto-generate Romanized script for all lines"
          >
            <Languages className="w-3.5 h-3.5 text-orange-400" />
            <span className="hidden sm:inline">Sync Romanized</span>
          </button>

          <button
            type="button"
            onClick={addSegment}
            className="flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-bold shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Line</span>
          </button>
        </div>
      </div>

      {/* AI Intelligence Toolbar */}
      <div className="my-2.5 p-2 bg-gradient-to-r from-orange-500/15 via-amber-500/10 to-transparent border border-orange-500/25 rounded-xl flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-1.5">
          <Wand2 className="w-3.5 h-3.5 text-orange-400 animate-pulse" />
          <span className="text-xs font-bold text-white">AI Tools:</span>
          {aiToast && (
            <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 flex items-center gap-1">
              <Check className="w-3 h-3" />
              {aiToast}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {onRetranscribe && (
            <div className="flex items-center gap-1 bg-neutral-900 border border-neutral-700/80 rounded-lg p-0.5">
              <select
                value={selectedLanguage}
                onChange={(e) => {
                  const newLang = e.target.value;
                  setSelectedLanguage(newLang);
                  onRetranscribe(newLang);
                }}
                disabled={isTranscribing}
                className="bg-transparent text-neutral-300 text-[11px] px-1.5 py-0.5 font-medium cursor-pointer focus:outline-none"
                title="Select language for speech recognition"
              >
                <option value="auto" className="bg-neutral-900 text-white">🌐 Auto</option>
                <option value="te" className="bg-neutral-900 text-white">🇮🇳 Telugu</option>
                <option value="en" className="bg-neutral-900 text-white">🔤 English</option>
              </select>
              <button
                onClick={() => onRetranscribe(selectedLanguage)}
                disabled={isTranscribing}
                className="flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 transition-all cursor-pointer disabled:opacity-50"
                title="Re-run AI speech recognition with chosen language"
              >
                {isTranscribing ? <Loader2 className="w-3 h-3 animate-spin text-orange-400" /> : <Mic className="w-3 h-3 text-orange-400" />}
                <span>{isTranscribing ? "Transcribing..." : "Re-Transcribe"}</span>
              </button>
            </div>
          )}

          <button
            onClick={() => handleAiAction("translate_telugu")}
            disabled={isAiLoading || segments.length === 0}
            className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-lg bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 border border-orange-500/40 transition-all cursor-pointer disabled:opacity-50"
            title="Convert and translate all captions into authentic Telugu script (తెలుగు లిపి)"
          >
            {isAiLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Languages className="w-3 h-3 text-orange-400" />}
            <span>🇮🇳 To Telugu</span>
          </button>

          <button
            onClick={() => handleAiAction("auto_emoji")}
            disabled={isAiLoading || segments.length === 0}
            className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 transition-all cursor-pointer disabled:opacity-50"
            title="Scan viral trigger keywords and auto-inject matching emojis (🔥, 💰, 🤫, 🤯, ⚡)"
          >
            {isAiLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
            <span>Auto-Emoji</span>
          </button>

          {/* Audio-Video Timing Nudge */}
          <div className="flex items-center gap-1 bg-neutral-900 border border-neutral-700/80 rounded-lg px-2 py-0.5 text-xs text-neutral-300">
            <span className="text-[10px] font-semibold text-neutral-400">Sync:</span>
            <button
              type="button"
              onClick={() => nudgeTiming(-0.1)}
              className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-neutral-800 hover:bg-neutral-700 text-orange-400 border border-neutral-700/80 transition-all cursor-pointer"
              title="Shift all captions 0.1s earlier (if captions appear after speech)"
            >
              -0.1s
            </button>
            <button
              type="button"
              onClick={() => nudgeTiming(0.1)}
              className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-neutral-800 hover:bg-neutral-700 text-orange-400 border border-neutral-700/80 transition-all cursor-pointer"
              title="Shift all captions 0.1s later (if captions appear before speech)"
            >
              +0.1s
            </button>
          </div>

          <button
            onClick={() => handleAiAction("grammar_polish")}
            disabled={isAiLoading || segments.length === 0}
            className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 transition-all cursor-pointer disabled:opacity-50"
            title="Scan and automatically fix spelling mistakes, typos, and grammar in both Telugu & English without changing spoken words"
          >
            {isAiLoading ? <Loader2 className="w-3 h-3 animate-spin text-emerald-400" /> : <Sparkles className="w-3 h-3 text-emerald-400" />}
            <span>Fix Spelling</span>
          </button>
        </div>
      </div>

      {/* Live Transcription Loading Banner */}
      {isTranscribing && (
        <div className="p-3 mb-2.5 rounded-xl bg-orange-500/15 border border-orange-500/30 text-orange-300 text-xs flex items-center justify-between animate-pulse shrink-0">
          <div className="flex items-center gap-2 font-medium">
            <Loader2 className="w-4 h-4 animate-spin text-orange-400 shrink-0" />
            <span>Transcribing Telugu speech with AI... (Matching word timings)</span>
          </div>
          <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-orange-500/20 text-orange-400 font-bold shrink-0">
            {asrInfo?.activeEngine || "AI ASR"}
          </span>
        </div>
      )}

      {/* High-Visibility Segment Cards List */}
      <div className="flex-1 min-h-0 overflow-y-auto space-y-2.5 pt-1 pr-1">
        {/* Active AI Transcription Progress Indicator */}
        {isTranscribing && (
          <div className="p-4 rounded-xl bg-gradient-to-r from-orange-500/20 via-amber-500/15 to-orange-500/10 border border-orange-500/40 text-center flex flex-col items-center justify-center gap-2 animate-pulse">
            <div className="flex items-center gap-2 text-orange-400 font-bold text-sm">
              <Loader2 className="w-4 h-4 animate-spin text-orange-400 shrink-0" />
              <span>AI Transcribing Speech & Timestamps...</span>
            </div>
            <p className="text-xs text-neutral-300 max-w-sm">
              Generating timed Telugu & English dual-script captions with word sync. Almost ready...
            </p>
            <div className="w-48 h-1 bg-neutral-800 rounded-full overflow-hidden mt-0.5">
              <div className="h-full bg-gradient-to-r from-orange-500 to-amber-400 animate-pulse w-3/4 rounded-full" />
            </div>
          </div>
        )}

        {segments.length === 0 && !isTranscribing && (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-12 text-neutral-400">
            <p className="text-sm font-medium">No caption lines yet.</p>
            <button
              type="button"
              onClick={addSegment}
              className="mt-3 px-3 py-1.5 rounded-lg bg-orange-500 text-white font-bold text-xs hover:bg-orange-600 transition-all cursor-pointer"
            >
              + Add First Caption Line
            </button>
          </div>
        )}

        {segments.map((seg, idx) => {
          const isActive = currentTime >= seg.start && currentTime <= seg.end;

          return (
            <div
              key={seg.id}
              ref={isActive ? activeCardRef : null}
              className={`p-3 rounded-xl border transition-all duration-150 ${
                isActive
                  ? "bg-neutral-800/95 border-orange-500 ring-2 ring-orange-500/40 shadow-lg shadow-orange-500/10"
                  : "bg-neutral-950/80 border-neutral-800 hover:border-neutral-700"
              }`}
            >
              {/* Card Meta Row: Number, Timing, Tools */}
              <div className="flex items-center justify-between text-xs mb-2">
                <div className="flex items-center gap-2">
                  <span className={`font-mono font-bold text-xs px-2 py-0.5 rounded ${
                    isActive ? "bg-orange-500 text-white" : "bg-neutral-800 text-neutral-300"
                  }`}>
                    #{String(idx + 1).padStart(2, '0')}
                  </span>

                  {isActive ? (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-full border border-orange-500/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-ping" />
                      Playing
                    </span>
                  ) : (
                    <button
                      onClick={() => onSeek(Number((seg.start + 0.05).toFixed(2)))}
                      className="text-[10px] text-neutral-400 hover:text-white flex items-center gap-0.5 cursor-pointer"
                    >
                      <Play className="w-2.5 h-2.5 fill-current" />
                      <span>Seek</span>
                    </button>
                  )}
                </div>

                {/* Timestamps inputs */}
                <div className="flex items-center gap-1 font-mono text-xs">
                  <Clock className="w-3 h-3 text-neutral-500" />
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={seg.start}
                    onChange={e => updateSegmentTime(seg.id, "start", e.target.value)}
                    className="w-14 px-1 py-0.5 bg-neutral-900 border border-neutral-700 rounded text-center text-white text-xs font-semibold focus:border-orange-500 focus:outline-none"
                    title="Start time"
                  />
                  <span className="text-neutral-500">→</span>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={seg.end}
                    onChange={e => updateSegmentTime(seg.id, "end", e.target.value)}
                    className="w-14 px-1 py-0.5 bg-neutral-900 border border-neutral-700 rounded text-center text-white text-xs font-semibold focus:border-orange-500 focus:outline-none"
                    title="End time"
                  />
                  <span className="text-[10px] text-neutral-400 font-mono ml-0.5">
                    ({(seg.end - seg.start).toFixed(1)}s)
                  </span>
                </div>

                {/* Split, Merge, Delete Actions */}
                <div className="flex items-center gap-0.5">
                  <button
                    onClick={() => splitSegment(seg.id)}
                    className="p-1 rounded hover:bg-neutral-800 text-neutral-400 hover:text-white cursor-pointer"
                    title="Split line at midpoint"
                  >
                    <Scissors className="w-3.5 h-3.5" />
                  </button>

                  {idx < segments.length - 1 && (
                    <button
                      onClick={() => mergeWithNext(idx)}
                      className="p-1 rounded hover:bg-neutral-800 text-neutral-400 hover:text-white cursor-pointer"
                      title="Merge with next line"
                    >
                      <Merge className="w-3.5 h-3.5" />
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => deleteSegment(seg.id)}
                    className="p-1 rounded hover:bg-rose-950 text-neutral-400 hover:text-rose-400 cursor-pointer transition-colors"
                    title="Delete line"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Text Fields */}
              <div className="space-y-1.5">
                {/* Native Telugu Script */}
                <div>
                  <div className="flex items-center justify-between text-[11px] text-neutral-400 mb-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-neutral-300">తెలుగు (Native Script)</span>
                      {scriptMode === "telugu" || scriptMode === "both" ? (
                        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-1.5 py-0.2 rounded-full">
                          ● Live on Video
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setScriptMode?.("telugu");
                            onSeek?.(Number((seg.start + 0.05).toFixed(2)));
                          }}
                          className="text-[10px] text-neutral-400 hover:text-orange-400 underline cursor-pointer"
                        >
                          Show on Video
                        </button>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => autoConvertScript(seg.id)}
                      className="text-[10px] text-orange-400 hover:underline flex items-center gap-0.5 cursor-pointer"
                    >
                      <Sparkles className="w-2.5 h-2.5" />
                      Sync Romanized
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      value={seg.text || ""}
                      onFocus={() => {
                        onSeek?.(Number((seg.start + 0.05).toFixed(2)));
                        setScriptMode?.("telugu");
                      }}
                      onChange={e => updateSegmentText(seg.id, e.target.value, false)}
                      className="w-full px-2.5 py-1.5 pr-7 bg-neutral-900 border border-neutral-700/80 rounded-lg text-white text-sm font-semibold focus:border-orange-500 focus:outline-none transition-all font-sans"
                      placeholder="తెలుగు టెక్స్ట్ రాయండి..."
                    />
                    {seg.text && (
                      <button
                        type="button"
                        onClick={() => updateSegmentText(seg.id, "", false)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300 p-0.5 rounded text-xs cursor-pointer"
                        title="Clear text"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>

                {/* Romanized English Script */}
                <div>
                  <div className="flex items-center justify-between text-[11px] text-neutral-400 mb-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-neutral-300">Romanized (English)</span>
                      {scriptMode === "romanized" || scriptMode === "both" ? (
                        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-1.5 py-0.2 rounded-full">
                          ● Live on Video
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setScriptMode?.("romanized");
                            onSeek?.(Number((seg.start + 0.05).toFixed(2)));
                          }}
                          className="text-[10px] text-neutral-400 hover:text-orange-400 underline cursor-pointer"
                        >
                          Show on Video
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      value={seg.romanizedText || ""}
                      onFocus={() => {
                        onSeek?.(Number((seg.start + 0.05).toFixed(2)));
                        setScriptMode?.("romanized");
                      }}
                      onChange={e => updateSegmentText(seg.id, e.target.value, true)}
                      className="w-full px-2.5 py-1 pr-7 bg-neutral-900 border border-neutral-700/80 rounded-lg text-neutral-200 text-xs font-mono focus:border-orange-500 focus:outline-none transition-all"
                      placeholder="Type Romanized spelling..."
                    />
                    {seg.romanizedText && (
                      <button
                        type="button"
                        onClick={() => updateSegmentText(seg.id, "", true)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300 p-0.5 rounded text-xs cursor-pointer"
                        title="Clear text"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Interactive Word Chips */}
              {seg.words && seg.words.length > 0 && (
                <div className="mt-2 pt-1.5 border-t border-neutral-800/80 flex flex-wrap gap-1 items-center">
                  <span className="text-[10px] font-mono text-neutral-500 mr-0.5">Words:</span>
                  {seg.words.map((w, wIdx) => {
                    const isWordActive = currentTime >= w.start && currentTime <= w.end;
                    const wordLabel = scriptMode === "romanized" ? (w.romanized || w.word) : w.word;

                    return (
                      <button
                        key={wIdx}
                        onClick={() => onSeek(w.start)}
                        className={`text-[11px] px-1.5 py-0.5 rounded transition-all cursor-pointer font-medium ${
                          isWordActive
                            ? "bg-orange-500 text-white font-bold shadow-sm"
                            : "bg-neutral-900 text-neutral-300 hover:bg-neutral-800 border border-neutral-800"
                        }`}
                        title={`Click to seek to ${w.start}s`}
                      >
                        {wordLabel}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Credit Pre-Confirmation Modal for Translation */}
      <CreditCostModal
        isOpen={costModalOpen}
        onClose={() => { setCostModalOpen(false); setPendingAiAction(null); }}
        onConfirm={() => executeAiAction(pendingAiAction?.actionType || "translate_telugu")}
        cost={pendingAiAction?.cost || 1}
        currentBalance={user?.credits_balance ?? 100}
        durationSec={pendingAiAction?.durationSec}
        actionTitle="Translate to Native Telugu"
        description="Converts transliterated text into authentic Native Telugu script."
      />

      {/* Guest Trial Sign In Modal */}
      <GuestAuthModal
        isOpen={guestAuthOpen}
        onClose={() => setGuestAuthOpen(false)}
        actionType="translate"
        onSuccess={() => {
          executeAiAction("translate_telugu");
        }}
      />
    </div>
  );
}
