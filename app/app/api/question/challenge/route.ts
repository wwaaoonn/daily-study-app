import { NextResponse } from "next/server";

import { getRandomQuestion } from "@/app/lib/question";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const excludeQuestionId = searchParams.get("exclude_question_id")?.trim() || undefined;
    const question = await getRandomQuestion(excludeQuestionId);

    if (!question) {
      return NextResponse.json(
        { error: "No challenge questions found." },
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
    console.error("Failed to fetch challenge question:", error);

    return NextResponse.json(
      { error: "Failed to fetch challenge question." },
      { status: 500 },
    );
  }
}
