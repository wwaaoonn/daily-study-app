"use client";

import { useEffect, useState } from "react";

type ChoiceKey = "A" | "B" | "C" | "D";

type DailyQuestion = {
  question_id: string;
  prompt: string;
  choice_a: string;
  choice_b: string;
  choice_c: string;
  choice_d: string;
};

type AnswerResult = {
  correct: boolean;
  correct_choice: ChoiceKey;
  explanation: string;
};

type QuestionMode = "daily" | "challenge";

const choiceOrder: ChoiceKey[] = ["A", "B", "C", "D"];
const displayName = "Takato";

function getChoiceText(question: DailyQuestion, choice: ChoiceKey) {
  if (choice === "A") return question.choice_a;
  if (choice === "B") return question.choice_b;
  if (choice === "C") return question.choice_c;
  return question.choice_d;
}

export function DailyQuestionScreen() {
  const [question, setQuestion] = useState<DailyQuestion | null>(null);
  const [questionMode, setQuestionMode] = useState<QuestionMode>("daily");
  const [isLoadingQuestion, setIsLoadingQuestion] = useState(true);
  const [questionError, setQuestionError] = useState<string | null>(null);
  const [selectedChoice, setSelectedChoice] = useState<ChoiceKey | null>(null);
  const [answerResult, setAnswerResult] = useState<AnswerResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isLoadingChallenge, setIsLoadingChallenge] = useState(false);
  const [challengeError, setChallengeError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let isActive = true;

    async function loadQuestion() {
      setQuestionMode("daily");
      setIsLoadingQuestion(true);
      setQuestionError(null);
      setSubmitError(null);
      setChallengeError(null);
      setIsLoadingChallenge(false);
      setSelectedChoice(null);
      setAnswerResult(null);

      try {
        const response = await fetch("/api/question/daily", {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("問題の取得に失敗しました。");
        }

        const data = (await response.json()) as DailyQuestion;

        if (!isActive) {
          return;
        }

        setQuestion(data);
      } catch (error) {
        if (!isActive) {
          return;
        }

        console.error(error);
        setQuestionError("問題を読み込めませんでした。時間をおいて再度お試しください。");
      } finally {
        if (isActive) {
          setIsLoadingQuestion(false);
        }
      }
    }

    void loadQuestion();

    return () => {
      isActive = false;
    };
  }, [reloadKey]);

  async function handleSubmit(choice: ChoiceKey) {
    if (!question || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    setSelectedChoice(choice);

    try {
      const response = await fetch("/api/answer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question_id: question.question_id,
          selected_choice: choice,
        }),
      });

      if (!response.ok) {
        throw new Error("回答の送信に失敗しました。");
      }

      const data = (await response.json()) as AnswerResult;
      setAnswerResult(data);
    } catch (error) {
      console.error(error);
      setSubmitError("回答を送信できませんでした。もう一度お試しください。");
      setSelectedChoice(null);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleChallengeMore() {
    if (!question || isLoadingChallenge) {
      return;
    }

    setIsLoadingChallenge(true);
    setChallengeError(null);

    try {
      const searchParams = new URLSearchParams({
        exclude_question_id: question.question_id,
      });
      const response = await fetch(`/api/question/challenge?${searchParams.toString()}`, {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("追加問題の取得に失敗しました。");
      }

      const data = (await response.json()) as DailyQuestion;
      setQuestion(data);
      setQuestionMode("challenge");
      setSubmitError(null);
      setSelectedChoice(null);
      setAnswerResult(null);
    } catch (error) {
      console.error(error);
      setChallengeError("別の問題を読み込めませんでした。時間をおいて再度お試しください。");
    } finally {
      setIsLoadingChallenge(false);
    }
  }

  const isAnswered = question !== null && answerResult !== null && selectedChoice !== null;
  const eyebrowText = isAnswered
    ? questionMode === "daily"
      ? "英語ミッションの結果"
      : "追加チャレンジの結果"
    : questionMode === "daily"
      ? "今日の英語ミッション"
      : "追加チャレンジ";
  const greetingText = isAnswered
    ? "今回のチャレンジ結果はこちら！"
    : questionMode === "daily"
      ? "今日のクエストはこちら！"
      : "次のクエストに挑戦しよう！";

  return (
    <main className="mission-shell">
      <section className="mission-panel">
        <header className="mission-header">
          <p className="mission-eyebrow">{eyebrowText}</p>
          <h1 className="mission-greeting">{displayName}さん、{greetingText}</h1>
        </header>

        {isLoadingQuestion ? (
          <section className="mission-card">
            <p className="mission-copy">問題を読み込んでいます...</p>
          </section>
        ) : null}

        {!isLoadingQuestion && questionError ? (
          <section className="mission-card">
            <p className="mission-copy">{questionError}</p>
            <button
              className="mission-secondary-button"
              type="button"
              onClick={() => setReloadKey((current) => current + 1)}
            >
              再読み込み
            </button>
          </section>
        ) : null}

        {!isLoadingQuestion && question ? (
          <>
            {!isAnswered ? (
              <>
                <section className="mission-card mission-question-card">
                  <p className="mission-question">{question.prompt}</p>
                </section>

                <section className="mission-answer-section" aria-label="回答選択">
                  <p className="mission-section-label">答えをタップ</p>
                  <div className="mission-choice-grid">
                    {choiceOrder.map((choice) => (
                      <button
                        key={choice}
                        className="mission-choice-button"
                        type="button"
                        onClick={() => void handleSubmit(choice)}
                        disabled={isSubmitting}
                      >
                        {choice}. {getChoiceText(question, choice)}
                      </button>
                    ))}
                  </div>
                  {submitError ? <p className="mission-error">{submitError}</p> : null}
                </section>

                <p className="mission-footer-note">
                  継続は力なり！今日も1分クエスト達成しよう
                </p>
              </>
            ) : null}

            {isAnswered ? (
              <>
                <section className="mission-card">
                  <p className="mission-result-title">
                    {answerResult.correct ? "正解！" : "おしい！"}
                  </p>
                  <p className="mission-copy">
                    正解は{" "}
                    <strong>
                      {answerResult.correct_choice}.{" "}
                      {getChoiceText(question, answerResult.correct_choice)}
                    </strong>
                  </p>
                  <p className="mission-copy">
                    あなたの回答：
                    <strong className={answerResult.correct ? "mission-highlight" : ""}>
                      {" "}
                      {selectedChoice}. {getChoiceText(question, selectedChoice)}
                    </strong>
                  </p>
                </section>

                <section className="mission-card">
                  <h2 className="mission-section-title">解説</h2>
                  <p className="mission-copy">{answerResult.explanation}</p>
                </section>

                <p className="mission-footer-note">
                  {answerResult.correct
                    ? "連続チャレンジ1日目！このまま頑張ろう:)"
                    : "次の1問で挽回しよう。続けるほど力になります。"}
                </p>

                <div className="mission-action-row">
                  <button
                    className="mission-primary-button"
                    type="button"
                    onClick={() => void handleChallengeMore()}
                    disabled={isLoadingChallenge}
                  >
                    {isLoadingChallenge ? "次の問題を読み込み中..." : "別の問題にチャレンジ"}
                  </button>
                </div>
                {challengeError ? <p className="mission-error">{challengeError}</p> : null}
              </>
            ) : null}
          </>
        ) : null}
      </section>
    </main>
  );
}
