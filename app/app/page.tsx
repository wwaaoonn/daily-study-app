import { DailyQuestionScreen } from "@/app/components/daily-question-screen";

type HomePageProps = {
  searchParams?: Promise<{
    mode?: string;
    question_id?: string;
    exclude_question_id?: string;
  }>;
};

export default async function Home({ searchParams }: HomePageProps) {
  const params = searchParams ? await searchParams : undefined;
  const initialMode = params?.mode === "challenge" ? "challenge" : "daily";
  const initialQuestionId = params?.question_id;
  const initialExcludeQuestionId = params?.exclude_question_id;

  return (
    <DailyQuestionScreen
      initialMode={initialMode}
      initialQuestionId={initialQuestionId}
      initialExcludeQuestionId={initialExcludeQuestionId}
    />
  );
}
