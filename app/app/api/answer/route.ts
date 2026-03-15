import { NextResponse } from "next/server";

import { ChoiceKey, VALID_CHOICES, createAnswer } from "@/app/lib/answer";
import { requireCurrentUser } from "@/app/lib/auth";

type SubmitAnswerRequest = {
  question_id?: string;
  selected_choice?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as SubmitAnswerRequest;
    const questionId = body.question_id?.trim();
    const selectedChoice = body.selected_choice?.trim().toUpperCase();

    if (!questionId || !selectedChoice) {
      return NextResponse.json(
        { error: "question_id and selected_choice are required." },
        { status: 400 },
      );
    }

    if (!selectedChoice || !VALID_CHOICES.has(selectedChoice as "A" | "B" | "C" | "D")) {
      return NextResponse.json(
        { error: "selected_choice must be one of A, B, C, or D." },
        { status: 400 },
      );
    }

    let user;

    try {
      user = await requireCurrentUser();
    } catch {
      return NextResponse.json(
        { error: "Authentication required." },
        { status: 401 },
      );
    }

    const result = await createAnswer({
      userId: user.id,
      questionId,
      selectedChoice: selectedChoice as ChoiceKey,
    });

    if (!result) {
      return NextResponse.json(
        { error: "Question not found." },
        { status: 404 },
      );
    }

    return NextResponse.json({
      correct: result.correct,
      correct_choice: result.correctChoice,
      explanation: result.explanation,
    });
  } catch (error) {
    console.error("Failed to submit answer:", error);

    return NextResponse.json(
      { error: "Failed to submit answer." },
      { status: 500 },
    );
  }
}
