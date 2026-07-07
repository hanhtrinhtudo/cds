import React, { useState } from "react";
import { User, LearningTopic, TopicCategory } from "../types";
import { BookOpen, Search, Scale, ShieldAlert, MessageSquare, HelpCircle, ChevronRight, AlertCircle, Bookmark } from "lucide-react";

interface LegalCenterProps {
  user: User;
  topics: LearningTopic[];
  onNavigate: (tab: string, arg?: any) => void;
}

interface LegalScenario {
  id: string;
  title: string;
  situation: string;
  question: string;
  lawCitation: string;
  correctBehavior: string;
}

export default function LegalCenter({ user, topics, onNavigate }: LegalCenterProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedScenario, setSelectedScenario] = useState<LegalScenario | null>(null);

  // Filter legal-related topics
  const legalTopics = topics.filter(t => 
    t.category === TopicCategory.LEGAL || 
    t.category === TopicCategory.PUBLIC_LEGAL ||
    t.tags.includes("Pháp luật")
  );

  // Common scenarios in military units / grassroots
  const mockScenarios: LegalScenario[] = [
    {
      id: "sc1",
      title: "Tạm hoãn nghĩa vụ quân sự khi đang học Đại học?",
      situation: "Anh Lê Văn Hải nhận được giấy gọi sơ tuyển nghĩa vụ quân sự ở quê nhà. Anh Hải hiện đang học năm thứ 2 hệ đại học chính quy của một trường Đại học tại Hà Nội và muốn tạm hoãn thực hiện nghĩa vụ quân sự để tập trung học tập.",
      question: "Trường hợp của anh Hải xử lý như thế nào theo đúng pháp luật?",
      lawCitation: "Khoản 1 Điều 41 Luật Nghĩa vụ quân sự năm 2015.",
      correctBehavior: "Anh Hải được quyền tạm hoãn gọi nhập ngũ trong thời bình do đang học tập tại cơ sở giáo dục đại học chính quy. Tuy nhiên, anh Hải KHÔNG ĐƯỢC tự ý bỏ qua lệnh khám sức khỏe sơ tuyển. Anh Hải cần xin giấy xác nhận sinh viên của nhà trường và nộp về Ban Chỉ huy Quân sự cấp xã ở quê nhà để hoàn thành hồ sơ xin tạm hoãn theo đúng thủ tục hành chính."
    },
    {
      id: "sc2",
      title: "Hành vi cản trở người khác thực hiện nghĩa vụ quân sự?",
      situation: "Bà Nguyễn Thị M có con trai trong độ tuổi gọi nhập ngũ đã nhận lệnh gọi. Vì thương con và sợ con đi vất vả, bà M đã chủ động giấu lệnh gọi nhập ngũ của con, khóa cửa phòng không cho con đi tham gia tập trung tuyển quân theo thời gian quy định.",
      question: "Hành vi của bà M vi phạm điều khoản nào và có bị xử lý hình sự hay không?",
      lawCitation: "Nghị định 37/2022/NĐ-CP và Điều 332 Bộ luật Hình sự.",
      correctBehavior: "Hành vi của bà M là hành vi cản trở việc thực hiện nghĩa vụ quân sự. Theo Nghị định 37/2022/NĐ-CP, hành vi cản trở công dân thực hiện nghĩa vụ quân sự có thể bị phạt hành chính từ 8.000.000đ đến 10.000.000đ. Nếu gây hậu quả nghiêm trọng hoặc đã bị xử lý hành chính mà còn tái phạm thì có thể bị truy cứu trách nhiệm hình sự về tội cản trở thực hiện nghĩa vụ quân sự."
    },
    {
      id: "sc3",
      title: "Quyền lợi trợ cấp của Dân quân tự vệ khi huấn luyện?",
      situation: "Anh Trịnh Văn Ba là dân quân tại chỗ thôn Tân Sỏi. Anh được triệu tập tham gia tuần tra giữ gìn trật tự và huấn luyện quân sự tập trung 15 ngày tại xã. Anh Ba băn khoăn về quyền lợi kinh tế của gia đình trong những ngày anh không đi làm nương rẫy được.",
      question: "Quyền lợi kinh tế của anh Ba được luật dân quân tự vệ bảo vệ thế nào?",
      lawCitation: "Điều 34 Luật Dân quân tự vệ năm 2019.",
      correctBehavior: "Khi được điều động làm nhiệm vụ huấn luyện, tuần tra, anh Ba sẽ được hưởng trợ cấp ngày công lao động (mức trợ cấp do UBND cấp tỉnh trình HĐND cùng cấp quyết định, nhưng không thấp hơn hệ số 0,08 mức lương cơ sở cho một ngày công). Đồng thời, anh được bảo đảm tiền ăn tương đương chế độ tiền ăn của chiến sĩ bộ binh, và được thanh toán chi phí đi lại nếu làm nhiệm vụ cách xa nơi cư trú."
    }
  ];

  const filteredTopics = legalTopics.filter(t => 
    t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4" id="legal-center-tab-content">
      
      {/* Search and Title in cohesive MD3 Hero Card */}
      <div className="relative overflow-hidden rounded-[var(--app-radius-sheet)] bg-gradient-to-br from-indigo-900 via-blue-900 to-slate-950 p-5 text-white app-shadow-medium space-y-3">
        <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-y-3">
          <Scale size={100} />
        </div>
        <div className="space-y-1">
          <span className="inline-block px-2 py-0.5 bg-yellow-400 text-[var(--app-color-text-primary)] text-caption font-extrabold rounded uppercase tracking-wide">
            Giáo dục pháp luật
          </span>
          <h2 className="text-base font-extrabold tracking-tight mt-1">Tủ sách Pháp luật Quân sự</h2>
          <p className="text-caption text-blue-100/95 leading-relaxed max-w-xs">
            Cung cấp thông tin chính thống, giải nghĩa điều luật cùng AI Chính trị viên, góp phần nâng cao ý thức chấp hành pháp luật nhà nước và kỷ luật quân đội.
          </p>
        </div>

        {/* Unified Search Input bar */}
        <div className="relative text-[var(--app-color-text-primary)] z-10 pt-1">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-[var(--app-color-text-muted)]">
            <Search size={14} />
          </span>
          <input
            type="text"
            placeholder="Tìm kiếm luật nghĩa vụ, dân quân..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 text-xs bg-white border border-transparent rounded-2xl focus:outline-none focus:ring-2 focus:ring-red-800 shadow-inner"
          />
        </div>
      </div>

      {/* Embedded interactive accordion detail */}
      {selectedScenario && (
        <div className="motion-fade-in space-y-3 rounded-[var(--app-radius-card)] border border-blue-100 bg-blue-50/75 p-4 app-shadow-low" id="scenario-detail-box">
          <div className="flex items-start justify-between gap-2 border-b border-blue-100 pb-2">
            <div className="flex items-center gap-2 min-w-0">
              <AlertCircle className="text-blue-700 shrink-0" size={16} />
              <h4 className="text-xs font-extrabold text-blue-900 line-clamp-1">{selectedScenario.title}</h4>
            </div>
            <button
              onClick={() => setSelectedScenario(null)}
              className="text-caption font-extrabold uppercase text-blue-800 hover:text-blue-950 p-1"
            >
              Đóng
            </button>
          </div>

          <div className="space-y-3 text-xs text-[var(--app-color-text-secondary)]">
            <div>
              <p className="text-caption font-extrabold uppercase tracking-wider text-[var(--app-color-text-muted)]">Tình huống thực tế</p>
              <p className="mt-1 bg-white p-3 rounded-2xl border border-[var(--app-color-divider)] leading-relaxed text-[var(--app-color-text-secondary)] font-medium">
                {selectedScenario.situation}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-1.5">
              <span className="text-caption font-extrabold uppercase tracking-wider text-[var(--app-color-text-muted)]">Câu hỏi pháp lý</span>
              <p className="font-bold text-[var(--app-color-text-primary)] bg-white/60 p-2.5 rounded-xl border border-[var(--app-color-divider)]">
                {selectedScenario.question}
              </p>
            </div>

            <div className="space-y-1.5">
              <p className="text-caption font-extrabold uppercase tracking-wider text-[var(--app-color-text-muted)] flex items-center gap-1">
                <span>Căn cứ áp dụng chính thức</span>
                <span className="px-1.5 py-0.5 bg-blue-100 text-blue-900 font-extrabold rounded text-caption">
                  {selectedScenario.lawCitation}
                </span>
              </p>
              <div className="bg-white p-3.5 rounded-2xl border border-blue-100/50 leading-relaxed">
                <p className="font-bold text-[var(--app-color-brand-primary)] text-body-s mb-1">Cách giải quyết thấu lý đạt tình:</p>
                <p className="text-[var(--app-color-text-secondary)] font-medium text-body-s">{selectedScenario.correctBehavior}</p>
              </div>
            </div>

            {/* AI Call to Action Trigger */}
            <div className="flex flex-col gap-2 pt-1.5">
              <button
                onClick={() => onNavigate("aitutor", {
                  title: `Tình huống: ${selectedScenario.title}`,
                  category: TopicCategory.LEGAL,
                  description: selectedScenario.situation
                })}
                className="w-full py-3 px-4 bg-[var(--app-color-brand-primary)] hover:bg-[var(--app-color-brand-primary-dark)] text-white font-extrabold text-xs rounded-xl transition app-shadow-low flex items-center justify-center gap-1.5 cursor-pointer min-h-[44px]"
              >
                <MessageSquare size={13} />
                <span>Trao đổi với AI Chính trị viên</span>
              </button>
              
              <button
                onClick={() => onNavigate("quiz")}
                className="w-full py-2.5 px-4 bg-white hover:bg-slate-50 text-[var(--app-color-text-secondary)] border border-[var(--app-color-border)] font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer min-h-11"
              >
                <HelpCircle size={13} />
                <span>Kiểm tra trắc nghiệm nhanh</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Scenario-Based Learning List */}
      <div className="space-y-2">
        <h3 className="text-caption font-extrabold uppercase tracking-widest text-[var(--app-color-text-muted)] pl-1 flex items-center gap-1.5">
          <ShieldAlert size={14} className="text-blue-800" />
          <span>Giải quyết tình huống thực tế</span>
        </h3>

        <div className="pixel-surface space-y-2.5 p-4">
          <p className="text-caption text-[var(--app-color-text-muted)] font-medium leading-relaxed">
            Chọn một vướng mắc pháp luật quân sự dân sự thường gặp ở cơ sở để tra cứu hướng ứng xử chuẩn xác:
          </p>

          <div className="grid grid-cols-1 gap-2">
            {mockScenarios.map(sc => (
              <button
                key={sc.id}
                onClick={() => setSelectedScenario(sc)}
                className={`w-full p-3.5 rounded-2xl text-left text-xs transition border cursor-pointer min-h-[50px] flex items-center justify-between gap-2 active:scale-98 ${
                  selectedScenario?.id === sc.id
                    ? "bg-blue-50 border-blue-300 text-blue-950 font-bold app-shadow-low"
                    : "bg-slate-50 border-[var(--app-color-divider)] text-[var(--app-color-text-secondary)] hover:bg-slate-100/50"
                }`}
              >
                <span className="leading-snug pr-2">{sc.title}</span>
                <ChevronRight size={14} className="text-[var(--app-color-text-muted)] shrink-0" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile-first Stacked List of Legal Topics */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-caption font-extrabold uppercase tracking-widest text-[var(--app-color-text-muted)]">Văn bản Pháp luật trọng tâm</h3>
          <span className="text-caption font-bold text-[var(--app-color-text-muted)] uppercase">{filteredTopics.length} CHUYÊN ĐỀ</span>
        </div>

        <div className="space-y-3">
          {filteredTopics.map(t => (
            <div
              key={t.id}
              onClick={() => onNavigate("learning", t)}
              className="pixel-surface flex cursor-pointer flex-col justify-between p-4 transition hover:border-blue-200"
            >
              <div className="space-y-1.5">
                <div className="flex items-center gap-1">
                  <Scale size={12} className="text-blue-600" />
                  <span className="text-caption font-extrabold text-[var(--app-color-text-muted)] uppercase tracking-wider">{t.category}</span>
                </div>
                <h4 className="text-xs font-extrabold text-[var(--app-color-text-primary)] leading-snug">
                  {t.title}
                </h4>
                <p className="text-caption text-[var(--app-color-text-muted)] line-clamp-2 leading-relaxed font-medium">
                  {t.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-[var(--app-color-divider)] flex items-center justify-between text-caption font-bold">
                <span className="text-[var(--app-color-text-muted)]">Mức độ: {t.difficulty}</span>
                <span className="text-blue-800 font-extrabold flex items-center gap-0.5">
                  <span>Học điều luật</span>
                  <ChevronRight size={12} />
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
