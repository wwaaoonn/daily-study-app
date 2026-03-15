import Link from "next/link";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/app/lib/auth";
import { getDashboardStats } from "@/app/lib/dashboard";
import { getQuestionReturnHref } from "@/app/lib/navigation";

export const metadata = {
  title: "Dashboard | Daily Study App",
  description: "回答状況と学習の継続状況を確認できるダッシュボードです。",
};

const weekdayLabels = ["日", "月", "火", "水", "木", "金", "土"];
const calendarWindowDays = 70;

function formatDateLabel(dateKey: string) {
  const date = new Date(`${dateKey}T00:00:00+09:00`);

  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    month: "short",
    day: "numeric",
  }).format(date);
}

function getDayNumber(dateKey: string) {
  const date = new Date(`${dateKey}T00:00:00+09:00`);

  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    day: "numeric",
  }).format(date);
}

function getMonthLabel(dateKey: string) {
  const date = new Date(`${dateKey}T00:00:00+09:00`);

  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    month: "long",
  }).format(date);
}

function getDateKeyInJst(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function buildCalendar(answeredDates: Array<{ date: string; count: number }>) {
  const activityMap = new Map(answeredDates.map((entry) => [entry.date, entry.count]));
  const today = new Date();
  const cells: Array<{
    dateKey: string;
    count: number;
    label: string;
    monthLabel: string | null;
  }> = [];
  let previousMonthLabel: string | null = null;

  for (let offset = calendarWindowDays - 1; offset >= 0; offset -= 1) {
    const date = new Date(today);
    date.setUTCDate(date.getUTCDate() - offset);
    const dateKey = getDateKeyInJst(date);
    const monthLabel = getMonthLabel(dateKey);

    cells.push({
      dateKey,
      count: activityMap.get(dateKey) ?? 0,
      label: formatDateLabel(dateKey),
      monthLabel: monthLabel !== previousMonthLabel ? monthLabel : null,
    });

    previousMonthLabel = monthLabel;
  }

  const weeks: typeof cells[] = [];

  for (let index = 0; index < cells.length; index += 7) {
    weeks.push(cells.slice(index, index + 7));
  }

  return weeks;
}

function getCalendarTone(count: number) {
  if (count >= 4) return "dashboard-calendar-cell is-strong";
  if (count >= 2) return "dashboard-calendar-cell is-medium";
  if (count >= 1) return "dashboard-calendar-cell is-light";
  return "dashboard-calendar-cell";
}

type DashboardPageProps = {
  searchParams?: Promise<{
    return_mode?: string;
    return_question_id?: string;
  }>;
};

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const params = searchParams ? await searchParams : undefined;
  const returnMode = params?.return_mode === "challenge" ? "challenge" : "daily";
  const returnQuestionId = params?.return_question_id;
  const [stats, fallbackQuestionReturnHref] = await Promise.all([
    getDashboardStats(user.id),
    getQuestionReturnHref(user.id),
  ]);
  const questionReturnHref = returnQuestionId
    ? `/?mode=${returnMode}&question_id=${returnQuestionId}`
    : fallbackQuestionReturnHref;
  const calendarWeeks = buildCalendar(stats.answeredDates);
  const topCategory = stats.categoryBreakdown[0] ?? null;
  const focusCategory =
    [...stats.categoryBreakdown]
      .filter((category) => category.attempts >= 2)
      .sort((left, right) => left.correctRate - right.correctRate || right.attempts - left.attempts)[0] ??
    null;

  return (
    <main className="dashboard-shell">
      <section className="dashboard-panel">
        <header className="dashboard-header">
          <div>
            <p className="dashboard-eyebrow">Learning Dashboard</p>
            <h1 className="dashboard-title">{user.name ?? user.email}さんの回答状況</h1>
            <p className="dashboard-subtitle">
              学習の偏り、正答率、継続日数をまとめて確認できます。
            </p>
          </div>
          <div className="dashboard-header-actions">
            <Link href={questionReturnHref} className="dashboard-secondary-link">
              問題に戻る
            </Link>
            <form action="/api/auth/signout" method="post">
              <button type="submit" className="dashboard-secondary-button">
                ログアウト
              </button>
            </form>
          </div>
        </header>

        <section className="dashboard-metric-grid" aria-label="主要な指標">
          <article className="dashboard-metric-card">
            <p className="dashboard-metric-label">総回答数</p>
            <p className="dashboard-metric-value">{stats.totalAttempts}</p>
            <p className="dashboard-metric-note">直近7日: {stats.recentAttempts}問</p>
          </article>
          <article className="dashboard-metric-card">
            <p className="dashboard-metric-label">正答率</p>
            <p className="dashboard-metric-value">{stats.correctRate}%</p>
            <p className="dashboard-metric-note">正解 {stats.correctAttempts} / {stats.totalAttempts}</p>
          </article>
          <article className="dashboard-metric-card">
            <p className="dashboard-metric-label">連続チャレンジ日数</p>
            <p className="dashboard-metric-value">{stats.currentStreak}日</p>
            <p className="dashboard-metric-note">最長 {stats.longestStreak}日連続</p>
          </article>
          <article className="dashboard-metric-card">
            <p className="dashboard-metric-label">学習した日数</p>
            <p className="dashboard-metric-value">{stats.activeDays}日</p>
            <p className="dashboard-metric-note">
              {topCategory ? `最も挑戦しているカテゴリ: ${topCategory.category}` : "回答がたまると表示されます"}
            </p>
          </article>
        </section>

        <section className="dashboard-content-grid">
          <article className="dashboard-card">
            <div className="dashboard-card-header">
              <div>
                <p className="dashboard-card-eyebrow">Category Mix</p>
                <h2 className="dashboard-card-title">チャレンジしたカテゴリの割合</h2>
              </div>
            </div>

            {stats.categoryBreakdown.length === 0 ? (
              <p className="dashboard-empty-copy">
                まだ回答データがありません。まずは1問チャレンジすると、カテゴリの偏りが見えるようになります。
              </p>
            ) : (
              <div className="dashboard-category-list">
                {stats.categoryBreakdown.map((category) => (
                  <section key={category.category} className="dashboard-category-row">
                    <div className="dashboard-category-head">
                      <p className="dashboard-category-name">{category.category}</p>
                      <p className="dashboard-category-meta">
                        {category.share}% / {category.attempts}問 / 正答率 {category.correctRate}%
                      </p>
                    </div>
                    <div
                      className="dashboard-category-bar"
                      role="img"
                      aria-label={`${category.category}が全体の${category.share}%`}
                    >
                      <span style={{ width: `${Math.max(category.share, 6)}%` }} />
                    </div>
                  </section>
                ))}
              </div>
            )}
          </article>

          <article className="dashboard-card">
            <div className="dashboard-card-header">
              <div>
                <p className="dashboard-card-eyebrow">Consistency</p>
                <h2 className="dashboard-card-title">回答カレンダー</h2>
              </div>
              <p className="dashboard-card-caption">過去50日</p>
            </div>

            <div className="dashboard-calendar-wrap">
              <div className="dashboard-calendar-weekdays" aria-hidden="true">
                {weekdayLabels.map((label) => (
                  <span key={label}>{label}</span>
                ))}
              </div>
              <div className="dashboard-calendar-grid">
                {calendarWeeks.map((week, index) => (
                  <div key={`week-${index}`} className="dashboard-calendar-week">
                    {week.map((day) => (
                      <div
                        key={day.dateKey}
                        className={getCalendarTone(day.count)}
                        title={`${day.label}: ${day.count}問`}
                        aria-label={`${day.label}に${day.count}問回答`}
                      >
                        {day.monthLabel ? (
                          <span className="dashboard-calendar-month">{day.monthLabel}</span>
                        ) : null}
                        <span>{getDayNumber(day.dateKey)}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            <div className="dashboard-calendar-legend" aria-hidden="true">
              <span>少ない</span>
              <span className="dashboard-calendar-cell" />
              <span className="dashboard-calendar-cell is-light" />
              <span className="dashboard-calendar-cell is-medium" />
              <span className="dashboard-calendar-cell is-strong" />
              <span>多い</span>
            </div>
          </article>
        </section>

        <section className="dashboard-insight-grid">
          <article className="dashboard-card dashboard-insight-card">
            <p className="dashboard-card-eyebrow">Focus Suggestion</p>
            <h2 className="dashboard-card-title">次に伸ばしたいポイント</h2>
            <p className="dashboard-insight-copy">
              {focusCategory
                ? `${focusCategory.category}は${focusCategory.attempts}問挑戦して正答率${focusCategory.correctRate}%です。次の数問はこのカテゴリを厚めに出すと、ダッシュボード改善が見えやすくなります。`
                : "カテゴリ別の傾向を出すには、まず複数カテゴリに回答をためていくのがおすすめです。"}
            </p>
          </article>

          <article className="dashboard-card dashboard-insight-card">
            <p className="dashboard-card-eyebrow">Useful Next Feature</p>
            <h2 className="dashboard-card-title">相性のよい追加機能</h2>
            <p className="dashboard-insight-copy">
              苦手カテゴリの再挑戦、週ごとの正答率推移、難易度別の成績を加えると、単なる記録ではなく「次に何を解くか」を決めやすいダッシュボードになります。
            </p>
          </article>
        </section>
      </section>
    </main>
  );
}
