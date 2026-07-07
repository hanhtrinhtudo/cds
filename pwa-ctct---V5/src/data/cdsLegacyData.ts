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
    name: "Đơn vị học tập",
    type: "legacy_static",
    description: "Đơn vị tham gia học tập và kiểm tra"
  }
];

export const legacyUsers: User[] = [
  {
    id: CDS_LEGACY_MEMBER_ID,
    fullName: "Đồng chí học viên",
    email: "hocvien@ptkv.vn",
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
    email: "quantri@ptkv.vn",
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
    description: "Nội dung chính trị, pháp luật, điều lệnh và công tác Đảng, công tác chính trị.",
    objective: "Nắm chắc nội dung giáo dục chính trị, pháp luật cơ bản; làm cơ sở ôn trắc nghiệm, Thi thử và Kiểm tra.",
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
    tags: ["Học tập", "Tài liệu học tập", "Phổ biến giáo dục pháp luật"],
    references: [
      "Tài liệu giáo dục chính trị và pháp luật",
      "Ngân hàng câu hỏi ôn tập"
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
    description: "Tin chính sách mới và công cụ tra cứu văn bản phục vụ học tập.",
    objective: "Giúp cán bộ, chiến sĩ tiếp cận nhanh chính sách mới, văn bản pháp luật và nội dung tuyên truyền phổ biến giáo dục pháp luật.",
    content: [
      "Màn hình Tin tức cung cấp các nhóm: Tin theo thời gian, Tin trong ngày, Tin chính trị ĐCSVN, Chính sách mới và Tra cứu văn bản chính sách.",
      "Nội dung được cập nhật từ nguồn tin tức và văn bản chính sách đã cấu hình."
    ].join("\n\n"),
    contentType: "document",
    estimatedMinutes: 20,
    required: false,
    status: LearningStatus.NOT_STARTED,
    difficulty: "Dễ" as LearningTopic["difficulty"],
    tags: ["Tin tức", "Chính sách mới", "Tra cứu văn bản chính sách"],
    references: ["Nguồn tin tức và văn bản chính sách"],
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
    reference: "Tài liệu ôn tập chính trị và pháp luật",
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
    reference: "Tài liệu ôn tập chính trị và pháp luật",
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
    reference: "Tài liệu ôn tập chính trị và pháp luật",
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
    reference: "Tài liệu ôn tập chính trị và pháp luật",
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
    reference: "Tài liệu ôn tập chính trị và pháp luật",
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
    reference: "Tài liệu ôn tập chính trị và pháp luật",
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
    reference: "Tài liệu ôn tập chính trị và pháp luật",
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
    reference: "Tài liệu ôn tập chính trị và pháp luật",
    tags: ["Tổ chức", "Quân đội"]
  }
];

export const legacyExams: Exam[] = [
  {
    id: "cds_official_awareness_exam",
    title: "Kiểm tra nhận thức chính trị - pháp luật",
    description: "Bài kiểm tra tổng hợp nội dung chính trị và pháp luật.",
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
    summary: "Tin nhanh giúp cán bộ, chiến sĩ theo dõi nội dung mới nhất.",
    content: "Tin theo thời gian tổng hợp những nội dung mới phục vụ học tập, công tác và sinh hoạt đơn vị.",
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
    summary: "Tin chính trị của Đảng phục vụ học tập và sinh hoạt đơn vị.",
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
    content: "Nội dung giới thiệu những chính sách, chế độ và văn bản mới cần quan tâm.",
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
    content: "Nội dung hỗ trợ tra cứu, đọc nhanh và liên kết với hoạt động học tập, ôn luyện.",
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
    summary: "Tra cứu nhanh văn bản chính sách theo nhu cầu.",
    content: "Đồng chí có thể tìm văn bản theo từ khóa, loại văn bản và thời gian ban hành.",
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
    source: "Kho văn bản chính sách"
  },
  {
    id: "cds_policy_002",
    title: "Chính sách, chế độ đối với quân nhân trong học tập, công tác",
    category: "Chính sách mới",
    summary: "Thông tin tham khảo về chính sách, chế độ trong học tập và công tác.",
    source: "Kho văn bản chính sách"
  }
];

export const legacyRankingEntries: RankingEntry[] = [
  {
    rank: 1,
    userId: CDS_LEGACY_MEMBER_ID,
    fullName: "Đồng chí học viên",
    unitId: CDS_LEGACY_UNIT_ID,
    unitName: "Đơn vị học tập",
    points: 95,
    completionRate: 70
  },
  {
    rank: 2,
    userId: "cds_legacy_member_2",
    fullName: "Đồng chí ôn luyện",
    unitId: CDS_LEGACY_UNIT_ID,
    unitName: "Đơn vị học tập",
    points: 82,
    completionRate: 62
  }
];

export const legacyAuditLogs: AuditLog[] = [
  {
    id: "cds_audit_login",
    userId: CDS_LEGACY_ADMIN_ID,
    userName: "Cán bộ quản trị",
    action: "Xem nhật ký quản trị",
    entityType: "Hoạt động quản trị",
    entityId: "Quản trị",
    metadata: { source: "admin.html" },
    createdAt: now
  }
];

export const legacyReviewData = [
  {
    id: "cds_review_awareness",
    title: "Xem lại và giải thích - Kiểm tra",
    sourcePage: "review.html",
    description: "Hiển thị câu đã làm, đáp án đã chọn, đáp án đúng và giải thích theo phạm vi bài nộp."
  },
  {
    id: "cds_review_practice",
    title: "Xem lại và giải thích - Ôn trắc nghiệm",
    sourcePage: "review.practice.html",
    description: "Xem lại câu trả lời, đáp án đúng và nội dung giải thích của bài ôn tập."
  },
  {
    id: "cds_review_try",
    title: "Xem lại và giải thích - Thi thử",
    sourcePage: "review-try.html",
    description: "Luồng xem lại bài thi thử, tập trung giải thích các câu sai."
  }
];
