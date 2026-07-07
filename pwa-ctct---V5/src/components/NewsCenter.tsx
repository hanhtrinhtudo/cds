import React, { useEffect, useMemo, useState } from "react";
import { News } from "../types";
import { ArrowLeft, Calendar, ExternalLink, FileText, Search, Share2, Sparkles, User } from "lucide-react";
import { AppsScriptNews, dedupeNews, newsService, PolicyDoc } from "../services/newsService";
import { NewsItem } from "./product";
import { AppContainer, AppPage, AppStack } from "./layout";
import { getNewsImageUrl } from "../utils/newsImage";

interface NewsCenterProps {
  news: News[];
  activeNewsArg: News | null;
  onClearNewsArg: () => void;
  onNavigate: (tab: string, arg?: any) => void;
}

const categories = [
  "Tin theo thời gian",
  "Tin trong ngày",
  "Tin chính trị ĐCSVN",
  "Chính sách mới",
  "Tra cứu văn bản chính sách"
] as const;

function NewsImage({ src, alt, className }: { src?: string; alt: string; className: string }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return (
      <div className={`${className} flex items-end bg-gradient-to-br from-red-700 via-red-900 to-red-950 p-4 text-white`}>
        <span className="text-sm font-bold">Tin tức và chính sách</span>
      </div>
    );
  }
  return <img src={src} alt={alt} className={className} loading="lazy" decoding="async" referrerPolicy="no-referrer" onError={() => setFailed(true)} />;
}

