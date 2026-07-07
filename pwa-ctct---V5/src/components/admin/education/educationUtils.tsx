import React from "react";
import { Bot, BookOpenCheck, ClipboardCheck, Newspaper, RotateCcw } from "lucide-react";
import { Exam, LearningTopic, Question, User, UserRole } from "../../../types";
import { EducationDashboardSpec } from "./educationTypes";

interface BuildEducationSpecsInput {
  users: User[];
  topics: LearningTopic[];
  exams: Exam[];
  questions: Question[];
  analyticsLoading?: boolean;
  analyticsAvailable?: boolean;
  analyticsEvents?: any[];
  analyticsSummary?: any;
  range?: "today" | "7d" | "30d";
}

const analyticsHelper = "Từ dữ liệu analytics";
const unavailableHelper = "Cần dữ liệu analytics để xác nhận";

const valueOrDash = (value: unknown): string | number =>
  typeof value === "number" || typeof value === "string"
    ? value
    : "--";

export const eventsOf = (events: any[], types: string[]) =>
  events.filter(event => types.includes(String(event.eventType || "")));

export const uniqueUserCount = (events: any[]) =>
  new Set(events.map(event => event.userId || event.UserID).filter(Boolean)).size;

export const averageScore = (events: any[]) => {
  const scores = events
    .map(event => Number(event.score ?? event.Score))
    .filter(score => Number.isFinite(score));

  if (!scores.length) return undefined;

  return Number((scores.reduce((sum, score) => sum + score, 0) / scores.length).toFixed(1));
};

