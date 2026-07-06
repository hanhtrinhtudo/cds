import React from "react";
import {
  User,
  LearningTopic,
  LearningProgress,
  Exam,
  News,
  LearningStatus,
  ExamAttempt
} from "../types";
import {
  BookOpen,
  Calendar,
  Award,
  AlertTriangle,
  ChevronRight,
  MessageSquare,
  HelpCircle,
  Star
} from "lucide-react";

interface DashboardProps {
  user: User;
  topics: LearningTopic[];
  progress: LearningProgress[];
  exams: Exam[];
  examAttempts: ExamAttempt[];
  news: News[];
  newsLoading?: boolean;
  newsLoadError?: string | null;
  onNavigate: (tab: string, arg?: any) => void;
  streak: number;
  averageScore: number;
}

export default function Dashboard({
  user,
  topics,
  progress,
  exams,
  examAttempts,
  news,
  newsLoading = false,
  newsLoadError = null,
  onNavigate,
  streak,
  averageScore
}: DashboardProps) {
  const getTopicProgress = (topicId: string) => {
    return progress.find(p => p.userId === user.id && p.topicId === topicId);
  };

  const getPriorityTask = () => {
    const activeExam = exams.find(e => {
      if ((e as Exam & { bankMode?: string }).bankMode === "mock") return false;
      if (e.status !== "active") return false;
      const submitted = examAttempts?.some(
        att => att.userId === user.id && att.examId === e.id
      );
      return !submitted;
    });

    if (activeExam) {
      return {
        type: "exam",
        title: "Kiểm tra chính thức đang diễn ra",
        description: activeExam.title,
        detail: `${activeExam.durationMinutes} phút • Hạn: ${new Date(
          activeExam.endDate
        ).toLocaleDateString("vi-VN")}`,
        actionText: "Vào kiểm tra",
        target: "exams",
        targetArg: activeExam,
        badgeColor: "bg-red-50 text-red-700 border-red-200",
        badgeText: "Đang diễn ra"
      };
    }

    const notStartedRequired = topics.find(t => {
      if (!t.required) return false;
      const prog = getTopicProgress(t.id);
      return !prog || prog.status === LearningStatus.NOT_STARTED;
    });

    if (notStartedRequired) {
      return {
        type: "topic",
        title: "Bài học bắt buộc chưa hoàn thành",
        description: notStartedRequired.title,
        detail: `${notStartedRequired.estimatedMinutes} phút${
          notStartedRequired.deadline
            ? ` • Hạn: ${new Date(notStartedRequired.deadline).toLocaleDateString("vi-VN")}`
            : ""
        }`,
        actionText: "Bắt đầu học",
        target: "learning",
        targetArg: notStartedRequired,
        badgeColor: "bg-amber-50 text-amber-700 border-amber-200",
        badgeText: "Cần học"
      };
    }

    const needReviewTopic = topics.find(t => {
      const prog = getTopicProgress(t.id);
      return prog?.status === LearningStatus.NEED_REVIEW;
    });

    if (needReviewTopic) {
      return {
        type: "review",
        title: "Nội dung cần ôn lại",
        description: needReviewTopic.title,
        detail: "Kết quả tự luyện cho thấy cần củng cố thêm nội dung này.",
        actionText: "Ôn lại bài",
        target: "learning",
        targetArg: needReviewTopic,
        badgeColor: "bg-orange-50 text-orange-700 border-orange-200",
        badgeText: "Cần ôn"
      };
    }

    const inProgressRequired = topics.find(t => {
      if (!t.required) return false;
      const prog = getTopicProgress(t.id);
      return prog?.status === LearningStatus.IN_PROGRESS;
    });

    if (inProgressRequired) {
      const prog = getTopicProgress(inProgressRequired.id);
      return {
        type: "topic",
        title: "Tiếp tục bài đang học",
        description: inProgressRequired.title,
        detail: `Tiến độ: ${prog?.progressPercent || 0}% • ${inProgressRequired.estimatedMinutes} phút`,
        actionText: "Mở bài học",
        target: "learning",
        targetArg: inProgressRequired,
        badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
        badgeText: "Cần học"
      };
    }

    const anyNotCompleted = topics.find(t => {
      const prog = getTopicProgress(t.id);
      return !prog || prog.status !== LearningStatus.COMPLETED;
    });

    if (anyNotCompleted) {
      return {
        type: "topic",
        title: "Bài học đề xuất",
        description: anyNotCompleted.title,
        detail: `Chuyên mục: ${anyNotCompleted.category}`,
        actionText: "Mở bài học",
        target: "learning",
        targetArg: anyNotCompleted,
        badgeColor: "bg-slate-50 text-slate-700 border-slate-200",
        badgeText: "Đề xuất"
      };
    }

    return {
      type: "done",
      title: "Đã hoàn thành nhiệm vụ học tập",
      description: "Đồng chí đã hoàn thành các nội dung được giao.",
      detail: "Có thể tiếp tục tự luyện hoặc hỏi AI Chính trị viên để mở rộng kiến thức.",
      actionText: "Hỏi AI Chính trị viên",
      target: "aitutor",
      targetArg: null,
      badgeColor: "bg-green-50 text-green-700 border-green-200",
      badgeText: "Hoàn thành"
    };
  };

  const priorityTask = getPriorityTask();

  const totalAssigned = topics.filter(t => t.required).length;
  const completedAssigned = topics.filter(t => {
    if (!t.required) return false;
    const prog = getTopicProgress(t.id);
    return prog?.status === LearningStatus.COMPLETED;
  }).length;

  const completionRate =
    totalAssigned > 0 ? Math.round((completedAssigned / totalAssigned) * 100) : 0;

  const weakTopics = topics.filter(t => {
    const prog = getTopicProgress(t.id);
    return prog?.status === LearningStatus.NEED_REVIEW;
  });

    const normalizeNewsText = (value?: string) =>
    String(value || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/[^a-z0-9\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();

  const getNewsDuplicateKey = (item: News) => {
  const title = normalizeNewsText(item.title);
  const summary = normalizeNewsText(item.summary);
  const image = String(item.imageUrl || "").split("?")[0];

  const titleKey = title.split(" ").slice(0, 4).join(" ");
  const summaryKey = summary.split(" ").slice(0, 6).join(" ");

  return item.externalUrl || image || `${titleKey}_${summaryKey}_${normalizeNewsText(item.source)}` || item.id;
};

  const uniqueNews = Array.from(
    new Map(
      news
        .filter(item => item?.title)
        .map(item => [getNewsDuplicateKey(item), item])
    ).values()
  );

  const latestNotices = uniqueNews
    .filter(n => n.category === "Thông báo đơn vị" || n.category === "Tin tức huấn luyện")
    .slice(0, 2);

  const dashboardNotices =
    latestNotices.length > 0 ? latestNotices : uniqueNews.slice(0, 3);

  return (
    <div className="space-y-4 pb-4" id="dashboard-tab-content">
      {/* Greeting */}
      <div
        className="bg-gradient-to-br from-red-700 via-red-800 to-red-950 p-3.5 rounded-[24px] text-white shadow-sm relative overflow-hidden"
        id="dashboard-banner"
      >
        <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none translate-y-4 translate-x-3">
          <BookOpen size={86} />
        </div>

        <div className="relative space-y-2.5">
          <div>
            <span className="inline-flex items-center px-2.5 py-0.5 bg-yellow-300 text-red-950 font-black rounded-full text-[9px] uppercase tracking-wide">
              Nhiệm vụ hôm nay
            </span>

            <h2 className="text-xl font-black tracking-tight mt-2 leading-tight">
              Chào đồng chí,
            </h2>

            <p className="text-lg font-black text-yellow-300 leading-snug break-words">
              {user.fullName}
            </p>

            <p className="text-[11px] text-red-50 mt-1 leading-relaxed">
              Hôm nay là{" "}
              {new Date().toLocaleDateString("vi-VN", {
                weekday: "long",
                day: "numeric",
                month: "numeric"
              })}
              . Hãy hoàn thành các nội dung học tập, ôn luyện và kiểm tra theo kế hoạch.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 bg-red-950/40 border border-white/10 rounded-2xl p-2">
            <div className="text-center">
              <p className="text-[9px] text-yellow-200 uppercase font-extrabold tracking-wide">
                Tiến độ học tập
              </p>
              <p className="text-xl leading-none font-black text-yellow-300 mt-1">
                {completionRate}%
              </p>
            </div>

            <div className="text-center border-l border-white/15">
              <p className="text-[9px] text-yellow-200 uppercase font-extrabold tracking-wide">
                Kết quả gần nhất
              </p>
              <p className="text-xl leading-none font-black text-white mt-1">
                {averageScore > 0 ? averageScore.toFixed(1) : "--"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Priority task */}
      <div className="bg-white border border-slate-100 rounded-[24px] p-3 shadow-sm space-y-2.5" id="priority-task-box">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400">
            Hôm nay cần làm gì?
          </h3>

          <span
            className={`px-2.5 py-0.5 border text-[9px] font-black rounded-full uppercase tracking-wide shrink-0 ${priorityTask.badgeColor}`}
          >
            {priorityTask.badgeText}
          </span>
        </div>

        <div className="flex items-start gap-2.5 p-2.5 bg-slate-50 border border-slate-100 rounded-2xl">
          <div
            className={`p-2.5 rounded-2xl shrink-0 ${
              priorityTask.type === "exam"
                ? "bg-red-50 text-red-600 border border-red-100"
                : priorityTask.type === "review"
                  ? "bg-orange-50 text-orange-600 border border-orange-100"
                  : "bg-red-50 text-red-700 border border-red-100"
            }`}
          >
            {priorityTask.type === "exam" ? <Calendar size={18} /> : <BookOpen size={18} />}
          </div>

          <div className="flex-1 min-w-0 space-y-1">
            <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wide leading-snug">
              {priorityTask.title}
            </h4>
            <p className="text-sm font-black text-slate-900 leading-snug">
              {priorityTask.description}
            </p>
            <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
              {priorityTask.detail}
            </p>
          </div>
        </div>

        <button
          onClick={() => onNavigate(priorityTask.target, priorityTask.targetArg)}
          className={`w-full py-2.5 px-4 rounded-2xl text-xs font-black flex items-center justify-center gap-2 transition shadow-sm active:scale-[0.98] min-h-[42px] ${
            priorityTask.type === "exam"
              ? "bg-red-600 hover:bg-red-700 text-white"
              : priorityTask.type === "review"
                ? "bg-orange-600 hover:bg-orange-700 text-white"
                : "bg-red-700 hover:bg-red-800 text-white"
          }`}
          id="btn-priority-task-action"
        >
          <span>{priorityTask.actionText}</span>
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Quick actions */}
      <div className="bg-white border border-slate-100 rounded-[24px] p-3 shadow-sm space-y-2.5" id="quick-actions">
        <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
          Truy cập nhanh
        </h4>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => onNavigate("learning")}
            className="p-2.5 bg-slate-50 hover:bg-red-50 active:scale-[0.98] border border-slate-100 rounded-2xl text-left transition flex items-center gap-2 min-h-[50px]"
          >
            <div className="p-1.5 bg-red-100 text-red-700 rounded-xl shrink-0">
              <BookOpen size={16} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-extrabold text-slate-800 truncate">Học tập</p>
              <p className="text-[9px] text-slate-400 truncate">Mở tài liệu</p>
            </div>
          </button>

          <button
            onClick={() => onNavigate("quiz")}
            className="p-2.5 bg-slate-50 hover:bg-red-50 active:scale-[0.98] border border-slate-100 rounded-2xl text-left transition flex items-center gap-2 min-h-[50px]"
          >
            <div className="p-1.5 bg-blue-100 text-blue-700 rounded-xl shrink-0">
              <HelpCircle size={16} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-extrabold text-slate-800 truncate">Ôn trắc nghiệm</p>
              <p className="text-[9px] text-slate-400 truncate">Tự luyện câu hỏi</p>
            </div>
          </button>

          <button
            onClick={() => onNavigate("exams")}
            className="p-2.5 bg-slate-50 hover:bg-red-50 active:scale-[0.98] border border-slate-100 rounded-2xl text-left transition flex items-center gap-2 min-h-[50px]"
          >
            <div className="p-1.5 bg-amber-100 text-amber-700 rounded-xl shrink-0">
              <Calendar size={16} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-extrabold text-slate-800 truncate">Kiểm tra</p>
              <p className="text-[9px] text-slate-400 truncate">Thi thử, kiểm tra</p>
            </div>
          </button>

          <button
            onClick={() => onNavigate("aitutor")}
            className="p-2.5 bg-slate-50 hover:bg-red-50 active:scale-[0.98] border border-slate-100 rounded-2xl text-left transition flex items-center gap-2 min-h-[50px]"
          >
            <div className="p-1.5 bg-rose-100 text-rose-700 rounded-xl shrink-0">
              <MessageSquare size={16} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-extrabold text-slate-800 truncate">AI Chính trị viên</p>
              <p className="text-[9px] text-slate-400 truncate">Hỏi, tóm tắt, giải thích</p>
            </div>
          </button>
        </div>
      </div>

      {/* Weak topics */}
      <div className="bg-white border border-slate-100 rounded-[24px] p-3 shadow-sm space-y-2.5" id="weak-topics-box">
        <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
          <AlertTriangle className="text-orange-500" size={16} />
          <span>Nội dung cần củng cố</span>
        </h3>

        {weakTopics.length > 0 ? (
          <div className="space-y-2">
            <p className="text-xs text-slate-500 leading-relaxed">
              Các nội dung dưới đây cần được ôn lại để nâng cao kết quả học tập.
            </p>

            {weakTopics.map(t => (
              <div
                key={t.id}
                className="p-3 bg-orange-50/80 border border-orange-100 rounded-2xl flex items-center justify-between gap-2 text-sm"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-2 h-2 bg-orange-500 rounded-full shrink-0" />
                  <p className="font-bold text-slate-800 truncate">{t.title}</p>
                </div>

                <button
                  onClick={() => onNavigate("learning", t)}
                  className="text-orange-800 text-xs font-black shrink-0 flex items-center hover:underline"
                >
                  <span>Ôn lại</span>
                  <ChevronRight size={12} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-3 text-center text-slate-400 flex flex-col items-center gap-1 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <Star size={20} className="text-amber-400 fill-amber-400" />
            <p className="text-xs font-black text-slate-700">Chưa có nội dung cần củng cố</p>
            <p className="text-[11px] text-slate-400">
              Tiếp tục duy trì học tập và ôn luyện thường xuyên.
            </p>
          </div>
        )}
      </div>

      {/* News */}
      <div className="bg-white border border-slate-100 rounded-[24px] p-3 shadow-sm space-y-2.5" id="notices-box">
        <div className="flex items-center justify-between pb-1 border-b border-slate-50">
          <h3 className="text-sm font-black text-slate-800">Tin tức & thông báo</h3>

          <button
            onClick={() => onNavigate("news")}
            className="text-xs text-red-700 font-black hover:underline flex items-center gap-0.5"
          >
            <span>Xem tất cả</span>
            <ChevronRight size={13} />
          </button>
        </div>

        <div className="space-y-2">
          {dashboardNotices.map(notice => (
            <div
              key={notice.id}
              onClick={() => onNavigate("news_detail", notice)}
              className="group cursor-pointer flex gap-2.5 p-2.5 bg-slate-50 hover:bg-red-50/40 rounded-2xl transition border border-transparent hover:border-red-100"
            >
              <div className="shrink-0 w-14 h-12 bg-slate-200 rounded-xl overflow-hidden relative border border-slate-200">
                {notice.imageUrl ? (
                  <img
                    src={notice.imageUrl}
                    alt={notice.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    referrerPolicy="no-referrer"
                    loading="lazy"
                    decoding="async"
                    onError={event => {
                      event.currentTarget.style.display = "none";
                      event.currentTarget.nextElementSibling?.classList.remove("hidden");
                    }}
                  />
                ) : null}
                  <div className={`${notice.imageUrl ? "hidden" : ""} w-full h-full flex items-center justify-center text-slate-400 bg-slate-100`}>
                    <BookOpen size={17} />
                  </div>
              </div>

              <div className="flex-1 min-w-0 flex flex-col justify-center">
                <span className="inline-block px-2 py-0.5 bg-red-50 text-red-700 text-[9px] font-black rounded w-fit mb-1 uppercase tracking-wide">
                  {notice.category}
                </span>

                <h4 className="text-sm font-black text-slate-800 group-hover:text-red-700 transition line-clamp-1 leading-snug">
                  {notice.title}
                </h4>

                <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">
                  {notice.summary}
                </p>
              </div>
            </div>
          ))}

          {dashboardNotices.length === 0 && newsLoading && (
            <div className="w-full p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3">
              <div className="w-12 h-10 rounded-xl bg-slate-200 animate-pulse shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-2.5 w-4/5 rounded bg-slate-200 animate-pulse" />
                <div className="h-2 w-1/2 rounded bg-slate-100 animate-pulse" />
                <p className="text-[11px] font-bold text-slate-500 pt-0.5">Đang tải tin tức...</p>
              </div>
            </div>
          )}

          {dashboardNotices.length === 0 && !newsLoading && (
            <button
              onClick={() => onNavigate("news")}
              className="w-full p-3 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-left text-xs font-bold text-slate-600"
            >
              {newsLoadError ? "Chưa tải được tin tức. Nhấn để thử lại trong chuyên mục Tin tức và Chính sách." : "Chưa có tin tức mới. Nhấn để mở chuyên mục Tin tức và Chính sách."}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
