const IMAGE_FIELD_NAMES = [
  "imageUrl",
  "image",
  "thumbnail",
  "thumbnailUrl",
  "thumb",
  "thumbUrl",
  "cover",
  "coverUrl",
  "photo",
  "photoUrl",
  "mediaUrl",
  "featuredImage",
  "imageId",
  "fileId",
  "driveFileId",
  "attachmentUrl",
  "hinhAnh",
  "anh",
  "urlAnh",
  "linkAnh",
  "image_url",
  "thumbnail_url"
] as const;

const RAW_DRIVE_ID = /^[a-zA-Z0-9_-]{20,}$/;
const EMPTY_IMAGE_VALUES = /^(?:-|n\/?a|null|undefined|none|no\s*image|kh[oô]ng\s*c[oó]\s*(?:ảnh|anh)|0)$/i;
const warnedSignatures = new Set<string>();

const driveThumbnail = (fileId: string): string =>
  `https://drive.google.com/thumbnail?id=${encodeURIComponent(fileId)}&sz=w800`;

const extractDriveFileId = (value: string): string | undefined => {
  try {
    const url = new URL(value);
    if (!/(^|\.)drive\.google\.com$/i.test(url.hostname)) return undefined;

    const pathMatch = url.pathname.match(/\/file\/d\/([a-zA-Z0-9_-]+)/i);
    return pathMatch?.[1] || url.searchParams.get("id") || undefined;
  } catch {
    return undefined;
  }
};

const asCandidate = (value: unknown): string => {
  if (Array.isArray(value)) return asCandidate(value[0]);
  return typeof value === "string" || typeof value === "number" ? String(value).trim() : "";
};

const resolveCandidate = (fieldName: string, value: unknown): string | undefined => {
  const candidate = asCandidate(value);
  if (!candidate || EMPTY_IMAGE_VALUES.test(candidate)) return undefined;

  const driveId = extractDriveFileId(candidate);
  if (driveId) return driveThumbnail(driveId);

  if (/^https?:\/\//i.test(candidate) || /^data:image\//i.test(candidate) || candidate.startsWith("/")) {
    return candidate;
  }

  if (RAW_DRIVE_ID.test(candidate) && /(?:image|thumb|cover|photo|file|drive|media|hinh|anh)/i.test(fieldName)) {
    return driveThumbnail(candidate);
  }

  return undefined;
};

export function getNewsImageUrl(item: any): string {
  const candidates = [
    item?.imageUrl,
    item?.thumbnailUrl,
    item?.image,
    item?.thumb,
    item?.thumbnail
  ];

  const found = candidates.find(v => {
    const s = String(v || "").trim();
    return /^https?:\/\//i.test(s);
  });

  return found ? String(found).trim() : "";
}

export default getNewsImageUrl;
