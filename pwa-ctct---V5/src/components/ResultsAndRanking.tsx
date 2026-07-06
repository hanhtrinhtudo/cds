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
    official: "Kiểm tra nhận thức",
    learningQuiz: "Quiz bài học"
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
    <div className="space-y-4" id="results-and-ranking-tab">
      
      {/* Dynamic Sub-tab selector */}
      <div className="bg-white border border-slate-100 rounded-2xl p-1 shadow-sm flex text-center font-bold text-xs shrink-0">
        <button
          onClick={() => setSubTab("profile")}
          className={`flex-1 py-3 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 min-h-[44px] ${
            subTab === "profile" 
              ? "bg-emerald-800 text-white shadow" 
              : "text-slate-500 hover:bg-slate-50"
          }`}
        >
          <Award size={14} />
          <span>Hồ sơ cá nhân</span>
        </button>
        <button
          onClick={() => setSubTab("leaderboard")}
          className={`flex-1 py-3 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 min-h-[44px] ${
            subTab === "leaderboard" 
              ? "bg-emerald-800 text-white shadow" 
              : "text-slate-500 hover:bg-slate-50"
          }`}
        >
          <Star size={14} />
          <span>Bảng xếp hạng</span>
        </button>
      </div>

      {remoteFallback && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 text-[11px] font-bold text-amber-900">
          Chưa tải được dữ liệu kết quả trực tuyến. Một số thông tin có thể chưa được cập nhật.
        </div>
      )}
     
      <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm space-y-2">
        <label className="block text-[10px] font-black uppercase text-slate-500">Kỳ thi / kiểm tra</label>
        <select
          value={selectedBank}
          onChange={event => setSelectedBank(event.target.value)}
          className="w-full min-h-[42px] rounded-xl border border-slate-200 bg-white px-3 text-xs"
        >
          <option value="">Tất cả kỳ thi</option>
          {examOptions.map(option => <option key={option.key} value={option.key}>{option.apiSource === "mock" ? "Thi thử — " : ""}{option.title}</option>)}
        </select>
        {remoteLoading && <p className="text-[10px] text-slate-400">Đang tải kết quả trực tuyến...</p>}
      </div>

      {subTab === "profile" ? (
        <div className="space-y-4 animate-fade-in" id="profile-subtab-container">
          {remoteResults.length > 0 && (
            <div className="bg-white border border-slate-100 rounded-[24px] p-4 shadow-sm space-y-2">
              <h3 className="text-[10px] font-black uppercase text-slate-500">Kết quả của tôi</h3>
              {remoteResults.map((result, index) => (
                <div key={String(result.attemptId || result.id || index)} className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-[11px] flex justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-black text-slate-800 truncate">{result.bankTitle || result.title || result.bank || selectedBank || "Kỳ kiểm tra"}</p>
                    <p className="text-[9px] text-slate-500 mt-1">{result.ts || result.date || result.submittedAt || ""}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-black text-red-800">{result.pct ?? result.percentAvg ?? (result.total ? Math.round((Number(result.correct || 0) / Number(result.total)) * 100) : 0)}%</p>
                    <p className="text-[9px] text-slate-500">{result.attemptsUsed ?? result.attempts ?? 0} lượt</p>
                  </div>
                </div>
              ))}
            </div>
          )}
          {!remoteLoading && !remoteFallback && remoteResultsEmpty && (
            <div className="bg-white border border-slate-100 rounded-[24px] p-4 text-center text-[10px] text-slate-500">
              Chưa có kết quả cho kỳ thi đã chọn.
            </div>
          )}
          
          {/* MD3 Profile Header card */}
          <div className="bg-white border border-slate-100 rounded-[24px] p-5 shadow-sm flex items-center gap-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-emerald-500/10 to-emerald-800/5 rounded-full -mr-8 -mt-8" />
            
            {/* User Avatar Badge with initial letters */}
            <div className="w-14 h-14 bg-emerald-800 text-white font-black text-lg rounded-2xl flex items-center justify-center shrink-0 shadow-md">
              {user.fullName.split(" ").pop()?.substring(0, 2).toUpperCase()}
            </div>

            <div className="min-w-0">
              <span className="px-1.5 py-0.5 bg-yellow-400 text-slate-950 font-black rounded text-[8px] uppercase tracking-wide">
                {currentRankEntry?.badge || "Đồng chí"}
              </span>
              <h2 className="text-sm font-black text-slate-800 mt-1 leading-tight">{user.fullName}</h2>
              <p className="text-[10px] text-slate-400 font-extrabold uppercase mt-0.5 truncate">
                ĐƠN VỊ: {units.find(u => u.id === user.unitId)?.name || "Chưa xác định"}
              </p>
            </div>
          </div>

          {/* Bento Grid: Circular progress & Learning Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Required Lesson Progress Circular Circle */}
            <div className="bg-white border border-slate-100 rounded-[24px] p-4 shadow-sm flex items-center justify-between gap-4">
              <div className="space-y-1.5">
                <p className="text-[9px] font-black tracking-wider uppercase text-slate-400">CHỦ ĐỀ BẮT BUỘC</p>
                <h3 className="text-xs font-black text-slate-800 leading-tight">Hoàn thành bài</h3>
                <p className="text-[10px] text-slate-400 leading-tight">Đã học {completedRequired} trên tổng số {totalRequired} bài bắt buộc chỉ định.</p>
              </div>

              {/* SVG Ring charts */}
              <div className="relative w-16 h-16 shrink-0">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 80 80">
                  <circle
                    cx="40"
                    cy="40"
                    r={radius}
                    className="text-slate-100"
                    strokeWidth="8"
                    stroke="currentColor"
                    fill="transparent"
                  />
                  <circle
                    cx="40"
                    cy="40"
                    r={radius}
                    className="text-emerald-800"
                    strokeWidth="8"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs font-black text-slate-800">{reqCompletionPercent}%</span>
                </div>
              </div>
            </div>

            {/* Quick stats grid */}
            <div className="bg-white border border-slate-100 rounded-[24px] p-4 shadow-sm grid grid-cols-2 gap-3.5">
              <div className="space-y-0.5">
                <span className="text-[8px] font-black uppercase tracking-wider text-slate-400">TỔNG ĐIỂM THI ĐUA</span>
                <p className="text-sm font-black text-slate-800">{currentRankEntry?.points || 0} Điểm</p>
                <p className="text-[9px] text-slate-400">Hạng {currentRankEntry?.rank || "N/A"} toàn phân đội</p>
              </div>
              <div className="space-y-0.5">
                <span className="text-[8px] font-black uppercase tracking-wider text-slate-400">LUYỆN TẬP</span>
                <p className="text-sm font-black text-slate-800">{avgQuizScore} / 10</p>
                <p className="text-[9px] text-slate-400">Trung bình {userQuizAttempts.length} lượt luyện tập</p>
              </div>
            </div>

          </div>

          {/* Weak Topics & Smart Recommendations Section */}
          <div className="bg-white border border-slate-100 rounded-[24px] p-5 shadow-sm space-y-3">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-50 pb-2">
              <ShieldAlert size={14} className="text-red-500 shrink-0" />
              <span>Nội dung cần ôn lại</span>
            </h4>

            {weakTopics.length > 0 ? (
              <div className="space-y-2.5">
                {weakTopics.map(item => (
                  <div key={item.topic.id} className="p-3 bg-red-50/50 border border-red-100 rounded-2xl text-xs space-y-2">
                    <div>
                      <p className="font-bold text-slate-800 leading-snug">{item.topic.title}</p>
                      <p className="text-[9px] text-red-700 font-bold mt-0.5">{item.reason}</p>
                    </div>
                    <button
                      onClick={() => onNavigate("aitutor", item.topic)}
                      className="inline-flex items-center gap-1 text-[9px] font-black uppercase text-emerald-800 hover:text-emerald-950 bg-white px-2.5 py-1 rounded-full shadow-sm border border-emerald-100 cursor-pointer"
                    >
                      <Sparkles size={10} />
                      <span>Nhờ AI giải thích</span>
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-green-50/50 border border-green-100 text-center text-xs space-y-2 text-green-800 font-bold">
                <CheckCircle size={20} className="mx-auto text-green-600" />
                <p>Tuyệt vời! Bản lĩnh chính trị xuất sắc, không phát hiện lỗ hổng lý thuyết.</p>
              </div>
            )}
          </div>

          {/* Detailed Logs Accordion Card (Quiz & Official exam attempts) */}
          <div className="space-y-3">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Lịch sử bài kiểm tra đã nộp</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Quiz Log */}
              <div className="bg-white border border-slate-100 rounded-[24px] p-4 shadow-sm space-y-2">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-50 pb-1.5 flex items-center gap-1.5">
                  <ClipboardList size={12} className="text-emerald-800" />
                  <span>Trắc nghiệm nhanh ({userQuizAttempts.length})</span>
                </p>
                {userQuizAttempts.length > 0 ? (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {userQuizAttempts.map(attempt => {
                      const topic = topics.find(t => t.id === attempt.topicId);
                      return (
                        <div key={attempt.id} className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl text-[11px] flex justify-between items-center gap-2">
                          <span className="font-bold text-slate-800 truncate leading-none">{topic?.title || "Ôn tập tổng hợp"}</span>
                          <span className={`px-2 py-0.5 rounded-full font-black text-[9px] uppercase shrink-0 ${
                            attempt.score >= 6 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                          }`}>
                            {attempt.score}/10
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-center text-[10px] text-slate-400 py-4">Chưa thực hiện tự luyện nào</p>
                )}
              </div>

              {/* Official Exam Log */}
              <div className="bg-white border border-slate-100 rounded-[24px] p-4 shadow-sm space-y-2">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-50 pb-1.5 flex items-center gap-1.5">
                  <Calendar size={12} className="text-red-700" />
                  <span>Sát hạch chính thức ({userExamAttempts.length})</span>
                </p>
                {userExamAttempts.length > 0 ? (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {userExamAttempts.map(attempt => (
                      <div key={attempt.id} className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl text-[11px] flex justify-between items-center gap-2">
                        <span className="font-bold text-slate-800 truncate leading-none">Chính trị viên đợt 1</span>
                        <span className={`px-2 py-0.5 rounded-full font-black text-[9px] uppercase shrink-0 ${
                          attempt.passed ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                        }`}>
                          {attempt.score}/10 {attempt.passed ? "Đạt" : "Hỏng"}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-[10px] text-slate-400 py-4">Chưa có kết quả chính quy</p>
                )}
              </div>
            </div>
          </div>

          
          <div className="bg-white border border-slate-100 rounded-[24px] p-5 shadow-sm space-y-3">
            <div className="flex items-start justify-between gap-3 border-b border-slate-50 pb-2">
              <div>
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Xem lại bài đã nộp</h4>
                <p className="text-[9px] text-slate-500 mt-1 leading-relaxed">
                  Lịch sử xem lại được lưu trên thiết bị đang sử dụng.
                </p>
              </div>
              <button type="button" onClick={loadReviewHistory} className="px-2.5 py-1.5 rounded-xl bg-slate-50 border border-slate-100 text-[9px] font-black text-slate-600">
                Làm mới
              </button>
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
                      className={`min-w-[180px] text-left p-3 rounded-2xl border text-xs ${
                        selectedReview?.attemptId === pack.attemptId
                          ? "bg-red-50 border-red-200 text-red-900"
                          : "bg-slate-50 border-slate-100 text-slate-700"
                      }`}
                    >
                      <p className="text-[9px] font-black uppercase text-slate-400">{reviewSourceLabel[pack.sourceType]}</p>
                      <p className="font-black truncate mt-1">{pack.title}</p>
                      <p className="text-[10px] mt-1">Điểm {pack.score}/10 • {pack.correct}/{pack.total} đúng</p>
                      <p className="text-[9px] text-slate-400 mt-1">{new Date(pack.submittedAt).toLocaleString("vi-VN")}</p>
                    </button>
                  ))}
                </div>

                {selectedReview && (
                  <div className="space-y-3">
                    <div className="p-3 rounded-2xl bg-slate-900 text-white">
                      <p className="text-[9px] font-black uppercase text-yellow-300">{reviewSourceLabel[selectedReview.sourceType]}</p>
                      <h5 className="font-black text-sm mt-1">{selectedReview.title}</h5>
                      <div className="grid grid-cols-4 gap-2 mt-3 text-center text-[10px]">
                        <div className="bg-white/10 rounded-xl p-2"><p className="font-black">{selectedReview.score}/10</p><p>Điểm</p></div>
                        <div className="bg-white/10 rounded-xl p-2"><p className="font-black">{selectedReview.correct}</p><p>Đúng</p></div>
                        <div className="bg-white/10 rounded-xl p-2"><p className="font-black">{selectedReview.wrong}</p><p>Sai</p></div>
                        <div className="bg-white/10 rounded-xl p-2"><p className="font-black">{selectedReview.skip}</p><p>Bỏ qua</p></div>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-1 bg-slate-100 p-1 rounded-2xl text-[9px] font-black">
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
                          className={`py-2 rounded-xl ${reviewFilter === key ? "bg-white text-red-800 shadow-sm" : "text-slate-500"}`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>

                    <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
                      {filteredReviewAnswers.map(answer => (
                        <div key={`${selectedReview.attemptId}-${answer.no}`} className="p-3 rounded-2xl border border-slate-100 bg-slate-50 text-xs space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-black text-slate-800 leading-relaxed">Câu {answer.no}. {answer.qtext}</p>
                            <span className={`px-2 py-1 rounded-full text-[9px] font-black shrink-0 ${
                              answer.ok ? "bg-green-100 text-green-800" : answer.chosen < 0 ? "bg-slate-200 text-slate-700" : "bg-red-100 text-red-800"
                            }`}>
                              {answer.ok ? "Đúng" : answer.chosen < 0 ? "Bỏ qua" : "Sai"}
                            </span>
                          </div>
                          {answer.topic && <p className="text-[10px] text-slate-500 font-bold">Chủ đề: {answer.topic}</p>}
                          <div className="grid grid-cols-1 gap-1.5 text-[11px]">
                            <div className="p-2 rounded-xl bg-white border border-slate-100">
                              <span className="font-black text-slate-500">Đã chọn: </span>
                              <span className={answer.chosen < 0 ? "text-slate-400" : answer.ok ? "text-green-700 font-bold" : "text-red-700 font-bold"}>
                                {answer.chosenText || "Chưa chọn"}
                              </span>
                            </div>
                            <div className="p-2 rounded-xl bg-green-50 border border-green-100">
                              <span className="font-black text-green-900">Đáp án đúng: </span>
                              <span className="text-green-800 font-bold">{answer.correctText}</span>
                            </div>
                          </div>
                          {answer.explain && (
                            <p className="p-2 rounded-xl bg-amber-50 border border-amber-100 text-[11px] text-amber-900 leading-relaxed">
                              <span className="font-black">Giải thích: </span>{answer.explain}
                            </p>
                          )}
                        </div>
                      ))}
                      {filteredReviewAnswers.length === 0 && (
                        <p className="text-center text-[10px] text-slate-400 py-4">Không có câu hỏi phù hợp bộ lọc này.</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-center text-[10px] text-slate-400 py-3">
                Chưa có bài làm đã nộp trên thiết bị này. Sau khi nộp ôn trắc nghiệm, quiz bài học, thi thử hoặc kiểm tra chính thức, mục xem lại sẽ xuất hiện ở đây.
              </p>
            )}
          </div>

          {/* Interactive Simulated MD3 App settings & Dark mode */}
          <div className="bg-white border border-slate-100 rounded-[24px] p-5 shadow-sm space-y-3.5">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-50 pb-2">
              <Settings size={14} className="text-slate-500 shrink-0" />
              <span>Thiết lập ứng dụng quân nhân</span>
            </h4>

            <div className="space-y-3">
              {/* Dark mode toggle */}
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Moon size={14} className="text-slate-400" />
                  <span className="font-bold text-slate-700">Chế độ hiển thị tối</span>
                </div>
                <button
                  type="button"
                  onClick={() => setDarkMode(!darkMode)}
                  className={`w-9 h-5 rounded-full p-0.5 transition cursor-pointer ${darkMode ? "bg-emerald-800" : "bg-slate-200"}`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white transition-transform ${darkMode ? "transform translate-x-4" : ""}`} />
                </button>
              </div>

              {/* Notification toggle */}
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Bell size={14} className="text-slate-400" />
                  <span className="font-bold text-slate-700">Thông báo từ ban chỉ huy</span>
                </div>
                <button
                  type="button"
                  onClick={() => setNotificationEnabled(!notificationEnabled)}
                  className={`w-9 h-5 rounded-full p-0.5 transition cursor-pointer ${notificationEnabled ? "bg-emerald-800" : "bg-slate-200"}`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white transition-transform ${notificationEnabled ? "transform translate-x-4" : ""}`} />
                </button>
              </div>

              {/* Daily Reminder toggle */}
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <BookOpen size={14} className="text-slate-400" />
                  <span className="font-bold text-slate-700">Nhắc nhở học tập hàng ngày</span>
                </div>
                <button
                  type="button"
                  onClick={() => setDailyReminder(!dailyReminder)}
                  className={`w-9 h-5 rounded-full p-0.5 transition cursor-pointer ${dailyReminder ? "bg-emerald-800" : "bg-slate-200"}`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white transition-transform ${dailyReminder ? "transform translate-x-4" : ""}`} />
                </button>
              </div>
            </div>
          </div>

        </div>
      ) : (
        <div className="space-y-4 animate-fade-in" id="leaderboard-subtab-container">
          
          {/* Header & Leaderboard scale scope switcher */}
          <div className="bg-white border border-slate-100 rounded-[24px] p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-black text-slate-800 uppercase">Bảng xếp hạng học tập</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Xếp hạng theo kết quả học tập, ôn luyện và kiểm tra.</p>
              </div>

              {/* Scope filter chips */}
              <div className="flex gap-1 bg-slate-100 p-1 rounded-xl text-[9px] font-black uppercase tracking-wide">
                <button
                  onClick={() => setLeaderboardScope("overall")}
                  className={`px-2.5 py-1.5 rounded-lg cursor-pointer transition ${
                    leaderboardScope === "overall" ? "bg-white text-slate-800 shadow-sm" : "text-slate-400"
                  }`}
                >
                  Cả đơn vị
                </button>
                <button
                  onClick={() => setLeaderboardScope("unit")}
                  className={`px-2.5 py-1.5 rounded-lg cursor-pointer transition ${
                    leaderboardScope === "unit" ? "bg-white text-slate-800 shadow-sm" : "text-slate-400"
                  }`}
                >
                  Đơn vị
                </button>
              </div>
            </div>
          </div>

          {/* Leaderboard mobile scroll list */}
          <div className="space-y-2.5">
            {filteredLeaderboard.map((entry) => {
              const isSelf = entry.userId === user.id;
              
              return (
                <div
                  key={entry.userId}
                  className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 text-xs transition ${
                    isSelf
                      ? "bg-amber-50 border-amber-300 shadow-sm font-bold scale-101"
                      : "bg-white border-slate-100 hover:border-slate-200 shadow-sm"
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    
                    {/* Rank Badge numbering indicator */}
                    <span className={`w-7 h-7 rounded-xl font-black text-xs flex items-center justify-center shrink-0 border ${
                      entry.rank === 1 ? "bg-yellow-400 border-yellow-500 text-slate-900" :
                      entry.rank === 2 ? "bg-slate-200 border-slate-300 text-slate-700" :
                      entry.rank === 3 ? "bg-amber-600 border-amber-700 text-white" : "bg-slate-50 border-slate-100 text-slate-400"
                    }`}>
                      {entry.rank}
                    </span>

                    {/* Member profile image placeholder */}
                    <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-100 font-extrabold text-[10px] flex items-center justify-center shrink-0">
                      {entry.fullName.split(" ").pop()?.substring(0, 2).toUpperCase()}
                    </div>

                    <div className="min-w-0">
                      <p className="font-black text-slate-800 flex items-center gap-1 text-[11px]">
                        <span className="truncate">{entry.fullName}</span>
                        {isSelf && (
                          <span className="px-1.5 py-0.5 bg-amber-200 text-amber-950 rounded text-[7px] font-black uppercase shrink-0">
                            Tôi
                          </span>
                        )}
                      </p>
                      <p className="text-[9px] text-slate-400 truncate font-extrabold uppercase mt-0.5">
                        {entry.unitName} • {entry.badge}
                      </p>
                    </div>
                  </div>

                  {/* Points breakdown */}
                  <div className="text-right shrink-0">
                    <p className="font-black text-slate-800 text-xs">{entry.points} điểm</p>
                    <p className="text-[9px] text-slate-400 font-extrabold uppercase mt-0.5">Hoàn thành: {entry.completionRate}%</p>
                  </div>
                </div>
              );
            })}
            {!remoteLoading && (remoteLeaderboardEmpty || remoteFallback) && filteredLeaderboard.length === 0 && (
              <div className="bg-white border border-slate-100 rounded-2xl p-5 text-center text-[10px] text-slate-500">
                Chưa có dữ liệu xếp hạng cho kỳ thi đã chọn.
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
}
