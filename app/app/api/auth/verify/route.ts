import { NextResponse } from "next/server";

import { consumeMagicLink, createSession } from "@/app/lib/auth";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const token = searchParams.get("token")?.trim() ?? "";

  if (!token) {
    return NextResponse.redirect(new URL("/login?error=missing-token", origin));
  }

  try {
    const user = await consumeMagicLink(token);

    if (!user) {
      return NextResponse.redirect(new URL("/login?error=invalid-link", origin));
    }

    await createSession(user.id);
    return NextResponse.redirect(new URL("/", origin));
  } catch (error) {
    console.error("Failed to verify magic link:", error);
    return NextResponse.redirect(new URL("/login?error=verify-failed", origin));
  }
}
