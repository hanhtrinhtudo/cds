import { apiClient } from "./apiClient";
import { News } from "../types";
import { isLegacyAppsScriptAuthMode } from "./authService";
import { legacyNews, legacyPolicyDocs } from "../data/cdsLegacyData";
import { getNewsImageUrl } from "../utils/newsImage";

export type NewsSource =
  | "vnexpress"
  | "chinhphu"
  | "dangcongsan.hoatdong"
  | "dangcongsan.xaydung"
  | string;

export interface AppsScriptNews extends News {
  source?: string;
  link?: string;
}

export interface PolicySearchParams {
  q?: string;
  type?: string;
  range?: string;
  limit?: number;
}

export interface PolicyDoc {
  so: string;
  loai: string;
  coquan: string;
  date: string;
  title: string;
  summary: string;
  linhvuc: string;
  link: string;
  pdf: string;
}

let fallbackUsed = false;

const env = (key: string): string => String((import.meta as any).env?.[key] || "").trim();
const newsApiUrl = () => env("VITE_NEWS_API_URL") || env("VITE_LEGACY_CDS_API_URL");
const NEWS_REQUEST_TIMEOUT_MS = 6500;

const extractRows = (payload: unknown): any[] => {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== "object") return [];
  const value = payload as Record<string, unknown>;
  for (const key of ["items", "data", "results", "rows", "documents"]) {
    if (Array.isArray(value[key])) return value[key] as any[];
  }
  return [];
};

const requestAction = async (action: string, params: Record<string, unknown> = {}): Promise<any[]> => {
  const baseUrl = newsApiUrl();
  if (!baseUrl) throw new Error("VITE_NEWS_API_URL chưa được cấu hình");

  const url = new URL(baseUrl);
  url.searchParams.set("action", action);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value) !== "") {
      url.searchParams.set(key, String(value));
    }
  });

  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), NEWS_REQUEST_TIMEOUT_MS);
  let response: Response;
  try {
    response = await fetch(url.toString(), { method: "GET", cache: "no-store", signal: controller.signal });
  } finally {
    window.clearTimeout(timeout);
  }
  if (!response.ok) throw new Error(`News Apps Script trả về HTTP ${response.status}`);
  const payload = await response.json();
  if ((payload as any)?.ok === false || (payload as any)?.success === false) {
    throw new Error(String((payload as any)?.error || (payload as any)?.message || "Apps Script báo lỗi"));
  }
  return extractRows(payload);
};

const categoryForSource = (source: string): string => {
  if (source === "vnexpress") return "Tin trong ngày";
  if (source === "chinhphu") return "Chính sách mới";
  if (source.startsWith("dangcongsan")) return "Tin chính trị ĐCSVN";
  return "Tin theo thời gian";
};

const stableId = (value: string, index: number) => {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  return `apps_news_${hash || index}`;
};

const normalizeKeyPart = (value: unknown): string =>
  String(value || "")
    .toLocaleLowerCase("vi")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

