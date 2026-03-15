import { redirect } from "next/navigation";

import { DailyQuestionScreen } from "@/app/components/daily-question-screen";
import { getCurrentUser } from "@/app/lib/auth";
import { getDailyQuestion, getQuestionById, getRandomQuestion } from "@/app/lib/question";

type HomePageProps = {
  searchParams?: Promise<{
    mode?: string;
    question_id?: string;
    exclude_question_id?: string;
  }>;
};

export default async function Home({ searchParams }: HomePageProps) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const params = searchParams ? await searchParams : undefined;
  const initialMode = params?.mode === "challenge" ? "challenge" : "daily";
  const initialQuestionId = params?.question_id;
  const initialExcludeQuestionId = params?.exclude_question_id;
  const initialQuestion =
    initialQuestionId
      ? await getQuestionById(initialQuestionId)
      : initialMode === "challenge"
        ? (await getRandomQuestion(initialExcludeQuestionId)) ?? (await getDailyQuestion())
        : await getDailyQuestion();

  return (
    <DailyQuestionScreen
      currentUserName={user.name ?? user.email}
      initialMode={initialMode}
      initialQuestionId={initialQuestionId}
      initialExcludeQuestionId={initialExcludeQuestionId}
      initialQuestion={
        initialQuestion
          ? {
              question_id: initialQuestion.id,
              prompt: initialQuestion.prompt,
              choice_a: initialQuestion.choice_a,
              choice_b: initialQuestion.choice_b,
              choice_c: initialQuestion.choice_c,
              choice_d: initialQuestion.choice_d,
            }
          : null
      }
    />
  );
}
