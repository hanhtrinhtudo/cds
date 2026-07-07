import React, { useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, ChevronDown, Sparkles, Trash2 } from "lucide-react";
import { AIChatMessage, LearningStatus, LearningTopic, User } from "../types";
import {
  aiService,
  PoliticalAIMode,
  PoliticalAIRequest,
  PoliticalAISource,
  toPoliticalAIUser
} from "../services/aiService";
import { reviewService } from "../services/reviewService";
import { AppCaption, AppHeading, IconButton } from "./ui";
import { ChatBubble, ChatComposer } from "./product";
import { AppBottomBar, AppPage, AppScrollable, AppWorkspace } from "./layout";
import { AnalyticsEventPayload, AnalyticsEventType } from "../services/analyticsService";

interface AITutorProps {
  user: User;
  topics: LearningTopic[];
  activeTopicArg: any;
  onClearTopicArg: () => void;
  onAnalyticsEvent?: (eventType: AnalyticsEventType, event?: Partial<AnalyticsEventPayload>) => void;
}

type TutorMessage = AIChatMessage & {
  sources?: PoliticalAISource[];
  warnings?: string[];
};

const FAILURE_MESSAGE =
  "AI Chính trị viên chưa sẵn sàng. Đồng chí vẫn có thể học tài liệu, làm bài ôn tập và xem lại đáp án.";

const welcomeMessage = (user: User): TutorMessage => ({
  id: "welcome",
  userId: user.id,
  role: "model",
  content:
    "Xin chào đồng chí.\n" +
    "AI Chính trị viên sẵn sàng hỗ trợ học tập, ôn luyện và giải đáp.",
  createdAt: new Date().toISOString()
});

const fileIdFromTopic = (topic?: LearningTopic) =>
  topic?.id.startsWith("cds_material_") ? topic.id.replace(/^cds_material_/, "") : "";