export default function NewsCenter({ news, activeNewsArg, onClearNewsArg, onNavigate }: NewsCenterProps) {
  const [selectedNews, setSelectedNews] = useState<AppsScriptNews | null>(activeNewsArg as AppsScriptNews | null);
  const [newsCategory, setNewsCategory] = useState<(typeof categories)[number]>("Tin theo thời gian");
  const [onlineNews, setOnlineNews] = useState<AppsScriptNews[]>(news as AppsScriptNews[]);
  const [loading, setLoading] = useState(false);
  const [fallback, setFallback] = useState(false);
  const [q, setQ] = useState("");
  const [type, setType] = useState("all");
  const [range, setRange] = useState("all");
  const [limit, setLimit] = useState(20);
  const [policyDocs, setPolicyDocs] = useState<PolicyDoc[]>([]);
  const [policyLoading, setPolicyLoading] = useState(false);

  useEffect(() => {
    if (activeNewsArg) setSelectedNews(activeNewsArg as AppsScriptNews);
  }, [activeNewsArg]);

  useEffect(() => {
    if (news.length) setOnlineNews(dedupeNews(news as AppsScriptNews[]));
  }, [news]);

  useEffect(() => {
    let active = true;
    if (news.length) return () => { active = false; };
    setLoading(true);
    newsService.getLatestNews()
      .then(items => {
        if (!active) return;
        setOnlineNews(dedupeNews(items));
        setFallback(newsService.wasFallbackUsed());
      })
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, []);

  const loadCategory = async (category: (typeof categories)[number]) => {
    setNewsCategory(category);
    if (category === "Tra cứu văn bản chính sách") return;
    setLoading(true);
    try {
      let items: AppsScriptNews[];
      let usedFallback = false;
      if (category === "Tin trong ngày") {
        items = await newsService.getNewsBySource("vnexpress");
        usedFallback = newsService.wasFallbackUsed();
      } else if (category === "Chính sách mới") {
        items = await newsService.getNewsBySource("chinhphu");
        usedFallback = newsService.wasFallbackUsed();
      } else if (category === "Tin chính trị ĐCSVN") {
        const activity = await newsService.getNewsBySource("dangcongsan.hoatdong");
        usedFallback = newsService.wasFallbackUsed();
        const building = await newsService.getNewsBySource("dangcongsan.xaydung");
        usedFallback = usedFallback || newsService.wasFallbackUsed();
        const seen = new Set<string>();
        items = [...activity, ...building].filter(item => {
          const key = item.link || item.title;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
      } else {
        items = await newsService.getLatestNews();
        usedFallback = newsService.wasFallbackUsed();
      }
      setOnlineNews(dedupeNews(items));
      setFallback(usedFallback);
    } finally {
      setLoading(false);
    }
  };

  const searchPolicy = async (event?: React.FormEvent) => {
    event?.preventDefault();
    setPolicyLoading(true);
    try {
      const docs = await newsService.getPolicyDocs({ q, type, range, limit });
      setPolicyDocs(docs);
      setFallback(newsService.wasFallbackUsed());
    } finally {
      setPolicyLoading(false);
    }
  };

  useEffect(() => {
    if (newsCategory === "Tra cứu văn bản chính sách" && policyDocs.length === 0) void searchPolicy();
    // The initial policy query runs only when the search tab is first opened.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newsCategory]);

  const displayedNews = useMemo(
    () => dedupeNews(onlineNews).sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()),
    [onlineNews]
  );

  const handleBackToList = () => {
    setSelectedNews(null);
    onClearNewsArg();
  };

  if (selectedNews) {
    const selectedImageUrl = getNewsImageUrl(selectedNews);
    return (
      <AppPage variant="plain" id="news-detail-view-layout">
        <AppContainer bleed>
          <AppStack gap="md" className="motion-fade-in">
        <div className="pixel-surface-flat flex min-h-11 items-center justify-between p-3">
          <button onClick={handleBackToList} className="flex min-h-11 items-center gap-1.5 text-xs font-extrabold text-red-800 hover:text-red-950 transition cursor-pointer">
            <ArrowLeft size={16} />
            <span>QUAY LẠI BẢN TIN</span>
          </button>
          <span className="text-caption text-[var(--app-color-text-muted)] font-extrabold uppercase tracking-wide">{selectedNews.category}</span>
        </div>

        <div className="pixel-surface overflow-hidden">
          <div className="h-36 bg-slate-900 relative">
            {selectedImageUrl ? (
              <NewsImage src={selectedImageUrl} alt={selectedNews.title} className="w-full h-full object-cover opacity-75" />
            ) : (
              <div className="w-full h-full flex items-end bg-gradient-to-br from-red-700 via-red-900 to-red-950 p-4 text-white">
                <p className="text-sm font-bold">Tin tức và chính sách</p>
              </div>
            )}
            <div className="absolute bottom-3 left-4 right-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-1 rounded-lg">
              <h1 className="text-xs font-extrabold text-white leading-snug">{selectedNews.title}</h1>
            </div>
          </div>

          <div className="p-3 space-y-3">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-caption text-[var(--app-color-text-muted)] pb-1 font-extrabold uppercase">
              <span className="flex items-center gap-1"><Calendar size={11} />{new Date(selectedNews.publishedAt).toLocaleString("vi-VN")}</span>
              <span className="flex items-center gap-1"><User size={11} />{selectedNews.source || "Ban Biên tập"}</span>
            </div>
            {selectedNews.summary && <p className="text-body-s font-bold text-[var(--app-color-text-secondary)] bg-slate-50 p-3 rounded-xl leading-relaxed">{selectedNews.summary}</p>}
            <div className="text-body-s text-[var(--app-color-text-secondary)] leading-relaxed whitespace-pre-line font-medium">{selectedNews.content || "Nội dung chi tiết được cung cấp tại nguồn tin."}</div>
            {selectedNews.link && (
              <a href={selectedNews.link} target="_blank" rel="noopener noreferrer" className="w-full py-2.5 bg-red-50 text-red-800 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 min-h-11">
                <ExternalLink size={13} /> Mở bài viết nguồn
              </a>
            )}
            <div className="pt-1 flex flex-col gap-1.5">
              <button onClick={() => onNavigate("aitutor", { title: `Góc nhìn bản tin: ${selectedNews.title}`, category: selectedNews.category, description: selectedNews.summary })} className="w-full py-2.5 bg-red-800 hover:bg-red-900 text-white font-extrabold text-xs rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer min-h-[44px]">
                <Sparkles size={13} className="text-yellow-300 fill-current" /> Trao đổi với AI Chính trị viên
              </button>
              <button type="button" onClick={() => void navigator.clipboard?.writeText(selectedNews.link || window.location.href)} className="w-full py-2.5 bg-white hover:bg-slate-50 text-[var(--app-color-text-secondary)] border border-[var(--app-color-border)] font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer min-h-11">
                <Share2 size={13} /> Sao chép liên kết bản tin
              </button>
            </div>
          </div>
        </div>
          </AppStack>
        </AppContainer>
      </AppPage>
    );
  }

  return (
    <AppPage variant="plain" id="news-center-tab-content">
      <AppContainer bleed>
        <AppStack gap="md">
      <div className="pixel-surface-flat space-y-1.5 p-2.5">
        <label className="text-caption font-extrabold uppercase tracking-wider text-[var(--app-color-text-muted)] pl-1">Tin tức và chính sách</label>
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {categories.map(category => (
            <button key={category} onClick={() => void loadCategory(category)} className={`px-3 py-1.5 rounded-full text-caption font-bold whitespace-nowrap shrink-0 transition cursor-pointer min-h-11 ${newsCategory === category ? "bg-red-800 text-white" : "bg-slate-50 text-[var(--app-color-text-muted)] hover:bg-slate-100"}`}>
              {category}
            </button>
          ))}
        </div>
      </div>

      {fallback && (
        <div role="status" className="bg-amber-50 rounded-2xl p-2.5 text-body-s font-bold text-amber-900">
          Không thể cập nhật tin tức mới. Đang hiển thị nội dung đã lưu.
        </div>
      )}

      {newsCategory === "Tra cứu văn bản chính sách" ? (
        <section className="space-y-3" aria-label="Tra cứu văn bản chính sách">
          <form onSubmit={searchPolicy} className="pixel-surface-flat space-y-2.5 p-3">
            <div className="flex items-center gap-2 text-sm font-extrabold text-red-900"><Search size={16} /> Tra cứu văn bản chính sách</div>
            <input value={q} onChange={event => setQ(event.target.value)} type="search" placeholder="Nhập số hoặc tên văn bản..." className="w-full min-h-11 rounded-xl border border-[var(--app-color-border)] px-3 text-xs outline-none focus:border-red-700" />
            <div className="grid grid-cols-2 gap-2">
              <select value={type} onChange={event => setType(event.target.value)} className="min-h-11 rounded-xl border border-[var(--app-color-border)] px-2 text-xs bg-white">
                <option value="all">Tất cả loại</option><option value="NGHI_DINH">Nghị định</option><option value="THONG_TU">Thông tư</option><option value="QUYET_DINH">Quyết định</option><option value="CONG_VAN">Công văn</option>
              </select>
              <select value={range} onChange={event => setRange(event.target.value)} className="min-h-11 rounded-xl border border-[var(--app-color-border)] px-2 text-xs bg-white">
                <option value="all">Tất cả thời gian</option><option value="month">30 ngày qua</option><option value="year">12 tháng qua</option>
              </select>
            </div>
            <div className="flex gap-2">
              <select aria-label="Số kết quả" value={limit} onChange={event => setLimit(Number(event.target.value))} className="min-h-11 rounded-xl border border-[var(--app-color-border)] px-2 text-xs bg-white">
                <option value={10}>10 kết quả</option><option value={20}>20 kết quả</option><option value={50}>50 kết quả</option>
              </select>
              <button disabled={policyLoading} type="submit" className="flex-1 min-h-11 rounded-xl bg-red-800 text-white text-xs font-extrabold disabled:opacity-60">{policyLoading ? "Đang tìm..." : "Tìm kiếm"}</button>
            </div>
          </form>

          <div className="space-y-2">
            {policyDocs.map((doc, index) => (
              <article key={`${doc.so}-${doc.link}-${index}`} className="pixel-surface-flat space-y-2 p-3">
                <div className="flex items-start gap-2"><FileText size={16} className="text-red-800 mt-0.5 shrink-0" /><h3 className="text-xs font-extrabold text-[var(--app-color-text-primary)] leading-snug">{doc.title}</h3></div>
                <div className="text-caption text-[var(--app-color-text-muted)] space-y-1">
                  <p><b>Số:</b> {doc.so || "—"} · <b>Loại:</b> {doc.loai || "—"}</p>
                  <p><b>Cơ quan:</b> {doc.coquan || "—"} · <b>Ngày:</b> {doc.date || "—"}</p>
                  <p><b>Lĩnh vực:</b> {doc.linhvuc || "—"}</p>
                </div>
                {doc.summary && <p className="text-body-s leading-relaxed text-[var(--app-color-text-secondary)]">{doc.summary}</p>}
                <div className="flex gap-2 pt-1">
                  {doc.link && <a href={doc.link} target="_blank" rel="noopener noreferrer" className="text-caption font-extrabold text-red-800 flex items-center gap-1"><ExternalLink size={11} /> Văn bản</a>}
                  {doc.pdf && <a href={doc.pdf} target="_blank" rel="noopener noreferrer" className="text-caption font-extrabold text-red-800 flex items-center gap-1"><FileText size={11} /> PDF</a>}
                </div>
              </article>
            ))}
            {!policyLoading && policyDocs.length === 0 && <div className="bg-white border border-dashed border-[var(--app-color-border)] rounded-2xl p-6 text-center text-xs text-[var(--app-color-text-muted)]">Không tìm thấy văn bản phù hợp.</div>}
          </div>
        </section>
      ) : (
        <div className="space-y-2" id="news-grid-list">
          {loading && <div className="pixel-surface-flat p-5 text-center text-xs text-[var(--app-color-text-muted)]">Đang tải tin tức...</div>}
          {!loading && displayedNews.map(item => (
            <NewsItem
              key={item.id}
              title={item.title}
              summary={item.summary}
              category={newsCategory}
              source={item.source}
              imageUrl={getNewsImageUrl(item)}
              publishedAt={new Date(item.publishedAt).toLocaleString("vi-VN")}
              onOpen={() => setSelectedNews(item)}
            />
          ))}
          {!loading && displayedNews.length === 0 && <div className="app-surface-soft p-5 text-center text-xs text-[var(--app-color-text-muted)]">Hiện chưa có tin tức trong chuyên mục này.</div>}
        </div>
      )}
        </AppStack>
      </AppContainer>
    </AppPage>
  );
}
