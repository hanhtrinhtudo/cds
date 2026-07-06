import {
  AccountStatus,
  AuditLog,
  Exam,
  ExamAttempt,
  LearningProgress,
  LearningSection,
  LearningStatus,
  LearningTopic,
  News,
  Question,
  QuestionType,
  QuizAttempt,
  TopicCategory,
  Unit,
  User,
  UserRole
} from "../types";
import { RankingEntry } from "../services/reportService";

const now = new Date().toISOString();
const nextMonth = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

export const CDS_LEGACY_UNIT_ID = "cds_legacy_unit";
export const CDS_LEGACY_TOPIC_ID = "cds_legacy_topic_political_legal";
export const CDS_LEGACY_ADMIN_ID = "cds_legacy_admin";
export const CDS_LEGACY_MEMBER_ID = "cds_legacy_member";

export const legacyUnits: Unit[] = [
  {
    id: CDS_LEGACY_UNIT_ID,
    name: "Đơn vị CDS/PTKV",
    type: "legacy_static",
    description: "Đơn vị trình diễn dùng cho bản Netlify static kế thừa CDS"
  }
];

export const legacyUsers: User[] = [
  {
    id: CDS_LEGACY_MEMBER_ID,
    fullName: "Đồng chí học viên",
    email: "hocvien.cds@example.test",
    phone: "",
    avatar: "",
    unitId: CDS_LEGACY_UNIT_ID,
    role: UserRole.MEMBER,
    accountStatus: AccountStatus.ACTIVE,
    createdAt: now,
    updatedAt: now,
    lastLoginAt: now
  },
  {
    id: CDS_LEGACY_ADMIN_ID,
    fullName: "Cán bộ quản trị",
    email: "admin.cds@example.test",
    phone: "",
    avatar: "",
    unitId: CDS_LEGACY_UNIT_ID,
    role: UserRole.ADMIN,
    accountStatus: AccountStatus.ACTIVE,
    createdAt: now,
    updatedAt: now,
    lastLoginAt: now
  }
];

export const legacyTopics: LearningTopic[] = [
  {
    id: CDS_LEGACY_TOPIC_ID,
    title: "Tài liệu học tập chính trị, pháp luật và CTĐ, CTCT",
    category: TopicCategory.POLITICAL,
    description: "Port từ luồng Học tập/Tài liệu của CDS: nội dung chính trị, pháp luật, điều lệnh và công tác Đảng, công tác chính trị.",
    objective: "Nắm chắc các nội dung giáo dục chính trị, pháp luật cơ bản; làm cơ sở ôn trắc nghiệm, thi thử và kiểm tra nhận thức.",
    content: [
      "1. Chủ nghĩa Mác - Lênin, tư tưởng Hồ Chí Minh và đường lối quân sự của Đảng.",
      "2. Bản chất, truyền thống, kỷ luật và nguyên tắc tổ chức của Quân đội nhân dân Việt Nam.",
      "3. Công tác Đảng, công tác chính trị; công tác tư tưởng trong đơn vị.",
      "4. Phổ biến giáo dục pháp luật, điều lệnh, chính sách mới và văn bản cần tra cứu.",
      "5. Học viên vắng mặt có thể đọc lại tài liệu, ôn trắc nghiệm và xem giải thích sau khi làm bài."
    ].join("\n\n"),
    contentType: "document",
    estimatedMinutes: 35,
    required: true,
    deadline: nextMonth,
    status: LearningStatus.IN_PROGRESS,
    difficulty: "Trung bình" as LearningTopic["difficulty"],
    tags: ["CDS", "Học tập", "Tài liệu học tập", "Phổ biến giáo dục pháp luật"],
    references: [
      "Nguồn CDS: Hoctap.html, study.html, materials.html, js/materials.plus.js",
      "Nguồn câu hỏi: cds/data/questions.json",
      "Cấu hình legacy được truyền qua VITE_LEGACY_* khi triển khai Netlify"
    ],
    createdBy: CDS_LEGACY_ADMIN_ID,
    createdAt: now,
    updatedAt: now,
    assignedUnitIds: [CDS_LEGACY_UNIT_ID]
  },
  {
    id: "cds_legacy_topic_policy_lookup",
    title: "Phổ biến giáo dục pháp luật / Tra cứu văn bản chính sách",
    category: TopicCategory.LEGAL,
    description: "Luồng tin chính sách mới và tra cứu văn bản từ tintuc24.html được đưa vào mobile shell.",
    objective: "Giúp cán bộ, chiến sĩ tiếp cận nhanh chính sách mới, văn bản pháp luật và nội dung tuyên truyền phổ biến giáo dục pháp luật.",
    content: [
      "Màn hình Tin tức cung cấp các nhóm: Tin theo thời gian, Tin trong ngày, Tin chính trị ĐCSVN, Chính sách mới và Tra cứu văn bản chính sách.",
      "Trong Netlify static mode, dữ liệu tin tức dùng Apps Script qua VITE_NEWS_API_URL (hoặc VITE_LEGACY_CDS_API_URL dự phòng); nếu không tải được sẽ dùng dữ liệu fallback an toàn."
    ].join("\n\n"),
    contentType: "document",
    estimatedMinutes: 20,
    required: false,
    status: LearningStatus.NOT_STARTED,
    difficulty: "Dễ" as LearningTopic["difficulty"],
    tags: ["Tin tức", "Chính sách mới", "Tra cứu văn bản chính sách"],
    references: ["Nguồn CDS: tintuc24.html, js/news.js"],
    createdBy: CDS_LEGACY_ADMIN_ID,
    createdAt: now,
    updatedAt: now,
    assignedUnitIds: [CDS_LEGACY_UNIT_ID]
  }
];

