import { AnalyticsEventRecord, AnalyticsSummary } from "../../../services/analyticsService";
import { User } from "../../../types";
import { CommandAlert, CommandKpi, LearnerSignal, UnitProgressItem, WidgetTone } from "./dashboardTypes";

export const eventTypeLabel: Record<string, string> = {
  LOGIN: "Đăng nhập",
  LOGOUT: "Đăng xuất",
  APP_OPEN: "Mở ứng dụng",
  TAB_OPEN: "Mở chuyên mục",
  OPEN_TOPIC: "Mở chuyên đề",
  OPEN_DOCUMENT: "Mở tài liệu",
  READ_PROGRESS: "Cập nhật tiến độ",
  MARK_COMPLETE: "Hoàn thành bài học",
  BOOKMARK_ADD: "Lưu bài học",
  BOOKMARK_REMOVE: "Bỏ lưu bài học",
  QUIZ_START: "Bắt đầu ôn tập",
  QUIZ_SUBMIT: "Nộp bài",
  REVIEW_OPEN: "Xem lại đáp án",
  REVIEW_COMPLETE: "Hoàn thành xem lại",
  NEWS_VIEW: "Xem tin",
  AI_OPEN: "Mở AI Chính trị viên",
  AI_PROMPT: "Hỏi AI",
  AI_RESPONSE: "AI phản hồi",
  PROFILE_OPEN: "Mở hồ sơ",
  RESULTS_OPEN: "Mở kết quả",
  ADMIN_OPEN: "Mở quản trị",
  ADMIN_VIEW_USER: "Xem học viên",
  ADMIN_VIEW_REPORT: "Xem báo cáo"
};

export const metricText = (value: unknown, suffix = ""): string => {
  if (value === null || value === undefined || value === "") return "--";
  if (typeof value === "number" && Number.isFinite(value)) {
    return `${Number.isInteger(value) ? value : value.toFixed(1)}${suffix}`;
  }
  return `${value}${suffix}`;
};

export const formatTime = (value?: string): string => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
};

export const unitStatus = (unit: UnitProgressItem): { label: string; tone: WidgetTone } => {
  const completion = Number(unit.completionRate ?? NaN);
  const peqi = Number(unit.peqiAverage ?? NaN);
  const score = Number(unit.averageScore ?? NaN);
  const signal = Number.isFinite(peqi) ? peqi : Number.isFinite(completion) ? completion : Number.isFinite(score) ? score * 10 : NaN;
  if (!Number.isFinite(signal)) return { label: "Theo dõi", tone: "neutral" };
  if (signal >= 80) return { label: "Tốt", tone: "good" };
  if (signal >= 65) return { label: "Theo dõi", tone: "neutral" };
  if (signal >= 50) return { label: "Chậm", tone: "warning" };
  return { label: "Cần hỗ trợ", tone: "danger" };
};

export const toneBadgeVariant = (tone: WidgetTone): "neutral" | "success" | "warning" | "danger" => {
  if (tone === "good") return "success";
  if (tone === "warning") return "warning";
  if (tone === "danger") return "danger";
  return "neutral";
};

export const deriveKpis = (summary: AnalyticsSummary, available: boolean): CommandKpi[] => {
  const units = summary.units || [];
  const slowUnits = available ? units.filter(unit => Number(unit.completionRate || 0) < 65).length : undefined;
  const peqiAverage = (summary as AnalyticsSummary & { peqiAverage?: number }).peqiAverage;
  return [
    { id: "loggedInToday", label: "Đã đăng nhập hôm nay", value: summary.loggedInToday, tone: "neutral", description: "Số tài khoản có phiên đăng nhập trong phạm vi đã chọn." },
    { id: "learningToday", label: "Đang học", value: summary.learningToday, tone: "good", description: "Học viên có hoạt động học tập gần đây." },
    { id: "completedToday", label: "Hoàn thành hôm nay", value: summary.completedTopics, tone: "good", description: "Lượt hoàn thành bài học/chuyên đề." },
    { id: "submissions", label: "Nộp bài ôn tập / kiểm tra", value: summary.quizSubmissions, tone: "neutral", description: "Số lượt nộp bài đã ghi nhận." },
    { id: "averageScore", label: "Điểm trung bình", value: summary.averageScore, tone: Number(summary.averageScore || 0) >= 8 ? "good" : Number(summary.averageScore || 0) > 0 ? "warning" : "neutral", description: "Điểm trung bình từ kết quả có dữ liệu." },
    { id: "weakLearners", label: "Học viên cần hỗ trợ", value: summary.weakLearners, tone: Number(summary.weakLearners || 0) > 0 ? "warning" : "neutral", description: "Học viên có tín hiệu cần theo dõi." },
    { id: "slowUnits", label: "Đơn vị chậm tiến độ", value: slowUnits, tone: Number(slowUnits || 0) > 0 ? "danger" : "neutral", description: "Đơn vị có tiến độ dưới ngưỡng theo dõi." },
    { id: "peqiAverage", label: "PEQI trung bình", value: peqiAverage, tone: Number(peqiAverage || 0) >= 80 ? "good" : Number(peqiAverage || 0) >= 50 ? "warning" : "neutral", description: "Chỉ số chất lượng giáo dục chính trị toàn phạm vi." }
  ];
};

