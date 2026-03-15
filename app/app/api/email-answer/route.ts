import { NextResponse } from "next/server";

import { ChoiceKey, VALID_CHOICES, createAnswer, getAnswerResultById, hashAnswerToken } from "@/app/lib/answer";
import { createSession, getBaseUrl } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";

function getDeliveryRange(deliveryDate: string) {
  const start = new Date(`${deliveryDate}T00:00:00+09:00`);
  const end = new Date(start);

  end.setUTCDate(end.getUTCDate() + 1);

  return { start, end };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token")?.trim() ?? "";
  const selectedChoice = searchParams.get("choice")?.trim().toUpperCase() as ChoiceKey;
  const redirectUrl = new URL("/", getBaseUrl());

  if (!token || !VALID_CHOICES.has(selectedChoice)) {
    redirectUrl.searchParams.set("email_answer_error", "invalid-link");
    return NextResponse.redirect(redirectUrl);
  }

  try {
    const tokenHash = hashAnswerToken(token);
    const delivery = await prisma.$transaction(async (tx) => {
      const deliveryRecord = await tx.dailyDelivery.findFirst({
        where: {
          answer_token_hash: tokenHash,
        },
        select: {
          id: true,
          user_id: true,
          question_id: true,
          delivery_date: true,
        },
      });

      if (!deliveryRecord) {
        return null;
      }

      const consumed = await tx.dailyDelivery.updateMany({
        where: {
          id: deliveryRecord.id,
          answer_token_hash: tokenHash,
        },
        data: {
          answer_token_hash: null,
        },
      });

      if (consumed.count !== 1) {
        return null;
      }

      return deliveryRecord;
    });

    if (!delivery) {
      redirectUrl.searchParams.set("email_answer_error", "invalid-link");
      return NextResponse.redirect(redirectUrl);
    }

    await createSession(delivery.user_id);

    const { start, end } = getDeliveryRange(delivery.delivery_date);
    const existingAnswer = await prisma.answer.findFirst({
      where: {
        user_id: delivery.user_id,
        question_id: delivery.question_id,
        answered_at: {
          gte: start,
          lt: end,
        },
      },
      orderBy: {
        answered_at: "desc",
      },
      select: {
        id: true,
      },
    });

    const answerResult =
      existingAnswer
        ? await getAnswerResultById({
            answerId: existingAnswer.id,
            userId: delivery.user_id,
          })
        : await createAnswer({
            userId: delivery.user_id,
            questionId: delivery.question_id,
            selectedChoice,
          });

    if (!answerResult) {
      redirectUrl.searchParams.set("email_answer_error", "question-not-found");
      return NextResponse.redirect(redirectUrl);
    }

    redirectUrl.searchParams.set("question_id", answerResult.questionId);
    redirectUrl.searchParams.set("answer_id", answerResult.answerId);

    if (existingAnswer) {
      redirectUrl.searchParams.set("email_answer_notice", "already-answered");
    }

    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    console.error("Failed to handle email answer:", error);
    redirectUrl.searchParams.set("email_answer_error", "submit-failed");
    return NextResponse.redirect(redirectUrl);
  }
}
