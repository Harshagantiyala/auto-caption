import { getOrCreateUser, getUserById, getOrCreateGuestSession } from "./db";

/**
 * Server-side helper to authenticate request from session cookie
 * and synchronize with SQLite database.
 */
export function getAuthenticatedUser(request) {
  try {
    const cookie = request.cookies.get("tc_session");
    if (!cookie?.value) {
      return { authenticated: false, user: null };
    }

    const decoded = Buffer.from(cookie.value, "base64").toString("utf-8");
    const sessionData = JSON.parse(decoded);

    if (!sessionData || !sessionData.id) {
      return { authenticated: false, user: null };
    }

    // Synchronize or fetch live user record with live credits balance from DB
    const dbUser = getOrCreateUser(sessionData);

    return {
      authenticated: Boolean(dbUser),
      user: dbUser
    };
  } catch (err) {
    console.warn("Could not authenticate session cookie:", err.message);
    return { authenticated: false, user: null };
  }
}

/**
 * Extract client IP from incoming Next.js Request
 */
export function getClientIp(request) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const ip = forwarded.split(",")[0].trim();
    if (ip) return ip;
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  return "127.0.0.1";
}

/**
 * Server-side helper to resolve or initialize an anonymous guest session.
 */
export function getGuestSession(request) {
  const cookie = request.cookies.get("tc_guest");
  const ip = getClientIp(request);
  const guestSession = getOrCreateGuestSession(cookie?.value, ip);
  return {
    guestId: guestSession.id,
    session: guestSession,
    ip
  };
}

/**
 * Verify Cloudflare Turnstile token server-side.
 * Gracefully bypasses if TURNSTILE_SECRET_KEY is not configured in .env.local.
 */
export async function verifyTurnstileToken(token, ip) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret || !secret.trim()) {
    // If not configured, allow in development/testing
    return { success: true, bypassed: true };
  }

  if (!token) {
    return { success: false, error: "Missing Turnstile verification token" };
  }

  try {
    const formData = new URLSearchParams();
    formData.append("secret", secret.trim());
    formData.append("response", token.trim());
    if (ip) formData.append("remoteip", ip);

    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body: formData,
      headers: { "Content-Type": "application/x-www-form-urlencoded" }
    });

    const data = await res.json();
    if (data.success) {
      return { success: true };
    } else {
      return { success: false, error: data["error-codes"]?.join(", ") || "Turnstile verification failed" };
    }
  } catch (err) {
    console.error("Turnstile verification request error:", err);
    return { success: false, error: "Cloudflare Turnstile verification server error" };
  }
}