export const dedupeNews = <T extends AppsScriptNews>(items: T[]): T[] => {
  const seen = new Set<string>();
  return items.filter(item => {
    const link = String(item.externalUrl || item.link || "").trim().toLocaleLowerCase();
    const image = String(item.imageUrl || "").split("?")[0].toLocaleLowerCase();
    const key = [normalizeKeyPart(item.title), normalizeKeyPart(item.summary), normalizeKeyPart(item.source), link, image]
      .filter(Boolean)
      .join("|") || item.id;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const mapNewsRows = (rows: any[], requestedSource = ""): AppsScriptNews[] =>
  rows
    .filter(row => row && (row.title || row.tieuDe || row.name))
    .map((row, index) => {
      const source = String(row.source || row.nguon || requestedSource || "").trim();
      const link = String(row.link || row.url || row.href || "").trim();
      const publishedAt = row.ts || row.dateISO || row.publishedAt || row.date || row.createdAt || new Date().toISOString();
      return {
        id: String(row.id || row.ID || row.slug || stableId(link || String(row.title), index)),
        title: String(row.title || row.tieuDe || row.name || "Tin tức"),
        category: categoryForSource(source || requestedSource),
        summary: String(row.summary || row.description || row.moTa || row.content || ""),
        content: String(row.content || row.noiDung || row.summary || row.description || ""),
        imageUrl: getNewsImageUrl(row) || undefined,
        visibility: "public",
        status: "published",
        authorId: "legacy_apps_script",
        publishedAt: String(publishedAt),
        createdAt: String(row.createdAt || publishedAt),
        source,
        link,
        externalUrl: link || undefined
      };
    });

const fallbackNews = (source?: string): AppsScriptNews[] => {
  if (!source) return legacyNews as AppsScriptNews[];
  const category = categoryForSource(source);
  return (legacyNews as AppsScriptNews[]).filter(item => item.category === category);
};

const mapPolicyRows = (rows: any[]): PolicyDoc[] =>
  rows.filter(Boolean).map(row => ({
    so: String(row.so || row.number || row.soHieu || ""),
    loai: String(row.loai || row.type || row.loaiVanBan || ""),
    coquan: String(row.coquan || row.authority || row.coQuan || ""),
    date: String(row.date || row.ngay || row.ngayBanHanh || ""),
    title: String(row.title || row.ten || row.tenVanBan || "Văn bản chính sách"),
    summary: String(row.summary || row.tomtat || row.tomTat || row.description || ""),
    linhvuc: String(row.linhvuc || row.field || row.linhVuc || ""),
    link: String(row.link || row.url || ""),
    pdf: String(row.pdf || row.pdfUrl || row.file || "")
  }));

const fallbackPolicyDocs = (): PolicyDoc[] =>
  legacyPolicyDocs.map((item: any) => ({
    so: String(item.so || item.number || ""),
    loai: String(item.loai || item.type || item.category || ""),
    coquan: String(item.coquan || item.authority || ""),
    date: String(item.date || item.publishedAt || ""),
    title: String(item.title || "Văn bản chính sách"),
    summary: String(item.summary || ""),
    linhvuc: String(item.linhvuc || item.field || item.category || ""),
    link: String(item.link || item.url || ""),
    pdf: String(item.pdf || item.pdfUrl || "")
  }));

const getRemoteNews = async (source?: string): Promise<AppsScriptNews[]> => {
  try {
    const rows = await requestAction("listNews", source ? { source } : {});
    const mapped = mapNewsRows(rows, source);
    if (!mapped.length) throw new Error("Apps Script không trả về bản tin");
    fallbackUsed = false;
    return dedupeNews(mapped);
  } catch (error) {
    console.warn("[newsService] Dùng dữ liệu tin dự phòng:", error instanceof Error ? error.message : error);
    fallbackUsed = true;
    return dedupeNews(fallbackNews(source));
  }
};

export const newsService = {
  async getNews(source?: NewsSource): Promise<AppsScriptNews[]> {
    if (isLegacyAppsScriptAuthMode()) return getRemoteNews(source);
    if (source) return getRemoteNews(source);
    return apiClient.get<News[]>("/api/news") as Promise<AppsScriptNews[]>;
  },

  async getLatestNews(): Promise<AppsScriptNews[]> {
    return getRemoteNews();
  },

  async getNewsBySource(source: NewsSource): Promise<AppsScriptNews[]> {
    return getRemoteNews(source);
  },

  async getPolicyDocs(params: PolicySearchParams = {}): Promise<PolicyDoc[]> {
    try {
      const rows = await requestAction("searchDocs", {
        q: params.q || "",
        type: params.type || "all",
        range: params.range || "all",
        limit: params.limit ?? 20
      });
      const mapped = mapPolicyRows(rows);
      if (!mapped.length) throw new Error("Apps Script không trả về văn bản");
      fallbackUsed = false;
      return mapped;
    } catch (error) {
      console.warn("[newsService] Dùng dữ liệu văn bản dự phòng:", error instanceof Error ? error.message : error);
      fallbackUsed = true;
      const docs = fallbackPolicyDocs();
      const query = (params.q || "").trim().toLocaleLowerCase("vi");
      const filtered = query
        ? docs.filter(doc => `${doc.so} ${doc.title} ${doc.summary} ${doc.linhvuc}`.toLocaleLowerCase("vi").includes(query))
        : docs;
      return filtered.slice(0, params.limit ?? 20);
    }
  },

  wasFallbackUsed(): boolean {
    return fallbackUsed;
  },

  async getNewsById(id: string): Promise<News> {
    if (isLegacyAppsScriptAuthMode()) {
      const news = await this.getLatestNews();
      const item = news.find(entry => entry.id === id);
      if (!item) throw new Error("Không tìm thấy bản tin CDS legacy");
      return item;
    }
    return apiClient.get<News>(`/api/news/${id}`);
  },

  async createNews(data: Partial<News>): Promise<News> {
    return apiClient.post<News>("/api/news", data);
  },

  async updateNews(id: string, data: Partial<News>): Promise<News> {
    return apiClient.patch<News>(`/api/news/${id}`, data);
  },

  async deleteNews(id: string): Promise<{ message: string }> {
    return apiClient.delete<{ message: string }>(`/api/news/${id}`);
  }
};

export default newsService;
