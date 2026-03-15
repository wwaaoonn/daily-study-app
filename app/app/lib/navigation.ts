import { prisma } from "@/app/lib/prisma";
import { getDailyQuestion, getJstDayRange } from "@/app/lib/question";

export async function getQuestionReturnHref(userId: string) {
  const dailyQuestion = await getDailyQuestion();

  if (!dailyQuestion) {
    return "/";
  }

  const { start, end } = getJstDayRange();
  const dailyAnswer = await prisma.answer.findFirst({
    where: {
      user_id: userId,
      question_id: dailyQuestion.id,
      answered_at: {
        gte: start,
        lt: end,
      },
    },
    select: {
      id: true,
    },
  });

  if (!dailyAnswer) {
    return "/";
  }

  return `/?mode=challenge&exclude_question_id=${dailyQuestion.id}`;
}
