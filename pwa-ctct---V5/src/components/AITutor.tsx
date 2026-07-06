import React, { useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, Send, Sparkles, Trash2 } from "lucide-react";
import { AIChatMessage, LearningStatus, LearningTopic, User } from "../types";
import {
  aiService,
  PoliticalAIMode,
  PoliticalAIRequest,
  PoliticalAISource,
  toPoliticalAIUser
} from "../services/aiService";
import { reviewService } from "../services/reviewService";

interface AITutorProps {
  user: User;
  topics: LearningTopic[];
  activeTopicArg: any;
  onClearTopicArg: () => void;
}

type TutorMessage = AIChatMessage & {
  sources?: PoliticalAISource[];
  warnings?: string[];
};

const FAILURE_MESSAGE =
  "AI Chính trị viên chưa sẵn sàng. Đồng chí vẫn có thể học tài liệu, làm quiz và xem lại đáp án.";

const welcomeMessage = (user: User): TutorMessage => ({
  id: "welcome",
  userId: user.id,
  role: "model",
  content:
    `Xin chào đồng chí ${user.fullName}.\n` +
    "Tôi sẵn sàng hỗ trợ tóm tắt tài liệu, giải thích nội dung khó và tạo câu hỏi ôn tập.",
  createdAt: new Date().toISOString()
});

const fileIdFromTopic = (topic?: LearningTopic) =>
  topic?.id.startsWith("cds_material_") ? topic.id.replace(/^cds_material_/, "") : "";

function renderInlineMarkdown(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);

  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={index} className="font-black">
          {part.slice(2, -2)}
        </strong>
      );
    }

    return <React.Fragment key={index}>{part}</React.Fragment>;
  });
}

