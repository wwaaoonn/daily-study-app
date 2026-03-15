import { NextResponse } from "next/server";

import { requireCurrentUser } from "@/app/lib/auth";
import { getDashboardStats } from "@/app/lib/dashboard";

export async function GET() {
  try {
    const user = await requireCurrentUser();
    const stats = await getDashboardStats(user.id);
    return NextResponse.json(stats);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { error: "Authentication required." },
        { status: 401 },
      );
    }
    console.error("Failed to fetch dashboard stats:", error);

    return NextResponse.json(
      { error: "Failed to fetch dashboard stats." },
      { status: 500 },
    );
  }
}
