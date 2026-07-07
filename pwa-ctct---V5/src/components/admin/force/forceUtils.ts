import { AccountStatus, User, UserRole } from "../../../types";
import { AnalyticsEventRecord, PEQIResult } from "../../../services/analyticsService";

export const roleLabel = (role: UserRole | string) => ({
  member: "Học viên", user: "Học viên", instructor: "Giảng viên",
  political_officer: "Cán bộ chính trị", "chi-huy": "Chỉ huy", chi_huy: "Chỉ huy",
  admin: "Quản trị viên", guest: "Khách"
}[String(role)] || "Học viên");

export const statusLabel = (status: AccountStatus | string) => ({
  active: "Đang hoạt động", pending: "Chờ phê duyệt",
  suspended: "Tạm khóa", rejected: "Đã từ chối"
}[String(status)] || "Chưa xác định");

export const eventLabel = (type: string) => ({
  LOGIN: "Đăng nhập", OPEN_TOPIC: "Mở chuyên đề", MARK_COMPLETE: "Hoàn thành chuyên đề",
  QUIZ_SUBMIT: "Nộp bài ôn tập", REVIEW_OPEN: "Mở xem lại", REVIEW_COMPLETE: "Hoàn thành xem lại",
  AI_PROMPT: "Trao đổi với AI Chính trị viên", AI_RESPONSE: "Nhận hỗ trợ từ AI Chính trị viên",
  NEWS_VIEW: "Đọc tin tức", RESULTS_OPEN: "Xem kết quả"
}[type] || "Hoạt động học tập");

export const eventTime = (event: AnalyticsEventRecord) => {
  const value = event.createdAt || event.clientTime;
  return value ? new Date(value).toLocaleString("vi-VN") : "--";
};

export const isLearner = (user: User) => ["member", "user"].includes(String(user.role));

export const recommendationsFromPeqi = (peqi: PEQIResult | null, events: AnalyticsEventRecord[]) => {
  if (!peqi && !events.length) return [];
  const flags = new Set(peqi?.riskFlags || []);
  const recommendations: string[] = [];
  if (flags.has("LOW_SCORE")) recommendations.push("Giao ôn tập lại chuyên đề có điểm thấp");
  if (flags.has("LOW_COMPLETION")) recommendations.push("Nhắc hoàn thành nội dung bắt buộc");
  if (flags.has("NO_REVIEW_ACTIVITY")) recommendations.push("Yêu cầu xem lại đáp án và ôn tập");
  if (flags.has("NOT_LOGGED_IN_RECENTLY")) recommendations.push("Liên hệ nhắc tham gia học tập");
  return recommendations;
};

