import React, { useEffect, useState } from "react";
import { Badge, Card, AppCaption, AppText } from "../ui";
import { getNewsImageUrl } from "../../utils/newsImage";

export interface NewsItemProps {
  title: string;
  summary?: string;
  category?: string;
  source?: string;
  imageUrl?: string;
  thumbnailUrl?: string;
  thumbnail?: string;
  image?: string;
  coverUrl?: string;
  cover?: string;
  photoUrl?: string;
  photo?: string;
  featuredImage?: string;
  mediaUrl?: string;
  publishedAt?: string;
  onOpen?: () => void;
  compact?: boolean;
  className?: string;
}

export function NewsItem({ title, summary, category, source, imageUrl, thumbnailUrl, thumbnail, image, coverUrl, cover, photoUrl, photo, featuredImage, mediaUrl, publishedAt, onOpen, compact = false, className = "" }: NewsItemProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const resolvedImage = getNewsImageUrl({ imageUrl, thumbnailUrl, thumbnail, image, coverUrl, cover, photoUrl, photo, featuredImage, mediaUrl });
  const placeholderLabel = category || source || "Tin tức";

  useEffect(() => setImageFailed(false), [resolvedImage]);
  return (
    <Card variant={onOpen ? "interactive" : "default"} className={["overflow-hidden", compact ? "p-2" : "p-2.5", className].filter(Boolean).join(" ")} onClick={onOpen}>
      <div className={compact ? "flex min-h-11 gap-2" : "space-y-2.5"}>
        {resolvedImage && !imageFailed ? (
          <img
            src={resolvedImage}
            alt=""
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
            onError={() => setImageFailed(true)}
            width={compact ? 48 : 640}
            height={compact ? 44 : 320}
            className={compact ? "h-11 w-12 rounded-xl object-cover shrink-0 bg-[var(--app-color-surface-soft)]" : "aspect-[2/1] h-auto max-h-40 w-full rounded-2xl object-cover bg-[var(--app-color-surface-soft)]"}
          />
        ) : (
          <div
            aria-hidden="true"
            className={compact
              ? "h-11 w-12 shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-red-800 to-red-950 px-1.5 text-white flex items-end pb-1.5"
              : "aspect-[2/1] max-h-36 w-full overflow-hidden rounded-2xl bg-gradient-to-br from-red-700 via-red-900 to-red-950 p-3 text-white flex items-end"}
          >
            <span className={compact ? "line-clamp-2 text-[10px] font-bold leading-tight" : "line-clamp-2 text-sm font-bold leading-snug"}>
              {placeholderLabel}
            </span>
          </div>
        )}

        <div className="min-w-0">
          <div className={compact ? "mb-0.5 flex flex-wrap gap-1" : "mb-1 flex flex-wrap gap-1.5"}>
            {category && <Badge variant="neutral">{category}</Badge>}
            {source && <Badge variant="info">{source}</Badge>}
          </div>
          <AppText variant="bodyS" weight="black" className={compact ? "line-clamp-1 text-[var(--app-color-text-primary)]" : "line-clamp-2 text-[var(--app-color-text-primary)]"}>{title}</AppText>
          {summary && <AppCaption className={compact ? "mt-0.5 line-clamp-1 text-[var(--app-color-text-secondary)]" : "mt-1 line-clamp-2 text-[var(--app-color-text-secondary)]"}>{summary}</AppCaption>}
          {publishedAt && !compact && <AppCaption className="mt-1 text-[var(--app-color-text-muted)]">{publishedAt}</AppCaption>}
        </div>
      </div>
    </Card>
  );
}

export default NewsItem;