export default function AITutor({
  user,
  topics,
  activeTopicArg,
  onClearTopicArg
}: AITutorProps) {
  const [messages, setMessages] = useState<TutorMessage[]>([welcomeMessage(user)]);
  const [inputText, setInputText] = useState("");
  const [selectedTopicId, setSelectedTopicId] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const gatewayConfigured = aiService.isConfigured();

  const selectedTopic = useMemo(
    () => topics.find(topic => topic.id === selectedTopicId),
    [selectedTopicId, topics]
  );

  const recentReview = useMemo(
    () => reviewService.getReviewHistory()[0] || null,
    [messages.length]
  );

  useEffect(() => {
    if (!activeTopicArg) return;

    const matchingTopic = topics.find(topic => topic.id === activeTopicArg.id);
    if (matchingTopic) setSelectedTopicId(matchingTopic.id);

    const title = activeTopicArg.title || activeTopicArg.name || "tài liệu đang học";
    setInputText(`Tóm tắt tài liệu: "${title}". Nêu nội dung cốt lõi và câu hỏi tự ôn.`);
    onClearTopicArg();
  }, [activeTopicArg, onClearTopicArg, topics]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages, loading]);

  const presets: Array<{ label: string; mode: PoliticalAIMode; prompt: string }> = [
    {
      label: "Tóm tắt",
      mode: "FAST",
      prompt: "Tóm tắt tài liệu đang chọn và nêu 3 ý chính cần ghi nhớ."
    },
    {
      label: "Giải thích",
      mode: "EXPLAIN",
      prompt: "Giải thích nội dung khó hiểu bằng ngôn ngữ dễ hiểu và liên hệ thực tiễn tại đơn vị."
    },
    {
      label: "Tạo câu hỏi",
      mode: "DRILL",
      prompt: "Tạo bộ câu hỏi ôn tập từ tài liệu đang chọn."
    }
  ];

  const detectMode = (question: string): PoliticalAIMode => {
    const text = question.toLowerCase();

    if (text.includes("tóm tắt") || text.includes("ý chính") || text.includes("nội dung cốt lõi")) {
      return "FAST";
    }

    if (
      text.includes("câu hỏi") ||
      text.includes("ôn tập") ||
      text.includes("trắc nghiệm") ||
      text.includes("kiểm tra nhanh")
    ) {
      return "DRILL";
    }

    if (
      text.includes("lỗi sai") ||
      text.includes("đáp án") ||
      text.includes("vì sao") ||
      text.includes("giải thích")
    ) {
      return "EXPLAIN";
    }

    if (
      text.includes("văn bản") ||
      text.includes("chính sách") ||
      text.includes("quy định") ||
      text.includes("nghị định") ||
      text.includes("thông tư") ||
      text.includes("luật")
    ) {
      return "POLICY";
    }

    if (text.includes("kế hoạch") || text.includes("lộ trình") || text.includes("5 ngày")) {
      return "STUDY_PLAN";
    }

    return selectedTopic ? "DEEP" : "FAST";
  };

  const buildRequest = (question: string, requestMode: PoliticalAIMode): PoliticalAIRequest => {
    const fileId = fileIdFromTopic(selectedTopic);

    const safeReview = recentReview
      ? {
          sourceType: recentReview.sourceType,
          attemptId: recentReview.attemptId,
          title: recentReview.title,
          submittedAt: recentReview.submittedAt,
          score: recentReview.score,
          total: recentReview.total,
          correct: recentReview.correct,
          wrong: recentReview.wrong,
          skip: recentReview.skip,
          answers: recentReview.answers.slice(0, 20)
        }
      : {};

    return {
      mode: requestMode,
      question,
      fileId: fileId || undefined,
      materialTitle: selectedTopic?.title,
      section: selectedTopic?.description,
      user: toPoliticalAIUser(user),
      context: {
        currentMaterial: selectedTopic
          ? {
              id: selectedTopic.id,
              title: selectedTopic.title,
              category: selectedTopic.category,
              description: selectedTopic.description,
              objective: selectedTopic.objective,
              tags: selectedTopic.tags,
              references: selectedTopic.references
            }
          : {},
        recentReview: safeReview,
        weakTopics: topics
          .filter(topic => topic.status === LearningStatus.NEED_REVIEW)
          .map(topic => ({ id: topic.id, title: topic.title })),
        policyDocs: [],
        questionBank: [],
        conversation: messages
          .slice(-6)
          .map(message => ({ role: message.role, content: message.content }))
      }
    };
  };

  const requestAI = async (payload: PoliticalAIRequest) => {
    if (payload.mode === "FAST" && payload.fileId) {
      const { mode: _mode, fileId, ...summaryPayload } = payload;
      return aiService.summarizeMaterial(fileId, summaryPayload);
    }

    if (payload.mode === "EXPLAIN") {
      const { mode: _mode, ...explainPayload } = payload;
      return aiService.explainQuestion(explainPayload);
    }

    if (payload.mode === "POLICY") {
      const { mode: _mode, ...policyPayload } = payload;
      return aiService.askPolicyQuestion(policyPayload);
    }

    if (payload.mode === "STUDY_PLAN") {
      const { mode: _mode, ...planPayload } = payload;
      return aiService.generateStudyPlan(planPayload);
    }

    return aiService.chatWithPoliticalAI(payload);
  };

  const handleSendMessage = async (
    event?: React.FormEvent,
    customPrompt?: string,
    customMode?: PoliticalAIMode
  ) => {
    event?.preventDefault();

    const question = (customPrompt || inputText).trim();
    if (!question || loading || !gatewayConfigured) return;

    const requestMode = customMode || detectMode(question);

    setErrorMsg("");
    setInputText("");

    const userMessage: TutorMessage = {
      id: `msg_${Date.now()}`,
      userId: user.id,
      role: "user",
      content: question,
      createdAt: new Date().toISOString()
    };

    setMessages(previous => [...previous, userMessage]);
    setLoading(true);

    try {
      const response = await requestAI(buildRequest(question, requestMode));

      setMessages(previous => [
        ...previous,
        {
          id: `msg_ai_${Date.now()}`,
          userId: user.id,
          role: "model",
          content: response.answer,
          sources: response.sources,
          warnings: response.warnings,
          createdAt: new Date().toISOString()
        }
      ]);
    } catch {
      setErrorMsg(FAILURE_MESSAGE);
    } finally {
      setLoading(false);
    }
  };

  const clearHistory = () => {
    if (!window.confirm("Đồng chí có muốn xóa lịch sử trò chuyện trên màn hình này?")) return;

    setMessages([welcomeMessage(user)]);
    setErrorMsg("");
  };

  const renderText = (text: string) =>
    text.split("\n").map((line, index) => {
      if (!line.trim()) return <div key={index} className="h-1" />;

      if (/^[-*]\s/.test(line)) {
        return (
          <li key={index} className="ml-4 list-disc text-sm leading-relaxed mt-1">
            {renderInlineMarkdown(line.slice(2))}
          </li>
        );
      }

      if (/^\d+\.\s/.test(line)) {
        return (
          <p key={index} className="text-sm leading-relaxed mt-1 font-semibold">
            {renderInlineMarkdown(line)}
          </p>
        );
      }

      return (
        <p key={index} className="text-sm leading-relaxed mt-1 whitespace-pre-wrap">
          {renderInlineMarkdown(line)}
        </p>
      );
    });

  return (
    <div
      className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden flex flex-col h-[calc(100dvh-128px)] min-h-[500px]"
      id="ai-chat-screen-layout"
    >
      <div className="bg-gradient-to-r from-red-800 to-red-950 px-3.5 py-2.5 flex items-center justify-between text-white shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="bg-white/10 p-1.5 rounded-full border border-white/20 shrink-0">
            <Sparkles size={16} className="text-yellow-300" />
          </div>

          <div className="min-w-0">
            <h3 className="text-sm font-black leading-tight truncate">
              AI Chính trị viên
            </h3>
            <p className="text-[11px] text-red-100 truncate">
              Hỗ trợ học tập, ôn luyện và tra cứu chính sách
            </p>
          </div>
        </div>

        <button
          onClick={clearHistory}
          className="p-2 text-red-100 hover:text-white hover:bg-white/10 rounded-xl shrink-0"
          title="Xóa lịch sử"
        >
          <Trash2 size={17} />
        </button>
      </div>

      <div className="px-2.5 py-2 border-b border-slate-100 bg-white space-y-1.5 shrink-0">
        {!gatewayConfigured && (
          <div className="p-2 rounded-xl bg-amber-50 border border-amber-200 text-[11px] font-bold text-amber-900">
            AI Chính trị viên chưa được kích hoạt trên bản triển khai này.
          </div>
        )}

        <label className="block text-[10px] font-black tracking-wide text-slate-500">
          Tài liệu
          <select
            value={selectedTopicId}
            onChange={event => setSelectedTopicId(event.target.value)}
            className="mt-1 w-full h-9 px-3 rounded-xl border border-slate-200 bg-white text-xs font-semibold normal-case text-slate-700"
          >
            <option value="">Không chọn tài liệu</option>
            {topics.map(topic => (
              <option key={topic.id} value={topic.id}>
                {topic.title}
              </option>
            ))}
          </select>
        </label>

        {recentReview && (
          <p className="text-[10px] text-slate-500 leading-snug line-clamp-1">
            Có thể hỏi AI giải thích bài đã nộp gần nhất: {recentReview.title}
          </p>
        )}
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-2.5 bg-slate-50/60 scrollbar-none" id="ai-messages-viewport">
        {messages.map(message => {
          const isAI = message.role === "model";
          const isWelcome = message.id === "welcome";

          return (
            <div
              key={message.id}
              className={`flex gap-2.5 max-w-[96%] ${
                isAI ? "mr-auto" : "ml-auto flex-row-reverse"
              }`}
            >
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center font-black text-[10px] shrink-0 ${
                  isAI ? "bg-red-700" : "bg-slate-800"
                } text-white`}
              >
                {isAI ? "AI" : "ĐC"}
              </div>

              <div
                className={`p-2.5 rounded-2xl border shadow-sm max-w-full ${
                  isAI
                    ? "bg-white border-slate-100 text-slate-800 rounded-tl-none"
                    : "bg-red-700 border-red-800 text-white rounded-tr-none"
                } ${isWelcome ? "max-h-[116px] overflow-hidden" : ""}`}
              >
                {renderText(message.content)}

                {isAI && message.sources && message.sources.length > 0 && (
                  <div className="mt-3 pt-2 border-t border-slate-100 space-y-1">
                    <p className="text-[10px] font-black uppercase text-slate-400">
                      Nguồn tham khảo
                    </p>

                    {message.sources.map((source, index) =>
                      source.url ? (
                        <a
                          key={`${source.type}-${source.id || index}`}
                          href={source.url}
                          target="_blank"
                          rel="noreferrer"
                          className="block text-xs font-bold text-red-700 underline break-words"
                        >
                          {source.title}
                        </a>
                      ) : (
                        <p
                          key={`${source.type}-${source.id || index}`}
                          className="text-xs text-slate-600"
                        >
                          {source.title}
                        </p>
                      )
                    )}
                  </div>
                )}

                {isAI &&
                  message.warnings?.map((warning, index) => (
                    <p key={index} className="mt-2 text-[10px] text-amber-800">
                      {warning}
                    </p>
                  ))}
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="text-xs font-bold text-slate-500 bg-white border border-slate-100 rounded-2xl p-3 w-fit">
            AI Chính trị viên đang tổng hợp...
          </div>
        )}

        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-xs rounded-2xl flex items-start gap-2">
            <AlertCircle size={16} className="shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="px-2.5 py-1.5 bg-white border-t border-slate-100 shrink-0">
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
          {presets.map(preset => (
            <button
              key={preset.label}
              type="button"
              onClick={() => void handleSendMessage(undefined, preset.prompt, preset.mode)}
              disabled={loading || !gatewayConfigured}
              className="h-8 px-3 bg-red-50 border border-red-100 rounded-full text-[10px] font-black text-red-800 disabled:opacity-50 whitespace-nowrap shrink-0"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-2.5 bg-white border-t border-slate-100 shrink-0 space-y-1">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input
            value={inputText}
            onChange={event => setInputText(event.target.value)}
            disabled={loading || !gatewayConfigured}
            placeholder="Hỏi AI về tài liệu, câu hỏi hoặc văn bản..."
            className="flex-1 h-11 px-4 text-sm bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-red-700 min-w-0"
          />

          <button
            type="submit"
            disabled={!inputText.trim() || loading || !gatewayConfigured}
            className="h-11 w-11 flex items-center justify-center bg-red-700 disabled:opacity-40 text-white rounded-2xl shrink-0"
            id="btn-ai-send"
          >
            <Send size={18} />
          </button>
        </form>

        <p className="text-[9px] text-slate-400 text-center italic px-1 leading-tight truncate">
          AI hỗ trợ học tập; cần đối chiếu văn bản chính thức khi áp dụng.
        </p>
      </div>
    </div>
  );
}
