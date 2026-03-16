import { prisma } from "@/app/lib/prisma";

export const questionSelect = {
  id: true,
  prompt: true,
  choice_a: true,
  choice_b: true,
  choice_c: true,
  choice_d: true,
  category: true,
  category_sub: true,
} as const;

export function getDateKeyInJst(date: Date) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  return formatter.format(date);
}

export function getJstDayRange(date = new Date()) {
  const dateKey = getDateKeyInJst(date);
  const start = new Date(`${dateKey}T00:00:00+09:00`);
  const end = new Date(start);

  end.setUTCDate(end.getUTCDate() + 1);

  return { start, end };
}

export async function getRandomQuestion(excludeQuestionId?: string) {
  const where = excludeQuestionId
    ? {
        id: {
          not: excludeQuestionId,
        },
      }
    : undefined;

  const totalQuestions = await prisma.question.count({ where });

  if (totalQuestions === 0) {
    return null;
  }

  return prisma.question.findFirst({
    where,
    orderBy: { id: "asc" },
    skip: Math.floor(Math.random() * totalQuestions),
    select: questionSelect,
  });
}

export async function getQuestionById(questionId: string) {
  return prisma.question.findUnique({
    where: {
      id: questionId,
    },
    select: questionSelect,
  });
}

function hashString(value: string) {
  let hash = 0;

  for (const char of value) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  }

  return hash;
}

export async function getDailyQuestion(date = new Date()) {
  const totalQuestions = await prisma.question.count();

  if (totalQuestions === 0) {
    return null;
  }

  const dateKey = getDateKeyInJst(date);
  const questionIndex = hashString(dateKey) % totalQuestions;

  return prisma.question.findFirst({
    orderBy: { id: "asc" },
    skip: questionIndex,
    select: questionSelect,
  });
}
