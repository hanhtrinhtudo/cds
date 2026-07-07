import React, { useState, useEffect } from "react";
import { User, UserRole, LearningTopic, LearningProgress, QuizAttempt, ExamAttempt, AccountStatus, LearningStatus, Exam, Unit, Question, News } from "./types";
import Auth from "./components/Auth";
import Dashboard from "./components/Dashboard";
import LearningCenter from "./components/LearningCenter";
import LegalCenter from "./components/LegalCenter";
import PracticeQuiz from "./components/PracticeQuiz";
import OfficialExam from "./components/OfficialExam";
import AITutor from "./components/AITutor";
import ResultsAndRanking from "./components/ResultsAndRanking";
import AdminPanel from "./components/AdminPanel";
import AdminCommandShell from "./components/admin/AdminCommandShell";
import NewsCenter from "./components/NewsCenter";
import { AppCaption, AppHeading, AppLabel } from "./components/ui";
import { BookOpen, HelpCircle, MessageSquare, Award, Shield, User as UserIcon, LogOut, Bell, Menu, X, Landmark, Compass, Flame, Home, GraduationCap, ClipboardCheck, MessageCircleCode, UserSquare2 } from "lucide-react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";

import { apiClient } from "./services/apiClient";
import { authService, isLegacyAppsScriptAuthMode } from "./services/authService";
import { userService } from "./services/userService";
import { learningService } from "./services/learningService";
import { quizService } from "./services/quizService";
import { examService } from "./services/examService";
import { dedupeNews, newsService } from "./services/newsService";
import { notificationService } from "./services/notificationService";
import { auditService } from "./services/auditService";
import { permissionService } from "./services/permissionService";
import { RankingEntry, reportService } from "./services/reportService";
import { legacyUnits } from "./data/cdsLegacyData";
import { cdsLegacyService } from "./services/cdsLegacyService";
import { reviewService } from "./services/reviewService";
import {
  persistenceService,
  PersistenceError,
  QuizAttemptWritePayload,
  ReviewWritePayload,
  mapRemoteBookmark,
  mapRemoteProgress,
  mapRemoteQuizAttempt,
  mergeAttemptsById,
  mergeProgressRecords
} from "./services/persistenceService";
import { offlineSyncQueue } from "./services/offlineSyncQueue";
import { analyticsService, AnalyticsEventPayload, AnalyticsEventType } from "./services/analyticsService";

const NEWS_CACHE_KEY = "ptkv_dashboard_news_cache_v1";
const NEWS_CACHE_TTL_MS = 10 * 60 * 1000;
const LEGACY_BOOTSTRAP_TIMEOUT_MS = 8_000;

const settleBootstrap = async <T,>(request: Promise<T>, fallback: T): Promise<T> => {
  let timer: number | undefined;
  try {
    return await Promise.race([
      request,
      new Promise<T>(resolve => { timer = window.setTimeout(() => resolve(fallback), LEGACY_BOOTSTRAP_TIMEOUT_MS); })
    ]);
  } finally {
    if (timer !== undefined) window.clearTimeout(timer);
  }
};

const LEGACY_AUTH_UNITS: Unit[] = [
  {
    id: "legacy_unit",
    name: "Đơn vị chưa cập nhật",
    type: "legacy",
    description: "Thông tin đơn vị sẽ được cập nhật sau khi đăng nhập"
  }
];

