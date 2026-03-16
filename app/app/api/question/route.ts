import { NextResponse } from "next/server";

import { getQuestionById } from "@/app/lib/question";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const questionId = searchParams.get("question_id")?.trim();

    if (!questionId) {
      return NextResponse.json(
        { error: "question_id is required." },
        { status: 400 },
      );
    }

    const question = await getQuestionById(questionId);

    if (!question) {
      return NextResponse.json(
        { error: "Question not found." },
        { status: 404 },
      );
    }

    return NextResponse.json({
      question_id: question.id,
      prompt: question.prompt,
      choice_a: question.choice_a,
      choice_b: question.choice_b,
      choice_c: question.choice_c,
      choice_d: question.choice_d,
      category: question.category,
      category_sub: question.category_sub,
    });
  } catch (error) {
    console.error("Failed to fetch question:", error);

    return NextResponse.json(
      { error: "Failed to fetch question." },
      { status: 500 },
    );
  }
}
