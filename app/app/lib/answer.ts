import { createHash, randomUUID } from "node:crypto";

import { prisma } from "@/app/lib/prisma";

export type ChoiceKey = "A" | "B" | "C" | "D";

export const VALID_CHOICES = new Set<ChoiceKey>(["A", "B", "C", "D"]);

export function hashAnswerToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function createAnswer(input: {
  userId: string;
  questionId: string;
  selectedChoice: ChoiceKey;
  source?: string;
  sourceDetail?: string | null;
}) {
  const question = await prisma.question.findUnique({
    where: { id: input.questionId },
    select: {
      id: true,
      correct_choice: true,
      explanation: true,
    },
  });

  if (!question) {
    return null;
  }

  const isCorrect = question.correct_choice === input.selectedChoice;
  const answer = await prisma.answer.create({
    data: {
      id: randomUUID(),
      user_id: input.userId,
      question_id: question.id,
      selected_choice: input.selectedChoice,
      is_correct: isCorrect,
      source: input.source ?? "unknown",
      source_detail: input.sourceDetail ?? null,
    },
    select: {
      id: true,
      question_id: true,
      selected_choice: true,
      is_correct: true,
      source: true,
      source_detail: true,
      question: {
        select: {
          correct_choice: true,
          explanation: true,
        },
      },
    },
  });

  return {
    answerId: answer.id,
    questionId: answer.question_id,
    selectedChoice: answer.selected_choice as ChoiceKey,
    correct: answer.is_correct,
    correctChoice: answer.question.correct_choice as ChoiceKey,
    explanation: answer.question.explanation,
    source: answer.source,
    sourceDetail: answer.source_detail,
  };
}

export async function getAnswerResultById(input: {
  answerId: string;
  userId: string;
}) {
  const answer = await prisma.answer.findFirst({
    where: {
      id: input.answerId,
      user_id: input.userId,
    },
    select: {
      id: true,
      question_id: true,
      selected_choice: true,
      is_correct: true,
      source: true,
      source_detail: true,
      question: {
        select: {
          correct_choice: true,
          explanation: true,
        },
      },
    },
  });

  if (!answer) {
    return null;
  }

  return {
    answerId: answer.id,
    questionId: answer.question_id,
    selectedChoice: answer.selected_choice as ChoiceKey,
    correct: answer.is_correct,
    correctChoice: answer.question.correct_choice as ChoiceKey,
    explanation: answer.question.explanation,
    source: answer.source,
    sourceDetail: answer.source_detail,
  };
}
