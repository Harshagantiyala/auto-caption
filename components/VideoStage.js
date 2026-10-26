"use client";

import React, { useRef, useState, useEffect } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  Smartphone
} from "lucide-react";
import CaptionOverlay from "./CaptionOverlay";
import InstagramSafeZone from "./InstagramSafeZone";

export default function VideoStage({
  videoSrc,
  segments,
  styleConfig,
  scriptMode,
  setScriptMode,
  showSafeZone,
  setShowSafeZone,
  currentTime,
  setCurrentTime,
  duration,
  setDuration,
  isPlaying,
  setIsPlaying
}) {
  const videoRef = useRef(null);
  const [aspectRatio, setAspectRatio] = useState("9/16"); // '9/16' | '1/1' | '16/9'
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isMuted, setIsMuted] = useState(false);

  // Play / Pause toggle
  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  // Keyboard Spacebar listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === "Space" && e.target.tagName !== "INPUT" && e.target.tagName !== "TEXTAREA") {
        e.preventDefault();
        togglePlay();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isPlaying]);

  // Sync external seek requests (e.g. from Transcript Editor or word chips) to video element
  useEffect(() => {
    if (videoRef.current && Math.abs(videoRef.current.currentTime - currentTime) > 0.15) {
      videoRef.current.currentTime = currentTime;
    }
  }, [currentTime]);

  // Real-time 60fps audio/video playhead synchronization to eliminate browser onTimeUpdate throttle lag (~250ms)
  useEffect(() => {
    let animId;
    const syncLoop = () => {
      if (videoRef.current && !videoRef.current.paused) {
        setCurrentTime(videoRef.current.currentTime);
        animId = requestAnimationFrame(syncLoop);
      }
    };

    if (isPlaying) {
      animId = requestAnimationFrame(syncLoop);
    }
    return () => {
      if (animId) cancelAnimationFrame(animId);
    };
  }, [isPlaying, setCurrentTime]);

  // Video time update fallback
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  // Video loaded metadata
  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration || 1);
    }
  };

  // Seek bar scrub
  const handleSeek = (e) => {
    const newTime = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  // Skip relative
  const skipSeconds = (sec) => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(0, Math.min(duration, videoRef.current.currentTime + sec));
    }
  };

  // Format seconds to mm:ss.d
  const formatTime = (sec) => {
    const mins = Math.floor(sec / 60);
    const secs = Math.floor(sec % 60);
    const ms = Math.floor((sec % 1) * 10);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${ms}`;
  };

  // Playback rate cycle
  const cycleRate = () => {
    const rates = [0.75, 1, 1.25, 1.5];
    const nextIdx = (rates.indexOf(playbackRate) + 1) % rates.length;
    const nextRate = rates[nextIdx];
    setPlaybackRate(nextRate);
    if (videoRef.current) {
      videoRef.current.playbackRate = nextRate;
    }
  };

  const [fitMode, setFitMode] = useState("cover"); // 'cover' | 'contain'

  return (
    <div className="flex flex-col w-full h-full p-2.5 sm:p-3 bg-neutral-900/50 rounded-2xl border border-neutral-800/80 shadow-xl overflow-hidden min-h-0">
      {/* Top Controls Bar */}
      <div className="w-full flex items-center justify-between gap-2 px-1 pb-2 border-b border-neutral-800/60 shrink-0">
        {/* Script Mode Selector */}
        <div className="flex items-center gap-1 bg-neutral-950 p-0.5 rounded-lg border border-neutral-800 text-xs">
          <button
            type="button"
            onClick={() => setScriptMode("both")}
            className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
              scriptMode === "both"
                ? "bg-orange-500 text-white shadow-sm"
                : "text-neutral-400 hover:text-white"
            }`}
            title="Show both Native Telugu script and English captions simultaneously"
          >
            Both (తెలుగు + Eng)
          </button>
          <button
            type="button"
            onClick={() => setScriptMode("telugu")}
            className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
              scriptMode === "telugu"
                ? "bg-orange-500 text-white shadow-sm"
                : "text-neutral-400 hover:text-white"
            }`}
            title="Show Native Telugu script (తెలుగు లిపి) captions"
          >
            తెలుగు (Native)
          </button>
          <button
            type="button"
            onClick={() => setScriptMode("romanized")}
            className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
              scriptMode === "romanized"
                ? "bg-orange-500 text-white shadow-sm"
                : "text-neutral-400 hover:text-white"
            }`}
            title="Show verbatim spoken English / Romanized captions"
          >
            English (Spoken)
          </button>
        </div>

        {/* Right Tools: Fit Mode, Safezone & Aspect Ratio */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Fit / Fill Toggle */}
          <button
            onClick={() => setFitMode(fitMode === "cover" ? "contain" : "cover")}
            title={fitMode === "cover" ? "Fill Frame (Cover) - Click to fit entire video" : "Fit Frame (Contain) - Click to fill frame"}
            className="px-2 py-1 rounded-lg border border-neutral-800 bg-neutral-950 text-neutral-400 hover:text-white text-xs font-medium cursor-pointer transition-all"
          >
            {fitMode === "cover" ? "Fill" : "Fit"}
          </button>

          <button
            onClick={() => setShowSafeZone(!showSafeZone)}
            title="Toggle caption margin guidelines"
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
              showSafeZone
                ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                : "bg-neutral-950 text-neutral-400 border-neutral-800 hover:text-white"
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Guides</span>
          </button>

          <div className="flex items-center gap-0.5 bg-neutral-950 p-0.5 rounded-lg border border-neutral-800 text-[11px] font-mono">
            <button
              onClick={() => setAspectRatio("9/16")}
              className={`px-2 py-0.5 rounded cursor-pointer ${
                aspectRatio === "9/16" ? "bg-neutral-800 text-white font-bold" : "text-neutral-400 hover:text-white"
              }`}
            >
              9:16
            </button>
            <button
              onClick={() => setAspectRatio("1/1")}
              className={`px-2 py-0.5 rounded cursor-pointer ${
                aspectRatio === "1/1" ? "bg-neutral-800 text-white font-bold" : "text-neutral-400 hover:text-white"
              }`}
            >
              1:1
            </button>
            <button
              onClick={() => setAspectRatio("16/9")}
              className={`px-2 py-0.5 rounded cursor-pointer ${
                aspectRatio === "16/9" ? "bg-neutral-800 text-white font-bold" : "text-neutral-400 hover:text-white"
              }`}
            >
              16:9
            </button>
          </div>
        </div>
      </div>

      {/* Center Viewport Stage */}
      <div className="flex-1 w-full min-h-0 flex items-center justify-center p-2 overflow-hidden my-1 relative">
        <div
          className="relative bg-black rounded-2xl overflow-hidden shadow-2xl border border-neutral-800 ring-1 ring-neutral-700/50 flex items-center justify-center cursor-pointer group select-none transition-all duration-150"
          style={{
            aspectRatio: aspectRatio,
            maxHeight: "100%",
            maxWidth: "100%",
            ...(aspectRatio === "16/9"
              ? { width: "100%", height: "auto" }
              : { height: "100%", width: "auto" })
          }}
          onClick={togglePlay}
        >
          <video
            ref={videoRef}
            src={videoSrc}
            className={`w-full h-full ${fitMode === "contain" ? "object-contain bg-black" : "object-cover"}`}
            playsInline
            loop
            muted={isMuted}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onEnded={() => setIsPlaying(false)}
          />

          {/* Live Subtitle Caption Overlay */}
          <CaptionOverlay
            segments={segments}
            currentTime={currentTime}
            styleConfig={styleConfig}
            scriptMode={scriptMode}
            isPlaying={isPlaying}
          />

          {/* Instagram Safe Zone Simulation */}
          <InstagramSafeZone
            enabled={showSafeZone && aspectRatio === "9/16"}
            stylePosY={styleConfig.positionYPct}
          />

          {/* Central Play/Pause indicator on pause */}
          {!isPlaying && (
            <div className="absolute inset-0 bg-black/25 flex items-center justify-center pointer-events-none transition-all">
              <div className="w-12 h-12 rounded-full bg-orange-500/90 text-white flex items-center justify-center shadow-lg shadow-orange-500/30">
                <Play className="w-5 h-5 fill-white ml-0.5" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Timeline & Controls Bar */}
      <div className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800/80 flex flex-col gap-1.5 shrink-0">
        {/* Timeline Scrubber */}
        <div className="relative w-full flex items-center">
          <input
            type="range"
            min="0"
            max={duration || 1}
            step="0.05"
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-orange-500 relative z-10"
          />

          {/* Segment Tick Markers */}
          {duration > 0 && segments.map(seg => (
            <div
              key={seg.id}
              className="absolute h-1.5 bg-orange-500/40 rounded pointer-events-none z-0"
              style={{
                left: `${(seg.start / duration) * 100}%`,
                width: `${Math.max(1, ((seg.end - seg.start) / duration) * 100)}%`
              }}
            />
          ))}
        </div>

        {/* Buttons Row */}
        <div className="flex items-center justify-between text-xs text-neutral-300">
          <div className="flex items-center gap-1.5">
            <button
              onClick={togglePlay}
              className="p-1 rounded-md bg-orange-500 text-white hover:bg-orange-600 transition-all cursor-pointer"
              title={isPlaying ? "Pause (Space)" : "Play (Space)"}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5 fill-white" /> : <Play className="w-3.5 h-3.5 fill-white ml-0.5" />}
            </button>

            <button
              onClick={() => skipSeconds(-3)}
              className="p-1 rounded hover:bg-neutral-800 text-neutral-400 hover:text-white transition-all cursor-pointer"
              title="Rewind 3s"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => skipSeconds(3)}
              className="p-1 rounded hover:bg-neutral-800 text-neutral-400 hover:text-white transition-all cursor-pointer"
              title="Fast forward 3s"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>

            <span className="font-mono text-xs text-neutral-400 ml-1">
              <span className="text-white font-semibold">{formatTime(currentTime)}</span> / {formatTime(duration)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={cycleRate}
              className="px-2 py-0.5 rounded bg-neutral-900 hover:bg-neutral-800 font-mono text-[11px] text-neutral-300 border border-neutral-800 transition-all cursor-pointer"
              title="Playback speed"
            >
              {playbackRate}x
            </button>

            <button
              onClick={() => setIsMuted(!isMuted)}
              className="p-1 rounded hover:bg-neutral-800 text-neutral-400 hover:text-white transition-all cursor-pointer"
              title={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5 text-red-400" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
