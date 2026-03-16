import { prisma } from "@/app/lib/prisma";

type CategoryStats = {
  category: string;
  attempts: number;
  correctAttempts: number;
  correctRate: number;
  share: number;
};

type SubcategoryStats = CategoryStats & {
  parentCategory: string;
};

const UNCATEGORIZED_SUBCATEGORY_LABEL = "未設定";

type DailyActivity = {
  date: string;
  count: number;
};

export type DashboardStats = {
  totalAttempts: number;
  correctAttempts: number;
  correctRate: number;
  activeDays: number;
  currentStreak: number;
  longestStreak: number;
  recentAttempts: number;
  categoryBreakdown: CategoryStats[];
  subcategoryBreakdown: SubcategoryStats[];
  answeredDates: DailyActivity[];
};

function getDateKeyInJst(date: Date) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  return formatter.format(date);
}

function getPreviousDateKey(dateKey: string) {
  const date = new Date(`${dateKey}T00:00:00+09:00`);
  date.setUTCDate(date.getUTCDate() - 1);
  return getDateKeyInJst(date);
}

function getPastDateKey(daysAgo: number) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - daysAgo);
  return getDateKeyInJst(date);
}

function toPercent(value: number, total: number) {
  if (total === 0) {
    return 0;
  }

  return Math.round((value / total) * 1000) / 10;
}

export async function getDashboardStats(userId: string): Promise<DashboardStats> {
  const answers = await prisma.answer.findMany({
    where: {
      user_id: userId,
    },
    orderBy: {
      answered_at: "asc",
    },
    select: {
      answered_at: true,
      is_correct: true,
      question: {
        select: {
          category: true,
          category_sub: true,
        },
      },
    },
  });

  const totalAttempts = answers.length;
  const correctAttempts = answers.filter((answer) => answer.is_correct).length;
  const recentThreshold = getPastDateKey(6);
  const categoryMap = new Map<string, { attempts: number; correctAttempts: number }>();
  const subcategoryMap = new Map<
    string,
    { category: string; attempts: number; correctAttempts: number }
  >();
  const activityMap = new Map<string, number>();

  let recentAttempts = 0;

  for (const answer of answers) {
    const dateKey = getDateKeyInJst(answer.answered_at);
    const category = answer.question.category;
    const subcategory = answer.question.category_sub?.trim() || UNCATEGORIZED_SUBCATEGORY_LABEL;
    const subcategoryKey = `${category}::${subcategory}`;
    const categoryStats = categoryMap.get(category) ?? { attempts: 0, correctAttempts: 0 };
    const subcategoryStats = subcategoryMap.get(subcategoryKey) ?? {
      category: subcategory,
      attempts: 0,
      correctAttempts: 0,
    };

    categoryStats.attempts += 1;
    subcategoryStats.attempts += 1;

    if (answer.is_correct) {
      categoryStats.correctAttempts += 1;
      subcategoryStats.correctAttempts += 1;
    }

    categoryMap.set(category, categoryStats);
    subcategoryMap.set(subcategoryKey, subcategoryStats);
    activityMap.set(dateKey, (activityMap.get(dateKey) ?? 0) + 1);

    if (dateKey >= recentThreshold) {
      recentAttempts += 1;
    }
  }

  const answeredDates = [...activityMap.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([date, count]) => ({ date, count }));

  const categoryBreakdown = [...categoryMap.entries()]
    .map(([category, stats]) => ({
      category,
      attempts: stats.attempts,
      correctAttempts: stats.correctAttempts,
      correctRate: toPercent(stats.correctAttempts, stats.attempts),
      share: toPercent(stats.attempts, totalAttempts),
    }))
    .sort((left, right) => right.attempts - left.attempts || left.category.localeCompare(right.category));

  const subcategoryBreakdown = [...subcategoryMap.entries()]
    .map(([subcategoryKey, stats]) => {
      const [parentCategory] = subcategoryKey.split("::", 1);

      return {
        category: stats.category,
        parentCategory,
        attempts: stats.attempts,
        correctAttempts: stats.correctAttempts,
        correctRate: toPercent(stats.correctAttempts, stats.attempts),
        share: toPercent(stats.attempts, totalAttempts),
      };
    })
    .sort(
      (left, right) =>
        right.attempts - left.attempts ||
        left.parentCategory.localeCompare(right.parentCategory) ||
        left.category.localeCompare(right.category),
    );

  const answeredDateKeys = answeredDates.map((entry) => entry.date);
  const todayKey = getDateKeyInJst(new Date());
  let currentStreak = 0;
  let expectedDateKey = todayKey;

  while (activityMap.has(expectedDateKey)) {
    currentStreak += 1;
    expectedDateKey = getPreviousDateKey(expectedDateKey);
  }

  let longestStreak = 0;
  let activeStreak = 0;
  let previousDateKey: string | null = null;

  for (const dateKey of answeredDateKeys) {
    if (previousDateKey === null) {
      activeStreak = 1;
    } else if (getPreviousDateKey(dateKey) === previousDateKey) {
      activeStreak += 1;
    } else {
      activeStreak = 1;
    }

    if (activeStreak > longestStreak) {
      longestStreak = activeStreak;
    }

    previousDateKey = dateKey;
  }

  return {
    totalAttempts,
    correctAttempts,
    correctRate: toPercent(correctAttempts, totalAttempts),
    activeDays: answeredDates.length,
    currentStreak,
    longestStreak,
    recentAttempts,
    categoryBreakdown,
    subcategoryBreakdown,
    answeredDates,
  };
}
