import { NextResponse } from "next/server";

/**
 * POST /api/auth/google/verify
 * Verifies a Google ID token from Google Identity Services (One-Tap / Google Sign-In button)
 */
export async function POST(request) {
  try {
    const { credential } = await request.json();

    if (!credential) {
      return NextResponse.json({ ok: false, error: "Missing Google credential" }, { status: 400 });
    }

    // Verify credential with Google's tokeninfo API
    const googleVerifyRes = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`
    );

    if (!googleVerifyRes.ok) {
      const errText = await googleVerifyRes.text();
      return NextResponse.json(
        { ok: false, error: `Invalid Google credential: ${errText}` },
        { status: 401 }
      );
    }

    const payload = await googleVerifyRes.json();

    // Verify audience matches if client id is configured
    const configuredClientId = process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (configuredClientId && payload.aud !== configuredClientId.trim()) {
      return NextResponse.json(
        { ok: false, error: "Google token audience mismatch" },
        { status: 403 }
      );
    }

    // Construct creator user profile
    const user = {
      id: payload.sub || `google_${Date.now()}`,
      name: payload.name || payload.given_name || "Google Creator",
      email: payload.email,
      avatar: payload.picture || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(payload.name || "Creator")}`,
      provider: "google",
      plan: "Creator Pro",
      quotaTotal: 180,
      quotaUsed: 0,
      joined: new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })
    };

    const response = NextResponse.json({ ok: true, user });

    // Set session cookie
    response.cookies.set({
      name: "tc_session",
      value: Buffer.from(JSON.stringify(user)).toString("base64"),
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      sameSite: "lax",
      httpOnly: false
    });

    return response;
  } catch (error) {
    console.error("Google verify error:", error);
    return NextResponse.json(
      { ok: false, error: error.message || "Failed to verify Google sign-in" },
      { status: 500 }
    );
  }
}
