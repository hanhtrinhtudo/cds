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
import { AppCaption, AppHeading, AppText, Badge, Button, EmptyState, SectionHeader, Skeleton } from "./ui";
import { NewsItem } from "./product";
import { AppContainer, AppPage, AppStack } from "./layout";
import { getNewsImageUrl } from "../utils/newsImage";

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
        title: "Kiểm tra đang diễn ra",
        description: activeExam.title,
        detail: `${activeExam.durationMinutes} phút • Hạn: ${new Date(
          activeExam.endDate
        ).toLocaleDateString("vi-VN")}`,
        actionText: "Bắt đầu kiểm tra",
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
        actionText: "Mở bài học",
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
        badgeColor: "bg-slate-50 text-[var(--app-color-text-secondary)] border-[var(--app-color-border)]",
        badgeText: "Đề xuất"
      };
    }

    return {
      type: "done",
      title: "Đã hoàn thành nhiệm vụ học tập",
      description: "Đồng chí đã hoàn thành các nội dung được giao.",
      detail: "Có thể tiếp tục ôn luyện hoặc trao đổi với AI Chính trị viên để mở rộng kiến thức.",
      actionText: "Trao đổi với AI Chính trị viên",
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
  const source = normalizeNewsText(item.source);

  const titleWords = title.split(" ").filter(Boolean);
  const summaryWords = summary.split(" ").filter(Boolean);

  const titleKey = titleWords.slice(0, 12).join(" ");
  const summaryKey = summaryWords.slice(0, 10).join(" ");

  if (titleKey) return `${titleKey}_${source}`;
  if (summaryKey) return `${summaryKey}_${source}`;

  const link = String((item as any).externalUrl || (item as any).link || "")
    .split("?")[0]
    .trim()
    .toLowerCase();

  return link || item.id;
};

  const uniqueNews = Array.from(
  new Map(
    news
      .filter(item => item?.title)
      .map(item => [getNewsDuplicateKey(item), {
        ...item,
        imageUrl: getNewsImageUrl(item)
      }])
  ).values()
);

  const latestNotices = uniqueNews
    .filter(n => n.category === "Thông báo đơn vị" || n.category === "Tin tức huấn luyện")
    .slice(0, 2);

  const dashboardNotices =
    latestNotices.length > 0 ? latestNotices : uniqueNews.slice(0, 3);

  return (
    <AppPage variant="plain" id="dashboard-tab-content">
      <AppContainer bleed>
        <AppStack gap="md" className="pb-3">
      {/* Greeting */}
      <div
        className="relative overflow-hidden rounded-[var(--app-radius-card)] bg-gradient-to-br from-red-700 via-red-800 to-red-950 p-3 text-white"
        id="dashboard-banner"
      >
        <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none translate-y-4 translate-x-3">
          <BookOpen size={86} />
        </div>

        <div className="relative space-y-2">
          <div>
            <AppCaption as="span" overline className="inline-flex items-center px-2.5 py-0.5 bg-yellow-300 text-red-950 font-extrabold rounded-full tracking-wide">
              Nhiệm vụ hôm nay
            </AppCaption>

            <AppHeading level="h2" variant="headingM" color="inverse" className="tracking-tight mt-1.5 leading-tight">
              Chào đồng chí,
            </AppHeading>

            <AppHeading level="h3" variant="headingM" className="text-yellow-300 leading-snug break-words">
              {user.fullName}
            </AppHeading>

            <AppCaption color="inverse" className="text-red-50 mt-1 leading-relaxed">
              Hôm nay là{" "}
              {new Date().toLocaleDateString("vi-VN", {
                weekday: "long",
                day: "numeric",
                month: "numeric"
              })}
              . Hãy hoàn thành các nội dung học tập, ôn luyện và kiểm tra theo kế hoạch.
            </AppCaption>
          </div>

          <div className="grid grid-cols-2 gap-2 bg-red-950/35 rounded-2xl p-1.5">
            <div className="text-center">
              <AppCaption overline className="text-yellow-200 uppercase font-extrabold tracking-wide">
                Tiến độ học tập
              </AppCaption>
              <p className="text-xl leading-none font-extrabold text-yellow-300 mt-1">
                {completionRate}%
              </p>
            </div>

            <div className="text-center border-l border-white/15">
              <AppCaption overline className="text-yellow-200 uppercase font-extrabold tracking-wide">
                Kết quả gần nhất
              </AppCaption>
              <p className="text-xl leading-none font-extrabold text-white mt-1">
                {averageScore > 0 ? averageScore.toFixed(1) : "--"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Priority task */}
      <div className="pixel-surface space-y-2.5 p-3" id="priority-task-box">
        <div className="flex items-center justify-between gap-2">
          <AppCaption overline className="font-extrabold uppercase tracking-widest text-[var(--app-color-text-muted)]">
            Hôm nay cần làm gì?
          </AppCaption>

          <Badge className={`shrink-0 ${priorityTask.badgeColor}`}>
            {priorityTask.badgeText}
          </Badge>
        </div>

        <div className="flex items-start gap-2.5 p-2.5 bg-slate-50 rounded-2xl">
          <div
            className={`p-2.5 rounded-2xl shrink-0 ${
              priorityTask.type === "exam"
                ? "bg-red-50 text-red-600"
                : priorityTask.type === "review"
                  ? "bg-orange-50 text-orange-600"
                  : "bg-red-50 text-red-700"
            }`}
          >
            {priorityTask.type === "exam" ? <Calendar size={18} /> : <BookOpen size={18} />}
          </div>

          <div className="flex-1 min-w-0 space-y-1">
            <AppCaption overline className="font-bold text-[var(--app-color-text-muted)] uppercase tracking-wide leading-snug">
              {priorityTask.title}
            </AppCaption>
            <AppText variant="body" weight="black" className="text-[var(--app-color-text-primary)] leading-snug">
              {priorityTask.description}
            </AppText>
            <AppCaption className="text-[var(--app-color-text-muted)] font-medium leading-relaxed">
              {priorityTask.detail}
            </AppCaption>
          </div>
        </div>

        <Button
          type="button"
          onClick={() => onNavigate(priorityTask.target, priorityTask.targetArg)}
          variant={priorityTask.type === "review" ? "warning" : "primary"}
          fullWidth
          rightIcon={<ChevronRight size={18} />}
          id="btn-priority-task-action"
        >
          {priorityTask.actionText}
        </Button>
      </div>

      {/* Quick actions */}
      <div className="pixel-surface space-y-2.5 p-3" id="quick-actions">
        <SectionHeader title="Truy cập nhanh" compact />

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => onNavigate("learning")}
            className="p-2 bg-slate-50 hover:bg-red-50 active:scale-[0.98] rounded-2xl text-left transition flex items-center gap-2 min-h-[48px]"
          >
            <div className="p-1.5 bg-red-100 text-red-700 rounded-xl shrink-0">
              <BookOpen size={16} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-extrabold text-[var(--app-color-text-primary)] truncate">Học tập</p>
              <AppCaption truncate className="text-[var(--app-color-text-muted)]">Mở tài liệu</AppCaption>
            </div>
          </button>

          <button
            onClick={() => onNavigate("quiz")}
            className="p-2 bg-slate-50 hover:bg-red-50 active:scale-[0.98] rounded-2xl text-left transition flex items-center gap-2 min-h-[48px]"
          >
            <div className="p-1.5 bg-blue-100 text-blue-700 rounded-xl shrink-0">
              <HelpCircle size={16} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-extrabold text-[var(--app-color-text-primary)] truncate">Ôn trắc nghiệm</p>
              <AppCaption truncate className="text-[var(--app-color-text-muted)]">Tự luyện câu hỏi</AppCaption>
            </div>
          </button>

          <button
            onClick={() => onNavigate("exams")}
            className="p-2 bg-slate-50 hover:bg-red-50 active:scale-[0.98] rounded-2xl text-left transition flex items-center gap-2 min-h-[48px]"
          >
            <div className="p-1.5 bg-amber-100 text-amber-700 rounded-xl shrink-0">
              <Calendar size={16} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-extrabold text-[var(--app-color-text-primary)] truncate">Kiểm tra</p>
              <AppCaption truncate className="text-[var(--app-color-text-muted)]">Thi thử, kiểm tra</AppCaption>
            </div>
          </button>

          <button
            onClick={() => onNavigate("aitutor")}
            className="p-2 bg-slate-50 hover:bg-red-50 active:scale-[0.98] rounded-2xl text-left transition flex items-center gap-2 min-h-[48px]"
          >
            <div className="p-1.5 bg-rose-100 text-rose-700 rounded-xl shrink-0">
              <MessageSquare size={16} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-extrabold text-[var(--app-color-text-primary)] truncate">AI Chính trị viên</p>
              <AppCaption truncate className="text-[var(--app-color-text-muted)]">Hỏi, tóm tắt, giải thích</AppCaption>
            </div>
          </button>
        </div>
      </div>

      {/* Weak topics */}
      <div className="pixel-surface space-y-2.5 p-3" id="weak-topics-box">
        <SectionHeader title="Nội dung cần củng cố" compact action={<AlertTriangle className="text-orange-500" size={16} />} />

        {weakTopics.length > 0 ? (
          <div className="space-y-2">
            <p className="text-xs text-[var(--app-color-text-muted)] leading-relaxed">
              Các nội dung dưới đây cần được ôn lại để nâng cao kết quả học tập.
            </p>

            {weakTopics.map(t => (
              <div
                key={t.id}
                className="p-2.5 bg-orange-50/80 rounded-2xl flex items-center justify-between gap-2 text-sm"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-2 h-2 bg-orange-500 rounded-full shrink-0" />
                  <p className="font-bold text-[var(--app-color-text-primary)] truncate">{t.title}</p>
                </div>

                <button
                  onClick={() => onNavigate("learning", t)}
                  className="text-orange-800 text-xs font-extrabold shrink-0 flex items-center hover:underline"
                >
                  <span>Ôn lại</span>
                  <ChevronRight size={12} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<Star size={20} className="text-amber-400 fill-amber-400" />}
            title="Chưa có nội dung cần củng cố"
            description="Tiếp tục duy trì học tập và ôn luyện thường xuyên."
            className="py-3"
          />
        )}
      </div>

      {/* News */}
      <div className="pixel-surface space-y-2 p-3" id="notices-box">
        <SectionHeader
          title="Tin tức và thông báo"
          compact
          className="pb-0.5"
          action={<button
            onClick={() => onNavigate("news")}
            className="inline-flex min-h-11 items-center gap-0.5 text-xs text-red-700 font-extrabold hover:underline"
          >
            <span>Xem tất cả</span>
            <ChevronRight size={13} />
          </button>}
        />

        <div className="space-y-1.5">
          {dashboardNotices.map(notice => (
            <NewsItem
              key={notice.id}
              title={notice.title}
              summary={notice.summary}
              category={notice.category}
              imageUrl={getNewsImageUrl(notice)}
              compact
              className="bg-slate-50 shadow-none hover:border-red-100 hover:bg-red-50/40"
              onOpen={() => onNavigate("news_detail", notice)}
            />
          ))}

          {dashboardNotices.length === 0 && newsLoading && (
            <Skeleton variant="news" />
          )}

          {dashboardNotices.length === 0 && !newsLoading && (
            <EmptyState
              variant="news"
              title={newsLoadError ? "Không thể tải tin tức" : "Hiện chưa có tin tức mới"}
              description={newsLoadError ? "Vui lòng mở chuyên mục Tin tức và thử lại." : "Tin tức mới sẽ được hiển thị tại đây."}
              action={<Button type="button" variant="secondary" size="sm" onClick={() => onNavigate("news")}>Xem tin tức</Button>}
            />
          )}
        </div>
      </div>
        </AppStack>
      </AppContainer>
    </AppPage>
  );
}
