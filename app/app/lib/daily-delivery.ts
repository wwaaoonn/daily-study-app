import { randomUUID } from "node:crypto";

import { Prisma } from "@/app/generated/prisma/client";

import { hashAnswerToken } from "@/app/lib/answer";
import { getBaseUrl } from "@/app/lib/auth";
import { sendDailyQuestionEmail } from "@/app/lib/email";
import { prisma } from "@/app/lib/prisma";
import { getDailyQuestion, getDateKeyInJst, getQuestionById } from "@/app/lib/question";

function getCronSecret() {
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    throw new Error("CRON_SECRET is not set.");
  }

  return cronSecret;
}

export function isAuthorizedCronRequest(request: Request) {
  const authHeader = request.headers.get("authorization");

  if (!authHeader) {
    return false;
  }

  return authHeader === `Bearer ${getCronSecret()}`;
}

function buildDailyQuestionLink(questionId: string) {
  const url = new URL("/", getBaseUrl());
  url.searchParams.set("question_id", questionId);
  return url.toString();
}

function buildEmailAnswerBaseLink(rawToken: string, choice: string) {
  const url = new URL("/api/email-answer", getBaseUrl());
  url.searchParams.set("token", rawToken);
  url.searchParams.set("choice", choice);
  return url.toString();
}

export async function sendDailyQuestionEmails() {
  return sendQuestionEmails();
}

export async function sendQuestionEmails(input?: {
  questionId?: string;
  forceResend?: boolean;
}) {
  if (!process.env.RESEND_API_KEY || !process.env.MAIL_FROM) {
    throw new Error("RESEND_API_KEY and MAIL_FROM must be set.");
  }

  const question = input?.questionId
    ? await getQuestionById(input.questionId)
    : await getDailyQuestion();

  if (!question) {
    return {
      ok: false as const,
      status: 404,
      message: "No questions found.",
    };
  }

  const deliveryDate = getDateKeyInJst(new Date());
  const users = await prisma.user.findMany({
    where: {
      email_verified_at: {
        not: null,
      },
    },
    select: {
      id: true,
      email: true,
      name: true,
    },
    orderBy: {
      created_at: "asc",
    },
  });

  let sentCount = 0;
  let skippedCount = 0;
  const failures: Array<{ email: string; reason: string }> = [];

  for (const user of users) {
    const existingDelivery = await prisma.dailyDelivery.findUnique({
      where: {
        user_id_delivery_date: {
          user_id: user.id,
          delivery_date: deliveryDate,
        },
      },
      select: {
        id: true,
        status: true,
      },
    });

    if (existingDelivery?.status === "sent") {
      if (!input?.forceResend) {
        skippedCount += 1;
        continue;
      }
    }

    if (existingDelivery && input?.forceResend) {
      await prisma.dailyDelivery.update({
        where: {
          id: existingDelivery.id,
        },
        data: {
          question_id: question.id,
          status: "failed",
          error_message: "manual resend requested",
          answer_token_hash: null,
        },
      });
    }

    const currentDelivery = existingDelivery && input?.forceResend
      ? {
          ...existingDelivery,
          status: "failed",
        }
      : existingDelivery;

    if (currentDelivery?.status === "sent") {
      skippedCount += 1;
      continue;
    }

    try {
      const rawAnswerToken = randomUUID();

      await sendDailyQuestionEmail({
        to: user.email,
        name: user.name,
        questionPrompt: question.prompt,
        questionLink: buildDailyQuestionLink(question.id),
        category: question.category,
        categorySub: question.category_sub,
        choiceA: question.choice_a,
        choiceB: question.choice_b,
        choiceC: question.choice_c,
        choiceD: question.choice_d,
        answerLinkA: buildEmailAnswerBaseLink(rawAnswerToken, "A"),
        answerLinkB: buildEmailAnswerBaseLink(rawAnswerToken, "B"),
        answerLinkC: buildEmailAnswerBaseLink(rawAnswerToken, "C"),
        answerLinkD: buildEmailAnswerBaseLink(rawAnswerToken, "D"),
      });

      if (currentDelivery) {
        await prisma.dailyDelivery.update({
          where: {
            id: currentDelivery.id,
          },
          data: {
            question_id: question.id,
            status: "sent",
            error_message: null,
            answer_token_hash: hashAnswerToken(rawAnswerToken),
            sent_at: new Date(),
          },
        });
      } else {
        await prisma.dailyDelivery.create({
          data: {
            user_id: user.id,
            question_id: question.id,
            delivery_date: deliveryDate,
            status: "sent",
            answer_token_hash: hashAnswerToken(rawAnswerToken),
          },
        });
      }

      sentCount += 1;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        skippedCount += 1;
        continue;
      }

      const reason = error instanceof Error ? error.message : "Unknown error";

      if (currentDelivery) {
        await prisma.dailyDelivery.update({
          where: {
            id: currentDelivery.id,
          },
          data: {
            question_id: question.id,
            status: "failed",
            error_message: reason,
            answer_token_hash: null,
          },
        });
      } else {
        await prisma.dailyDelivery.create({
          data: {
            user_id: user.id,
            question_id: question.id,
            delivery_date: deliveryDate,
            status: "failed",
            error_message: reason,
            answer_token_hash: null,
          },
        });
      }

      failures.push({ email: user.email, reason });
      console.error(`Failed to deliver daily question to ${user.email}:`, error);
    }
  }

  return {
    ok: failures.length === 0,
    status: failures.length === 0 ? 200 : 207,
    questionId: question.id,
    attemptedCount: users.length,
    sentCount,
    skippedCount,
    failureCount: failures.length,
    failures,
  };
}
