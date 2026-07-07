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
  updatedAt?: string;
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

let activeUserId = "";
let hydratedRemoteReviews: ReviewPack[] | null = null;
const scopedHistoryKey = (userId: string) => `${REVIEW_KEYS.history}_${userId}`;
const scopedLatestKey = (userId: string, sourceType: ReviewSourceType) => `${latestKeyByType[sourceType]}_${userId}`;

const safeReadPackList = (): ReviewPack[] => {
  try {
    const raw = activeUserId
      ? localStorage.getItem(scopedHistoryKey(activeUserId))
      : localStorage.getItem(REVIEW_KEYS.history);
    const value = JSON.parse(raw || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
};

export const reviewService = {
  setCurrentUser(userId: string): void {
    if (activeUserId !== userId) hydratedRemoteReviews = null;
    activeUserId = userId;
  },

  clearCurrentUser(): void {
    activeUserId = "";
    hydratedRemoteReviews = null;
  },

  hydrateRemoteReviews(userId: string, reviews: ReviewPack[]): void {
    activeUserId = userId;
    hydratedRemoteReviews = reviews;
    localStorage.setItem(scopedHistoryKey(userId), JSON.stringify(reviews.slice(0, 50)));
    reviews.forEach(pack => localStorage.setItem(scopedLatestKey(userId, pack.sourceType), JSON.stringify(pack)));
  },

  saveReviewPack(pack: ReviewPack): void {
    const latestKey = activeUserId ? scopedLatestKey(activeUserId, pack.sourceType) : latestKeyByType[pack.sourceType];
    const historyKey = activeUserId ? scopedHistoryKey(activeUserId) : REVIEW_KEYS.history;
    localStorage.setItem(latestKey, JSON.stringify(pack));
    const previous = safeReadPackList();
    const next = [pack, ...previous.filter(item => item.attemptId !== pack.attemptId)].slice(0, 30);
    localStorage.setItem(historyKey, JSON.stringify(next));
    if (hydratedRemoteReviews) hydratedRemoteReviews = next;
  },

  getReviewHistory(): ReviewPack[] {
    return hydratedRemoteReviews || safeReadPackList();
  },

  getLatestReview(sourceType: ReviewSourceType): ReviewPack | null {
    try {
      const value = activeUserId
        ? localStorage.getItem(scopedLatestKey(activeUserId, sourceType))
        : localStorage.getItem(latestKeyByType[sourceType]);
      return value ? JSON.parse(value) as ReviewPack : null;
    } catch {
      return null;
    }
  }
};

export default reviewService;
