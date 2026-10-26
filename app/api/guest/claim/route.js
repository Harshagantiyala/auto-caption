import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/authServer";
import { claimGuestProjects } from "@/lib/db";

/**
 * POST /api/guest/claim
 * Transfers any unclaimed guest projects linked to the tc_guest cookie
 * to the authenticated user's account upon login or registration.
 */
export async function POST(request) {
  try {
    const { authenticated, user } = getAuthenticatedUser(request);
    if (!authenticated || !user) {
      return NextResponse.json(
        { ok: false, error: "Authentication required to claim guest projects", code: "AUTH_REQUIRED" },
        { status: 401 }
      );
    }

    const guestCookie = request.cookies.get("tc_guest");
    let guestId = guestCookie?.value;

    // Fallback: check if guestId was provided in JSON body
    if (!guestId) {
      try {
        const body = await request.json();
        guestId = body?.guestId;
      } catch {}
    }

    if (!guestId) {
      return NextResponse.json({
        ok: true,
        claimedCount: 0,
        projects: []
      });
    }

    const claimed = claimGuestProjects(guestId, user.id);

    return NextResponse.json({
      ok: true,
      claimedCount: claimed.length,
      projects: claimed
    });
  } catch (error) {
    console.error("Error claiming guest projects:", error);
    return NextResponse.json(
      { ok: false, error: error.message || "Failed to claim guest projects" },
      { status: 500 }
    );
  }
}
