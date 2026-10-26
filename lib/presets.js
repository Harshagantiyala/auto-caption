/**
 * Telugu Captions Studio - Caption Style System & Presets
 * Reverse engineered from tcaptions.vercel.app with high-fidelity defaults.
 */

export const DEFAULT_STYLE = {
  fontFamily: "NTR",
  fontSizePct: 4.2,
  fontWeight: 700,
  color: "#FFFFFF",
  outlineColor: "#000000",
  outlineWidth: 0,
  shadow: true,
  backgroundColor: "#000000",
  backgroundOpacity: 0,
  bgPaddingXPct: 1.2,
  bgPaddingYPct: 0.6,
  align: "center",
  positionYPct: 62,
  lineHeight: 1.1,
  maxWidthPct: 84,
  letterSpacingEm: -0.02,
  textCase: "none", // 'none' | 'upper' | 'lower' | 'capitalize'
  karaoke: false,
  highlightColor: "#E2FF00",
  glowStrength: 1,
  glowColor: "#FFFFFF",
  boxMode: "none", // 'none' | 'inline' | 'box' | 'rounded'
  boxRadiusPct: 0.8,
  animation: "pop", // 'pop' | 'fade' | 'shamani' | 'pinterest' | 'pinterest3' | 'pinterest4'
  textEffect: "none", // 'none' | 'negative'
  emphasisMode: "auto",
  syncOffset: 0.16 // Natural audio lead-in to sync captions perfectly with speech
};