export default function App() {
  const prefersReducedMotion = useReducedMotion();
  // App state
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [topics, setTopics] = useState<LearningTopic[]>([]);
  const [allQuestions, setAllQuestions] = useState<Question[]>([]);
  const [progress, setProgress] = useState<LearningProgress[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [quizAttempts, setQuizAttempts] = useState<QuizAttempt[]>([]);
  const [examAttempts, setExamAttempts] = useState<ExamAttempt[]>([]);
  const [news, setNews] = useState<News[]>([]);
  const [newsLoading, setNewsLoading] = useState(false);
  const [newsLoadError, setNewsLoadError] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [rankings, setRankings] = useState<RankingEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Layout navigation states
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [navArg, setNavArg] = useState<any>(null); // auxiliary argument passed across modules
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showNotificationPanel, setShowNotificationPanel] = useState(false);

  // Streak & Performance variables (derived / persistent)
  const [userStreak, setUserStreak] = useState(5);
  const [averageScore, setAverageScore] = useState(0);
  const [bookmarkedTopicIds, setBookmarkedTopicIds] = useState<string[]>([]);
  const [persistenceAvailable, setPersistenceAvailable] = useState(false);
  const [analyticsAvailable, setAnalyticsAvailable] = useState(false);
  const [analyticsSessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`);

  // Initialize and check current user session
  useEffect(() => {
    const initApp = async () => {
      try {
        if (isLegacyAppsScriptAuthMode()) {
          setUnits(legacyUnits.length ? legacyUnits : LEGACY_AUTH_UNITS);
          const user = await settleBootstrap(authService.me(), null);
          if (user) {
            setCurrentUser(user);
            if (!user.mustChangePassword) await loadAllData();
          }
          return;
        }
        const availableUnits = await userService.getUnits();
        setUnits(availableUnits);
        const user = await settleBootstrap(authService.me(), null);
        if (user) {
          setCurrentUser(user);
          if (!user.mustChangePassword) await loadAllData();
        }
      } catch (err) {
        console.error("Lỗi khởi tạo phiên đăng nhập:", err);
      } finally {
        setIsLoading(false);
      }
    };
    initApp();
  }, []);

  const loadAllData = async () => {
  if (isLegacyAppsScriptAuthMode()) {
    const sessionUser = authService.getCurrentUser();
    const [fetchedTopics, fetchedExams] = await Promise.all([
      settleBootstrap(learningService.getTopics().catch(() => []), [] as LearningTopic[]),
      settleBootstrap(examService.getExams().catch(() => []), [] as Exam[])
    ]);

    setUnits(legacyUnits.length ? legacyUnits : LEGACY_AUTH_UNITS);
    setTopics(fetchedTopics);
    setExams(fetchedExams);
    setNotifications([]);
    setProgress(
      sessionUser
        ? cdsLegacyService
            .getProgress()
            .map(item => ({ ...item, userId: sessionUser.id }))
        : []
    );

    void loadOptionalLegacyData(sessionUser);
    if (sessionUser) void hydratePersistenceData(sessionUser);
    void loadNewsInBackground();
    return;
  }
    try {
      const sessionUser = authService.getCurrentUser();
      const canViewUsers = sessionUser && [UserRole.ADMIN, UserRole.POLITICAL_OFFICER, UserRole.INSTRUCTOR].includes(sessionUser.role);
      const canViewAuditLogs = sessionUser && [UserRole.ADMIN, UserRole.POLITICAL_OFFICER].includes(sessionUser.role);
      const [
        fetchedUsers,
        fetchedUnits,
        fetchedTopics,
        fetchedExams,
        fetchedQuestions,
        fetchedQuizHistory,
        fetchedExamHistory,
        fetchedNews,
        fetchedNotifications,
        fetchedAuditLogs,
        fetchedRankings
      ] = await Promise.all([
        canViewUsers ? userService.getUsers() : Promise.resolve([]),
        userService.getUnits(),
        learningService.getTopics(),
        examService.getExams(),
        quizService.getQuestions(),
        quizService.getQuizHistory(),
        examService.getExamHistory(),
        newsService.getNews(),
        notificationService.getNotifications(),
        canViewAuditLogs ? auditService.getAuditLogs() : Promise.resolve([]),
        reportService.getRankings()
      ]);

      setUsers(fetchedUsers);
      setUnits(fetchedUnits);
      setTopics(fetchedTopics);
      setExams(fetchedExams);
      setAllQuestions(fetchedQuestions);
      setQuizAttempts(fetchedQuizHistory);
      setExamAttempts(fetchedExamHistory);
      setNews(dedupeNews(fetchedNews));
      setNotifications(fetchedNotifications);
      setAuditLogs(fetchedAuditLogs);
      setRankings(fetchedRankings);

      const meUser = authService.getCurrentUser();
      if (meUser) {
        const progresses = fetchedTopics.map((t: any) => t.progress).filter(Boolean) as LearningProgress[];
        setProgress(progresses);

        setAverageScore(calculateLatestResultScore(meUser.id, fetchedQuizHistory, fetchedExamHistory));
      }
    } catch (err) {
      console.error("Lỗi đồng bộ dữ liệu hệ thống:", err);
    }
  };

const hydratePersistenceData = async (sessionUser: User): Promise<boolean> => {
  reviewService.setCurrentUser(sessionUser.id);
  const token = apiClient.getAuthToken();
  if (!token) {
    setPersistenceAvailable(false);
    return false;
  }
  try {
    const health = await persistenceService.health();
    if (!persistenceService.isSupported(health)) {
      setPersistenceAvailable(false);
      return false;
    }
    setPersistenceAvailable(true);
    let [remoteProgress, remoteAttempts, remoteReviews, remoteBookmarks] = await Promise.all([
      persistenceService.getProgress(token),
      persistenceService.listQuizAttempts(token),
      persistenceService.listReviews(token),
      persistenceService.listBookmarks(token)
    ]);
    const syncResult = await offlineSyncQueue.flushQueue(token, sessionUser.id);
    if (syncResult.succeeded > 0) {
      [remoteProgress, remoteAttempts, remoteReviews, remoteBookmarks] = await Promise.all([
        persistenceService.getProgress(token),
        persistenceService.listQuizAttempts(token),
        persistenceService.listReviews(token),
        persistenceService.listBookmarks(token)
      ]);
    }
    const ownedProgress = remoteProgress.map(item => ({ ...item, userId: sessionUser.id }));
    const ownedAttempts = remoteAttempts.map(item => ({ ...item, userId: sessionUser.id }));
    setProgress(ownedProgress);
    setQuizAttempts(ownedAttempts);
    reviewService.hydrateRemoteReviews(sessionUser.id, remoteReviews);
    setBookmarkedTopicIds(remoteBookmarks.filter(item => item.active).map(item => item.resourceId));
    setAverageScore(calculateLatestResultScore(sessionUser.id, ownedAttempts, examAttempts));
    await hydrateAnalyticsCapability(sessionUser, "APP_OPEN");
    return true;
  } catch (error) {
    setPersistenceAvailable(false);
    if ((import.meta as any).env?.DEV) console.warn("[persistence] Hydration unavailable", error);
    return false;
  }
};

const hydrateAnalyticsCapability = async (sessionUser: User, initialEvent?: AnalyticsEventType): Promise<boolean> => {
  const token = apiClient.getAuthToken();
  if (!token) {
    setAnalyticsAvailable(false);
    return false;
  }
  try {
    const health = await analyticsService.health(token);
    const supported = analyticsService.isSupported(health);
    setAnalyticsAvailable(supported);
    if (supported && initialEvent) {
      void analyticsService.logEvent(token, {
        eventType: initialEvent,
        resourceType: "app",
        sessionId: analyticsSessionId,
        metadata: { role: sessionUser.role }
      }).catch(() => undefined);
    }
    return supported;
  } catch {
    setAnalyticsAvailable(false);
    return false;
  }
};

const logAnalyticsEvent = (eventType: AnalyticsEventType, event: Partial<AnalyticsEventPayload> = {}) => {
  if (!analyticsAvailable) return;
  const token = apiClient.getAuthToken();
  if (!token) return;
  void analyticsService.logEvent(token, {
    eventType,
    sessionId: analyticsSessionId,
    ...event
  }).catch(() => undefined);
};

  useEffect(() => {
    if (!currentUser || !persistenceAvailable) return undefined;
    const flushWhenOnline = () => {
      const token = apiClient.getAuthToken();
      if (token) void offlineSyncQueue.flushQueue(token, currentUser.id);
    };
    window.addEventListener("online", flushWhenOnline);
    return () => window.removeEventListener("online", flushWhenOnline);
  }, [currentUser, persistenceAvailable]);
const loadOptionalLegacyData = async (sessionUser: User | null) => {
  const canViewUsers = Boolean(sessionUser && [UserRole.ADMIN, UserRole.POLITICAL_OFFICER, UserRole.INSTRUCTOR].includes(sessionUser.role));
  const canViewAuditLogs = Boolean(sessionUser && [UserRole.ADMIN, UserRole.POLITICAL_OFFICER].includes(sessionUser.role));
  const [questionsResult, quizHistoryResult, examHistoryResult, rankingsResult, usersResult, auditResult] = await Promise.allSettled([
    quizService.getQuestions(), quizService.getQuizHistory(), examService.getExamHistory(), reportService.getRankings(),
    canViewUsers ? userService.getUsers() : Promise.resolve([]),
    canViewAuditLogs ? auditService.getAuditLogs() : Promise.resolve([])
  ]);
  if (questionsResult.status === "fulfilled") setAllQuestions(questionsResult.value);
  if (quizHistoryResult.status === "fulfilled") setQuizAttempts(quizHistoryResult.value);
  if (examHistoryResult.status === "fulfilled") setExamAttempts(examHistoryResult.value);
  if (sessionUser) {
    const realQuizAttempts = quizHistoryResult.status === "fulfilled"
      ? quizHistoryResult.value.filter(item => item.userId === sessionUser.id && item.status === "submitted")
      : [];
    const realExamAttempts = examHistoryResult.status === "fulfilled"
      ? examHistoryResult.value.filter(item => item.userId === sessionUser.id && item.status !== "in_progress")
      : [];
    setAverageScore(calculateLatestResultScore(sessionUser.id, realQuizAttempts, realExamAttempts));
  }
  if (rankingsResult.status === "fulfilled") setRankings(rankingsResult.value);
  if (usersResult.status === "fulfilled") setUsers(usersResult.value);
  if (auditResult.status === "fulfilled") setAuditLogs(auditResult.value);
};

const loadNewsInBackground = async () => {
  const cachedNews = readCachedNews();
  if (cachedNews.length) {
    setNews(current => current.length ? dedupeNews(current) : cachedNews);
  }
  setNewsLoading(true);
  setNewsLoadError(null);
  try {
    const fetchedNews = await newsService.getNews();
    const uniqueNews = dedupeNews(fetchedNews);
    setNews(uniqueNews);
    writeCachedNews(uniqueNews);
  } catch (err) {
    console.warn("Không tải được tin tức nền:", err);
    setNewsLoadError("Không tải được tin tức.");
  } finally {
    setNewsLoading(false);
  }
};

const readCachedNews = (): News[] => {
  try {
    const raw = localStorage.getItem(NEWS_CACHE_KEY) || sessionStorage.getItem(NEWS_CACHE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as { savedAt?: number; items?: News[] };
    if (!parsed.savedAt || Date.now() - parsed.savedAt > NEWS_CACHE_TTL_MS) return [];
    return dedupeNews(Array.isArray(parsed.items) ? parsed.items : []);
  } catch {
    return [];
  }
};

const writeCachedNews = (items: News[]) => {
  try {
    const payload = JSON.stringify({ savedAt: Date.now(), items: dedupeNews(items).slice(0, 40) });
    localStorage.setItem(NEWS_CACHE_KEY, payload);
    sessionStorage.setItem(NEWS_CACHE_KEY, payload);
  } catch {
    // Storage can be unavailable in some browser modes.
  }
};

const scoreTimestamp = (value?: string) => {
  const time = value ? new Date(value).getTime() : 0;
  return Number.isFinite(time) ? time : 0;
};

const latestScore = (scores: Array<{ score: number; at?: string }>) => {
  const valid = scores
    .filter(item => Number.isFinite(item.score))
    .sort((a, b) => scoreTimestamp(b.at) - scoreTimestamp(a.at));
  return valid.length ? Number(valid[0].score.toFixed(1)) : 0;
};

const calculateLatestResultScore = (userId: string, quizzes: QuizAttempt[], exams: ExamAttempt[]) => {
  const submittedExams = exams
    .filter(item => item.userId === userId && item.status !== "in_progress" && Number.isFinite(item.score))
    .map(item => ({ score: Number(item.score), at: item.submittedAt || item.startedAt }));
  const officialReviews = reviewService.getReviewHistory()
    .filter(item => item.sourceType === "official" && Number.isFinite(item.score))
    .map(item => ({ score: Number(item.score), at: item.submittedAt }));
  const latestOfficial = latestScore([...submittedExams, ...officialReviews]);
  if (latestOfficial > 0) return latestOfficial;

  const mockReviews = reviewService.getReviewHistory()
    .filter(item => item.sourceType === "mock" && Number.isFinite(item.score))
    .map(item => ({ score: Number(item.score), at: item.submittedAt }));
  const latestMock = latestScore(mockReviews);
  if (latestMock > 0) return latestMock;

  const practiceScores = quizzes
    .filter(item => item.userId === userId && item.status === "submitted" && Number.isFinite(item.score))
    .map(item => ({ score: Number(item.score), at: item.submittedAt || item.startedAt }));
  const localReviewScores = reviewService.getReviewHistory()
    .filter(item => ["practice", "learningQuiz"].includes(item.sourceType) && Number.isFinite(item.score))
    .map(item => ({ score: Number(item.score), at: item.submittedAt }));
  return latestScore([...practiceScores, ...localReviewScores]);
};
  // Authentication triggers
  const handleLogin = async (user: User | null) => {
    if (user) {
      setCurrentUser(user);
      if (user.mustChangePassword) return;
      if (isLegacyAppsScriptAuthMode()) {
        setUnits(legacyUnits.length ? legacyUnits : LEGACY_AUTH_UNITS);
        setIsLoading(true);
        await loadAllData();
        await hydrateAnalyticsCapability(user, "LOGIN");
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      await loadAllData();
      await hydrateAnalyticsCapability(user, "LOGIN");
      setIsLoading(false);
    } else {
      await authService.logout();
      setCurrentUser(null);
    }
  };

  const handleRegister = () => {
    // Auth.tsx now handles register directly via authService
  };

  const handleLogout = async () => {
    logAnalyticsEvent("LOGOUT", { resourceType: "auth" });
    await authService.logout();
    setCurrentUser(null);
    setNavArg(null);
    setActiveTab("dashboard");
    setMobileMenuOpen(false);
    setPersistenceAvailable(false);
    setAnalyticsAvailable(false);
    setBookmarkedTopicIds([]);
    reviewService.clearCurrentUser();
  };

  // State update handlers
  const handleUpdateUserStatus = async (userId: string, status: AccountStatus) => {
    try {
      if (status === AccountStatus.ACTIVE) {
        const targetUser = users.find(user => user.id === userId);
        if (targetUser?.accountStatus === AccountStatus.SUSPENDED || targetUser?.accountStatus === AccountStatus.REJECTED) {
          await userService.reactivateUser(userId);
        } else {
          await userService.approveUser(userId);
        }
      } else if (status === AccountStatus.REJECTED) {
        await userService.rejectUser(userId);
      } else if (status === AccountStatus.SUSPENDED) {
        await userService.suspendUser(userId);
      } else {
        await userService.updateUser(userId, { accountStatus: status });
      }
      await loadAllData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateUser = async (data: {
    fullName: string;
    email: string;
    phone?: string;
    temporaryPassword: string;
    role: UserRole;
    unitId: string;
  }) => {
    await userService.createUser(data);
    await loadAllData();
  };

  const handleResetUserPassword = async (userId: string, temporaryPassword: string) => {
    await userService.resetPassword(userId, temporaryPassword);
    await loadAllData();
  };

  const handleChangeUserRole = async (userId: string, role: UserRole) => {
    await userService.changeRole(userId, role);
    await loadAllData();
  };

  const handleAddTopic = async (newTopic: LearningTopic) => {
    try {
      await learningService.createTopic(newTopic);
      await loadAllData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateTopicAssignment = async (topicId: string, updatedFields: Partial<LearningTopic>) => {
    try {
      await learningService.assignTopic(topicId, {
        assignedUnitIds: updatedFields.assignedUnitIds || [],
        assignedUserIds: updatedFields.assignedUserIds || [],
        deadline: updatedFields.deadline,
        required: updatedFields.required
      });
      await loadAllData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateTopicProgress = async (topicId: string, status: LearningStatus, percent: number) => {
    try {
      if (isLegacyAppsScriptAuthMode()) {
        const user = authService.getCurrentUser();
        if (!user) return;
        setProgress(prev => {
          const existing = prev.find(p => p.topicId === topicId && p.userId === user.id);
          const updated: LearningProgress = {
            id: existing?.id || `legacy_progress_${topicId}_${user.id}`,
            userId: user.id,
            topicId,
            status,
            progressPercent: percent,
            startedAt: existing?.startedAt || new Date().toISOString(),
            completedAt: status === LearningStatus.COMPLETED ? new Date().toISOString() : existing?.completedAt,
            lastAccessedAt: new Date().toISOString(),
            needReview: status === LearningStatus.NEED_REVIEW
          };
          return existing
            ? prev.map(p => (p.id === existing.id ? updated : p))
            : [...prev, updated];
        });
        const token = apiClient.getAuthToken();
        if (persistenceAvailable && token) {
          const payload = {
            topicId,
            status: String(status) as "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED" | "NEED_REVIEW",
            progressPercent: percent,
            needReview: status === LearningStatus.NEED_REVIEW
          };
          try {
            const result = await persistenceService.upsertProgress(token, payload);
            const confirmed = { ...mapRemoteProgress(result.item), userId: user.id };
            setProgress(previous => mergeProgressRecords(previous, [confirmed]));
          } catch (error) {
            if (!(error instanceof PersistenceError) || error.retryable) {
              offlineSyncQueue.enqueue(user.id, "progress.upsert", payload, topicId);
            }
          }
        }
        logAnalyticsEvent(status === LearningStatus.COMPLETED ? "MARK_COMPLETE" : "READ_PROGRESS", {
          resourceType: "learning_topic",
          resourceId: topicId,
          progressPercent: percent,
          status: String(status)
        });
        return;
      }
      await learningService.updateProgress(topicId, percent, status);
      await loadAllData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveQuizAttempt = async (attempt: QuizAttempt) => {
    try {
      if (isLegacyAppsScriptAuthMode()) {
        setQuizAttempts(prev => {
          const next = [attempt, ...prev.filter(item => item.id !== attempt.id)];
          setAverageScore(calculateLatestResultScore(attempt.userId, next, examAttempts));
          return next;
        });
        const token = apiClient.getAuthToken();
        if (persistenceAvailable && token) {
          const payload: QuizAttemptWritePayload = {
            attemptId: attempt.id,
            quizType: attempt.topicId ? "learningQuiz" : "practice",
            topicId: attempt.topicId,
            startedAt: attempt.startedAt,
            submittedAt: attempt.submittedAt || new Date().toISOString(),
            score: attempt.score,
            correct: attempt.correctCount,
            wrong: attempt.wrongCount,
            skip: Math.max(0, attempt.totalQuestions - attempt.correctCount - attempt.wrongCount),
            total: attempt.totalQuestions,
            answers: attempt.answers,
            device: "web"
          };
          try {
            const result = await persistenceService.saveQuizAttempt(token, payload);
            const confirmed = { ...mapRemoteQuizAttempt(result.item), userId: attempt.userId };
            setQuizAttempts(previous => mergeAttemptsById(previous, [confirmed]));
          } catch (error) {
            if (!(error instanceof PersistenceError) || error.retryable) {
              offlineSyncQueue.enqueue(attempt.userId, "quizAttempt.save", payload as unknown as Record<string, unknown>, attempt.id);
            }
          }
        }
        logAnalyticsEvent("QUIZ_SUBMIT", {
          resourceType: attempt.topicId ? "learning_topic" : "practice_quiz",
          resourceId: attempt.topicId || attempt.id,
          score: attempt.score,
          status: attempt.status,
          metadata: { correct: attempt.correctCount, wrong: attempt.wrongCount, total: attempt.totalQuestions }
        });
        return;
      }
      await apiClient.post("/api/quiz/save-attempt", attempt);
      await loadAllData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveReview = async (review: ReviewWritePayload) => {
    const user = authService.getCurrentUser();
    const token = apiClient.getAuthToken();
    if (!user || !persistenceAvailable || !token) return;
    try {
      await persistenceService.saveReview(token, review);
      logAnalyticsEvent("REVIEW_COMPLETE", {
        resourceType: review.sourceType,
        resourceId: review.attemptId,
        resourceTitle: review.title,
        score: review.score,
        metadata: { total: review.total, correct: review.correct, wrong: review.wrong, skip: review.skip }
      });
    } catch (error) {
      if (!(error instanceof PersistenceError) || error.retryable) {
        offlineSyncQueue.enqueue(user.id, "review.save", review as unknown as Record<string, unknown>, review.attemptId);
      }
    }
  };

  const handleToggleBookmark = async (topicId: string, active: boolean) => {
    const user = authService.getCurrentUser();
    if (!user) return;
    setBookmarkedTopicIds(previous => active
      ? Array.from(new Set([...previous, topicId]))
      : previous.filter(id => id !== topicId));
    const token = apiClient.getAuthToken();
    if (!persistenceAvailable || !token) return;
    const payload = { resourceType: "learning_topic" as const, resourceId: topicId, active };
    logAnalyticsEvent(active ? "BOOKMARK_ADD" : "BOOKMARK_REMOVE", {
      resourceType: "learning_topic",
      resourceId: topicId,
      status: active ? "active" : "inactive"
    });
    try {
      const result = await persistenceService.toggleBookmark(token, payload);
      const confirmed = mapRemoteBookmark(result.item);
      setBookmarkedTopicIds(previous => confirmed.active
        ? Array.from(new Set([...previous, confirmed.resourceId]))
        : previous.filter(id => id !== confirmed.resourceId));
    } catch (error) {
      if (!(error instanceof PersistenceError) || error.retryable) {
        offlineSyncQueue.enqueue(user.id, "bookmark.toggle", payload, `learning_topic:${topicId}`);
      }
    }
  };

  const handleSaveExamAttempt = async (attempt: ExamAttempt) => {
    try {
      if (isLegacyAppsScriptAuthMode()) {
        setExamAttempts(prev => {
          const next = [attempt, ...prev.filter(item => item.id !== attempt.id)];
          setAverageScore(calculateLatestResultScore(attempt.userId, quizAttempts, next));
          return next;
        });
        return;
      }
      await apiClient.post("/api/exam-attempts/save-attempt", attempt);
      await loadAllData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddExam = async (newExam: Exam) => {
    try {
      await examService.createExam(newExam);
      await loadAllData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateExam = async (examId: string, updatedFields: Partial<Exam>) => {
    try {
      await examService.updateExam(examId, updatedFields);
      await loadAllData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleNavigate = (tab: string, arg?: any) => {
    if (!permissionService.canAccessRoute(currentUser, tab)) {
      console.warn("Không có quyền truy cập:", tab);
      return;
    }
    setActiveTab(tab);
    setNavArg(arg || null);
    setMobileMenuOpen(false);
    logAnalyticsEvent("TAB_OPEN", {
      resourceType: "tab",
      resourceId: tab,
      resourceTitle: tab,
      metadata: arg?.id || arg?.title ? { targetId: arg.id, targetTitle: arg.title } : {}
    });
    if (tab === "admin") logAnalyticsEvent("ADMIN_OPEN", { resourceType: "admin" });
    if (tab === "ranking") logAnalyticsEvent("RESULTS_OPEN", { resourceType: "profile" });
    if (tab === "news_detail" && arg) {
      logAnalyticsEvent("NEWS_VIEW", {
        resourceType: "news",
        resourceId: arg.id,
        resourceTitle: arg.title,
        category: arg.category
      });
    }
  };

  const clearNavArg = () => {
    setNavArg(null);
  };

  const handleDismissNotification = async (id: string) => {
    try {
      await notificationService.markAsRead(id);
      await loadAllData();
    } catch (err) {
      console.error(err);
    }
  };

  // Loading Indicator for backend hydration
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--app-color-brand-primary-dark)] flex flex-col items-center justify-center text-white" id="app-loading-screen">
        <div className="w-12 h-12 border-4 border-[var(--app-color-brand-gold)] border-t-transparent rounded-full motion-spinner mb-4"></div>
        <p className="text-sm font-bold font-sans tracking-wide">ĐANG ĐỒNG BỘ CƠ SỞ DỮ LIỆU BAN CHỈ HUY...</p>
      </div>
    );
  }

  // Conditionally render Authentication screen if not authenticated
  if (!currentUser || currentUser.mustChangePassword) {
    return <Auth currentUser={currentUser} onLogin={handleLogin} onRegister={handleRegister} units={units} />;
  }

  const isAdminRole = ["admin", "political_officer", "instructor", "chi-huy", "chi_huy"].includes(String(currentUser.role));

  if (isAdminRole) {
    return (
      <AdminCommandShell
        currentUser={currentUser}
        topics={topics}
        progress={progress}
        questions={allQuestions}
        exams={exams}
        users={users}
        units={units}
        onUpdateUserStatus={handleUpdateUserStatus}
        onCreateUser={isLegacyAppsScriptAuthMode() ? undefined : handleCreateUser}
        onResetUserPassword={isLegacyAppsScriptAuthMode() ? undefined : handleResetUserPassword}
        onChangeUserRole={handleChangeUserRole}
        onAddTopic={isLegacyAppsScriptAuthMode() ? undefined : handleAddTopic}
        onUpdateTopicAssignment={isLegacyAppsScriptAuthMode() ? undefined : handleUpdateTopicAssignment}
        onAddExam={isLegacyAppsScriptAuthMode() ? undefined : handleAddExam}
        onUpdateExam={isLegacyAppsScriptAuthMode() ? undefined : handleUpdateExam}
        auditLogs={auditLogs}
        onLogout={handleLogout}
      />
    );
  }

  return (
    <div className="w-screen min-h-dvh bg-[var(--app-color-bg)] flex items-stretch justify-center p-0 font-sans text-[var(--app-color-text-primary)] overflow-x-hidden" id="app-root-shell">
      <div className="w-screen md:max-w-[428px] h-dvh min-h-dvh bg-[var(--app-color-bg)] flex flex-col overflow-hidden relative">
        
        {/* 1. TOP APP BAR */}
        <header className={`app-top-bar bg-[var(--app-color-brand-primary)] text-white px-3 py-1.5 items-center justify-between shrink-0 z-40 relative ${activeTab === "aitutor" ? "hidden" : "flex"}`}>
          <div className="flex items-center gap-2">
            {/* Vietnamese National Star Flag representation */}
            <div className="w-6 h-6 bg-red-600 rounded flex items-center justify-center shadow-inner border border-red-500 text-yellow-300 font-extrabold text-caption motion-status-change shrink-0">
              ★
            </div>
            <div className="min-w-0">
              <AppHeading level="h1" variant="title" color="inverse" truncate className="uppercase tracking-wider leading-none">
                BAN CHỈ HUY PTKV3
              </AppHeading>
              <AppCaption as="p" color="inverse" truncate className="text-yellow-100 mt-0.5 font-bold leading-tight max-w-[210px]">
                Trung tâm Giáo dục Chính trị số
              </AppCaption>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Admin toggle if instructor */}
            {isAdminRole && (
              <button
                onClick={() => handleNavigate("admin")}
                className={`w-11 h-11 rounded-xl transition shrink-0 cursor-pointer flex items-center justify-center ${activeTab === "admin" ? "bg-[var(--app-color-brand-gold)] text-red-950" : "bg-red-950/35 hover:bg-red-950/50 text-yellow-100"}`}
                title="Khu vực chỉ huy"
              >
                <Shield size={14} />
              </button>
            )}

            {/* Notification Bell with indicator */}
            <div className="relative shrink-0">
              <button
                onClick={() => setShowNotificationPanel(!showNotificationPanel)}
                className="w-11 h-11 bg-red-950/35 hover:bg-red-950/50 rounded-xl transition cursor-pointer flex items-center justify-center"
              >
                <Bell size={14} />
                {notifications.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-[var(--app-color-brand-gold)] text-overline text-red-950 font-bold flex items-center justify-center rounded-full border border-red-900">
                    {notifications.length}
                  </span>
                )}
              </button>

              {/* Notification Overlay dropdown */}
              {showNotificationPanel && (
                <div className="absolute right-0 mt-2 w-64 app-overlay text-[var(--app-color-text-primary)] p-3 space-y-2.5 z-50">
                  <div className="flex justify-between items-center border-b pb-1">
                    <AppLabel as="span" color="muted" uppercase>Thông báo quân số</AppLabel>
                    <button onClick={() => setShowNotificationPanel(false)} className="text-caption font-bold text-[var(--app-color-brand-primary)]">Đóng</button>
                  </div>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {notifications.length > 0 ? (
                      notifications.map(notif => (
                        <div key={notif.id} className="p-2 bg-slate-50 rounded-lg border border-[var(--app-color-divider)] relative text-caption leading-relaxed">
                          <p className="font-bold text-[var(--app-color-text-primary)]">{notif.title}</p>
                          <p className="text-[var(--app-color-text-muted)] mt-0.5">{notif.message}</p>
                          <button
                            onClick={() => handleDismissNotification(notif.id)}
                            className="absolute top-1.5 right-1.5 text-[var(--app-color-text-muted)] hover:text-red-500"
                            title="Xóa thông báo"
                          >
                            <X size={10} />
                          </button>
                        </div>
                      ))
                    ) : (
                      <AppCaption align="center" className="text-[var(--app-color-text-muted)] py-2">Không có cảnh báo mới.</AppCaption>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Logout Trigger */}
            <button
              onClick={handleLogout}
                className="w-11 h-11 bg-red-950/35 hover:bg-red-950/50 rounded-xl transition text-yellow-100 hover:text-white cursor-pointer flex items-center justify-center"
              title="Đăng xuất"
            >
              <LogOut size={14} />
            </button>
          </div>
        </header>

        {/* 2. MAIN WORKSPACE VIEWPORT (With smooth fade transition animations) */}
        <div className={`flex-1 min-h-0 overflow-x-hidden px-2.5 select-text bg-[var(--app-color-bg)] scrollbar-none ${activeTab === "aitutor" ? "overflow-hidden pb-0 pt-0" : "overflow-y-auto pb-2.5 pt-2.5"}`} id="app-main-viewport">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: prefersReducedMotion ? 0 : -4 }}
              transition={{ duration: prefersReducedMotion ? 0 : 0.18, ease: [0.2, 0, 0, 1] }}
              className={activeTab === "aitutor" ? "h-full min-h-0" : "pb-2"}
            >
              {(() => {
                // Filter topics assigned to current user if member
                const assignedTopics = topics.filter(t => {
                  if (currentUser.role !== "member") return true;
                  const hasUnitAssign = t.assignedUnitIds && t.assignedUnitIds.length > 0;
                  const hasUserAssign = t.assignedUserIds && t.assignedUserIds.length > 0;
                  if (!hasUnitAssign && !hasUserAssign) return true;
                  const matchesUnit = hasUnitAssign && t.assignedUnitIds!.includes(currentUser.unitId);
                  const matchesUser = hasUserAssign && t.assignedUserIds!.includes(currentUser.id);
                  return matchesUnit || matchesUser;
                });

                if (activeTab === "dashboard") {
                  return (
                    <Dashboard
                      user={currentUser}
                      topics={assignedTopics}
                      progress={progress}
                      exams={exams}
                      examAttempts={examAttempts}
                      news={news}
                      newsLoading={newsLoading}
                      newsLoadError={newsLoadError}
                      onNavigate={handleNavigate}
                      streak={userStreak}
                      averageScore={averageScore}
                    />
                  );
                }

                if (activeTab === "learning") {
                  return (
                    <LearningCenter
                      user={currentUser}
                      topics={assignedTopics}
                      progress={progress}
                      quizAttempts={quizAttempts}
                      onUpdateProgress={handleUpdateTopicProgress}
                      onSaveQuizAttempt={handleSaveQuizAttempt}
                      onSaveReview={handleSaveReview}
                      bookmarkedIds={bookmarkedTopicIds}
                      onToggleBookmark={handleToggleBookmark}
                      onNavigate={handleNavigate}
                      activeTopicArg={navArg}
                      onClearTopicArg={clearNavArg}
                    />
                  );
                }

                if (activeTab === "legal") {
                  return (
                    <LegalCenter
                      user={currentUser}
                      topics={assignedTopics}
                      onNavigate={handleNavigate}
                    />
                  );
                }

                if (activeTab === "quiz") {
                  return (
                    <PracticeQuiz
                      user={currentUser}
                      topics={assignedTopics}
                      allQuestions={allQuestions}
                      activeTopicArg={navArg}
                      onClearTopicArg={clearNavArg}
                      onSaveQuizAttempt={handleSaveQuizAttempt}
                      onSaveReview={handleSaveReview}
                      onNavigate={handleNavigate}
                    />
                  );
                }

                if (activeTab === "exams") {
                  return (
                    <OfficialExam
                      user={currentUser}
                      userUnitName={units.find(unit => unit.id === currentUser.unitId)?.name}
                      exams={exams}
                      allQuestions={allQuestions}
                      attempts={examAttempts}
                      onSaveExamAttempt={handleSaveExamAttempt}
                      onSaveReview={handleSaveReview}
                      activeExamArg={navArg}
                      onClearExamArg={clearNavArg}
                      onNavigate={handleNavigate}
                    />
                  );
                }

                if (activeTab === "aitutor") {
                  return (
                    <AITutor
                      user={currentUser}
                      topics={assignedTopics}
                      activeTopicArg={navArg}
                      onClearTopicArg={clearNavArg}
                      onAnalyticsEvent={logAnalyticsEvent}
                    />
                  );
                }

                if (activeTab === "ranking") {
                  return (
                    <ResultsAndRanking
                      user={currentUser}
                      topics={assignedTopics}
                      progress={progress}
                      quizAttempts={quizAttempts}
                      examAttempts={examAttempts}
                      onNavigate={handleNavigate}
                      activeReviewArg={navArg}
                      units={units}
                      rankingEntries={rankings}
                    />
                  );
                }

                if (activeTab === "admin" && isAdminRole) {
                  return (
                    <AdminPanel
                      currentUser={currentUser}
                      topics={topics}
                      progress={progress}
                      questions={allQuestions}
                      exams={exams}
                      users={users}
                      units={units}
                      onUpdateUserStatus={handleUpdateUserStatus}
                      onCreateUser={isLegacyAppsScriptAuthMode() ? undefined : handleCreateUser}
                      onResetUserPassword={isLegacyAppsScriptAuthMode() ? undefined : handleResetUserPassword}
                      onChangeUserRole={handleChangeUserRole}
                      onAddTopic={isLegacyAppsScriptAuthMode() ? undefined : handleAddTopic}
                      onUpdateTopicAssignment={isLegacyAppsScriptAuthMode() ? undefined : handleUpdateTopicAssignment}
                      onAddExam={isLegacyAppsScriptAuthMode() ? undefined : handleAddExam}
                      onUpdateExam={isLegacyAppsScriptAuthMode() ? undefined : handleUpdateExam}
                      auditLogs={auditLogs}
                    />
                  );
                }

                return null;
              })()}

              {activeTab === "news" && (
                <NewsCenter
                  news={news}
                  activeNewsArg={navArg}
                  onClearNewsArg={clearNavArg}
                  onNavigate={handleNavigate}
                />
              )}

              {activeTab === "news_detail" && (
                <NewsCenter
                  news={news}
                  activeNewsArg={navArg}
                  onClearNewsArg={clearNavArg}
                  onNavigate={handleNavigate}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* 3. HIGH FIDELITY BOTTOM PERSISTENT NAVIGATION RAILS (Exactly 5 Tabs) */}
        <nav className="app-bottom-nav sticky bottom-0 bg-[var(--app-color-surface)] border-t border-[var(--app-color-divider)] shrink-0 z-30 pb-[env(safe-area-inset-bottom)]" id="bottom-navigation-dock">
          <div className="px-2 py-0.5 flex items-center justify-between text-center min-h-[52px]">
            
            {/* Tab 1: Trang chủ */}
            <button
              onClick={() => handleNavigate("dashboard")}
              aria-current={activeTab === "dashboard" ? "page" : undefined}
              className={`motion-nav-item flex-1 min-w-0 h-11 flex flex-col items-center gap-0.5 justify-center cursor-pointer ${activeTab === "dashboard" ? "text-[var(--app-color-brand-primary)] font-extrabold" : "text-[var(--app-color-text-muted)] hover:text-[var(--app-color-text-secondary)]"}`}
            >
              <Home size={18} className={activeTab === "dashboard" ? "text-[var(--app-color-brand-primary)]" : "text-[var(--app-color-text-muted)]"} />
              <AppCaption as="span" className="font-bold tracking-tight">Trang chủ</AppCaption>
            </button>

            {/* Tab 2: Học tập */}
            <button
              onClick={() => handleNavigate("learning")}
              aria-current={activeTab === "learning" || activeTab === "news" || activeTab === "news_detail" || activeTab === "legal" ? "page" : undefined}
              className={`motion-nav-item flex-1 min-w-0 h-11 flex flex-col items-center gap-0.5 justify-center cursor-pointer ${activeTab === "learning" || activeTab === "news" || activeTab === "news_detail" || activeTab === "legal" ? "text-[var(--app-color-brand-primary)] font-extrabold" : "text-[var(--app-color-text-muted)] hover:text-[var(--app-color-text-secondary)]"}`}
            >
              <GraduationCap size={18} className={activeTab === "learning" || activeTab === "news" || activeTab === "news_detail" || activeTab === "legal" ? "text-[var(--app-color-brand-primary)]" : "text-[var(--app-color-text-muted)]"} />
              <AppCaption as="span" className="font-bold tracking-tight">Học tập</AppCaption>
            </button>

            {/* Tab 3: Kiểm tra */}
            <button
              onClick={() => handleNavigate("exams")}
              aria-current={activeTab === "exams" ? "page" : undefined}
              className={`motion-nav-item flex-1 min-w-0 h-11 flex flex-col items-center gap-0.5 justify-center cursor-pointer ${activeTab === "exams" ? "text-[var(--app-color-brand-primary)] font-extrabold" : "text-[var(--app-color-text-muted)] hover:text-[var(--app-color-text-secondary)]"}`}
            >
              <ClipboardCheck size={18} className={activeTab === "exams" ? "text-[var(--app-color-brand-primary)]" : "text-[var(--app-color-text-muted)]"} />
              <AppCaption as="span" className="font-bold tracking-tight">Kiểm tra</AppCaption>
            </button>

            {/* Tab 4: AI Assistant */}
            <button
              onClick={() => handleNavigate("aitutor")}
              aria-current={activeTab === "aitutor" ? "page" : undefined}
              className={`motion-nav-item flex-1 min-w-0 h-11 flex flex-col items-center gap-0.5 justify-center cursor-pointer ${activeTab === "aitutor" ? "text-[var(--app-color-brand-primary)] font-extrabold" : "text-[var(--app-color-text-muted)] hover:text-[var(--app-color-text-secondary)]"}`}
            >
              <MessageCircleCode size={18} className={activeTab === "aitutor" ? "text-[var(--app-color-brand-primary)]" : "text-[var(--app-color-text-muted)]"} />
              <AppCaption as="span" className="whitespace-nowrap font-bold tracking-tight">Hỏi AI</AppCaption>
            </button>

            {/* Tab 5: Cá nhân / Thi đua */}
            <button
              onClick={() => handleNavigate("ranking")}
              aria-current={activeTab === "ranking" ? "page" : undefined}
              className={`motion-nav-item flex-1 min-w-0 h-11 flex flex-col items-center gap-0.5 justify-center cursor-pointer ${activeTab === "ranking" ? "text-[var(--app-color-brand-primary)] font-extrabold" : "text-[var(--app-color-text-muted)] hover:text-[var(--app-color-text-secondary)]"}`}
            >
              <UserSquare2 size={18} className={activeTab === "ranking" ? "text-[var(--app-color-brand-primary)]" : "text-[var(--app-color-text-muted)]"} />
              <AppCaption as="span" className="font-bold tracking-tight">Cá nhân</AppCaption>
            </button>

          </div>
        </nav>

      </div>
    </div>
  );
}
