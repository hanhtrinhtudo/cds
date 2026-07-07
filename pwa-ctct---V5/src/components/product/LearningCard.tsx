import React from "react";
import { Bookmark, Bot, Clock, FileText } from "lucide-react";
import { Badge, Button, Card, IconButton, AppCaption, AppText } from "../ui";

export interface LearningCardProps {
  title: string;
  description?: string;
  category?: string;
  required?: boolean;
  estimatedMinutes?: number;
  progressPercent?: number;
  hasQuiz?: boolean;
  pdfAvailable?: boolean;
  onOpen?: () => void;
  onAskAI?: () => void;
  actionLabel?: string;
  bookmarked?: boolean;
  onToggleBookmark?: () => void;
  bookmarkAriaLabel?: string;
  showBookmark?: boolean;
  className?: string;
}

export function LearningCard({
  title,
  description,
  category,
  required,
  estimatedMinutes,
  progressPercent,
  hasQuiz,
  pdfAvailable,
  onOpen,
  onAskAI,
  actionLabel = "Mở bài học",
  bookmarked = false,
  onToggleBookmark,
  bookmarkAriaLabel,
  showBookmark = false,
  className = ""
}: LearningCardProps) {
  const displaysBookmark = showBookmark && Boolean(onToggleBookmark);

  return (
    <Card variant="interactive" className={["relative space-y-2.5 p-3", className].filter(Boolean).join(" ")} onClick={onOpen}>
      <div className="flex items-start justify-between gap-2.5">
        <div className={["min-w-0", displaysBookmark ? "pr-10" : ""].filter(Boolean).join(" ")}>
          <AppText variant="bodyS" weight="black" className="text-[var(--app-color-text-primary)]">{title}</AppText>
          {description && <AppCaption className="mt-1 line-clamp-2 text-[var(--app-color-text-secondary)]">{description}</AppCaption>}
        </div>
        {!displaysBookmark && required && <Badge variant="warning">Cần học</Badge>}
      </div>

      {displaysBookmark && (
        <IconButton
          type="button"
          size="sm"
          variant="ghost"
          aria-label={bookmarkAriaLabel || (bookmarked ? `Bỏ lưu ${title}` : `Lưu ${title}`)}
          aria-pressed={bookmarked}
          icon={<Bookmark size={16} className={bookmarked ? "fill-amber-400 text-amber-500" : ""} />}
          className={[
            "absolute right-2 top-2 z-10",
            bookmarked ? "text-[var(--app-color-warning)]" : "text-[var(--app-color-text-muted)]"
          ].join(" ")}
          onClick={(event) => {
            event.stopPropagation();
            onToggleBookmark?.();
          }}
        />
      )}

      <div className="flex flex-wrap gap-1">
        {category && <Badge variant="neutral">{category}</Badge>}
        {displaysBookmark && required && <Badge variant="warning">Cần học</Badge>}
        {hasQuiz && <Badge variant="review">Có ôn tập</Badge>}
        {pdfAvailable && <Badge variant="info">Tài liệu</Badge>}
      </div>

      {(typeof progressPercent === "number" || estimatedMinutes) && (
        <div className="flex items-center justify-between gap-2 text-[var(--app-color-text-muted)]">
          {typeof progressPercent === "number" && <AppCaption>Tiến độ {Math.round(progressPercent)}%</AppCaption>}
          {estimatedMinutes && <AppCaption className="inline-flex items-center gap-1"><Clock size={12} /> {estimatedMinutes} phút</AppCaption>}
        </div>
      )}

      <div className="flex gap-1.5 pt-0.5">
        <Button type="button" size="sm" onClick={(event) => { event.stopPropagation(); onOpen?.(); }} leftIcon={<FileText size={14} />}>
          {actionLabel}
        </Button>
        {onAskAI && (
          <Button type="button" size="sm" variant="secondary" onClick={(event) => { event.stopPropagation(); onAskAI(); }} leftIcon={<Bot size={14} />}>
            Trao đổi với AI Chính trị viên
          </Button>
        )}
      </div>
    </Card>
  );
}

export default LearningCard;