export const legacySections: LearningSection[] = [
  {
    id: "cds_legacy_section_materials",
    topicId: CDS_LEGACY_TOPIC_ID,
    title: "Tài liệu học tập",
    content: legacyTopics[0].content,
    order: 1,
    required: true
  }
];

export const legacyProgress: LearningProgress[] = [
  {
    id: "cds_legacy_progress_member",
    userId: CDS_LEGACY_MEMBER_ID,
    topicId: CDS_LEGACY_TOPIC_ID,
    status: LearningStatus.IN_PROGRESS,
    progressPercent: 35,
    startedAt: now,
    lastAccessedAt: now,
    needReview: false
  }
];

export const legacyQuestions: Question[] = [
  {
    id: "cds_q_001",
    topicId: CDS_LEGACY_TOPIC_ID,
    type: QuestionType.SINGLE,
    questionText: "Chủ nghĩa Mác - Lênin gồm mấy bộ phận cấu thành?",
    options: ["Hai bộ phận", "Ba bộ phận", "Bốn bộ phận", "Năm bộ phận"],
    correctAnswers: [1],
    explanation: "Chủ nghĩa Mác - Lênin gồm triết học Mác - Lênin, kinh tế chính trị Mác - Lênin và chủ nghĩa xã hội khoa học.",
    difficulty: "Dễ" as Question["difficulty"],
    reference: "cds/data/questions.json",
    tags: ["Ôn trắc nghiệm", "Chính trị"]
  },
  {
    id: "cds_q_002",
    topicId: CDS_LEGACY_TOPIC_ID,
    type: QuestionType.SINGLE,
    questionText: "Tư tưởng Hồ Chí Minh là gì?",
    options: [
      "Hệ thống quan điểm toàn diện và sâu sắc về cách mạng Việt Nam",
      "Một trường phái triết học phương Tây",
      "Một phong trào yêu nước đầu thế kỷ XX",
      "Một học thuyết quân sự hiện đại"
    ],
    correctAnswers: [0],
    explanation: "Tư tưởng Hồ Chí Minh là hệ thống quan điểm toàn diện, sâu sắc về những vấn đề cơ bản của cách mạng Việt Nam.",
    difficulty: "Trung bình" as Question["difficulty"],
    reference: "cds/data/questions.json",
    tags: ["Ôn trắc nghiệm", "Tư tưởng Hồ Chí Minh"]
  },
  {
    id: "cds_q_003",
    topicId: CDS_LEGACY_TOPIC_ID,
    type: QuestionType.SINGLE,
    questionText: "Đường lối quân sự của Đảng dựa trên nguyên tắc nào?",
    options: ["Phòng ngự là chính", "Tiến công là chủ đạo", "Kết hợp xây dựng và bảo vệ Tổ quốc", "Tự vệ tuyệt đối"],
    correctAnswers: [2],
    explanation: "Đường lối quân sự của Đảng gắn xây dựng nền quốc phòng toàn dân với nhiệm vụ bảo vệ Tổ quốc.",
    difficulty: "Trung bình" as Question["difficulty"],
    reference: "cds/data/questions.json",
    tags: ["Đường lối quân sự", "Kiểm tra nhận thức"]
  },
  {
    id: "cds_q_004",
    topicId: CDS_LEGACY_TOPIC_ID,
    type: QuestionType.SINGLE,
    questionText: "Quân đội nhân dân Việt Nam mang bản chất giai cấp nào?",
    options: ["Giai cấp tư sản", "Giai cấp nông dân", "Giai cấp công nhân, nhân dân lao động và của dân tộc", "Giai cấp tiểu thương"],
    correctAnswers: [2],
    explanation: "Quân đội nhân dân Việt Nam mang bản chất giai cấp công nhân, tính nhân dân và tính dân tộc sâu sắc.",
    difficulty: "Trung bình" as Question["difficulty"],
    reference: "cds/data/questions.json",
    tags: ["Quân đội", "Chính trị"]
  },
  {
    id: "cds_q_005",
    topicId: CDS_LEGACY_TOPIC_ID,
    type: QuestionType.SINGLE,
    questionText: "Phương châm huấn luyện chiến đấu trong Quân đội là gì?",
    options: ["Cơ bản, thiết thực, vững chắc", "Nhanh, mạnh, bí mật", "Chính xác, an toàn, tiết kiệm", "Hiên ngang, dũng cảm, mưu trí"],
    correctAnswers: [0],
    explanation: "Phương châm cơ bản, thiết thực, vững chắc bảo đảm huấn luyện sát nhiệm vụ, đối tượng và địa bàn.",
    difficulty: "Dễ" as Question["difficulty"],
    reference: "cds/data/questions.json",
    tags: ["Huấn luyện", "Ôn tập"]
  },
  {
    id: "cds_q_006",
    topicId: CDS_LEGACY_TOPIC_ID,
    type: QuestionType.SINGLE,
    questionText: "Một trong những nội dung của CTĐ, CTCT là gì?",
    options: ["Công tác hậu cần", "Công tác tư tưởng", "Công tác kỹ thuật", "Công tác tài chính"],
    correctAnswers: [1],
    explanation: "Công tác tư tưởng là một nội dung quan trọng trong công tác Đảng, công tác chính trị.",
    difficulty: "Dễ" as Question["difficulty"],
    reference: "cds/data/questions.json",
    tags: ["CTĐ", "CTCT"]
  },
  {
    id: "cds_q_007",
    topicId: CDS_LEGACY_TOPIC_ID,
    type: QuestionType.SINGLE,
    questionText: "Kỷ luật Quân đội nhân dân Việt Nam yêu cầu gì?",
    options: ["Tự giác, nghiêm minh", "Khoan dung, linh hoạt", "Tự do, sáng tạo", "Tùy nghi, linh hoạt"],
    correctAnswers: [0],
    explanation: "Kỷ luật quân đội yêu cầu sự tự giác, nghiêm minh, thống nhất ý chí và hành động.",
    difficulty: "Dễ" as Question["difficulty"],
    reference: "cds/data/questions.json",
    tags: ["Kỷ luật", "Pháp luật"]
  },
  {
    id: "cds_q_008",
    topicId: CDS_LEGACY_TOPIC_ID,
    type: QuestionType.SINGLE,
    questionText: "Nguyên tắc tổ chức của Quân đội nhân dân Việt Nam là gì?",
    options: ["Tập trung dân chủ", "Tam quyền phân lập", "Tập quyền tuyệt đối", "Phân tán tự trị"],
    correctAnswers: [0],
    explanation: "Tập trung dân chủ là nguyên tắc tổ chức cơ bản, bảo đảm lãnh đạo tập trung, thống nhất.",
    difficulty: "Trung bình" as Question["difficulty"],
    reference: "cds/data/questions.json",
    tags: ["Tổ chức", "Quân đội"]
  }
];

