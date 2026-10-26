/**
 * TELUGU CAPTIONS STUDIO - PRICING & CREDITS CONFIGURATION
 * Single source of truth for credit pricing, rate rules, and usage limits.
 */

export const PRICING_RULES = {
  // Credits granted once upon signup (or initial migration for existing users)
  SIGNUP_BONUS_CREDITS: 100,

  // Caption generation rate: 1 credit per minute of video (round up)
  // e.g., 15 sec -> 1 credit, 61 sec -> 2 credits
  CAPTION_CREDITS_PER_MINUTE: 1,

  // Translation rate: 0.5 credits per minute per language (round up)
  // e.g., 45 sec -> 0.5 rounded up to 1 credit
  TRANSLATION_CREDITS_PER_MINUTE: 0.5,

  // Burned-in MP4 video rendering & download: 1 credit per export
  BURNED_VIDEO_EXPORT_CREDITS: 1,

  // Subtitle file download (SRT / VTT): Free for manual editing
  SRT_EXPORT_CREDITS: 0,

  // Helper: Calculate caption generation credits from video duration in seconds
  calculateCaptionCost: (durationSec) => {
    const sec = Math.max(1, Number(durationSec) || 1);
    const minutes = Math.ceil(sec / 60);
    return Math.max(1, minutes * PRICING_RULES.CAPTION_CREDITS_PER_MINUTE);
  },

  // Helper: Calculate translation credits from duration in seconds & language count
  calculateTranslationCost: (durationSec, numLanguages = 1) => {
    const sec = Math.max(1, Number(durationSec) || 1);
    const minutes = Math.ceil(sec / 60);
    return Math.max(1, Math.ceil(minutes * PRICING_RULES.TRANSLATION_CREDITS_PER_MINUTE * numLanguages));
  },

  // Helper: Calculate export cost
  calculateExportCost: () => {
    return PRICING_RULES.BURNED_VIDEO_EXPORT_CREDITS;
  },

  // Phase 6 Integration: Guest Trial Limits
  GUEST_TRIAL_LIMITS: {
    MAX_TRIALS_PER_SESSION: 1,
    MAX_VIDEO_DURATION_SEC: 120, // 2 minutes max for trial
    MAX_FILE_SIZE_MB: 100, // 100 MB placeholder
    MAX_TRIALS_PER_IP_24H: 2,
    CLEANUP_HOURS: 48
  }
};
