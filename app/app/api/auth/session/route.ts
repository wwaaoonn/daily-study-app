import { NextResponse } from "next/server";

import { getCurrentUser } from "@/app/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();

    return NextResponse.json({
      user,
    });
  } catch (error) {
    console.error("Failed to fetch session:", error);

    return NextResponse.json(
      { error: "Failed to fetch session." },
      { status: 500 },
    );
  }
}
