"use client";

import React from "react";
import { AlertCircle } from "lucide-react";

export default function InstagramSafeZone({ enabled, opacity = 0.85, stylePosY }) {
  if (!enabled) return null;

  // Detect if caption is placed too close to screen edges (top 12% or bottom 18%)
  const isTooHigh = stylePosY < 12;
  const isTooLow = stylePosY > 82;
  const hasCollision = isTooHigh || isTooLow;

  return (
    <div
      className="absolute inset-0 pointer-events-none z-30 select-none overflow-hidden"
      style={{ opacity }}
    >
      {/* Clean Minimal Safe Margin Guidelines (No mock social UI) */}
      <div className="absolute inset-x-5 top-[12%] bottom-[18%] border border-dashed border-emerald-400/40 rounded-xl pointer-events-none flex flex-col justify-between p-2.5">
        <div className="text-[9px] uppercase tracking-wider text-emerald-400 font-mono font-bold bg-black/60 px-2 py-0.5 rounded self-start border border-emerald-400/30">
          ✓ Safe Caption Area
        </div>
        {hasCollision && (
          <div className="self-center bg-rose-600/90 text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-lg flex items-center gap-1.5 animate-bounce">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Warning: Caption position near screen edge</span>
          </div>
        )}
        <div className="text-[9px] uppercase tracking-wider text-emerald-400/70 font-mono self-end bg-black/60 px-2 py-0.5 rounded border border-emerald-400/20">
          Margin Guides
        </div>
      </div>
    </div>
  );
}
