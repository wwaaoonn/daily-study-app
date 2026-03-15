import { NextResponse } from "next/server";

import { getDashboardStats } from "@/app/lib/dashboard";

export async function GET() {
  try {
    const stats = await getDashboardStats();
    return NextResponse.json(stats);
  } catch (error) {
    console.error("Failed to fetch dashboard stats:", error);

    return NextResponse.json(
      { error: "Failed to fetch dashboard stats." },
      { status: 500 },
    );
  }
}
