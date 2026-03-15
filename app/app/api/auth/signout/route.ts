import { NextResponse } from "next/server";

import { signOutCurrentSession } from "@/app/lib/auth";

export async function POST(request: Request) {
  try {
    await signOutCurrentSession();

    const accept = request.headers.get("accept") ?? "";
    if (accept.includes("text/html")) {
      return NextResponse.redirect(new URL("/login", request.url), 303);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to sign out:", error);

    return NextResponse.json(
      { error: "Failed to sign out." },
      { status: 500 },
    );
  }
}
