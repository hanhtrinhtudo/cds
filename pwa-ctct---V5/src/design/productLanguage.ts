export const productLanguage = {
  product: {
    name: "AI Chính trị viên số",
    assistant: "AI Chính trị viên",
    learning: "Học tập",
    practice: "Ôn trắc nghiệm",
    mockExam: "Thi thử",
    officialExam: "Kiểm tra",
    results: "Kết quả",
    ranking: "Bảng xếp hạng",
    news: "Tin tức",
    notifications: "Thông báo",
    personal: "Cá nhân",
    profile: "Hồ sơ cá nhân",
    account: "Tài khoản"
  },
  buttons: {
    viewDetails: "Xem chi tiết",
    openLesson: "Mở bài học",
    continueLearning: "Tiếp tục học",
    reviewLesson: "Ôn lại bài",
    startPractice: "Bắt đầu ôn tập",
    startMockExam: "Bắt đầu thi thử",
    startExam: "Bắt đầu kiểm tra",
    submit: "Nộp bài",
    viewResults: "Xem kết quả",
    reviewAnswers: "Xem lại và giải thích",
    askAssistant: "Trao đổi với AI Chính trị viên",
    retry: "Thử lại",
    close: "Đóng",
    back: "Quay lại"
  },
  titles: {
    learning: "Học tập",
    learningMaterials: "Tài liệu học tập",
    practice: "Ôn trắc nghiệm",
    exams: "Thi thử và Kiểm tra",
    results: "Kết quả",
    ranking: "Bảng xếp hạng",
    review: "Xem lại và giải thích",
    news: "Tin tức và chính sách",
    profile: "Hồ sơ cá nhân",
    administration: "Quản trị",
    assistant: "AI Chính trị viên"
  },
  sections: {
    today: "Hôm nay cần làm gì?",
    latestNews: "Tin tức và thông báo",
    myResults: "Kết quả của tôi",
    submittedHistory: "Lịch sử bài đã nộp",
    reviewHistory: "Lịch sử xem lại",
    accountManagement: "Quản lý tài khoản",
    activityLog: "Nhật ký hoạt động"
  },
  badges: {
    learning: "Đang học",
    completed: "Hoàn thành",
    submitted: "Đã nộp",
    graded: "Đã chấm",
    expired: "Quá hạn",
    active: "Đang diễn ra",
    scheduled: "Sắp diễn ra",
    required: "Bắt buộc",
    recommended: "Khuyến khích",
    review: "Cần ôn"
  },
  dialogs: {
    submitTitle: "Xác nhận nộp bài?",
    submitDescription: "Sau khi nộp bài, đồng chí không thể thay đổi câu trả lời.",
    cancel: "Rà soát lại",
    confirmSubmit: "Nộp bài"
  },
  alerts: {
    unavailable: "Hiện chưa thể tải nội dung. Vui lòng thử lại.",
    showingSavedContent: "Không thể cập nhật nội dung mới. Đang hiển thị nội dung đã lưu.",
    resultNotSynced: "Kết quả chưa được ghi nhận. Bài làm vẫn được giữ để đồng chí thử lại.",
    assistantUnavailable: "AI Chính trị viên chưa sẵn sàng. Đồng chí vẫn có thể học tài liệu, làm bài và xem lại đáp án."
  },
  emptyStates: {
    defaultTitle: "Hiện chưa có nội dung",
    learningTitle: "Chưa có bài học phù hợp",
    learningDescription: "Hãy thay đổi từ khóa hoặc bộ lọc.",
    examTitle: "Hiện chưa có kỳ kiểm tra",
    mockExamTitle: "Hiện chưa có kỳ thi thử",
    resultsTitle: "Chưa có kết quả",
    rankingTitle: "Chưa có dữ liệu xếp hạng",
    newsTitle: "Hiện chưa có tin tức",
    reviewTitle: "Chưa có bài để xem lại"
  },
  loading: {
    data: "Đang tải dữ liệu...",
    learning: "Đang chuẩn bị tài liệu học tập...",
    exam: "Đang chuẩn bị bài kiểm tra...",
    results: "Đang tải kết quả...",
    news: "Đang tải tin tức...",
    assistant: "AI Chính trị viên đang phân tích..."
  },
  errors: {
    load: "Không thể tải dữ liệu. Vui lòng thử lại.",
    submit: "Không thể nộp bài. Vui lòng thử lại.",
    login: "Không thể đăng nhập. Vui lòng kiểm tra thông tin và thử lại.",
    register: "Không thể tạo tài khoản. Vui lòng thử lại."
  },
  confirmation: {
    deleteConversation: "Xóa lịch sử trò chuyện?",
    signOut: "Đăng xuất khỏi tài khoản?"
  },
  success: {
    registered: "Tạo tài khoản thành công. Vui lòng đăng nhập.",
    submitted: "Nộp bài thành công.",
    saved: "Đã lưu thay đổi."
  }
} as const;

export type ProductLanguage = typeof productLanguage;
