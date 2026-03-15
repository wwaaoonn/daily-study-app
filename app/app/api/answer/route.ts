import { randomUUID } from "node:crypto";

import { NextResponse } from "next/server";

import { requireCurrentUser } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";

const VALID_CHOICES = new Set(["A", "B", "C", "D"]);

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

    if (!VALID_CHOICES.has(selectedChoice)) {
      return NextResponse.json(
        { error: "selected_choice must be one of A, B, C, or D." },
        { status: 400 },
      );
    }

    const question = await prisma.question.findUnique({
      where: { id: questionId },
      select: {
        id: true,
        correct_choice: true,
        explanation: true,
      },
    });

    if (!question) {
      return NextResponse.json(
        { error: "Question not found." },
        { status: 404 },
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

    const isCorrect = question.correct_choice === selectedChoice;

    await prisma.answer.create({
      data: {
        id: randomUUID(),
        user_id: user.id,
        question_id: question.id,
        selected_choice: selectedChoice,
        is_correct: isCorrect,
      },
    });

    return NextResponse.json({
      correct: isCorrect,
      correct_choice: question.correct_choice,
      explanation: question.explanation,
    });
  } catch (error) {
    console.error("Failed to submit answer:", error);

    return NextResponse.json(
      { error: "Failed to submit answer." },
      { status: 500 },
    );
  }
}
