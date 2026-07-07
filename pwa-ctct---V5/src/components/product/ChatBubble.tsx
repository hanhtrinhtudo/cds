import React from "react";
import { AppCaption } from "../ui";

export interface ChatSource {
  type?: string;
  title: string;
  id?: string;
  url?: string;
}

export interface ChatBubbleProps {
  role: "user" | "model" | "system";
  content: React.ReactNode;
  sources?: ChatSource[];
  warnings?: string[];
  timestamp?: string;
  loading?: boolean;
  compact?: boolean;
}

export function ChatBubble({
  role,
  content,
  sources = [],
  warnings = [],
  timestamp,
  loading = false,
  compact = false
}: ChatBubbleProps) {
  const isAI = role === "model" || role === "system";

  return (
    <div className={`motion-message mb-3 flex min-w-0 gap-2 ${isAI ? "mr-auto max-w-[82%]" : "ml-auto max-w-[84%] flex-row-reverse"}`}>
      <div
        className={`w-6 h-6 rounded-full flex items-center justify-center font-extrabold text-overline shrink-0 ${
          isAI ? "bg-[var(--app-color-brand-primary)]" : "bg-[var(--app-color-text-primary)]"
        } text-white`}
      >
        {isAI ? "AI" : "ĐC"}
      </div>

      <div
        className={[
          "min-w-0 max-w-full overflow-wrap-anywhere rounded-[var(--app-radius-compact)]",
          compact ? "p-2" : "p-2",
          isAI ? "bg-[var(--app-color-surface-soft)] text-[var(--app-color-text-primary)] rounded-tl-md" : "bg-[var(--app-color-brand-primary)] text-white rounded-tr-md"
        ].join(" ")}
      >
        {loading ? (
          <div className="flex items-center gap-1 py-1" aria-label="AI Chính trị viên đang phân tích">
            <span className="motion-typing-dot h-1.5 w-1.5 rounded-full bg-[var(--app-color-brand-primary)]" />
            <span className="motion-typing-dot h-1.5 w-1.5 rounded-full bg-[var(--app-color-brand-primary)]" />
            <span className="motion-typing-dot h-1.5 w-1.5 rounded-full bg-[var(--app-color-brand-primary)]" />
          </div>
        ) : (
          content
        )}

        {timestamp && (
          <AppCaption className={isAI ? "mt-1 text-[var(--app-color-text-muted)]" : "mt-1 text-red-100"}>
            {timestamp}
          </AppCaption>
        )}

        {isAI && sources.length > 0 && (
          <details className="mt-2 border-t border-[var(--app-color-divider)] pt-1.5">
            <summary className="cursor-pointer list-none text-caption font-extrabold text-[var(--app-color-text-secondary)]">
              Nguồn tham khảo ({sources.length})
            </summary>
            <div className="motion-collapse mt-1 space-y-1">
              {sources.map((source, index) =>
                source.url ? (
                  <a
                    key={`${source.type}-${source.id || index}`}
                    href={source.url}
                    target="_blank"
                    rel="noreferrer"
                    className="block text-xs font-bold text-[var(--app-color-brand-primary)] underline break-words"
                  >
                    {source.title}
                  </a>
                ) : (
                  <AppCaption key={`${source.type}-${source.id || index}`} className="text-[var(--app-color-text-secondary)]">
                    {source.title}
                  </AppCaption>
                )
              )}
            </div>
          </details>
        )}

        {isAI &&
          warnings.map((warning, index) => (
            <AppCaption key={index} className="mt-1.5 block rounded-lg bg-[var(--app-color-warning-soft)] px-2 py-1 text-[var(--app-color-warning)]">
              {warning}
            </AppCaption>
          ))}
      </div>
    </div>
  );
}

export default ChatBubble;
