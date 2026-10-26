"use client";

import React, { useState } from "react";
import { useAuth } from "@/lib/authContext";
import {
  Sparkles,
  Zap,
  Lock,
  ArrowRight,
  X,
  CheckCircle2,
  Download,
  Languages,
  Film,
  Loader2,
  Mail
} from "lucide-react";

export default function GuestAuthModal({
  isOpen,
  onClose,
  actionType = "download_video",
  onSuccess
}) {
  const {
    loginWithGoogle,
    loginWithGoogleAccount,
    loginDemoAccount,
    loginWithEmail,
    googleConfigured,
    claimGuestProjects
  } = useAuth();

  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [error, setError] = useState(null);
  const [showEmailInput, setShowEmailInput] = useState(false);

  if (!isOpen) return null;

  const actionTitle =
    actionType === "translate"
      ? "Sign in to translate your captions and get 100 free credits"
      : "Sign in to download your captions and get 100 free credits";

  const actionDesc =
    actionType === "translate"
      ? "Unlock fast dual-script Telugu AI translation and auto-save this project to your account."
      : "Unlock high-definition MP4 downloads, SRT subtitles, and claim this project to your account.";

  // Post-login handler: claim projects & execute continuation
  const handlePostLogin = async (user) => {
    try {
      if (claimGuestProjects) {
        await claimGuestProjects();
      }
    } catch (e) {
      console.warn("Guest claim notice:", e);
    }
    onClose();
    if (typeof onSuccess === "function") {
      onSuccess(user);
    }
  };

  // 1. Continue with Google
  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      if (googleConfigured) {
        // Save pending action to sessionStorage so Studio resumes upon redirect
        if (typeof window !== "undefined") {
          sessionStorage.setItem("tc_pending_guest_action", actionType);
          document.cookie = `tc_return_to=/studio?resumeAction=${encodeURIComponent(actionType)}; path=/; max-age=600; SameSite=Lax`;
        }
        await loginWithGoogle();
      } else {
        // Use instant Google Creator profile if OAuth keys are not configured yet
        const googleUser = {
          id: "google_user_creator",
          name: "Telugu Reels Creator",
          email: "telugu.creator.studio@gmail.com",
          avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80",
          provider: "google"
        };
        const synced = await loginWithGoogleAccount(googleUser);
        await handlePostLogin(synced);
      }
    } catch (err) {
      setError(err.message || "Google sign-in failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // 2. Demo Creator Account (Instant 1-click test)
  const handleDemoSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      const demo = await loginDemoAccount();
      await handlePostLogin(demo);
    } catch (err) {
      setError(err.message || "Sign-in failed");
    } finally {
      setLoading(false);
    }
  };

  // 3. Email Sign-In
  const handleEmailSignIn = async (e) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const user = await loginWithEmail(email, "guest_trial_pass");
      await handlePostLogin(user);
    } catch (err) {
      setError(err.message || "Email login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-3xl bg-neutral-900 border border-neutral-800 p-6 sm:p-7 shadow-2xl overflow-hidden text-neutral-100">
        {/* Subtle orange accent glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={loading}
          className="absolute top-4 right-4 p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800/80 transition-all cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/15 border border-orange-500/30 text-orange-400 text-xs font-bold mb-3">
          <Zap className="w-3.5 h-3.5 fill-orange-400" />
          <span>100 Free Credits Included at Signup</span>
        </div>

        {/* Title & Description */}
        <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-snug">
          {actionTitle}
        </h2>
        <p className="text-xs sm:text-sm text-neutral-400 mt-2 leading-relaxed">
          {actionDesc}
        </p>

        {/* Perks list */}
        <div className="my-5 p-3.5 rounded-2xl bg-neutral-950/70 border border-neutral-800/80 space-y-2">
          <div className="flex items-center gap-2 text-xs text-neutral-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Automatic transfer of your current captions and video</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-neutral-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>100 bonus credits added immediately (never expires)</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-neutral-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Universal MP4 video export & SRT subtitles download</span>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium">
            {error}
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          {/* Main Option: Continue with Google */}
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full py-3.5 px-4 rounded-2xl bg-white hover:bg-neutral-100 text-neutral-900 font-bold text-sm shadow-xl flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin text-neutral-900" />
            ) : (
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            )}
            <span>Continue with Google</span>
          </button>

          {/* Quick Demo Login Option */}
          <button
            onClick={handleDemoSignIn}
            disabled={loading}
            className="w-full py-2.5 px-3 rounded-xl bg-orange-500/15 hover:bg-orange-500/25 border border-orange-500/30 text-orange-400 font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Instant 1-Click Creator Sign In</span>
          </button>

          {/* Email Option Toggle */}
          {!showEmailInput ? (
            <button
              onClick={() => setShowEmailInput(true)}
              className="w-full text-center text-xs text-neutral-400 hover:text-white pt-1 transition-colors cursor-pointer"
            >
              Sign in with email instead
            </button>
          ) : (
            <form onSubmit={handleEmailSignIn} className="pt-2 space-y-2">
              <div className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  className="flex-1 bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-orange-500"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs transition-colors cursor-pointer"
                >
                  Sign In
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