export const topResources = (events: any[], limit = 5) => {
  const map = new Map<string, { title: string; count: number }>();

  events.forEach(event => {
    const key =
      String(event.resourceId || event.ResourceID || event.resourceTitle || event.ResourceTitle || "unknown");

    const title =
      String(event.resourceTitle || event.ResourceTitle || event.resourceId || event.ResourceID || "Chưa xác định");

    const current = map.get(key) || { title, count: 0 };
    current.count += 1;
    map.set(key, current);
  });

  return Array.from(map.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
};

export const recentEvents = (events: any[], limit = 5) =>
  [...events]
    .sort((a, b) => {
      const at = new Date(a.createdAt || a.CreatedAt || a.clientTime || a.ClientTime || 0).getTime();
      const bt = new Date(b.createdAt || b.CreatedAt || b.clientTime || b.ClientTime || 0).getTime();
      return bt - at;
    })
    .slice(0, limit);

export const usersWithoutEvent = (users: User[], events: any[]) => {
  const activeUserIds = new Set(
    events.map(event => String(event.userId || event.UserID || "")).filter(Boolean)
  );

  return users.filter(user => user.role === UserRole.MEMBER && !activeUserIds.has(String(user.id))).length;
};

const toRanking = (items: Array<{ title: string; count: number }>) =>
  items.map((item, index) => ({
    id: item.title,
    rank: index + 1,
    title: item.title,
    value: item.count,
    helper: `${item.count} lượt`
  }));

const toActivities = (events: any[]) =>
  recentEvents(events, 5).map((event, index) => ({
    id: String(event.eventId || event.EventID || `${event.eventType}-${index}`),
    title: String(event.resourceTitle || event.ResourceTitle || event.eventType || "Hoạt động"),
    description: String(event.fullName || event.FullName || event.username || event.Username || "Học viên"),
    time: String(event.createdAt || event.CreatedAt || event.clientTime || event.ClientTime || "")
  }));

export function buildEducationDashboardSpecs({
  users,
  topics,
  exams,
  questions,
  analyticsLoading = false,
  analyticsAvailable = false,
  analyticsEvents = []
}: BuildEducationSpecsInput): EducationDashboardSpec[] {
  const learnerCount = users.filter(user => user.role === UserRole.MEMBER).length;
  const requiredTopicCount = topics.filter(topic => topic.required).length;

  const learningEvents = eventsOf(analyticsEvents, [
    "OPEN_TOPIC",
    "READ_PROGRESS",
    "MARK_COMPLETE",
    "BOOKMARK_ADD",
    "BOOKMARK_REMOVE"
  ]);

  const completedEvents = eventsOf(analyticsEvents, ["MARK_COMPLETE"]);

  const quizEvents = eventsOf(analyticsEvents, [
    "QUIZ_START",
    "QUIZ_SUBMIT"
  ]);

  const quizSubmitEvents = eventsOf(analyticsEvents, ["QUIZ_SUBMIT"]);

  const reviewEvents = eventsOf(analyticsEvents, [
    "REVIEW_OPEN",
    "REVIEW_COMPLETE"
  ]);

  const reviewCompleteEvents = eventsOf(analyticsEvents, ["REVIEW_COMPLETE"]);

  const aiEvents = eventsOf(analyticsEvents, [
    "AI_OPEN",
    "AI_PROMPT",
    "AI_RESPONSE"
  ]);

  const aiPromptEvents = eventsOf(analyticsEvents, ["AI_PROMPT"]);

  const newsEvents = eventsOf(analyticsEvents, ["NEWS_VIEW"]);

  const weakQuizLearners = new Set(
    quizSubmitEvents
      .filter(event => Number(event.score ?? event.Score) < 6)
      .map(event => String(event.userId || event.UserID || ""))
      .filter(Boolean)
  ).size;

  const base = {
    analyticsAvailable,
    loading: analyticsLoading
  };

  return [
    {
      ...base,
      id: "learning",
      title: "Tiến độ học",
      subtitle: "Theo dõi tiến độ học tập theo học viên, chuyên đề và đơn vị.",
      badge: analyticsAvailable ? "Live analytics" : "No analytics available",
      icon: <BookOpenCheck size={22} />,
      kpis: [
        { id: "totalLearners", label: "Tổng học viên", value: learnerCount, helper: "Từ danh sách tài khoản", tone: "info" },
        { id: "learningEvents", label: "Hoạt động học", value: analyticsAvailable ? learningEvents.length : "--", helper: analyticsAvailable ? analyticsHelper : unavailableHelper },
        { id: "activeLearners", label: "Người học hoạt động", value: analyticsAvailable ? uniqueUserCount(learningEvents) : "--", helper: analyticsAvailable ? analyticsHelper : unavailableHelper },
        { id: "completed", label: "Hoàn thành", value: analyticsAvailable ? completedEvents.length : "--", helper: analyticsAvailable ? analyticsHelper : unavailableHelper },
        { id: "slowLearners", label: "Chưa có hoạt động học", value: analyticsAvailable ? usersWithoutEvent(users, learningEvents) : "--", helper: analyticsAvailable ? analyticsHelper : unavailableHelper, tone: "warning" },
        { id: "requiredTopics", label: "Chuyên đề bắt buộc", value: requiredTopicCount, helper: "Từ danh mục chuyên đề", tone: "info" }
      ],
      trends: topResources(learningEvents, 2).length
        ? topResources(learningEvents, 2).map(item => ({
            id: item.title,
            title: item.title,
            description: "Chuyên đề có nhiều hoạt động học.",
            value: item.count
          }))
        : [
            { id: "topicCompletion", title: "Chuyên đề nổi bật", description: "Hiển thị khi có tiến độ theo chuyên đề.", value: "--" },
            { id: "unitCompletion", title: "Đơn vị học tập", description: "Hiển thị khi có tiến độ theo đơn vị.", value: "--" }
          ],
      rankings: analyticsAvailable ? toRanking(topResources(learningEvents, 5)) : [],
      activities: analyticsAvailable ? toActivities(learningEvents) : [],
      drillDownTitle: "Drill-down tiến độ học",
      drillDownDescription: "Khu vực drill-down theo học viên, chuyên đề hoặc đơn vị.",
      emptyTitle: analyticsAvailable ? "Chưa có hoạt động học" : "No analytics available",
      emptyDescription: analyticsAvailable
        ? "Chưa ghi nhận sự kiện học tập trong khoảng thời gian đã chọn."
        : "Chưa có dữ liệu phân tích tiến độ học để drill-down."
    },
    {
      ...base,
      id: "exam",
      title: "Kiểm tra",
      subtitle: "Theo dõi lượt nộp bài, điểm số, tỷ lệ đạt và thống kê nội dung kiểm tra.",
      badge: analyticsAvailable ? "Live analytics" : "No analytics available",
      icon: <ClipboardCheck size={22} />,
      kpis: [
        { id: "quizEvents", label: "Hoạt động kiểm tra", value: analyticsAvailable ? quizEvents.length : "--", helper: analyticsAvailable ? analyticsHelper : unavailableHelper },
        { id: "submissions", label: "Lượt nộp bài", value: analyticsAvailable ? quizSubmitEvents.length : "--", helper: analyticsAvailable ? analyticsHelper : unavailableHelper },
        {
          id: "averageScore",
          label: "Điểm TB",
          value: analyticsAvailable ? valueOrDash(averageScore(quizSubmitEvents)) : "--",
          helper: analyticsAvailable ? analyticsHelper : unavailableHelper
        },
        { id: "recentExams", label: "Kỳ kiểm tra", value: exams.length, helper: "Từ danh sách kỳ kiểm tra", tone: "info" },
        { id: "weakLearners", label: "Học viên điểm thấp", value: analyticsAvailable ? weakQuizLearners : "--", helper: analyticsAvailable ? "Điểm dưới 6" : unavailableHelper, tone: "warning" },
        { id: "activeLearners", label: "Người tham gia", value: analyticsAvailable ? uniqueUserCount(quizEvents) : "--", helper: analyticsAvailable ? analyticsHelper : unavailableHelper }
      ],
      trends: topResources(quizSubmitEvents, 2).length
        ? topResources(quizSubmitEvents, 2).map(item => ({
            id: item.title,
            title: item.title,
            description: "Nội dung kiểm tra có nhiều lượt nộp.",
            value: item.count
          }))
        : [
            { id: "recentExamList", title: "Kỳ kiểm tra gần đây", description: "Danh sách kiểm tra gần đây sẽ có số liệu khi analytics sẵn sàng.", value: exams.length },
            { id: "topicStatistics", title: "Thống kê chủ đề", description: "Thống kê theo chủ đề/câu hỏi cần dữ liệu kết quả.", value: "--" }
          ],
      rankings: analyticsAvailable ? toRanking(topResources(quizSubmitEvents, 5)) : [],
      activities: analyticsAvailable ? toActivities(quizEvents) : [],
      drillDownTitle: "Drill-down kiểm tra",
      drillDownDescription: "Khu vực phân tích theo kỳ kiểm tra, học viên và chủ đề.",
      emptyTitle: analyticsAvailable ? "Chưa có dữ liệu kiểm tra" : "No analytics available",
      emptyDescription: analyticsAvailable
        ? "Chưa ghi nhận lượt kiểm tra trong khoảng thời gian đã chọn."
        : "Không hiển thị số liệu khi chưa có dữ liệu phân tích hợp lệ."
    },
    {
      ...base,
      id: "review",
      title: "Ôn tập",
      subtitle: "Theo dõi tần suất ôn tập, chủ đề được xem lại và nhóm học viên chưa ôn.",
      badge: analyticsAvailable ? "Live analytics" : "No analytics available",
      icon: <RotateCcw size={22} />,
      kpis: [
        { id: "reviewSessions", label: "Lượt ôn tập", value: analyticsAvailable ? reviewEvents.length : "--", helper: analyticsAvailable ? analyticsHelper : unavailableHelper },
        { id: "reviewComplete", label: "Hoàn thành ôn", value: analyticsAvailable ? reviewCompleteEvents.length : "--", helper: analyticsAvailable ? analyticsHelper : unavailableHelper },
        { id: "reviewUsers", label: "Người ôn tập", value: analyticsAvailable ? uniqueUserCount(reviewEvents) : "--", helper: analyticsAvailable ? analyticsHelper : unavailableHelper },
        { id: "withoutReview", label: "Chưa ôn tập", value: analyticsAvailable ? usersWithoutEvent(users, reviewEvents) : "--", helper: analyticsAvailable ? analyticsHelper : unavailableHelper, tone: "warning" },
        { id: "mostReviewed", label: "Chủ đề ôn nhiều", value: analyticsAvailable ? topResources(reviewEvents, 1)[0]?.count ?? "--" : "--", helper: analyticsAvailable ? analyticsHelper : unavailableHelper },
        { id: "questionBank", label: "Ngân hàng câu hỏi", value: questions.length, helper: "Từ ngân hàng câu hỏi", tone: "info" }
      ],
      trends: topResources(reviewEvents, 2).length
        ? topResources(reviewEvents, 2).map(item => ({
            id: item.title,
            title: item.title,
            description: "Chủ đề được ôn tập nhiều.",
            value: item.count
          }))
        : [
            { id: "mostReviewedTopics", title: "Chủ đề ôn nhiều", description: "Cần sự kiện review để xác định chủ đề được ôn nhiều.", value: "--" },
            { id: "reviewFrequency", title: "Tần suất ôn tập", description: "Cần analytics để tính tần suất ôn tập.", value: "--" }
          ],
      rankings: analyticsAvailable ? toRanking(topResources(reviewEvents, 5)) : [],
      activities: analyticsAvailable ? toActivities(reviewEvents) : [],
      drillDownTitle: "Drill-down ôn tập",
      drillDownDescription: "Khu vực phân tích tần suất ôn, chủ đề và học viên chưa xem lại.",
      emptyTitle: analyticsAvailable ? "Chưa có dữ liệu ôn tập" : "No analytics available",
      emptyDescription: analyticsAvailable
        ? "Chưa ghi nhận hoạt động ôn tập trong khoảng thời gian đã chọn."
        : "Dữ liệu ôn tập sẽ hiển thị khi có sự kiện review."
    },
    {
      ...base,
      id: "ai",
      title: "AI Tutor",
      subtitle: "Theo dõi mức độ sử dụng AI Chính trị viên theo chủ đề và học viên.",
      badge: analyticsAvailable ? "Live analytics" : "Analytics unavailable",
      icon: <Bot size={22} />,
      kpis: [
        { id: "aiEvents", label: "Hoạt động AI", value: analyticsAvailable ? aiEvents.length : "--", helper: analyticsAvailable ? analyticsHelper : unavailableHelper },
        { id: "questions", label: "Lượt hỏi AI", value: analyticsAvailable ? aiPromptEvents.length : "--", helper: analyticsAvailable ? "Không hiển thị nội dung hỏi" : unavailableHelper },
        { id: "activeUsers", label: "Người dùng AI", value: analyticsAvailable ? uniqueUserCount(aiEvents) : "--", helper: analyticsAvailable ? analyticsHelper : unavailableHelper },
        { id: "topAskedTopics", label: "Chủ đề hỏi nhiều", value: analyticsAvailable ? topResources(aiPromptEvents, 1)[0]?.count ?? "--" : "--", helper: analyticsAvailable ? "Chỉ dùng metadata, không dùng nội dung nhạy cảm" : unavailableHelper },
        { id: "unknownTopics", label: "Chủ đề chưa phân loại", value: "--", helper: "Cần phân loại analytics nâng cao", tone: "warning" }
      ],
      trends: topResources(aiPromptEvents, 2).length
        ? topResources(aiPromptEvents, 2).map(item => ({
            id: item.title,
            title: item.title,
            description: "Nhóm chủ đề AI được hỏi nhiều.",
            value: item.count
          }))
        : [
            { id: "askedTopics", title: "Chủ đề hỏi nhiều", description: "Không ghi nội dung nhạy cảm; chỉ dùng metadata khi analytics sẵn sàng.", value: "--" },
            { id: "unknownTopicSignals", title: "Chủ đề chưa phân loại", description: "Chủ đề chưa phân loại cần được xử lý bởi analytics.", value: "--" }
          ],
      rankings: analyticsAvailable ? toRanking(topResources(aiPromptEvents, 5)) : [],
      activities: analyticsAvailable ? toActivities(aiEvents) : [],
      drillDownTitle: "Drill-down AI Tutor",
      drillDownDescription: "Khu vực xem nhóm chủ đề hỏi AI và học viên sử dụng nhiều.",
      emptyTitle: analyticsAvailable ? "Chưa có dữ liệu AI" : "Analytics unavailable",
      emptyDescription: analyticsAvailable
        ? "Chưa ghi nhận hoạt động AI trong khoảng thời gian đã chọn."
        : "Chưa có dữ liệu phân tích hoạt động AI Tutor."
    },
    {
      ...base,
      id: "news",
      title: "Tin tức",
      subtitle: "Theo dõi lượt đọc tin, chuyên mục được quan tâm và nội dung chưa đọc.",
      badge: analyticsAvailable ? "Live analytics" : "No analytics available",
      icon: <Newspaper size={22} />,
      kpis: [
        { id: "newsViewed", label: "Lượt đọc tin", value: analyticsAvailable ? newsEvents.length : "--", helper: analyticsAvailable ? analyticsHelper : unavailableHelper },
        { id: "readers", label: "Người đọc tin", value: analyticsAvailable ? uniqueUserCount(newsEvents) : "--", helper: analyticsAvailable ? analyticsHelper : unavailableHelper },
        { id: "mostRead", label: "Tin/chuyên mục nổi bật", value: analyticsAvailable ? topResources(newsEvents, 1)[0]?.count ?? "--" : "--", helper: analyticsAvailable ? analyticsHelper : unavailableHelper },
        { id: "unreadNews", label: "Chưa đọc tin", value: analyticsAvailable ? usersWithoutEvent(users, newsEvents) : "--", helper: analyticsAvailable ? analyticsHelper : unavailableHelper, tone: "warning" },
        { id: "latestNews", label: "Tin mới", value: analyticsAvailable ? recentEvents(newsEvents, 1).length : "--", helper: analyticsAvailable ? analyticsHelper : "Cần nguồn tin và analytics đọc tin" }
      ],
      trends: topResources(newsEvents, 2).length
        ? topResources(newsEvents, 2).map(item => ({
            id: item.title,
            title: item.title,
            description: "Tin hoặc chuyên mục được đọc nhiều.",
            value: item.count
          }))
        : [
            { id: "categories", title: "Chuyên mục đọc nhiều", description: "Cần sự kiện NEWS_VIEW để tổng hợp chuyên mục đọc nhiều.", value: "--" },
            { id: "unread", title: "Tin chưa đọc", description: "Cần dữ liệu người đọc để xác định tin chưa đọc.", value: "--" }
          ],
      rankings: analyticsAvailable ? toRanking(topResources(newsEvents, 5)) : [],
      activities: analyticsAvailable ? toActivities(newsEvents) : [],
      drillDownTitle: "Drill-down tin tức",
      drillDownDescription: "Khu vực phân tích lượt đọc theo tin, chuyên mục và đơn vị.",
      emptyTitle: analyticsAvailable ? "Chưa có dữ liệu đọc tin" : "No analytics available",
      emptyDescription: analyticsAvailable
        ? "Chưa ghi nhận lượt đọc tin trong khoảng thời gian đã chọn."
        : "Lượt đọc tin sẽ hiển thị khi analytics ghi nhận NEWS_VIEW."
    }
  ];
}