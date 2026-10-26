"use client";

import React, { useState } from "react";
import {
  Sparkles,
  Type,
  Palette,
  Sliders,
  MoveVertical,
  Check,
  Flame,
  Layout,
  Layers,
  Wand2
} from "lucide-react";
import { STYLE_PRESETS, AVAILABLE_FONTS } from "@/lib/presets";

export default function StyleCustomizer({ styleConfig, setStyleConfig }) {
  const [activeTab, setActiveTab] = useState("presets"); // 'presets' | 'typography' | 'colors' | 'position'

  // Apply preset
  const applyPreset = (preset) => {
    setStyleConfig({
      ...preset.style
    });
  };

  // Update specific style field
  const updateStyle = (key, val) => {
    setStyleConfig(prev => ({
      ...prev,
      [key]: val
    }));
  };

  return (
    <div className="flex flex-col h-full bg-neutral-900/40 rounded-2xl border border-neutral-800/80 p-4 overflow-hidden min-h-0">
      {/* Panel Header & Tabs */}
      <div className="pb-3 border-b border-neutral-800">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Wand2 className="w-4 h-4 text-orange-400" />
            <span>Styles 2.0 Studio</span>
          </h2>
          <span className="text-[10px] font-mono bg-orange-500/10 text-orange-400 border border-orange-500/20 px-2 py-0.5 rounded-full font-bold">
            9 Viral Presets
          </span>
        </div>

        {/* Sub-tabs */}
        <div className="grid grid-cols-4 gap-1 bg-neutral-950 p-1 rounded-xl border border-neutral-800 text-xs font-medium">
          <button
            onClick={() => setActiveTab("presets")}
            className={`py-1.5 rounded-lg flex items-center justify-center gap-1 transition-all ${
              activeTab === "presets" ? "bg-neutral-800 text-white font-bold" : "text-neutral-400 hover:text-white"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Presets</span>
          </button>
          <button
            onClick={() => setActiveTab("typography")}
            className={`py-1.5 rounded-lg flex items-center justify-center gap-1 transition-all ${
              activeTab === "typography" ? "bg-neutral-800 text-white font-bold" : "text-neutral-400 hover:text-white"
            }`}
          >
            <Type className="w-3.5 h-3.5" />
            <span>Font</span>
          </button>
          <button
            onClick={() => setActiveTab("colors")}
            className={`py-1.5 rounded-lg flex items-center justify-center gap-1 transition-all ${
              activeTab === "colors" ? "bg-neutral-800 text-white font-bold" : "text-neutral-400 hover:text-white"
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>Colors</span>
          </button>
          <button
            onClick={() => setActiveTab("position")}
            className={`py-1.5 rounded-lg flex items-center justify-center gap-1 transition-all ${
              activeTab === "position" ? "bg-neutral-800 text-white font-bold" : "text-neutral-400 hover:text-white"
            }`}
          >
            <MoveVertical className="w-3.5 h-3.5" />
            <span>Layout</span>
          </button>
        </div>
      </div>

      {/* Tab Body */}
      <div className="flex-1 min-h-0 overflow-y-auto pt-3 pr-1 space-y-4">
        {/* TAB 1: PRESETS */}
        {activeTab === "presets" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {STYLE_PRESETS.map(preset => {
              const isSelected =
                styleConfig.fontFamily === preset.style.fontFamily &&
                styleConfig.karaoke === preset.style.karaoke &&
                styleConfig.boxMode === preset.style.boxMode &&
                styleConfig.textEffect === preset.style.textEffect;

              return (
                <button
                  key={preset.id}
                  onClick={() => applyPreset(preset)}
                  className={`p-3 rounded-xl border text-left transition-all relative overflow-hidden group ${
                    isSelected
                      ? "bg-neutral-800 border-orange-500 ring-1 ring-orange-500/40 shadow-lg"
                      : "bg-neutral-900/60 border-neutral-800 hover:border-neutral-700 hover:bg-neutral-800/50"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-xs text-white">{preset.name}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-neutral-950 text-neutral-400 border border-neutral-800">
                      {preset.tag}
                    </span>
                  </div>

                  {/* Sample visual preview box */}
                  <div className="h-14 bg-neutral-950 rounded-lg flex items-center justify-center p-2 overflow-hidden border border-neutral-800/60">
                    <span
                      style={{
                        fontFamily: preset.style.fontFamily,
                        fontSize: "12px",
                        fontWeight: preset.style.fontWeight,
                        color: preset.style.color,
                        letterSpacing: `${preset.style.letterSpacingEm}em`,
                        textTransform: preset.style.textCase === "upper" ? "uppercase" : "none"
                      }}
                      className="truncate"
                    >
                      {preset.sample}
                    </span>
                  </div>

                  <p className="text-[10px] text-neutral-400 mt-2 line-clamp-1">
                    {preset.description}
                  </p>

                  {isSelected && (
                    <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-orange-500 text-white flex items-center justify-center">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* TAB 2: TYPOGRAPHY */}
        {activeTab === "typography" && (
          <div className="space-y-4">
            {/* Font Family Selection */}
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                Font Family
              </label>
              <div className="grid grid-cols-1 gap-1.5">
                {AVAILABLE_FONTS.map(font => (
                  <button
                    key={font.id}
                    onClick={() => updateStyle("fontFamily", font.id)}
                    className={`p-2.5 rounded-lg border text-left flex items-center justify-between transition-all ${
                      styleConfig.fontFamily === font.id
                        ? "bg-neutral-800 border-orange-500 text-white"
                        : "bg-neutral-950 border-neutral-800 text-neutral-300 hover:border-neutral-700"
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold">{font.name}</div>
                      <div className="text-[10px] text-neutral-400 font-sans">{font.category}</div>
                    </div>
                    <span
                      className="text-sm px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800"
                      style={{ fontFamily: font.id }}
                    >
                      {font.preview}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Font Size Slider */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-semibold text-neutral-300">Font Size (% of video height)</span>
                <span className="font-mono text-orange-400 font-bold">{styleConfig.fontSizePct}%</span>
              </div>
              <input
                type="range"
                min="2.0"
                max="10.0"
                step="0.2"
                value={styleConfig.fontSizePct}
                onChange={e => updateStyle("fontSizePct", parseFloat(e.target.value))}
                className="w-full accent-orange-500 bg-neutral-800 h-2 rounded-lg cursor-pointer"
              />
            </div>

            {/* Text Case Mode */}
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                Text Casing
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "none", label: "Normal (As typed)" },
                  { id: "upper", label: "UPPERCASE" },
                  { id: "lower", label: "lowercase" }
                ].map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => updateStyle("textCase", opt.id)}
                    className={`py-2 px-2 text-xs rounded-lg border text-center transition-all ${
                      styleConfig.textCase === opt.id
                        ? "bg-orange-500 text-white font-bold border-orange-500"
                        : "bg-neutral-950 text-neutral-300 border-neutral-800 hover:bg-neutral-800"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Line Height & Letter Spacing */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-xs text-neutral-300 font-semibold block mb-1">
                  Line Height: {styleConfig.lineHeight}
                </span>
                <input
                  type="range"
                  min="0.85"
                  max="1.5"
                  step="0.05"
                  value={styleConfig.lineHeight}
                  onChange={e => updateStyle("lineHeight", parseFloat(e.target.value))}
                  className="w-full accent-orange-500 bg-neutral-800 h-2 rounded-lg cursor-pointer"
                />
              </div>

              <div>
                <span className="text-xs text-neutral-300 font-semibold block mb-1">
                  Letter Spacing: {styleConfig.letterSpacingEm}em
                </span>
                <input
                  type="range"
                  min="-0.05"
                  max="0.08"
                  step="0.01"
                  value={styleConfig.letterSpacingEm}
                  onChange={e => updateStyle("letterSpacingEm", parseFloat(e.target.value))}
                  className="w-full accent-orange-500 bg-neutral-800 h-2 rounded-lg cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: COLORS & EFFECTS */}
        {activeTab === "colors" && (
          <div className="space-y-4">
            {/* Primary Text Color */}
            <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-orange-400" />
                  <span>Primary Text Color</span>
                </label>
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-orange-400">
                  {styleConfig.color}
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <input
                  type="color"
                  value={styleConfig.color || "#FFFFFF"}
                  onChange={e => {
                    setStyleConfig(prev => ({
                      ...prev,
                      color: e.target.value,
                      textEffect: "none"
                    }));
                  }}
                  className="w-9 h-9 rounded-lg cursor-pointer bg-transparent border-0 shrink-0"
                />
                <input
                  type="text"
                  value={styleConfig.color || "#FFFFFF"}
                  onChange={e => {
                    setStyleConfig(prev => ({
                      ...prev,
                      color: e.target.value,
                      textEffect: "none"
                    }));
                  }}
                  className="w-24 px-2 py-1 bg-neutral-900 border border-neutral-800 rounded font-mono text-xs text-white uppercase"
                />
                {/* Palette quick buttons */}
                <div className="flex flex-wrap gap-1.5 flex-1">
                  {[
                    { color: "#FFFFFF", name: "White" },
                    { color: "#FFE600", name: "Neon Yellow" },
                    { color: "#FFD400", name: "Gold" },
                    { color: "#FF3B30", name: "Flame Red" },
                    { color: "#00F0FF", name: "Cyan" },
                    { color: "#00FF66", name: "Neon Green" },
                    { color: "#111111", name: "Dark" }
                  ].map(item => (
                    <button
                      key={item.color}
                      onClick={() => {
                        setStyleConfig(prev => ({
                          ...prev,
                          color: item.color,
                          textEffect: "none"
                        }));
                      }}
                      className={`w-6 h-6 rounded-full border transition-all cursor-pointer ${
                        styleConfig.color?.toLowerCase() === item.color.toLowerCase()
                          ? "ring-2 ring-orange-500 scale-110 border-white"
                          : "border-neutral-700 hover:scale-105"
                      }`}
                      style={{ backgroundColor: item.color }}
                      title={item.name}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Karaoke Mode Toggle & Highlight Color */}
            <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Flame className="w-3.5 h-3.5 text-orange-400" />
                    <span>Viral Karaoke Highlighting</span>
                  </div>
                  <p className="text-[10px] text-neutral-400">
                    Syncs word-by-word with active speech cadence
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={styleConfig.karaoke}
                  onChange={e => updateStyle("karaoke", e.target.checked)}
                  className="w-4 h-4 accent-orange-500 rounded cursor-pointer"
                />
              </div>

              {styleConfig.karaoke && (
                <div className="pt-2 border-t border-neutral-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-neutral-400">Active Highlight Color:</span>
                    <span className="font-mono text-orange-400 font-bold">{styleConfig.highlightColor}</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <input
                      type="color"
                      value={styleConfig.highlightColor || "#FF3B30"}
                      onChange={e => updateStyle("highlightColor", e.target.value)}
                      className="w-8 h-8 rounded cursor-pointer bg-transparent border-0 shrink-0"
                    />
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { color: "#FF3B30", name: "Red" },
                        { color: "#FFD400", name: "Gold" },
                        { color: "#C8FF00", name: "Lime" },
                        { color: "#00FF66", name: "Green" },
                        { color: "#00F0FF", name: "Cyan" },
                        { color: "#FF00E5", name: "Magenta" },
                        { color: "#FFFFFF", name: "White" }
                      ].map(item => (
                        <button
                          key={item.color}
                          onClick={() => updateStyle("highlightColor", item.color)}
                          className={`w-6 h-6 rounded-full border transition-all cursor-pointer ${
                            styleConfig.highlightColor?.toLowerCase() === item.color.toLowerCase()
                              ? "ring-2 ring-orange-500 scale-110 border-white"
                              : "border-neutral-700 hover:scale-105"
                          }`}
                          style={{ backgroundColor: item.color }}
                          title={item.name}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Outline Stroke Width & Outline Color */}
            <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-neutral-300">Stroke Outline (Border)</span>
                <span className="font-mono text-orange-400 font-bold">{styleConfig.outlineWidth || 0}px</span>
              </div>
              <input
                type="range"
                min="0"
                max="8"
                step="1"
                value={styleConfig.outlineWidth || 0}
                onChange={e => updateStyle("outlineWidth", parseInt(e.target.value))}
                className="w-full accent-orange-500 bg-neutral-800 h-2 rounded-lg cursor-pointer"
              />
              {(styleConfig.outlineWidth || 0) > 0 && (
                <div className="pt-2 border-t border-neutral-800/80 flex items-center justify-between text-xs">
                  <span className="text-neutral-400">Outline Color:</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={styleConfig.outlineColor || "#000000"}
                      onChange={e => updateStyle("outlineColor", e.target.value)}
                      className="w-7 h-7 rounded cursor-pointer bg-transparent border-0"
                    />
                    <div className="flex gap-1.5">
                      {["#000000", "#FFFFFF", "#FF3B30", "#FFD400", "#00F0FF"].map(c => (
                        <button
                          key={c}
                          onClick={() => updateStyle("outlineColor", c)}
                          className={`w-5 h-5 rounded-full border transition-all cursor-pointer ${
                            styleConfig.outlineColor?.toLowerCase() === c.toLowerCase()
                              ? "ring-2 ring-orange-500 scale-110 border-white"
                              : "border-neutral-700"
                          }`}
                          style={{ backgroundColor: c }}
                          title={c}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Background Box Mode */}
            <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-neutral-300">
                  Background Box Style
                </label>
                <span className="text-[10px] text-neutral-400 font-mono capitalize">
                  {styleConfig.boxMode || "None"}
                </span>
              </div>
              <div className="grid grid-cols-4 gap-1.5 text-xs">
                {[
                  { id: "none", label: "None" },
                  { id: "inline", label: "Pill Word" },
                  { id: "box", label: "Block" },
                  { id: "rounded", label: "Rounded" }
                ].map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => {
                      setStyleConfig(prev => ({
                        ...prev,
                        boxMode: opt.id,
                        backgroundOpacity: opt.id !== "none" && (!prev.backgroundOpacity || prev.backgroundOpacity === 0) ? 0.85 : prev.backgroundOpacity
                      }));
                    }}
                    className={`py-1.5 px-2 rounded-lg border text-center transition-all cursor-pointer ${
                      styleConfig.boxMode === opt.id
                        ? "bg-orange-500 text-white font-bold border-orange-500 shadow-sm"
                        : "bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-white"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {styleConfig.boxMode !== "none" && (
                <div className="space-y-2 pt-2 border-t border-neutral-800/80">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-neutral-400">Box Color:</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={styleConfig.backgroundColor || "#000000"}
                        onChange={e => updateStyle("backgroundColor", e.target.value)}
                        className="w-7 h-7 rounded cursor-pointer bg-transparent border-0"
                      />
                      <div className="flex gap-1.5">
                        {["#000000", "#FFE600", "#FF3B30", "#10B981", "#1E1B4B", "#FFFFFF"].map(c => (
                          <button
                            key={c}
                            onClick={() => updateStyle("backgroundColor", c)}
                            className={`w-5 h-5 rounded-full border transition-all cursor-pointer ${
                              styleConfig.backgroundColor?.toLowerCase() === c.toLowerCase()
                                ? "ring-2 ring-orange-500 scale-110 border-white"
                                : "border-neutral-700"
                            }`}
                            style={{ backgroundColor: c }}
                            title={c}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-neutral-400">
                      Opacity: {Math.round((styleConfig.backgroundOpacity ?? 0.85) * 100)}%
                    </span>
                    <input
                      type="range"
                      min="0.1"
                      max="1.0"
                      step="0.05"
                      value={styleConfig.backgroundOpacity ?? 0.85}
                      onChange={e => updateStyle("backgroundOpacity", parseFloat(e.target.value))}
                      className="w-36 accent-orange-500 bg-neutral-800 h-2 rounded-lg cursor-pointer"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Shadow & Negative Cutout Effect Toggle */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <label className="flex items-center gap-2 p-2.5 rounded-xl bg-neutral-950 border border-neutral-800 cursor-pointer hover:border-neutral-700 transition-all">
                <input
                  type="checkbox"
                  checked={styleConfig.shadow}
                  onChange={e => updateStyle("shadow", e.target.checked)}
                  className="accent-orange-500 w-4 h-4 rounded"
                />
                <span className="text-neutral-300 font-medium">Text Drop Shadow</span>
              </label>

              <label className="flex items-center gap-2 p-2.5 rounded-xl bg-neutral-950 border border-neutral-800 cursor-pointer hover:border-neutral-700 transition-all">
                <input
                  type="checkbox"
                  checked={styleConfig.textEffect === "negative"}
                  onChange={e => updateStyle("textEffect", e.target.checked ? "negative" : "none")}
                  className="accent-orange-500 w-4 h-4 rounded"
                />
                <span className="text-neutral-300 font-medium">Negative Cutout</span>
              </label>
            </div>
          </div>
        )}

        {/* TAB 4: POSITION & LAYOUT */}
        {activeTab === "position" && (
          <div className="space-y-4">
            {/* Vertical Position Slider */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-semibold text-neutral-300">Vertical Position (% from top)</span>
                <span className="font-mono text-orange-400 font-bold">{styleConfig.positionYPct}%</span>
              </div>
              <input
                type="range"
                min="18"
                max="82"
                step="1"
                value={styleConfig.positionYPct}
                onChange={e => updateStyle("positionYPct", parseInt(e.target.value))}
                className="w-full accent-orange-500 bg-neutral-800 h-2 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-neutral-500 font-mono mt-1">
                <span>Top (20%)</span>
                <span>Center (50%)</span>
                <span>Bottom Safe Zone (65%)</span>
              </div>
            </div>

            {/* Max Width % */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-semibold text-neutral-300">Max Subtitle Width</span>
                <span className="font-mono text-orange-400 font-bold">{styleConfig.maxWidthPct}%</span>
              </div>
              <input
                type="range"
                min="60"
                max="95"
                step="2"
                value={styleConfig.maxWidthPct}
                onChange={e => updateStyle("maxWidthPct", parseInt(e.target.value))}
                className="w-full accent-orange-500 bg-neutral-800 h-2 rounded-lg cursor-pointer"
              />
            </div>

            {/* Animation Entry Mode */}
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                Word Animation
              </label>
              <div className="grid grid-cols-3 gap-2 text-xs">
                {[
                  { id: "pop", label: "Pop Scale" },
                  { id: "fade", label: "Smooth Fade" },
                  { id: "shamani", label: "Shamani Bounce" }
                ].map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => updateStyle("animation", opt.id)}
                    className={`py-2 px-2 rounded-lg border text-center transition-all ${
                      styleConfig.animation === opt.id
                        ? "bg-orange-500 text-white font-bold border-orange-500"
                        : "bg-neutral-950 text-neutral-300 border-neutral-800 hover:bg-neutral-800"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
