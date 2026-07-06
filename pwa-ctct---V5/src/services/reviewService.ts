export type ReviewSourceType = "practice" | "mock" | "official" | "learningQuiz";

export interface ReviewAnswer {
  no: number;
  qid: string | number;
  qtext: string;
  opts: string[];
  chosen: number;
  chosenText: string;
  correctIndex: number;
  correctText: string;
  ok: boolean;
  topic?: string;
  explain?: string;
}

export interface ReviewPack {
  sourceType: ReviewSourceType;
  attemptId: string;
  title: string;
  submittedAt: string;
  score: number;
  total: number;
  correct: number;
  wrong: number;
  skip: number;
  answers: ReviewAnswer[];
}

export const REVIEW_KEYS = {
  latestOfficial: "ptkv_review_latest_official",
  latestMock: "ptkv_review_latest_mock",
  latestPractice: "ptkv_review_latest_practice",
  latestLearningQuiz: "ptkv_review_latest_learning_quiz",
  history: "ptkv_review_history"
} as const;

const latestKeyByType: Record<ReviewSourceType, string> = {
  official: REVIEW_KEYS.latestOfficial,
  mock: REVIEW_KEYS.latestMock,
  practice: REVIEW_KEYS.latestPractice,
  learningQuiz: REVIEW_KEYS.latestLearningQuiz
};

const safeReadPackList = (): ReviewPack[] => {
  try {
    const value = JSON.parse(localStorage.getItem(REVIEW_KEYS.history) || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
};

export const reviewService = {
  saveReviewPack(pack: ReviewPack): void {
    localStorage.setItem(latestKeyByType[pack.sourceType], JSON.stringify(pack));
    const previous = safeReadPackList();
    const next = [pack, ...previous.filter(item => item.attemptId !== pack.attemptId)].slice(0, 30);
    localStorage.setItem(REVIEW_KEYS.history, JSON.stringify(next));
  },

  getReviewHistory(): ReviewPack[] {
    return safeReadPackList();
  },

  getLatestReview(sourceType: ReviewSourceType): ReviewPack | null {
    try {
      const value = localStorage.getItem(latestKeyByType[sourceType]);
      return value ? JSON.parse(value) as ReviewPack : null;
    } catch {
      return null;
    }
  }
};

export default reviewService;