export const STYLE_PRESETS = [
  {
    id: "classic",
    name: "Classic",
    category: "aesthetic",
    tag: "Default",
    sample: "MEERU EE REEL NI CHUSARA",
    description: "Balanced native Telugu font with subtle shadow. Great for storytelling.",
    style: {
      ...DEFAULT_STYLE,
      fontFamily: "NTR",
      fontSizePct: 4.8,
      fontWeight: 700,
      color: "#FFFFFF",
      highlightColor: "#E2FF00",
      outlineWidth: 0,
      shadow: true,
      positionYPct: 65,
      animation: "pop"
    }
  },
  {
    id: "bold",
    name: "Bold Impact",
    category: "impact",
    tag: "Impact",
    sample: "WATCH THIS NOW",
    description: "Punchy Anton font with high-contrast outline for strong hooks.",
    style: {
      ...DEFAULT_STYLE,
      fontFamily: "Anton",
      fontWeight: 400,
      fontSizePct: 6.5,
      color: "#FFFFFF",
      outlineColor: "#000000",
      outlineWidth: 4,
      shadow: true,
      backgroundOpacity: 0,
      boxMode: "none",
      positionYPct: 70,
      maxWidthPct: 90,
      letterSpacingEm: 0.02,
      lineHeight: 1.0,
      textCase: "upper",
      karaoke: false,
      animation: "pop",
      highlightColor: "#FFFFFF"
    }
  },
  {
    id: "karaoke",
    name: "Viral Karaoke",
    category: "sync",
    tag: "Sync",
    sample: "ee vishayam meeku thelusa",
    description: "Word-by-word synchronized red active highlight matching speech cadence.",
    style: {
      ...DEFAULT_STYLE,
      fontFamily: "Montserrat",
      fontWeight: 800,
      fontSizePct: 4.8,
      color: "#FFFFFF",
      highlightColor: "#FF3B30",
      outlineWidth: 2,
      outlineColor: "#000000",
      shadow: true,
      positionYPct: 60,
      maxWidthPct: 88,
      letterSpacingEm: -0.01,
      lineHeight: 1.15,
      textCase: "none",
      karaoke: true,
      animation: "fade"
    }
  },
  {
    id: "highlight",
    name: "Yellow Pill",
    category: "aesthetic",
    tag: "Aesthetic",
    sample: "prathi roju kotha vishayam",
    description: "Modern dark text inside a vibrant yellow inline pill badge.",
    style: {
      ...DEFAULT_STYLE,
      fontFamily: "Inter",
      fontWeight: 700,
      fontSizePct: 3.8,
      color: "#111111",
      highlightColor: "#111111",
      outlineWidth: 0,
      shadow: false,
      backgroundColor: "#FFE600",
      backgroundOpacity: 1,
      bgPaddingXPct: 2.2,
      bgPaddingYPct: 0.8,
      boxMode: "inline",
      boxRadiusPct: 0.6,
      positionYPct: 56,
      maxWidthPct: 86,
      letterSpacingEm: -0.01,
      lineHeight: 1.15,
      textCase: "none",
      karaoke: false,
      animation: "fade"
    }
  },
  {
    id: "negative",
    name: "Negative Cutout",
    category: "aesthetic",
    tag: "Cutout",
    sample: "EXCLUSIVE UPDATE",
    description: "High-contrast inverted color cutout effect popular in movie reviews.",
    style: {
      ...DEFAULT_STYLE,
      fontFamily: "Anton",
      fontWeight: 400,
      fontSizePct: 7.2,
      color: "#FFFFFF",
      highlightColor: "#FFFFFF",
      outlineWidth: 0,
      shadow: false,
      backgroundOpacity: 0,
      boxMode: "none",
      positionYPct: 50,
      maxWidthPct: 90,
      letterSpacingEm: -0.02,
      lineHeight: 1.0,
      textCase: "upper",
      karaoke: false,
      animation: "pop",
      textEffect: "negative"
    }
  },
  {
    id: "raj-shamani",
    name: "Shamani Gold",
    category: "premium",
    tag: "Creator 3.0",
    sample: "MEERU EE REEL NI SAVE CHESUKONDI",
    description: "Viral creator style with rich gold active highlight & high retention.",
    style: {
      ...DEFAULT_STYLE,
      fontFamily: "Anton",
      fontWeight: 400,
      fontSizePct: 7.4,
      color: "#FFFFFF",
      highlightColor: "#FFD400",
      outlineWidth: 0,
      shadow: true,
      glowStrength: 1,
      glowColor: "#FFD400",
      positionYPct: 66,
      maxWidthPct: 84,
      letterSpacingEm: 0.02,
      lineHeight: 1.0,
      textCase: "upper",
      karaoke: true,
      animation: "shamani"
    }
  },
  {
    id: "pinterest-2",
    name: "Editorial Serif",
    category: "premium",
    tag: "Luxury",
    sample: "life is too short for boring videos",
    description: "Aesthetic editorial serif with neon lime karaoke highlight.",
    style: {
      ...DEFAULT_STYLE,
      fontFamily: "Instrument Serif",
      fontWeight: 400,
      fontSizePct: 7.8,
      color: "#FFFFFF",
      highlightColor: "#C8FF00",
      outlineWidth: 0,
      shadow: false,
      positionYPct: 52,
      maxWidthPct: 86,
      letterSpacingEm: -0.02,
      lineHeight: 0.95,
      textCase: "lower",
      karaoke: true,
      animation: "pinterest"
    }
  },
  {
    id: "pinterest-3",
    name: "Nordic Bold",
    category: "premium",
    tag: "Ultra Bold",
    sample: "Nijamga meeru nammuthara",
    description: "Ultra-heavy Inter font with compact letter spacing.",
    style: {
      ...DEFAULT_STYLE,
      fontFamily: "Inter",
      fontWeight: 800,
      fontSizePct: 6.8,
      color: "#FFFFFF",
      highlightColor: "#FFFFFF",
      outlineWidth: 0,
      shadow: false,
      positionYPct: 54,
      maxWidthPct: 88,
      letterSpacingEm: -0.04,
      lineHeight: 0.9,
      textCase: "none",
      karaoke: false,
      animation: "pop"
    }
  },
  {
    id: "soft-focus",
    name: "Soft Minimal",
    category: "quiet",
    tag: "Minimal",
    sample: "simple and clean thoughts",
    description: "Clean aesthetic lower-third placement for calm storytelling clips.",
    style: {
      ...DEFAULT_STYLE,
      fontFamily: "Inter",
      fontWeight: 400,
      fontSizePct: 3.2,
      color: "#FFFFFF",
      highlightColor: "#FFFFFF",
      outlineWidth: 0,
      shadow: true,
      positionYPct: 32,
      maxWidthPct: 74,
      letterSpacingEm: 0.02,
      lineHeight: 1.2,
      textCase: "none",
      karaoke: false,
      animation: "fade"
    }
  }
];

export const AVAILABLE_FONTS = [
  { id: "NTR", name: "NTR (Telugu Native)", category: "Telugu Script", preview: "తెలుగు అక్షరాలు" },
  { id: "Anton", name: "Anton (Impact)", category: "Display Bold", preview: "VIRAL IMPACT" },
  { id: "Montserrat", name: "Montserrat", category: "Modern Sans", preview: "Clean & Punchy" },
  { id: "Inter", name: "Inter", category: "Modern UI", preview: "Neutral Sans" },
  { id: "Instrument Serif", name: "Instrument Serif", category: "Luxury Serif", preview: "Editorial Serif" }
];

export const INSTAGRAM_SAFE_ZONES = {
  topBar: { top: 0, height: 12, label: "Top Search / Reels UI (Blocked)" },
  rightRail: { top: 38, bottom: 85, right: 0, width: 18, label: "Like, Comment & Share (Blocked)" },
  bottomMeta: { bottom: 0, height: 20, label: "Creator Handle, Caption & Audio Pill (Warn)" },
  safeZone: { top: 14, bottom: 78, left: 6, right: 80, label: "Safe Recommendation Zone" }
};
