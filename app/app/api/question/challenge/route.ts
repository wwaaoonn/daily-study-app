import { NextResponse } from "next/server";

import { getRandomQuestion } from "@/app/lib/question";

export async function GET() {
  try {
    const question = await getRandomQuestion();

    if (!question) {
      return NextResponse.json(
        { error: "No questions found." },
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
    });
  } catch (error) {
    console.error("Failed to fetch challenge question:", error);

    return NextResponse.json(
      { error: "Failed to fetch challenge question." },
      { status: 500 },
    );
  }
}