export const legacyExams: Exam[] = [
  {
    id: "cds_official_awareness_exam",
    title: "Kiểm tra nhận thức chính trị - pháp luật",
    description: "Luồng kiểm tra chính thức/sát hạch từ CDS: kiemtra.html, lambai.html, exam.html.",
    topicIds: [CDS_LEGACY_TOPIC_ID],
    durationMinutes: 20,
    questionCount: 8,
    startDate: now,
    endDate: nextMonth,
    passingScore: 6,
    allowReview: true,
    status: "active",
    lifecycleStatus: "published",
    createdBy: CDS_LEGACY_ADMIN_ID
  }
];

export const legacyQuizAttempts: QuizAttempt[] = [
  {
    id: "cds_quiz_attempt_sample",
    userId: CDS_LEGACY_MEMBER_ID,
    quizType: "random",
    topicId: CDS_LEGACY_TOPIC_ID,
    startedAt: now,
    submittedAt: now,
    score: 8,
    correctCount: 6,
    wrongCount: 2,
    totalQuestions: 8,
    answers: {},
    status: "submitted"
  }
];

export const legacyExamAttempts: ExamAttempt[] = [
  {
    id: "cds_exam_attempt_sample",
    examId: "cds_official_awareness_exam",
    userId: CDS_LEGACY_MEMBER_ID,
    startedAt: now,
    submittedAt: now,
    score: 7.5,
    correctCount: 6,
    wrongCount: 2,
    passed: true,
    status: "submitted",
    answers: {}
  }
];

