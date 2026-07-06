import React, { useEffect, useMemo, useState } from "react";
import { News } from "../types";
import { ArrowLeft, BookOpen, Calendar, ChevronRight, ExternalLink, FileText, Search, Share2, Sparkles, User } from "lucide-react";
import { AppsScriptNews, dedupeNews, newsService, PolicyDoc } from "../services/newsService";

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
    return <div className={`${className} flex items-center justify-center text-slate-400 bg-red-950/20`}><BookOpen size={24} /></div>;
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
    return (
      <div className="space-y-4 animate-fade-in" id="news-detail-view-layout">
        <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <button onClick={handleBackToList} className="flex items-center gap-1.5 text-xs font-black text-red-800 hover:text-red-950 transition cursor-pointer">
            <ArrowLeft size={16} />
            <span>QUAY LẠI BẢN TIN</span>
          </button>
          <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wide">{selectedNews.category}</span>
        </div>

        <div className="bg-white border border-slate-100 rounded-[24px] shadow-sm overflow-hidden">
          <div className="h-44 bg-slate-900 relative">
            {selectedNews.imageUrl ? (
              <NewsImage src={selectedNews.imageUrl} alt={selectedNews.title} className="w-full h-full object-cover opacity-75" />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 bg-red-950/40">
                <BookOpen size={36} />
                <p className="text-[10px] font-black mt-1.5 uppercase tracking-widest">Tin tức - chính sách</p>
              </div>
            )}
            <div className="absolute bottom-3 left-4 right-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-1 rounded-lg">
              <h1 className="text-xs font-black text-white leading-snug drop-shadow-md">{selectedNews.title}</h1>
            </div>
          </div>

          <div className="p-4 space-y-4">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[9px] text-slate-400 border-b border-slate-50 pb-3 font-extrabold uppercase">
              <span className="flex items-center gap-1"><Calendar size={11} />{new Date(selectedNews.publishedAt).toLocaleString("vi-VN")}</span>
              <span className="flex items-center gap-1"><User size={11} />{selectedNews.source || "Ban Biên tập"}</span>
            </div>
            {selectedNews.summary && <p className="text-[11px] font-bold text-slate-700 bg-slate-50 p-3.5 border-l-4 border-red-800 rounded-r-xl leading-relaxed">{selectedNews.summary}</p>}
            <div className="text-[11px] text-slate-600 leading-relaxed whitespace-pre-line font-medium">{selectedNews.content || "Nội dung chi tiết được cung cấp tại nguồn tin."}</div>
            {selectedNews.link && (
              <a href={selectedNews.link} target="_blank" rel="noopener noreferrer" className="w-full py-2.5 border border-red-200 text-red-800 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 min-h-[40px]">
                <ExternalLink size={13} /> Mở bài viết nguồn
              </a>
            )}
            <div className="pt-4 border-t border-slate-50 flex flex-col gap-2">
              <button onClick={() => onNavigate("aitutor", { title: `Góc nhìn bản tin: ${selectedNews.title}`, category: selectedNews.category, description: selectedNews.summary })} className="w-full py-3 bg-red-800 hover:bg-red-900 text-white font-extrabold text-xs rounded-xl transition shadow-sm flex items-center justify-center gap-1.5 cursor-pointer min-h-[44px]">
                <Sparkles size={13} className="text-yellow-300 fill-current" /> Phân tích cùng Trợ lý AI
              </button>
              <button type="button" onClick={() => void navigator.clipboard?.writeText(selectedNews.link || window.location.href)} className="w-full py-2.5 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer min-h-[40px]">
                <Share2 size={13} /> Sao chép liên kết bản tin
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4" id="news-center-tab-content">
      <div className="bg-white border border-slate-100 rounded-2xl p-3 shadow-sm space-y-1.5">
        <label className="text-[9px] font-black uppercase tracking-wider text-slate-400 pl-1">Tin tức và chính sách</label>
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {categories.map(category => (
            <button key={category} onClick={() => void loadCategory(category)} className={`px-3 py-1.5 rounded-full text-[10px] font-bold whitespace-nowrap border shrink-0 transition cursor-pointer min-h-[32px] ${newsCategory === category ? "bg-red-800 text-white border-red-800 shadow-sm" : "bg-slate-50 text-slate-500 border-slate-200/60 hover:bg-slate-100"}`}>
              {category}
            </button>
          ))}
        </div>
      </div>

      {fallback && (
        <div role="status" className="bg-amber-50 border border-amber-200 rounded-2xl p-3 text-[11px] font-bold text-amber-900">
          Không tải được dữ liệu trực tuyến, đang hiển thị dữ liệu dự phòng.
        </div>
      )}

      {newsCategory === "Tra cứu văn bản chính sách" ? (
        <section className="space-y-3" aria-label="Tra cứu văn bản chính sách">
          <form onSubmit={searchPolicy} className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-sm font-black text-red-900"><Search size={16} /> Tra cứu văn bản chính sách</div>
            <input value={q} onChange={event => setQ(event.target.value)} type="search" placeholder="Nhập số hoặc tên văn bản..." className="w-full min-h-[42px] rounded-xl border border-slate-200 px-3 text-xs outline-none focus:border-red-700" />
            <div className="grid grid-cols-2 gap-2">
              <select value={type} onChange={event => setType(event.target.value)} className="min-h-[42px] rounded-xl border border-slate-200 px-2 text-xs bg-white">
                <option value="all">Tất cả loại</option><option value="NGHI_DINH">Nghị định</option><option value="THONG_TU">Thông tư</option><option value="QUYET_DINH">Quyết định</option><option value="CONG_VAN">Công văn</option>
              </select>
              <select value={range} onChange={event => setRange(event.target.value)} className="min-h-[42px] rounded-xl border border-slate-200 px-2 text-xs bg-white">
                <option value="all">Tất cả thời gian</option><option value="month">30 ngày qua</option><option value="year">12 tháng qua</option>
              </select>
            </div>
            <div className="flex gap-2">
              <select aria-label="Số kết quả" value={limit} onChange={event => setLimit(Number(event.target.value))} className="min-h-[42px] rounded-xl border border-slate-200 px-2 text-xs bg-white">
                <option value={10}>10 kết quả</option><option value={20}>20 kết quả</option><option value={50}>50 kết quả</option>
              </select>
              <button disabled={policyLoading} type="submit" className="flex-1 min-h-[42px] rounded-xl bg-red-800 text-white text-xs font-black disabled:opacity-60">{policyLoading ? "Đang tìm..." : "Tìm kiếm"}</button>
            </div>
          </form>

          <div className="space-y-3">
            {policyDocs.map((doc, index) => (
              <article key={`${doc.so}-${doc.link}-${index}`} className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm space-y-2">
                <div className="flex items-start gap-2"><FileText size={16} className="text-red-800 mt-0.5 shrink-0" /><h3 className="text-xs font-black text-slate-800 leading-snug">{doc.title}</h3></div>
                <div className="text-[10px] text-slate-500 space-y-1">
                  <p><b>Số:</b> {doc.so || "—"} · <b>Loại:</b> {doc.loai || "—"}</p>
                  <p><b>Cơ quan:</b> {doc.coquan || "—"} · <b>Ngày:</b> {doc.date || "—"}</p>
                  <p><b>Lĩnh vực:</b> {doc.linhvuc || "—"}</p>
                </div>
                {doc.summary && <p className="text-[11px] leading-relaxed text-slate-600">{doc.summary}</p>}
                <div className="flex gap-2 pt-1">
                  {doc.link && <a href={doc.link} target="_blank" rel="noopener noreferrer" className="text-[10px] font-black text-red-800 flex items-center gap-1"><ExternalLink size={11} /> Văn bản</a>}
                  {doc.pdf && <a href={doc.pdf} target="_blank" rel="noopener noreferrer" className="text-[10px] font-black text-red-800 flex items-center gap-1"><FileText size={11} /> PDF</a>}
                </div>
              </article>
            ))}
            {!policyLoading && policyDocs.length === 0 && <div className="bg-white border border-dashed border-slate-200 rounded-2xl p-6 text-center text-xs text-slate-500">Không tìm thấy văn bản phù hợp.</div>}
          </div>
        </section>
      ) : (
        <div className="space-y-3" id="news-grid-list">
          {loading && <div className="bg-white rounded-2xl p-5 text-center text-xs text-slate-500">Đang tải tin trực tuyến...</div>}
          {!loading && displayedNews.map(item => (
            <article key={item.id} onClick={() => setSelectedNews(item)} className="bg-white border border-slate-100 rounded-[24px] shadow-sm overflow-hidden hover:border-red-200 transition cursor-pointer active:scale-99">
              <div className="h-32 bg-slate-950 relative">
                <NewsImage src={item.imageUrl} alt={item.title} className="w-full h-full object-cover opacity-75" />
                <span className="absolute top-3 left-3 px-2 py-0.5 bg-red-800 text-white font-black rounded-full text-[8px] uppercase tracking-wide shadow-sm">{newsCategory}</span>
              </div>
              <div className="p-4 space-y-1">
                <p className="text-[8px] text-slate-400 font-extrabold uppercase font-mono">{new Date(item.publishedAt).toLocaleString("vi-VN")} {item.source ? `· ${item.source}` : ""}</p>
                <h4 className="text-xs font-black text-slate-800 line-clamp-2 leading-snug">{item.title}</h4>
                {item.summary && <p className="text-[10px] text-slate-500 line-clamp-2 leading-relaxed">{item.summary}</p>}
              </div>
              <div className="px-4 pb-3 pt-2 border-t border-slate-50 flex items-center justify-between text-[10px] font-black text-red-800"><span>ĐỌC BẢN TIN</span><ChevronRight size={12} /></div>
            </article>
          ))}
          {!loading && displayedNews.length === 0 && <div className="bg-white border border-dashed border-slate-200 rounded-[24px] p-6 text-center text-xs text-slate-500">Chưa có dữ liệu trong chuyên mục này.</div>}
        </div>
      )}
    </div>
  );
}
