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
import NewsCenter from "./components/NewsCenter";
import { BookOpen, HelpCircle, MessageSquare, Award, Shield, User as UserIcon, LogOut, Bell, Menu, X, Landmark, Compass, Flame, Wifi, Battery, Signal, Home, GraduationCap, ClipboardCheck, MessageCircleCode, UserSquare2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

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

const NEWS_CACHE_KEY = "ptkv_dashboard_news_cache_v1";
const NEWS_CACHE_TTL_MS = 10 * 60 * 1000;

const LEGACY_AUTH_UNITS: Unit[] = [
  {
    id: "legacy_unit",
    name: "Đơn vị legacy CDS",
    type: "legacy",
    description: "Đơn vị từ Google Apps Script/CDS"
  }
];

export default function App() {
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

  // Live ticking clock for status bar
  const [timeStr, setTimeStr] = useState("09:41");
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hrs = now.getHours().toString().padStart(2, "0");
      const mins = now.getMinutes().toString().padStart(2, "0");
      setTimeStr(`${hrs}:${mins}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Initialize and check current user session
  useEffect(() => {
    const initApp = async () => {
      try {
        if (isLegacyAppsScriptAuthMode()) {
          setUnits(legacyUnits.length ? legacyUnits : LEGACY_AUTH_UNITS);
          const user = await authService.me();
          if (user) {
            setCurrentUser(user);
            if (!user.mustChangePassword) await loadAllData();
          }
          return;
        }
        const availableUnits = await userService.getUnits();
        setUnits(availableUnits);
        const user = await authService.me();
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
      learningService.getTopics().catch(() => []),
      examService.getExams().catch(() => [])
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
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      await loadAllData();
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
    await authService.logout();
    setCurrentUser(null);
    setNavArg(null);
    setActiveTab("dashboard");
    setMobileMenuOpen(false);
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
        return;
      }
      await apiClient.post("/api/quiz/save-attempt", attempt);
      await loadAllData();
    } catch (err) {
      console.error(err);
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
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white" id="app-loading-screen">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-sm font-bold font-sans tracking-wide">ĐANG ĐỒNG BỘ CƠ SỞ DỮ LIỆU BAN CHỈ HUY...</p>
      </div>
    );
  }

  // Conditionally render Authentication screen if not authenticated
  if (!currentUser || currentUser.mustChangePassword) {
    return <Auth currentUser={currentUser} onLogin={handleLogin} onRegister={handleRegister} units={units} />;
  }

  const isAdminRole = currentUser.role === "instructor" || currentUser.role === "political_officer" || currentUser.role === "admin";

  return (
    <div className="w-screen min-h-dvh bg-slate-50 md:bg-slate-100 flex items-stretch justify-center p-0 font-sans text-slate-800 overflow-x-hidden" id="app-root-shell">
      <div className="w-screen md:max-w-[428px] h-dvh min-h-dvh bg-slate-50 flex flex-col overflow-hidden relative">
        
        {/* 1. MOBILE STATUS BAR */}
        <div className="bg-emerald-900 text-emerald-100/95 px-4 pt-[max(4px,env(safe-area-inset-top))] pb-1 flex items-center justify-between text-[10px] leading-none font-semibold shrink-0 select-none z-50">
          <span>{timeStr}</span>
          <div className="flex items-center gap-1.5">
            <Signal size={11} />
            <span className="text-[9px]">5G</span>
            <Wifi size={11} />
            <Battery size={13} />
          </div>
        </div>

        {/* 2. TOP APP BAR */}
        <header className="bg-emerald-800 text-white px-3 py-2 flex items-center justify-between shadow-sm border-b border-emerald-900 shrink-0 z-40 relative">
          <div className="flex items-center gap-2">
            {/* Vietnamese National Star Flag representation */}
            <div className="w-6 h-6 bg-red-600 rounded flex items-center justify-center shadow-inner border border-red-500 text-yellow-300 font-extrabold text-[12px] animate-pulse shrink-0">
              ★
            </div>
            <div className="min-w-0">
              <h1 className="text-xs font-black uppercase tracking-wider leading-none">BAN CHỈ HUY PTKV3</h1>
              <p className="text-[8px] text-emerald-200 mt-0.5 font-bold leading-tight truncate max-w-[210px]">
                Trung tâm Giáo dục Chính trị số
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Admin toggle if instructor */}
            {isAdminRole && (
              <button
                onClick={() => handleNavigate("admin")}
                className={`w-8 h-8 rounded-lg transition shrink-0 cursor-pointer flex items-center justify-center ${activeTab === "admin" ? "bg-emerald-300 text-slate-950" : "bg-emerald-900/60 hover:bg-emerald-900 text-emerald-100"}`}
                title="Khu vực chỉ huy"
              >
                <Shield size={14} />
              </button>
            )}

            {/* Notification Bell with indicator */}
            <div className="relative shrink-0">
              <button
                onClick={() => setShowNotificationPanel(!showNotificationPanel)}
                className="w-8 h-8 bg-emerald-900/60 hover:bg-emerald-900 rounded-lg transition cursor-pointer flex items-center justify-center"
              >
                <Bell size={14} />
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-600 text-[8px] font-bold flex items-center justify-center rounded-full border border-emerald-800">
                    {notifications.length}
                  </span>
                )}
              </button>

              {/* Notification Overlay dropdown */}
              {showNotificationPanel && (
                <div className="absolute right-0 mt-2 w-64 bg-white text-slate-800 rounded-2xl border border-slate-150 shadow-xl p-3 space-y-2.5 z-50">
                  <div className="flex justify-between items-center border-b pb-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Thông báo quân số</span>
                    <button onClick={() => setShowNotificationPanel(false)} className="text-[9px] font-bold text-emerald-800">Đóng</button>
                  </div>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {notifications.length > 0 ? (
                      notifications.map(notif => (
                        <div key={notif.id} className="p-2 bg-slate-50 rounded-lg border border-slate-100 relative text-[10px] leading-relaxed">
                          <p className="font-bold text-slate-800">{notif.title}</p>
                          <p className="text-slate-500 mt-0.5">{notif.message}</p>
                          <button
                            onClick={() => handleDismissNotification(notif.id)}
                            className="absolute top-1.5 right-1.5 text-slate-300 hover:text-red-500"
                            title="Xóa thông báo"
                          >
                            <X size={10} />
                          </button>
                        </div>
                      ))
                    ) : (
                      <p className="text-center text-[10px] text-slate-400 py-2">Không có cảnh báo mới.</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Logout Trigger */}
            <button
              onClick={handleLogout}
              className="w-8 h-8 bg-emerald-900/60 hover:bg-emerald-900 rounded-lg transition text-emerald-200 hover:text-white cursor-pointer flex items-center justify-center"
              title="Đăng xuất"
            >
              <LogOut size={14} />
            </button>
          </div>
        </header>

        {/* 3. MAIN WORKSPACE VIEWPORT (With smooth fade transition animations) */}
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-3 py-3 pb-[calc(74px+env(safe-area-inset-bottom))] space-y-3 select-text bg-slate-50/50 scrollbar-none" id="app-main-viewport">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
              className="pb-2"
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

        {/* 4. HIGH FIDELITY BOTTOM PERSISTENT NAVIGATION RAILS (Exactly 5 Tabs) */}
        <nav className="sticky bottom-0 bg-white border-t border-slate-200 shrink-0 z-30 shadow-[0_-8px_18px_rgba(15,23,42,0.08)] pb-[env(safe-area-inset-bottom)]" id="bottom-navigation-dock">
          <div className="px-2.5 py-1.5 flex items-center justify-between text-center min-h-[58px]">
            
            {/* Tab 1: Trang chủ */}
            <button
              onClick={() => handleNavigate("dashboard")}
              className={`flex-1 min-w-0 h-11 flex flex-col items-center gap-0.5 justify-center cursor-pointer transition ${activeTab === "dashboard" ? "text-emerald-800 font-extrabold" : "text-slate-400 hover:text-slate-600"}`}
            >
              <Home size={18} className={activeTab === "dashboard" ? "text-emerald-800" : "text-slate-400"} />
              <span className="text-[9px] font-bold tracking-tight">Trang chủ</span>
            </button>

            {/* Tab 2: Học tập */}
            <button
              onClick={() => handleNavigate("learning")}
              className={`flex-1 min-w-0 h-11 flex flex-col items-center gap-0.5 justify-center cursor-pointer transition ${activeTab === "learning" || activeTab === "news" || activeTab === "news_detail" || activeTab === "legal" ? "text-emerald-800 font-extrabold" : "text-slate-400 hover:text-slate-600"}`}
            >
              <GraduationCap size={18} className={activeTab === "learning" || activeTab === "news" || activeTab === "news_detail" || activeTab === "legal" ? "text-emerald-800" : "text-slate-400"} />
              <span className="text-[9px] font-bold tracking-tight">Học tập</span>
            </button>

            {/* Tab 3: Kiểm tra */}
            <button
              onClick={() => handleNavigate("exams")}
              className={`flex-1 min-w-0 h-11 flex flex-col items-center gap-0.5 justify-center cursor-pointer transition ${activeTab === "exams" ? "text-emerald-800 font-extrabold" : "text-slate-400 hover:text-slate-600"}`}
            >
              <ClipboardCheck size={18} className={activeTab === "exams" ? "text-emerald-800" : "text-slate-400"} />
              <span className="text-[9px] font-bold tracking-tight">Kiểm tra</span>
            </button>

            {/* Tab 4: AI Assistant */}
            <button
              onClick={() => handleNavigate("aitutor")}
              className={`flex-1 min-w-0 h-11 flex flex-col items-center gap-0.5 justify-center cursor-pointer transition ${activeTab === "aitutor" ? "text-emerald-800 font-extrabold" : "text-slate-400 hover:text-slate-600"}`}
            >
              <MessageCircleCode size={18} className={activeTab === "aitutor" ? "text-emerald-800" : "text-slate-400"} />
              <span className="text-[9px] font-bold tracking-tight">Trợ lý AI</span>
            </button>

            {/* Tab 5: Cá nhân / Thi đua */}
            <button
              onClick={() => handleNavigate("ranking")}
              className={`flex-1 min-w-0 h-11 flex flex-col items-center gap-0.5 justify-center cursor-pointer transition ${activeTab === "ranking" ? "text-emerald-800 font-extrabold" : "text-slate-400 hover:text-slate-600"}`}
            >
              <UserSquare2 size={18} className={activeTab === "ranking" ? "text-emerald-800" : "text-slate-400"} />
              <span className="text-[9px] font-bold tracking-tight">Cá nhân</span>
            </button>

          </div>
        </nav>

      </div>
    </div>
  );
}