export const legacyNews: News[] = [
  {
    id: "cds_news_timeline",
    title: "Tin theo thời gian: cập nhật nhiệm vụ giáo dục chính trị trong ngày",
    category: "Tin theo thời gian",
    summary: "Luồng tin nhanh kế thừa từ tintuc24.html để cán bộ, chiến sĩ theo dõi nội dung mới nhất.",
    content: "Bản mobile shell hiển thị nhóm Tin theo thời gian, ưu tiên kết nối Apps Script qua VITE_NEWS_API_URL và chỉ dùng dữ liệu fallback khi nguồn trực tuyến lỗi hoặc rỗng.",
    visibility: "public",
    status: "published",
    authorId: CDS_LEGACY_ADMIN_ID,
    publishedAt: now,
    createdAt: now
  },
  {
    id: "cds_news_today",
    title: "Tin trong ngày: điểm tin chính trị, xã hội phục vụ sinh hoạt đơn vị",
    category: "Tin trong ngày",
    summary: "Tóm tắt tin tức trong ngày, hỗ trợ sinh hoạt chính trị và định hướng thông tin.",
    content: "Tin trong ngày giúp chỉ huy nhanh chóng phổ biến những vấn đề cần chú ý trong học tập, rèn luyện và chấp hành kỷ luật.",
    visibility: "public",
    status: "published",
    authorId: CDS_LEGACY_ADMIN_ID,
    publishedAt: now,
    createdAt: now
  },
  {
    id: "cds_news_party",
    title: "Tin chính trị ĐCSVN: xây dựng Đảng, xây dựng đơn vị vững mạnh",
    category: "Tin chính trị ĐCSVN",
    summary: "Nhóm tin chính trị của Đảng được port từ luồng tintuc24.html.",
    content: "Nội dung phục vụ giáo dục chính trị, nâng cao nhận thức về công tác xây dựng Đảng và nhiệm vụ bảo vệ Tổ quốc.",
    visibility: "public",
    status: "published",
    authorId: CDS_LEGACY_ADMIN_ID,
    publishedAt: now,
    createdAt: now
  },
  {
    id: "cds_news_policy",
    title: "Chính sách mới: cập nhật văn bản, chế độ, tiêu chuẩn liên quan quân nhân",
    category: "Chính sách mới",
    summary: "Kênh phổ biến chính sách mới và văn bản cần biết.",
    content: "Khi triển khai thực tế, nhóm này có thể lấy dữ liệu qua Apps Script legacy. Trong bản port static, dữ liệu fallback bảo đảm màn hình không rỗng.",
    visibility: "public",
    status: "published",
    authorId: CDS_LEGACY_ADMIN_ID,
    publishedAt: now,
    createdAt: now
  },
  {
    id: "cds_news_legal",
    title: "Phổ biến giáo dục pháp luật: chấp hành kỷ luật, điều lệnh, an toàn đơn vị",
    category: "Phổ biến giáo dục pháp luật",
    summary: "Nội dung pháp luật, điều lệnh và kỷ luật quân đội phục vụ học tập thường xuyên.",
    content: "Kế thừa mục tiêu phổ biến pháp luật của CDS; hỗ trợ tra cứu, đọc nhanh và liên kết sang học tập/ôn luyện.",
    visibility: "public",
    status: "published",
    authorId: CDS_LEGACY_ADMIN_ID,
    publishedAt: now,
    createdAt: now
  },
  {
    id: "cds_policy_lookup",
    title: "Tra cứu văn bản chính sách: điều lệnh, chế độ, quy định liên quan",
    category: "Tra cứu văn bản chính sách",
    summary: "Điểm vào cho nhu cầu tìm kiếm văn bản chính sách trong mobile shell.",
    content: "Người dùng có thể tìm theo từ khóa. Nguồn tra cứu runtime được cấu hình qua VITE_NEWS_API_URL hoặc VITE_LEGACY_CDS_API_URL.",
    visibility: "public",
    status: "published",
    authorId: CDS_LEGACY_ADMIN_ID,
    publishedAt: now,
    createdAt: now
  }
];