export const deriveLearners = (events: AnalyticsEventRecord[], users: User[]): LearnerSignal[] => {
  const map = new Map<string, LearnerSignal>();
  events.forEach(event => {
    const id = event.userId || event.username || event.fullName;
    if (!id) return;
    const existing = map.get(id);
    const next: LearnerSignal = existing || {
      userId: event.userId || id,
      username: event.username,
      fullName: event.fullName || event.username || "Học viên",
      unit: event.unit,
      activityCount: 0
    };
    next.activityCount += 1;
    next.latestActivity = event.createdAt || next.latestActivity;
    if (typeof event.score === "number") next.averageScore = event.score;
    if (event.eventType === "MARK_COMPLETE") next.completedTopics = (next.completedTopics || 0) + 1;
    map.set(id, next);
  });
  users.forEach(user => {
    if (map.has(user.id)) return;
    map.set(user.id, {
      userId: user.id,
      username: user.email,
      fullName: user.fullName,
      unit: user.organizationName || user.unitId,
      activityCount: 0
    });
  });
  return Array.from(map.values())
    .filter(item => item.activityCount > 0 || item.averageScore !== undefined || item.completedTopics !== undefined)
    .sort((a, b) => (b.peqi || 0) - (a.peqi || 0) || b.activityCount - a.activityCount)
    .slice(0, 8);
};

export const deriveAlerts = (summary: AnalyticsSummary, units: UnitProgressItem[], learners: LearnerSignal[], available: boolean): CommandAlert[] => {
  if (!available) return [];
  const alerts: CommandAlert[] = [];
  const weakLearners = Number(summary.weakLearners || 0);
  if (weakLearners > 0) {
    alerts.push({
      id: "weak-learners",
      severity: weakLearners > 5 ? "danger" : "warning",
      title: "Học viên cần hỗ trợ",
      description: `${weakLearners} học viên có tín hiệu cần theo dõi trong phạm vi đã chọn.`,
      scope: "user",
      recommendedAction: "Xem danh sách học viên và nhắc ôn tập phù hợp."
    });
  }
  units.filter(unit => Number(unit.completionRate || 0) > 0 && Number(unit.completionRate || 0) < 50).slice(0, 3).forEach(unit => {
    alerts.push({
      id: `slow-${unit.unit}`,
      severity: "warning",
      title: "Đơn vị chậm tiến độ",
      description: `${unit.unit} có tiến độ hoàn thành thấp hơn ngưỡng theo dõi.`,
      scope: "unit",
      recommendedAction: "Kiểm tra kế hoạch học tập và phân công đôn đốc."
    });
  });
  learners.filter(item => item.activityCount === 0).slice(0, 2).forEach(item => {
    alerts.push({
      id: `inactive-${item.userId}`,
      severity: "info",
      title: "Cần kiểm tra mức độ tham gia",
      description: `${item.fullName} chưa có tín hiệu hoạt động trong dữ liệu gần đây.`,
      scope: "user",
      recommendedAction: "Xác minh tài khoản và hướng dẫn truy cập nếu cần."
    });
  });
  return alerts.slice(0, 6);
};
