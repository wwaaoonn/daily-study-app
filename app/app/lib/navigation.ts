import { getDefaultUser } from "@/app/lib/default-user";
import { prisma } from "@/app/lib/prisma";
import { getDailyQuestion, getJstDayRange } from "@/app/lib/question";

export async function getQuestionReturnHref() {
  const [user, dailyQuestion] = await Promise.all([getDefaultUser(), getDailyQuestion()]);

  if (!dailyQuestion) {
    return "/";
  }

  const { start, end } = getJstDayRange();
  const dailyAnswer = await prisma.answer.findFirst({
    where: {
      user_id: user.id,
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