export const legacyPolicyDocs = [
  {
    id: "cds_policy_001",
    title: "Quy định chấp hành kỷ luật và điều lệnh trong đơn vị",
    category: "Tra cứu văn bản chính sách",
    summary: "Tài liệu tham khảo phục vụ phổ biến giáo dục pháp luật và rèn luyện kỷ luật.",
    source: "CDS legacy policy/search workflow"
  },
  {
    id: "cds_policy_002",
    title: "Chính sách, chế độ đối với quân nhân trong học tập, công tác",
    category: "Chính sách mới",
    summary: "Mẫu dữ liệu fallback để màn hình chính sách không rỗng khi chưa cấu hình API legacy.",
    source: "CDS tintuc24.html"
  }
];

export const legacyRankingEntries: RankingEntry[] = [
  {
    rank: 1,
    userId: CDS_LEGACY_MEMBER_ID,
    fullName: "Đồng chí học viên",
    unitId: CDS_LEGACY_UNIT_ID,
    unitName: "Đơn vị CDS/PTKV",
    points: 95,
    completionRate: 70
  },
  {
    rank: 2,
    userId: "cds_legacy_member_2",
    fullName: "Đồng chí ôn luyện",
    unitId: CDS_LEGACY_UNIT_ID,
    unitName: "Đơn vị CDS/PTKV",
    points: 82,
    completionRate: 62
  }
];

export const legacyAuditLogs: AuditLog[] = [
  {
    id: "cds_audit_login",
    userId: CDS_LEGACY_ADMIN_ID,
    userName: "Cán bộ quản trị",
    action: "legacy_admin_list_audit",
    entityType: "legacy_apps_script",
    entityId: "cds_admin",
    metadata: { source: "admin.html" },
    createdAt: now
  }
];

export const legacyReviewData = [
  {
    id: "cds_review_awareness",
    title: "Xem lại & Giải thích - Kiểm tra nhận thức",
    sourcePage: "review.html",
    description: "Hiển thị câu đã làm, đáp án đã chọn, đáp án đúng và giải thích theo phạm vi bài nộp."
  },
  {
    id: "cds_review_practice",
    title: "Xem lại & Giải thích - Ôn trắc nghiệm",
    sourcePage: "review.practice.html",
    description: "Luồng xem lại gói ôn tập/luyện tập kế thừa từ localStorage của CDS."
  },
  {
    id: "cds_review_try",
    title: "Xem lại & Giải thích - Thi thử",
    sourcePage: "review-try.html",
    description: "Luồng xem lại bài thi thử, tập trung giải thích các câu sai."
  }
];