function renderInlineMarkdown(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);

  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={index} className="font-extrabold">
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
  onClearTopicArg,
  onAnalyticsEvent
}: AITutorProps) {
  const [messages, setMessages] = useState<TutorMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [selectedTopicId, setSelectedTopicId] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const conversationRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isNearBottomRef = useRef(true);
  const forceScrollRef = useRef(false);
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

  const hasUserMessage = useMemo(
    () => messages.some(message => message.role === "user"),
    [messages]
  );

  const handleConversationScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const viewport = event.currentTarget;
    isNearBottomRef.current = viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight < 140;
  };

  const scrollConversationToBottom = (behavior: ScrollBehavior = "smooth") => {
    const scroll = () => {
      messagesEndRef.current?.scrollIntoView({
        behavior,
        block: "end"
      });
    };

    window.requestAnimationFrame(scroll);
    window.setTimeout(scroll, 0);
  };

  useEffect(() => {
    if (!forceScrollRef.current && !isNearBottomRef.current) return;

    const forced = forceScrollRef.current;
    scrollConversationToBottom(forced ? "auto" : "smooth");
    forceScrollRef.current = false;
    isNearBottomRef.current = true;

    return undefined;
  }, [messages.length, loading]);

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
      label: "Ôn tập",
      mode: "DRILL",
      prompt: "Tạo bộ câu hỏi ôn tập từ tài liệu đang chọn."
    },
    {
      label: "Tra cứu",
      mode: "POLICY",
      prompt: "Tra cứu và giải thích nội dung văn bản, chính sách liên quan đến câu hỏi của tôi."
    },
    {
      label: "Kế hoạch",
      mode: "STUDY_PLAN",
      prompt: "Lập kế hoạch học tập ngắn ngày dựa trên tài liệu và kết quả ôn tập gần đây."
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

    forceScrollRef.current = true;
    setMessages(previous => [...previous, userMessage]);
    setLoading(true);
    scrollConversationToBottom("auto");
    onAnalyticsEvent?.("AI_PROMPT", {
      resourceType: "ai",
      resourceId: selectedTopic?.id,
      resourceTitle: selectedTopic?.title,
      category: selectedTopic?.category,
      metadata: { mode: requestMode, hasMaterial: Boolean(selectedTopic), hasReview: Boolean(recentReview) }
    });

    try {
      const response = await requestAI(buildRequest(question, requestMode));
      onAnalyticsEvent?.("AI_RESPONSE", {
        resourceType: "ai",
        resourceId: selectedTopic?.id,
        resourceTitle: selectedTopic?.title,
        category: selectedTopic?.category,
        metadata: {
          mode: requestMode,
          sourceCount: response.sources?.length || 0,
          warningCount: response.warnings?.length || 0,
          model: response.model,
          provider: response.provider
        }
      });

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

    setMessages([]);
    setErrorMsg("");
    forceScrollRef.current = true;
  };

  const renderText = (text: string) =>
    text.split("\n").map((line, index) => {
      if (!line.trim()) return <div key={index} className="h-1" />;

      if (/^[-*]\s/.test(line)) {
        return (
          <li key={index} className="ml-4 mt-1 list-disc text-body leading-relaxed">
            {renderInlineMarkdown(line.slice(2))}
          </li>
        );
      }

      if (/^\d+\.\s/.test(line)) {
        return (
          <p key={index} className="mt-1 text-body font-semibold leading-relaxed">
            {renderInlineMarkdown(line)}
          </p>
        );
      }

      return (
        <p key={index} className="mt-1 whitespace-pre-wrap text-body leading-relaxed">
          {renderInlineMarkdown(line)}
        </p>
      );
    });

  return (
    <AppPage variant="workspace" className="ai-workspace flex h-full min-h-0 flex-col overflow-hidden bg-white" id="ai-chat-screen-layout">
      <AppWorkspace
        className="h-full min-h-0 overflow-hidden bg-white"
        topSlot={
          <>
            <div className="pixel-toolbar ai-toolbar-compact flex shrink-0 items-center justify-between gap-1.5">
              <div className="flex items-center gap-2 min-w-0">
                <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-700 text-white">
                  <Sparkles size={14} className="text-yellow-300" />
                  <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full border border-white bg-[var(--app-color-brand-primary)]" />
                </div>

                <div className="min-w-0">
                  <AppHeading level="h3" variant="title" truncate className="leading-none">
                    AI Chính trị viên
                  </AppHeading>
                  <AppCaption className="text-[var(--app-color-text-muted)] leading-none">Sẵn sàng hỗ trợ</AppCaption>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <label className="relative block">
                  <span className="sr-only">Tài liệu đang học</span>
                  <select
                    value={selectedTopicId}
                    onChange={event => setSelectedTopicId(event.target.value)}
                    className="h-10 max-w-[104px] appearance-none rounded-full border border-[var(--app-color-border)] bg-slate-50 py-1 pl-3 pr-7 text-xs font-bold text-[var(--app-color-text-secondary)] focus:outline-none focus:ring-2 focus:ring-red-700"
                    aria-label="Tài liệu đang học"
                  >
                    <option value="">Tài liệu</option>
                    {topics.map(topic => (
                      <option key={topic.id} value={topic.id}>
                        {topic.title}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={13} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[var(--app-color-text-muted)]" />
                </label>

                <IconButton
                  onClick={clearHistory}
                  variant="ghost"
                  size="sm"
                  icon={<Trash2 size={16} />}
                  className="text-[var(--app-color-text-muted)] hover:text-red-700 hover:bg-red-50 shrink-0"
                  title="Xóa lịch sử"
                  aria-label="Xóa lịch sử trò chuyện"
                />
              </div>
            </div>

            {!gatewayConfigured && (
              <div className="px-3 py-1.5 border-b border-amber-100 bg-amber-50 text-xs font-semibold text-amber-800">
                AI Chính trị viên hiện chưa được kích hoạt.
              </div>
            )}
          </>
        }
        bottomSlot={
          <AppBottomBar safeArea={false} elevated={false} className="shrink-0 border-t border-[var(--app-color-divider)]">
            <ChatComposer
              value={inputText}
              onChange={setInputText}
              onSubmit={handleSendMessage}
              disabled={!gatewayConfigured}
              loading={loading}
              presets={hasUserMessage ? [] : presets.map(preset => ({ label: preset.label, value: preset.label }))}
              showDisclaimer={!hasUserMessage}
              onPresetClick={preset => {
                const match = presets.find(item => item.label === preset.label);
                if (match) void handleSendMessage(undefined, match.prompt, match.mode);
              }}
            />
          </AppBottomBar>
        }
      >
        <AppScrollable
          ref={conversationRef}
          hideScrollbar
          onScroll={handleConversationScroll}
          className="ai-conversation-scroll overflow-x-hidden bg-white px-2.5 pb-2 pt-2"
          id="ai-messages-viewport"
        >
          {!hasUserMessage && messages.length === 0 && (
            <div className="mx-auto flex min-h-[42%] max-w-[84%] flex-col items-center justify-center text-center">
              <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-red-700 text-white">
                <Sparkles size={16} className="text-yellow-300" />
              </div>
              <p className="text-body font-semibold leading-relaxed text-[var(--app-color-text-primary)]">
                Xin chào đồng chí. AI Chính trị viên sẵn sàng hỗ trợ học tập, ôn luyện và giải đáp.
              </p>
            </div>
          )}

          {messages.map(message => (
            <ChatBubble
              key={message.id}
              role={message.role === "model" ? "model" : "user"}
              content={renderText(message.content)}
              sources={message.sources}
              warnings={message.warnings}
            />
          ))}

          {loading && <ChatBubble role="model" content={null} loading />}

          {errorMsg && (
            <div className="mr-auto flex max-w-[94%] items-start gap-2 rounded-2xl bg-red-50 px-3 py-2 text-sm font-semibold text-red-800">
              <AlertCircle size={15} className="mt-0.5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </AppScrollable>
      </AppWorkspace>
    </AppPage>
  );
}
