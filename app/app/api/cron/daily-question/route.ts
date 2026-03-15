import { NextResponse } from "next/server";

import { isAuthorizedCronRequest, sendQuestionEmails } from "@/app/lib/daily-delivery";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    if (!isAuthorizedCronRequest(request)) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const questionId = searchParams.get("question_id")?.trim() || undefined;
    const forceResend = searchParams.get("force_resend") === "true";
    const result = await sendQuestionEmails({
      questionId,
      forceResend,
    });

    return NextResponse.json(result, { status: result.status });
  } catch (error) {
    console.error("Failed to send daily question emails:", error);

    return NextResponse.json(
      { error: "Failed to send daily question emails." },
      { status: 500 },
    );
  }
}
