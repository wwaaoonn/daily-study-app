import { DailyQuestionScreen } from "@/app/components/daily-question-screen";

type HomePageProps = {
  searchParams?: Promise<{
    mode?: string;
    exclude_question_id?: string;
  }>;
};

export default async function Home({ searchParams }: HomePageProps) {
  const params = searchParams ? await searchParams : undefined;
  const initialMode = params?.mode === "challenge" ? "challenge" : "daily";
  const initialExcludeQuestionId = params?.exclude_question_id;

  return (
    <DailyQuestionScreen
      initialMode={initialMode}
      initialExcludeQuestionId={initialExcludeQuestionId}
    />
  );
}
