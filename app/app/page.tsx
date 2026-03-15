import { redirect } from "next/navigation";

import { DailyQuestionScreen } from "@/app/components/daily-question-screen";
import { getCurrentUser } from "@/app/lib/auth";
import { getAnswerResultById } from "@/app/lib/answer";
import { getDailyQuestion, getQuestionById, getRandomQuestion } from "@/app/lib/question";

type HomePageProps = {
  searchParams?: Promise<{
    mode?: string;
    question_id?: string;
    exclude_question_id?: string;
    answer_id?: string;
    email_answer_error?: string;
    email_answer_notice?: string;
  }>;
};

export default async function Home({ searchParams }: HomePageProps) {
  const params = searchParams ? await searchParams : undefined;
  const nextSearchParams = new URLSearchParams();

  if (params?.mode === "challenge") {
    nextSearchParams.set("mode", "challenge");
  }

  if (params?.question_id) {
    nextSearchParams.set("question_id", params.question_id);
  }

  if (params?.answer_id) {
    nextSearchParams.set("answer_id", params.answer_id);
  }

  if (params?.exclude_question_id) {
    nextSearchParams.set("exclude_question_id", params.exclude_question_id);
  }

  const user = await getCurrentUser();

  if (!user) {
    const nextPath = nextSearchParams.toString();
    const loginPath = nextPath
      ? `/login?next=${encodeURIComponent(`/?${nextPath}`)}`
      : "/login";

    redirect(loginPath);
  }

  const initialMode = params?.mode === "challenge" ? "challenge" : "daily";
  const initialQuestionId = params?.question_id;
  const initialExcludeQuestionId = params?.exclude_question_id;
  const initialAnswerId = params?.answer_id;
  const initialQuestion =
    initialQuestionId
      ? await getQuestionById(initialQuestionId)
      : initialMode === "challenge"
        ? (await getRandomQuestion(initialExcludeQuestionId)) ?? (await getDailyQuestion())
        : await getDailyQuestion();
  const initialAnswerResult =
    initialAnswerId
      ? await getAnswerResultById({
          answerId: initialAnswerId,
          userId: user.id,
        })
      : null;

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
      initialSelectedChoice={initialAnswerResult?.selectedChoice ?? null}
      initialAnswerResult={
        initialAnswerResult
          ? {
              correct: initialAnswerResult.correct,
              correct_choice: initialAnswerResult.correctChoice,
              explanation: initialAnswerResult.explanation,
            }
          : null
      }
      initialEmailAnswerError={params?.email_answer_error ?? null}
      initialEmailAnswerNotice={params?.email_answer_notice ?? null}
    />
  );
}
