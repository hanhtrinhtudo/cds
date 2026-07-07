import React, { useEffect, useState } from "react";
import { User, LearningTopic, LearningProgress, QuizAttempt, ExamAttempt, LearningStatus, Unit } from "../types";
import {
  Award,
  Calendar,
  ClipboardList,
  ChevronRight,
  Star,
  ShieldAlert,
  Settings,
  Moon,
  Bell,
  LogOut,
  CheckCircle,
  RefreshCw,
  Sparkles,
  BookOpen
} from "lucide-react";
import { RankingEntry } from "../services/reportService";
import { examService } from "../services/examService";
import { ReviewPack, ReviewSourceType, reviewService } from "../services/reviewService";
import { Alert, Button, EmptyState } from "./ui";
import { RankingRow, ReviewAnswerCard } from "./product";
import { AppContainer, AppPage, AppStack } from "./layout";

type ExamOption = {
  key: string;
  bank: string;
  title: string;
  apiSource: "official" | "mock";
};

interface ResultsAndRankingProps {
  user: User;
  topics: LearningTopic[];
  progress: LearningProgress[];
  quizAttempts: QuizAttempt[];
  examAttempts: ExamAttempt[];
  units: Unit[];
  rankingEntries: RankingEntry[];
  onNavigate: (tab: string, arg?: any) => void;
  activeReviewArg?: ReviewPack | null;
}

export default function ResultsAndRanking({
  user,
  topics,
  progress,
  quizAttempts,
  examAttempts,
  units,
  rankingEntries,
  onNavigate,
  activeReviewArg
}: ResultsAndRankingProps) {
  // Tabs: profile, leaderboard
  const [subTab, setSubTab] = useState<"profile" | "leaderboard">("profile");
  const [leaderboardScope, setLeaderboardScope] = useState<"overall" | "unit">("overall");
  const [examOptions, setExamOptions] = useState<ExamOption[]>([]);
  const [selectedBank, setSelectedBank] = useState("");
  const [remoteResults, setRemoteResults] = useState<any[]>([]);
  const [remoteLeaderboard, setRemoteLeaderboard] = useState<any[]>([]);
  const [remoteFallback, setRemoteFallback] = useState(false);
  const [remoteResultsEmpty, setRemoteResultsEmpty] = useState(false);
  const [remoteLeaderboardEmpty, setRemoteLeaderboardEmpty] = useState(false);
  const [remoteLoading, setRemoteLoading] = useState(false);
  const [reviewHistory, setReviewHistory] = useState<ReviewPack[]>([]);
  const [selectedReview, setSelectedReview] = useState<ReviewPack | null>(null);
  const [reviewFilter, setReviewFilter] = useState<"all" | "correct" | "wrong" | "skipped">("all");
  
  // Interactive settings state
  const [darkMode, setDarkMode] = useState(false);
  const [notificationEnabled, setNotificationEnabled] = useState(true);
  const [dailyReminder, setDailyReminder] = useState(true);

  const extractRows = (payload: any): any[] => {
    if (Array.isArray(payload)) return payload;
    if (!payload || typeof payload !== "object") return [];
    const direct = [payload.items, payload.rankings, payload.leaderboard, payload.results, payload.itemsUser, payload.exams, payload.banks];
    const nested = [payload.data?.items, payload.data?.rankings, payload.data?.leaderboard, payload.data?.results, payload.data];
    const found = [...direct, ...nested].find(Array.isArray);
    return Array.isArray(found) ? found : [];
  };

  const normalizeLeaderboardRow = (entry: any, index: number) => {
    const unitText = entry.userUnit || entry.unitName || entry.unit || entry.donVi || "";
    const nameText = entry.userName || entry.fullName || entry.name || entry.username || entry.displayName || entry.hoTen || "Học viên";
    const unitName = leaderboardScope === "unit"
      ? String(entry.topUser || entry.topName || entry.bestUser || entry.bestName ? `Dẫn đầu: ${entry.topUser || entry.topName || entry.bestUser || entry.bestName}` : unitText || "Đơn vị")
      : String(unitText || "—");
    const pct = entry.pct ?? entry.percent ?? entry.scorePct ?? entry.avgPct ?? entry.percentAvg ?? entry.bestPct ?? entry.score ?? 0;
    return {
      rank: Number(entry.rank || entry.position || entry.stt || index + 1),
      userId: String(entry.userId || entry.id || entry.username || entry.userName || entry.unitId || entry.unit || `remote_${index}`),
      fullName: String(leaderboardScope === "unit" ? entry.unit || entry.unitName || "Đơn vị" : nameText),
      unitId: String(entry.unitId || entry.userUnit || entry.unit || ""),
      unitName,
      points: Number(pct),
      completionRate: Number(entry.completionPct ?? entry.completionRate ?? pct ?? 0),
      badge: leaderboardScope === "unit"
        ? `${entry.members || entry.count || entry.totalUsers || 0} thành viên`
        : `${entry.attempts || entry.attemptsUsed || entry.count || 0} lượt`
    };
  };

  const loadReviewHistory = () => {
    const history = reviewService.getReviewHistory();
    setReviewHistory(history);
    setSelectedReview(current => current || history[0] || null);
  };

  useEffect(() => {
    loadReviewHistory();
  }, []);

  useEffect(() => {
    if (activeReviewArg?.answers?.length) {
      setSubTab("profile");
      setSelectedReview(activeReviewArg);
      loadReviewHistory();
    }
  }, [activeReviewArg]);

  useEffect(() => {
    let active = true;
    examService.getLeaderboardExams().then(payload => {
      if (!active) return;
      const rows = extractRows(payload);
      const options = rows.map((row: any) => {
        const apiSource = row.apiSource === "mock" ? "mock" as const : "official" as const;
        const bank = String(row.bank || row.bankId || row.id || row.title || "");
        const title = String(row.title || row.bankTitle || row.bank || row.bankId || "Kỳ kiểm tra");
        return {
          key: `${apiSource}::${bank}`,
          bank,
          title,
          apiSource
        };
      }).filter((row: ExamOption) => row.bank);
      setExamOptions(options);
      if (options.length) setSelectedBank(previous => previous || options[0].key);
    }).catch(error => {
      if (!active) return;
      if ((import.meta as any).env?.DEV) console.warn("[ResultsAndRanking] Không tải được danh sách kỳ thi:", error);
      setRemoteFallback(true);
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    if (!selectedBank && examOptions.length === 0) {
      setRemoteLoading(false);
      return () => { active = false; };
    }
    setRemoteLoading(true);
    const unitName = units.find(unit => unit.id === user.unitId)?.name || user.unitId;
    const selectedOption = examOptions.find(option => option.key === selectedBank)
      || examOptions.find(option => option.title === selectedBank || option.bank === selectedBank);
    const apiSource = selectedOption?.apiSource || "official";
    const bank = selectedOption?.bank || selectedBank;
    Promise.all([
      examService.getResultSummary({ bank, user: user.fullName, unit: unitName, apiSource }),
      examService.getLeaderboard({ bank, scope: leaderboardScope === "unit" ? "unit" : "user", limit: leaderboardScope === "unit" ? 3 : 10, apiSource })
    ]).then(([resultPayload, leaderboardPayload]) => {
      if (!active) return;
      const results = extractRows(resultPayload);
      const leaderboardItems = extractRows(leaderboardPayload);
      setRemoteResults(results);
      setRemoteLeaderboard(leaderboardItems);
      setRemoteResultsEmpty(results.length === 0);
      setRemoteLeaderboardEmpty(leaderboardItems.length === 0);
      setRemoteFallback(false);
    }).catch(error => {
      if (!active) return;
      if ((import.meta as any).env?.DEV) console.warn("[ResultsAndRanking] Không tải được kết quả/xếp hạng:", { selectedBank, apiSource, error });
      setRemoteResults([]);
      setRemoteLeaderboard([]);
      setRemoteResultsEmpty(true);
      setRemoteLeaderboardEmpty(true);
      setRemoteFallback(true);
    }).finally(() => active && setRemoteLoading(false));
    return () => { active = false; };
  }, [selectedBank, leaderboardScope, user.fullName, user.unitId, units, examOptions]);

  // User metrics calculation
  const userProgress = progress.filter(p => p.userId === user.id);
  const userQuizAttempts = quizAttempts.filter(q => q.userId === user.id);
  const userExamAttempts = examAttempts.filter(e => e.userId === user.id);

  const completedCount = userProgress.filter(p => p.status === LearningStatus.COMPLETED).length;
  const inProgressCount = userProgress.filter(p => p.status === LearningStatus.IN_PROGRESS).length;
  const needReviewCount = userProgress.filter(p => p.status === LearningStatus.NEED_REVIEW).length;

  const totalRequired = topics.filter(t => t.required).length;
  const completedRequired = topics.filter(t => {
    if (!t.required) return false;
    const p = userProgress.find(pr => pr.topicId === t.id);
    return p && p.status === LearningStatus.COMPLETED;
  }).length;

  const reqCompletionPercent = totalRequired > 0 ? Math.round((completedRequired / totalRequired) * 100) : 100;

  // Average quiz scores
  const totalQuizScore = userQuizAttempts.reduce((acc, q) => acc + q.score, 0);
  const avgQuizScore = userQuizAttempts.length > 0 ? Number((totalQuizScore / userQuizAttempts.length).toFixed(1)) : 0;

  // Exams passed count
  const examsPassedCount = userExamAttempts.filter(e => e.passed).length;

  // Weak topics detection & recommendations
  const getWeakTopics = () => {
    // Topics marked as NEED_REVIEW or where quiz score < 6
    const weakList: { topic: LearningTopic; reason: string }[] = [];
    
    topics.forEach(topic => {
      const p = userProgress.find(pr => pr.topicId === topic.id);
      const quizzesForTopic = userQuizAttempts.filter(q => q.topicId === topic.id);
      const lowestScore = quizzesForTopic.length > 0 ? Math.min(...quizzesForTopic.map(q => q.score)) : null;

      if (p && p.status === LearningStatus.NEED_REVIEW) {
        weakList.push({ topic, reason: "Được đánh dấu cần nghiên cứu sâu thêm" });
      } else if (lowestScore !== null && lowestScore < 6) {
        weakList.push({ topic, reason: `Điểm trắc nghiệm thấp nhất đạt ${lowestScore}/10` });
      }
    });

    return weakList.slice(0, 2); // Show top 2 weak topics
  };

  const weakTopics = getWeakTopics();

  const fallbackLeaderboard = rankingEntries.map(entry => {
      let badgeLabel = "Chiến sĩ Tập sự";
      if (entry.points > 120) badgeLabel = "Chuyên gia Lý luận";
      else if (entry.points > 80) badgeLabel = "Học viên Ưu tú";
      else if (entry.points > 40) badgeLabel = "Chiến sĩ Gương mẫu";
      return { ...entry, badge: badgeLabel };
    });
  const liveLeaderboard = remoteLeaderboard.map(normalizeLeaderboardRow);
  const leaderboard = remoteFallback ? [] : liveLeaderboard;
  const currentRankEntry = leaderboard.find(e => e.userId === user.id || e.fullName === user.fullName);

  const filteredLeaderboard = !remoteFallback ? leaderboard : leaderboardScope === "unit"
    ? leaderboard.filter(e => {
        return e.unitId === user.unitId;
      })
    : leaderboard;

  const reviewSourceLabel: Record<ReviewSourceType, string> = {
    practice: "Ôn trắc nghiệm",
    mock: "Thi thử",
    official: "Kiểm tra",
    learningQuiz: "Ôn tập bài học"
  };

  const filteredReviewAnswers = selectedReview?.answers.filter(answer => {
    if (reviewFilter === "correct") return answer.ok;
    if (reviewFilter === "wrong") return !answer.ok && answer.chosen >= 0;
    if (reviewFilter === "skipped") return answer.chosen < 0;
    return true;
  }) || [];

  // SVG circular progress parameters
  const radius = 30;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (reqCompletionPercent / 100) * circumference;

  return (
    <AppPage variant="plain" id="results-and-ranking-tab">
      <AppContainer bleed>
        <AppStack gap="md">
      
      {/* Dynamic Sub-tab selector */}
      <div className="pixel-surface-flat flex shrink-0 p-1 text-center text-xs font-bold">
        <button
          onClick={() => setSubTab("profile")}
          className={`flex-1 py-3 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 min-h-[44px] ${
            subTab === "profile" 
              ? "bg-[var(--app-color-brand-primary)] text-white" 
              : "text-[var(--app-color-text-muted)] hover:bg-slate-50"
          }`}
        >
          <Award size={14} />
          <span>Hồ sơ cá nhân</span>
        </button>
        <button
          onClick={() => setSubTab("leaderboard")}
          className={`flex-1 py-3 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 min-h-[44px] ${
            subTab === "leaderboard" 
              ? "bg-[var(--app-color-brand-primary)] text-white" 
              : "text-[var(--app-color-text-muted)] hover:bg-slate-50"
          }`}
        >
          <Star size={14} />
          <span>Bảng xếp hạng</span>
        </button>
      </div>

      {remoteFallback && (
        <Alert
          variant="warning"
          description="Không thể cập nhật kết quả mới. Một số thông tin có thể chưa được hiển thị."
        />
      )}
     
      <div className="pixel-surface-flat space-y-2 p-3">
        <label className="block text-caption font-extrabold uppercase text-[var(--app-color-text-muted)]">Nội dung đánh giá</label>
        <select
          value={selectedBank}
          onChange={event => setSelectedBank(event.target.value)}
          className="w-full min-h-11 rounded-xl border border-[var(--app-color-border)] bg-white px-3 text-xs"
        >
          <option value="">Tất cả kỳ thi</option>
          {examOptions.map(option => <option key={option.key} value={option.key}>{option.apiSource === "mock" ? "Thi thử — " : ""}{option.title}</option>)}
        </select>
        {remoteLoading && <p className="text-caption text-[var(--app-color-text-muted)]">Đang tải kết quả...</p>}
      </div>

      {subTab === "profile" ? (
        <div className="space-y-3 motion-fade-in" id="profile-subtab-container">
          {remoteResults.length > 0 && (
            <div className="pixel-surface space-y-2 p-3">
              <h3 className="text-caption font-extrabold uppercase text-[var(--app-color-text-muted)]">Kết quả của tôi</h3>
              {remoteResults.map((result, index) => (
                <div key={String(result.attemptId || result.id || index)} className="p-2.5 bg-slate-50 rounded-xl text-body-s flex justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-extrabold text-[var(--app-color-text-primary)] truncate">{result.bankTitle || result.title || result.bank || selectedBank || "Kỳ kiểm tra"}</p>
                    <p className="text-caption text-[var(--app-color-text-muted)] mt-1">{result.ts || result.date || result.submittedAt || ""}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-extrabold text-red-800">{result.pct ?? result.percentAvg ?? (result.total ? Math.round((Number(result.correct || 0) / Number(result.total)) * 100) : 0)}%</p>
                    <p className="text-caption text-[var(--app-color-text-muted)]">{result.attemptsUsed ?? result.attempts ?? 0} lượt</p>
                  </div>
                </div>
              ))}
            </div>
          )}
          {!remoteLoading && !remoteFallback && remoteResultsEmpty && (
            <EmptyState
              variant="results"
              title="Chưa có kết quả"
              description="Hiện chưa có kết quả cho nội dung đã chọn."
              className="bg-white"
            />
          )}
          
          {/* MD3 Profile Header card */}
          <div className="pixel-surface relative flex items-center gap-3 overflow-hidden p-3">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-red-500/10 to-[var(--app-color-brand-primary)]/5 rounded-full -mr-8 -mt-8" />
            
            {/* User Avatar Badge with initial letters */}
            <div className="w-12 h-12 bg-[var(--app-color-brand-primary)] text-white font-extrabold text-base rounded-2xl flex items-center justify-center shrink-0">
              {user.fullName.split(" ").pop()?.substring(0, 2).toUpperCase()}
            </div>

            <div className="min-w-0">
              <span className="px-1.5 py-0.5 bg-yellow-400 text-[var(--app-color-text-primary)] font-extrabold rounded text-caption uppercase tracking-wide">
                {currentRankEntry?.badge || "Đồng chí"}
              </span>
              <h2 className="text-sm font-extrabold text-[var(--app-color-text-primary)] mt-1 leading-tight">{user.fullName}</h2>
              <p className="text-caption text-[var(--app-color-text-muted)] font-extrabold uppercase mt-0.5 truncate">
                ĐƠN VỊ: {units.find(u => u.id === user.unitId)?.name || "Chưa xác định"}
              </p>
            </div>
          </div>

          {/* Bento Grid: Circular progress & Learning Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            
            {/* Required Lesson Progress Circular Circle */}
            <div className="pixel-surface flex items-center justify-between gap-3 p-3">
              <div className="space-y-1.5">
                <p className="text-caption font-extrabold tracking-wider uppercase text-[var(--app-color-text-muted)]">CHỦ ĐỀ BẮT BUỘC</p>
                <h3 className="text-xs font-extrabold text-[var(--app-color-text-primary)] leading-tight">Hoàn thành bài</h3>
                <p className="text-caption text-[var(--app-color-text-muted)] leading-tight">Đã học {completedRequired} trên tổng số {totalRequired} bài bắt buộc chỉ định.</p>
              </div>

              {/* SVG Ring charts */}
              <div className="relative w-16 h-16 shrink-0">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 80 80">
                  <circle
                    cx="40"
                    cy="40"
                    r={radius}
                    className="text-white/85"
                    strokeWidth="8"
                    stroke="currentColor"
                    fill="transparent"
                  />
                  <circle
                    cx="40"
                    cy="40"
                    r={radius}
                    className="text-[var(--app-color-brand-primary)]"
                    strokeWidth="8"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs font-extrabold text-[var(--app-color-text-primary)]">{reqCompletionPercent}%</span>
                </div>
              </div>
            </div>

            {/* Quick stats grid */}
            <div className="pixel-surface grid grid-cols-2 gap-3 p-3">
              <div className="space-y-0.5">
                <span className="text-caption font-extrabold uppercase tracking-wider text-[var(--app-color-text-muted)]">TỔNG ĐIỂM THI ĐUA</span>
                <p className="text-sm font-extrabold text-[var(--app-color-text-primary)]">{currentRankEntry?.points || 0} Điểm</p>
                <p className="text-caption text-[var(--app-color-text-muted)]">Hạng {currentRankEntry?.rank || "N/A"} toàn phân đội</p>
              </div>
              <div className="space-y-0.5">
                <span className="text-caption font-extrabold uppercase tracking-wider text-[var(--app-color-text-muted)]">LUYỆN TẬP</span>
                <p className="text-sm font-extrabold text-[var(--app-color-text-primary)]">{avgQuizScore} / 10</p>
                <p className="text-caption text-[var(--app-color-text-muted)]">Trung bình {userQuizAttempts.length} lượt luyện tập</p>
              </div>
            </div>

          </div>

          {/* Weak Topics & Smart Recommendations Section */}
          <div className="pixel-surface space-y-2.5 p-3">
            <h4 className="text-caption font-extrabold text-[var(--app-color-text-muted)] uppercase tracking-wider flex items-center gap-1.5 pb-1">
              <ShieldAlert size={14} className="text-red-500 shrink-0" />
              <span>Nội dung cần ôn lại</span>
            </h4>

            {weakTopics.length > 0 ? (
              <div className="space-y-2.5">
                {weakTopics.map(item => (
                  <div key={item.topic.id} className="p-2.5 bg-red-50/50 rounded-2xl text-xs space-y-2">
                    <div>
                      <p className="font-bold text-[var(--app-color-text-primary)] leading-snug">{item.topic.title}</p>
                      <p className="text-caption text-red-700 font-bold mt-0.5">{item.reason}</p>
                    </div>
                    <button
                      onClick={() => onNavigate("aitutor", item.topic)}
                      className="inline-flex items-center gap-1 text-caption font-extrabold uppercase text-[var(--app-color-brand-primary)] hover:text-[var(--app-color-brand-primary-dark)] bg-white px-2.5 py-1 rounded-full cursor-pointer"
                    >
                      <Sparkles size={10} />
                      <span>Trao đổi với AI Chính trị viên</span>
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3 rounded-2xl bg-green-50/50 text-center text-xs space-y-2 text-green-800 font-bold">
                <CheckCircle size={20} className="mx-auto text-green-600" />
                <p>Tuyệt vời! Bản lĩnh chính trị xuất sắc, không phát hiện lỗ hổng lý thuyết.</p>
              </div>
            )}
          </div>

          {/* Detailed Logs Accordion Card (Quiz & Official exam attempts) */}
          <div className="space-y-2.5">
            <h4 className="text-caption font-extrabold text-[var(--app-color-text-muted)] uppercase tracking-widest pl-1">Lịch sử bài đã nộp</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Quiz Log */}
              <div className="pixel-surface space-y-2 p-3">
                <p className="text-caption font-extrabold text-[var(--app-color-text-muted)] uppercase tracking-wider pb-1 flex items-center gap-1.5">
                  <ClipboardList size={12} className="text-[var(--app-color-brand-primary)]" />
                  <span>Trắc nghiệm nhanh ({userQuizAttempts.length})</span>
                </p>
                {userQuizAttempts.length > 0 ? (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {userQuizAttempts.map(attempt => {
                      const topic = topics.find(t => t.id === attempt.topicId);
                      return (
                        <div key={attempt.id} className="p-2 bg-slate-50 rounded-xl text-body-s flex justify-between items-center gap-2">
                          <span className="font-bold text-[var(--app-color-text-primary)] truncate leading-none">{topic?.title || "Ôn tập tổng hợp"}</span>
                          <span className={`px-2 py-0.5 rounded-full font-extrabold text-caption uppercase shrink-0 ${
                            attempt.score >= 6 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                          }`}>
                            {attempt.score}/10
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-center text-caption text-[var(--app-color-text-muted)] py-4">Chưa thực hiện tự luyện nào</p>
                )}
              </div>

              {/* Official Exam Log */}
              <div className="pixel-surface space-y-2 p-3">
                <p className="text-caption font-extrabold text-[var(--app-color-text-muted)] uppercase tracking-wider pb-1 flex items-center gap-1.5">
                  <Calendar size={12} className="text-red-700" />
                  <span>Sát hạch chính thức ({userExamAttempts.length})</span>
                </p>
                {userExamAttempts.length > 0 ? (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {userExamAttempts.map(attempt => (
                      <div key={attempt.id} className="p-2 bg-slate-50 rounded-xl text-body-s flex justify-between items-center gap-2">
                        <span className="font-bold text-[var(--app-color-text-primary)] truncate leading-none">Chính trị viên đợt 1</span>
                        <span className={`px-2 py-0.5 rounded-full font-extrabold text-caption uppercase shrink-0 ${
                          attempt.passed ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                        }`}>
                          {attempt.score}/10 {attempt.passed ? "Đạt" : "Hỏng"}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-caption text-[var(--app-color-text-muted)] py-4">Chưa có kết quả Kiểm tra</p>
                )}
              </div>
            </div>
          </div>

          
          <div className="pixel-surface space-y-2.5 p-3">
            <div className="flex items-start justify-between gap-3 pb-1">
              <div>
                <h4 className="text-caption font-extrabold text-[var(--app-color-text-muted)] uppercase tracking-wider">Xem lại bài đã nộp</h4>
                <p className="text-caption text-[var(--app-color-text-muted)] mt-1 leading-relaxed">
                  Lịch sử xem lại được lưu trên thiết bị đang sử dụng.
                </p>
              </div>
              <Button type="button" onClick={loadReviewHistory} variant="secondary" size="sm">
                Làm mới
              </Button>
            </div>

            {reviewHistory.length > 0 ? (
              <div className="space-y-3">
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {reviewHistory.map(pack => (
                    <button
                      key={pack.attemptId}
                      type="button"
                      onClick={() => {
                        setSelectedReview(pack);
                        setReviewFilter("all");
                      }}
                      className={`min-w-[172px] text-left p-2.5 rounded-2xl text-xs ${
                        selectedReview?.attemptId === pack.attemptId
                          ? "bg-red-50 text-red-900"
                          : "bg-slate-50 text-[var(--app-color-text-secondary)]"
                      }`}
                    >
                      <p className="text-caption font-extrabold uppercase text-[var(--app-color-text-muted)]">{reviewSourceLabel[pack.sourceType]}</p>
                      <p className="font-extrabold truncate mt-1">{pack.title}</p>
                      <p className="text-caption mt-1">Điểm {pack.score}/10 • {pack.correct}/{pack.total} đúng</p>
                      <p className="text-caption text-[var(--app-color-text-muted)] mt-1">{new Date(pack.submittedAt).toLocaleString("vi-VN")}</p>
                    </button>
                  ))}
                </div>

                {selectedReview && (
                  <div className="space-y-3">
                    <div className="p-2.5 rounded-2xl bg-slate-900 text-white">
                      <p className="text-caption font-extrabold uppercase text-yellow-300">{reviewSourceLabel[selectedReview.sourceType]}</p>
                      <h5 className="font-extrabold text-sm mt-1">{selectedReview.title}</h5>
                      <div className="grid grid-cols-4 gap-2 mt-3 text-center text-caption">
                        <div className="bg-white/10 rounded-xl p-2"><p className="font-extrabold">{selectedReview.score}/10</p><p>Điểm</p></div>
                        <div className="bg-white/10 rounded-xl p-2"><p className="font-extrabold">{selectedReview.correct}</p><p>Đúng</p></div>
                        <div className="bg-white/10 rounded-xl p-2"><p className="font-extrabold">{selectedReview.wrong}</p><p>Sai</p></div>
                        <div className="bg-white/10 rounded-xl p-2"><p className="font-extrabold">{selectedReview.skip}</p><p>Bỏ qua</p></div>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-1 bg-slate-100 p-1 rounded-2xl text-caption font-extrabold">
                      {[
                        ["all", "Tất cả"],
                        ["correct", "Đúng"],
                        ["wrong", "Sai"],
                        ["skipped", "Bỏ qua"]
                      ].map(([key, label]) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setReviewFilter(key as "all" | "correct" | "wrong" | "skipped")}
                          className={`min-h-11 py-2 rounded-xl ${reviewFilter === key ? "bg-white text-red-800" : "text-[var(--app-color-text-muted)]"}`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>

                    <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
                      {filteredReviewAnswers.map(answer => (
                        <ReviewAnswerCard
                          key={`${selectedReview.attemptId}-${answer.no}`}
                          index={answer.no}
                          question={answer.qtext}
                          selectedAnswer={answer.chosenText || "Chưa chọn"}
                          correctAnswer={answer.correctText}
                          explanation={answer.explain}
                          isCorrect={answer.ok}
                          isSkipped={answer.chosen < 0}
                          topic={answer.topic}
                          sourceType={reviewSourceLabel[selectedReview.sourceType]}
                        />
                      ))}
                      {filteredReviewAnswers.length === 0 && (
                        <p className="text-center text-caption text-[var(--app-color-text-muted)] py-4">Hiện chưa có câu hỏi phù hợp với bộ lọc.</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <EmptyState
                variant="results"
                title="Chưa có bài xem lại"
                description="Sau khi nộp bài ôn tập, Thi thử hoặc Kiểm tra, nội dung xem lại sẽ xuất hiện ở đây."
              />
            )}
          </div>

          {/* Interactive Simulated MD3 App settings & Dark mode */}
          <div className="pixel-surface space-y-3 p-3">
            <h4 className="text-caption font-extrabold text-[var(--app-color-text-muted)] uppercase tracking-wider flex items-center gap-1.5 pb-1">
              <Settings size={14} className="text-[var(--app-color-text-muted)] shrink-0" />
              <span>Thiết lập ứng dụng quân nhân</span>
            </h4>

            <div className="space-y-3">
              {/* Dark mode toggle */}
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Moon size={14} className="text-[var(--app-color-text-muted)]" />
                  <span className="font-bold text-[var(--app-color-text-secondary)]">Chế độ hiển thị tối</span>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={darkMode}
                  aria-label="Chế độ hiển thị tối"
                  onClick={() => setDarkMode(!darkMode)}
                  className="app-switch cursor-pointer"
                >
                  <div className="app-switch-thumb" />
                </button>
              </div>

              {/* Notification toggle */}
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Bell size={14} className="text-[var(--app-color-text-muted)]" />
                  <span className="font-bold text-[var(--app-color-text-secondary)]">Thông báo từ ban chỉ huy</span>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={notificationEnabled}
                  aria-label="Thông báo từ ban chỉ huy"
                  onClick={() => setNotificationEnabled(!notificationEnabled)}
                  className="app-switch cursor-pointer"
                >
                  <div className="app-switch-thumb" />
                </button>
              </div>

              {/* Daily Reminder toggle */}
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <BookOpen size={14} className="text-[var(--app-color-text-muted)]" />
                  <span className="font-bold text-[var(--app-color-text-secondary)]">Nhắc nhở học tập hàng ngày</span>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={dailyReminder}
                  aria-label="Nhắc nhở học tập hằng ngày"
                  onClick={() => setDailyReminder(!dailyReminder)}
                  className="app-switch cursor-pointer"
                >
                  <div className="app-switch-thumb" />
                </button>
              </div>
            </div>
          </div>

        </div>
      ) : (
        <div className="space-y-3 motion-fade-in" id="leaderboard-subtab-container">
          
          {/* Header & Leaderboard scale scope switcher */}
          <div className="pixel-surface space-y-2.5 p-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-extrabold text-[var(--app-color-text-primary)] uppercase">Bảng xếp hạng học tập</h3>
                <p className="text-caption text-[var(--app-color-text-muted)] mt-0.5">Xếp hạng theo kết quả học tập, ôn luyện và kiểm tra.</p>
              </div>

              {/* Scope filter chips */}
              <div className="flex gap-1 bg-slate-100 p-1 rounded-xl text-caption font-extrabold uppercase tracking-wide">
                <button
                  onClick={() => setLeaderboardScope("overall")}
                  className={`px-2.5 py-1.5 rounded-lg cursor-pointer transition ${
                    leaderboardScope === "overall" ? "bg-white text-[var(--app-color-text-primary)]" : "text-[var(--app-color-text-muted)]"
                  }`}
                >
                  Cả đơn vị
                </button>
                <button
                  onClick={() => setLeaderboardScope("unit")}
                  className={`px-2.5 py-1.5 rounded-lg cursor-pointer transition ${
                    leaderboardScope === "unit" ? "bg-white text-[var(--app-color-text-primary)]" : "text-[var(--app-color-text-muted)]"
                  }`}
                >
                  Đơn vị
                </button>
              </div>
            </div>
          </div>

          {/* Leaderboard mobile scroll list */}
          <div className="space-y-2">
            {filteredLeaderboard.map((entry) => {
              const isSelf = entry.userId === user.id;
              
              return (
                <RankingRow
                  key={entry.userId}
                  rank={entry.rank}
                  fullName={entry.fullName}
                  unit={entry.unitName}
                  score={`${entry.points} điểm`}
                  badge={entry.badge}
                  completionRate={entry.completionRate}
                  highlight={isSelf}
                />
              );
            })}
            {!remoteLoading && (remoteLeaderboardEmpty || remoteFallback) && filteredLeaderboard.length === 0 && (
              <EmptyState
                variant="ranking"
                title="Chưa có kết quả xếp hạng"
                description="Hiện chưa có kết quả xếp hạng cho nội dung đã chọn."
                className="bg-white"
              />
            )}
          </div>

        </div>
      )}

        </AppStack>
      </AppContainer>
    </AppPage>
  );
}
