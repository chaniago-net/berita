import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  PlusCircle, 
  Trash2, 
  Edit3, 
  RotateCcw, 
  Check, 
  Eye, 
  Globe, 
  Sparkles, 
  X, 
  Search, 
  FileText, 
  Calendar, 
  User, 
  CheckCircle, 
  AlertCircle,
  HelpCircle,
  Video,
  Volume2
} from "lucide-react";
import { Article } from "../types";
import { PHOTO_ASSETS } from "../data";

interface CmsAdminProps {
  articles: Article[];
  onAddArticle: (updatedArticles: Article[]) => void;
  onResetToDefault: () => void;
  onNavigateToTab: (tab: "portal" | "lab") => void;
}

const CATEGORIES = [
  "Berita Regional",
  "Warta Kampus",
  "Opini",
  "Olahraga",
  "Seni Budaya",
  "Iptek"
];

export default function CmsAdmin({
  articles,
  onAddArticle,
  onResetToDefault,
  onNavigateToTab
}: CmsAdminProps) {
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Form states
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [author, setAuthor] = useState("");
  const [editor, setEditor] = useState("Tim Jurnalistik");
  const [category, setCategory] = useState("Berita Regional");
  const [region, setRegion] = useState("Bojonegoro");
  const [imageUrl, setImageUrl] = useState("");
  const [imageCaption, setImageCaption] = useState("");
  const [bullets, setBullets] = useState<string[]>(["", "", ""]);
  const [videoUrl, setVideoUrl] = useState("");
  const [audioUrl, setAudioUrl] = useState("");

  // SEO states
  const [slug, setSlug] = useState("");
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [metaKeywordsText, setMetaKeywordsText] = useState("");

  // Search keyword inside CMS table
  const [searchQuery, setSearchQuery] = useState("");

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // Helper to generate slug
  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^\w ]+/g, "")
      .replace(/ +/g, "-");
  };

  // Watch title to automatically suggest/pre-populate SEO fields on new articles
  useEffect(() => {
    if (isFormOpen && !selectedArticle) {
      if (title) {
        setSlug(generateSlug(title));
        if (!metaTitle) setMetaTitle(title.substring(0, 60));
        if (!metaDescription) {
          setMetaDescription(
            `Kabar aktual Bojonegoro: ${title.substring(0, 100)}... Baca liputan jurnalisme mahasiswa selengkapnya di UNUGIRI Terkini.`
          );
        }
      }
    }
  }, [title, isFormOpen, selectedArticle]);

  // Handle open form for brand-new article
  const handleOpenCreateForm = () => {
    setSelectedArticle(null);
    setTitle("");
    setBody("");
    setAuthor("");
    setEditor("Tim Redaktur Akademik");
    setCategory("Berita Regional");
    setRegion("Bojonegoro");
    setImageUrl(PHOTO_ASSETS[0].url);
    setImageCaption("KETERANGAN FOTO — Deskripsi rincian peristiwa liputan jurnalisme Bojonegoro.");
    setBullets(["", "", ""]);
    setVideoUrl("https://assets.mixkit.co/videos/preview/mixkit-heavy-rain-falls-on-window-pane-34063-large.mp4");
    setAudioUrl("");
    setSlug("");
    setMetaTitle("");
    setMetaDescription("");
    setMetaKeywordsText("Bojonegoro, Mahasiswa, UNUGIRI, Aktual");
    setIsFormOpen(true);
  };

  // Handle edit selected article
  const handleOpenEditForm = (art: Article) => {
    setSelectedArticle(art);
    setTitle(art.title);
    setBody(art.body);
    setAuthor(art.author);
    setEditor(art.editor || "Tim Redaktur Jurnalis");
    setCategory(art.category);
    setRegion(art.region);
    setImageUrl(art.imageUrl);
    setImageCaption(art.imageCaption);
    
    // safe bullet parsing
    let bList = ["", "", ""];
    if (art.bullets && art.bullets.length > 0) {
      bList = [art.bullets[0] || "", art.bullets[1] || "", art.bullets[2] || ""];
    }
    setBullets(bList);
    setVideoUrl(art.videoUrl || "");
    setAudioUrl(art.audioUrl || "");
    setSlug(art.slug || generateSlug(art.title));
    setMetaTitle(art.metaTitle || art.title);
    setMetaDescription(art.metaDescription || art.body.substring(0, 150));
    setMetaKeywordsText(art.metaKeywords ? art.metaKeywords.join(", ") : "Bojonegoro, UNUGIRI");
    setIsFormOpen(true);
  };

  // Save / submit form
  const handleSaveArticle = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !body.trim() || !author.trim()) {
      alert("Harap lengkapi Judul, Isi Berita, dan Nama Reporter.");
      return;
    }

    const keywordsArray = metaKeywordsText
      .split(",")
      .map((k) => k.trim())
      .filter((k) => k.length > 0);

    const safeSlug = slug.trim() ? slug.trim() : generateSlug(title);

    const cleanBullets = bullets.filter((b) => b.trim().length > 0);

    if (selectedArticle) {
      // Edit existing article in the local list
      const updatedList = articles.map((art) => {
        if (art.id === selectedArticle.id) {
          return {
            ...art,
            title,
            body,
            author,
            editor,
            category,
            region,
            imageUrl,
            imageCaption,
            bullets: cleanBullets.length > 0 ? cleanBullets : undefined,
            videoUrl,
            audioUrl,
            slug: safeSlug,
            metaTitle,
            metaDescription,
            metaKeywords: keywordsArray
          };
        }
        return art;
      });
      onAddArticle(updatedList);
      triggerToast("✔️ Artikel berhasil diperbarui secara permanen!");
    } else {
      // Create a new article
      const newId = `custom_${Date.now()}`;
      const now = new Date();
      
      const formattedDate = now.toLocaleDateString("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric"
      });
      
      const formattedTime = now.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        timeZoneName: "short"
      });

      const newArt: Article = {
        id: newId,
        title,
        body,
        author,
        editor,
        date: formattedDate,
        time: formattedTime,
        category,
        region,
        imageUrl,
        imageCaption,
        bullets: cleanBullets.length > 0 ? cleanBullets : undefined,
        cropZoom: 1.0,
        brightness: 100,
        contrast: 100,
        saturation: 100,
        hueRotate: 0,
        slug: safeSlug,
        videoUrl,
        audioUrl,
        metaTitle,
        metaDescription,
        metaKeywords: keywordsArray,
        isCustomEdited: true,
        evaluationNote: "- **Format Baru**: Ditulis langsung dari CMS Admin Redaksi.\n- **Keseragaman**: Sesuai tata tertulis EYD standar."
      };

      onAddArticle([newArt, ...articles]);
      triggerToast("✔️ Artikel Baru berhasil ditambahkan ke jajaran publikasi portal!");
    }

    setIsFormOpen(false);
  };

  // Delete article
  const handleDeleteArticle = (id: string, event: React.MouseEvent) => {
    event.stopPropagation();
    if (articles.length <= 1) {
      alert("Gagal menghapus! Setidaknya harus ada 1 berita aktif di basis data agar portal tidak runtuh.");
      return;
    }
    if (confirm("Apakah Anda yakin ingin menghapus artikel ini dari sistem penerbitan? Tindakan ini tidak dapat dibatalkan.")) {
      const filtered = articles.filter((a) => a.id !== id);
      onAddArticle(filtered);
      triggerToast("🗑️ Artikel resmi dieliminasi dari sistem.");
    }
  };

  // Filter articles list
  const filteredArticles = articles.filter((art) => {
    const q = searchQuery.toLowerCase();
    return (
      art.title.toLowerCase().includes(q) ||
      art.body.toLowerCase().includes(q) ||
      art.author.toLowerCase().includes(q) ||
      art.category.toLowerCase().includes(q)
    );
  });

  // Real-time SEO Scoring & feedback
  const getSeoScores = () => {
    let score = 100;
    const errors: string[] = [];

    // Title Length
    if (metaTitle.length < 30) {
      score -= 20;
      errors.push("Meta Title terlalu pendek (kurang dari 30 karakter).");
    } else if (metaTitle.length > 65) {
      score -= 15;
      errors.push("Meta Title terlalu panjang (lebih dari 65 karakter, akan terpotong di Google).");
    }

    // Description Length
    if (metaDescription.length < 80) {
      score -= 25;
      errors.push("Meta Description terlalu pendek. Tulis minimal 80 karakter untuk memikat pembaca.");
    } else if (metaDescription.length > 160) {
      score -= 15;
      errors.push("Meta Description terlalu panjang (melebihi 160 karakter batas maksimal Google snippet).");
    }

    // Slug checks
    if (!slug || slug.trim().length < 5) {
      score -= 20;
      errors.push("Slug tidak boleh kosong.");
    } else if (/[A-Z]/.test(slug) || /\s/.test(slug)) {
      score -= 15;
      errors.push("Slug harus menggunakan huruf kecil dan menggunakan tanda hubung - tanpa spasi.");
    }

    // Keyword density simulator
    const keywords = metaKeywordsText.split(",").map(k => k.trim().toLowerCase());
    if (keywords.length < 3) {
      score -= 10;
      errors.push("Tuliskan minimal 3 kata kunci relevan dipisah koma.");
    }

    return {
      score: Math.max(0, score),
      errors
    };
  };

  const seoRating = getSeoScores();

  return (
    <div className="min-h-screen bg-[#fafbfc] text-slate-900 font-sans selection:bg-[#10b981]/20 selection:text-slate-900">
      {/* Toast message wrapper */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed bottom-6 right-6 z-50 bg-[#0b1712] border border-[#10b981]/30 text-[#10b981] py-3.5 px-6 rounded-xl shadow-2xl flex items-center gap-3"
          >
            <div className="h-2 w-2 rounded-full bg-[#10b981] animate-ping"></div>
            <span className="text-sm font-black tracking-wide font-sans uppercase">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-neutral-200/80 px-4 sm:px-6 py-4 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.05)]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h1 
              onClick={() => onNavigateToTab("portal")}
              className="text-xl sm:text-2xl font-sans font-black italic tracking-tight leading-none text-neutral-900 uppercase select-none cursor-pointer"
            >
              unugiri<span className="text-[#10b981] font-sans font-extrabold not-italic text-xl">.terkini</span>
              <span className="text-[9px] bg-emerald-600/10 text-emerald-600 px-2.5 py-0.5 border border-emerald-500/20 rounded-md uppercase font-sans tracking-wide font-bold ml-2.5 inline-block align-middle">DAPUR REDAKSI</span>
            </h1>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={onResetToDefault}
              className="py-2 px-3.5 bg-neutral-100 hover:bg-neutral-200 rounded-xl border border-neutral-200 hover:border-neutral-300 text-neutral-600 font-bold text-xs uppercase tracking-wider transition-all duration-200 cursor-pointer flex items-center gap-2"
              title="Reset data ke bawaan semula"
            >
              <RotateCcw className="h-3.5 w-3.5 text-red-500" />
              <span>Reset Default</span>
            </button>

            <button
              onClick={() => onNavigateToTab("portal")}
              className="py-2 px-4 bg-[#10b981] hover:bg-emerald-600 rounded-xl text-white font-black text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
            >
              <Globe className="h-3.5 w-3.5" />
              <span>Lihat Portal</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main CMS Layout Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        
        {/* Navigation Info */}
        <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm">
          <div>
            <h2 className="text-sm font-black uppercase text-emerald-600 tracking-wider">Modul Management & Desentralisasi Berita</h2>
            <p className="text-xs text-neutral-500">Gunakan dasbor ini untuk menambah rilis pers, mengedit naskah liputan, dan memeriksa rasio SEO.</p>
          </div>
          <button
            onClick={handleOpenCreateForm}
            className="w-full sm:w-auto bg-[#10b981] hover:bg-emerald-600 text-white font-black text-xs uppercase tracking-widest py-2.5 px-5 rounded-xl transition-all duration-250 flex items-center justify-center gap-2 cursor-pointer shadow active:scale-95"
            id="btn-cms-create"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Tulis rilis Pers baru</span>
          </button>
        </div>

        {/* Search and stats bar */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Quick search input */}
          <div className="relative md:col-span-2">
            <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Cari berita berdasarkan judul, jurnalis, isi berita di tabel..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-neutral-250 rounded-xl py-2.5 pl-10 pr-4 text-xs font-sans text-neutral-800 placeholder-neutral-400 focus:outline-none focus:border-[#10b981] focus:ring-1 focus:ring-[#10b981]/15 shadow-sm"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery("")} 
                className="absolute right-3.5 top-1/2 transform -translate-y-1/2 text-neutral-400 hover:text-neutral-700"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="bg-white p-3 rounded-xl border border-neutral-250 flex items-center justify-between text-xs font-sans text-neutral-500 px-4 shadow-sm">
            <span>TOTAL AKTIF:</span>
            <span className="text-emerald-700 font-bold text-sm bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-100">{articles.length} ARTIKEL</span>
          </div>
        </div>

        {/* CMS Table / Grid */}
        <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-neutral-50 border-b border-neutral-200 text-[10px] font-black text-neutral-500 tracking-wider font-sans uppercase">
                  <th className="py-4 px-5">INFO ARTIKEL</th>
                  <th className="py-4 px-5">REPORTER & EDITOR</th>
                  <th className="py-4 px-5">KATEGORI & REGION</th>
                  <th className="py-4 px-5">WAKTU TERBIT</th>
                  <th className="py-4 px-5">MULTIMEDIA</th>
                  <th className="py-4 px-5 text-right">AKSI ADMINISTRASI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 text-xs">
                {filteredArticles.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-neutral-400 font-sans">
                      🚨 Tidak ada rilis artikel ditemukan yang sesuai sandi kata pencarian Anda.
                    </td>
                  </tr>
                ) : (
                  filteredArticles.map((art) => (
                    <tr 
                      key={art.id} 
                      className="hover:bg-neutral-50/50 transition-colors duration-150 cursor-pointer"
                      onClick={() => handleOpenEditForm(art)}
                    >
                      {/* Title Info */}
                      <td className="py-4 px-5 max-w-[280px]">
                        <div className="space-y-1.5">
                          <h4 className="font-sans italic font-bold text-neutral-900 hover:text-[#10b981] text-sm leading-snug line-clamp-2">
                            {art.title}
                          </h4>
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] font-sans bg-neutral-100 text-neutral-600 px-2 py-0.5 border border-neutral-200 rounded font-bold">
                              /{art.slug || generateSlug(art.id)}
                            </span>
                            {art.isCustomEdited && (
                              <span className="text-[8px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 border border-emerald-100 rounded font-bold uppercase tracking-wider font-sans">
                                QC Lolos
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Author */}
                      <td className="py-4 px-5 text-neutral-800 font-sans">
                        <div className="space-y-1 text-[11px]">
                          <p className="font-bold text-neutral-900 flex items-center gap-1.5">
                            <User className="h-3 w-3 text-neutral-450" />
                            <span>{art.author}</span>
                          </p>
                          <p className="text-neutral-500 italic text-[10px]">Ed: {art.editor}</p>
                        </div>
                      </td>

                      {/* Category & Region */}
                      <td className="py-4 px-5">
                        <div className="space-y-1.5">
                          <span className="inline-block text-[10px] font-black uppercase tracking-wider bg-neutral-100 border border-neutral-200 text-amber-700 px-2 py-0.5 rounded-md">
                            {art.category}
                          </span>
                          <span className="block text-[10px] text-neutral-500 font-sans italic">
                            Kab. {art.region}
                          </span>
                        </div>
                      </td>

                      {/* Publish Date */}
                      <td className="py-4 px-5 text-neutral-550 font-sans text-[10px]">
                        <div className="space-y-1">
                          <p className="flex items-center gap-1 text-neutral-800 font-semibold">
                            <Calendar className="h-3 w-3 text-neutral-450" />
                            <span>{art.date}</span>
                          </p>
                          <p className="text-neutral-500 pr-2 pl-4">{art.time}</p>
                        </div>
                      </td>

                      {/* Multimedia supports */}
                      <td className="py-4 px-5">
                        <div className="flex flex-col gap-1.5 font-sans text-[9px] text-neutral-500">
                          <span className="flex items-center gap-1">
                            <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full"></span>
                            <span>Gambar: Ya</span>
                          </span>
                          {art.videoUrl ? (
                            <span className="flex items-center gap-1 text-emerald-600 font-bold">
                              <Video className="h-3 w-3 inline text-emerald-500" />
                              <span>TV Broadcast</span>
                            </span>
                          ) : (
                            <span className="text-neutral-400">Tanpa Video</span>
                          )}
                          {art.audioUrl || true ? (
                            <span className="flex items-center gap-1 text-[#10b981] font-bold">
                              <Volume2 className="h-3 w-3 inline text-emerald-500" />
                              <span>AI Narator</span>
                            </span>
                          ) : (
                            <span className="text-neutral-400">Tanpa Narasi</span>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-5 text-right font-sans" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenEditForm(art)}
                            className="bg-neutral-100 hover:bg-neutral-200 border border-neutral-200 hover:border-neutral-300 text-neutral-600 p-2 rounded-xl transition-all cursor-pointer"
                            title="Edit isi naskah & SEO"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={(e) => handleDeleteArticle(art.id, e)}
                            className="bg-red-50 hover:bg-red-500 border border-red-200 hover:border-red-500 text-red-500 hover:text-white p-2 rounded-xl transition-all cursor-pointer"
                            title="Hapus berita"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* CMS Full-featured Form Overlay Modal */}
        <AnimatePresence>
          {isFormOpen && (
            <div className="fixed inset-0 z-50 overflow-y-auto bg-neutral-900/40 backdrop-blur-xs flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="bg-white border border-neutral-200 w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col"
              >
                {/* Form Header */}
                <div className="bg-neutral-50 border-b border-neutral-200 px-6 py-4 flex items-center justify-between shadow-xs">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-[#10b981]" />
                    <h3 className="text-base font-black uppercase text-neutral-900 font-sans tracking-wider font-sans">
                      {selectedArticle ? "EDIT NASKAH & OPTIMASI PENERBITAN SIARAN" : "TULIS RILIS PERS & VALIDASI BARU"}
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    className="p-1.5 hover:bg-neutral-200 text-neutral-400 hover:text-neutral-700 rounded-xl transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Form Body - Dual Column with Scroll */}
                <form onSubmit={handleSaveArticle} className="p-6 overflow-y-auto space-y-8 flex-1 text-neutral-800">
                  
                  {/* Two columns divided into Naskah and SEO */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                    
                    {/* Left Column: Berita & Media */}
                    <div className="space-y-5">
                      <div className="flex items-center gap-2 border-b border-neutral-100 pb-2">
                        <span className="text-[11px] font-black tracking-widest text-[#10b981] uppercase block">
                          BAGIAN I: NASKAH UTAMA & MULTIMEDIA
                        </span>
                      </div>

                      {/* Judul */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-sans uppercase text-neutral-500 font-bold tracking-widest">
                          Judul Rilis Berita (EYD Kasus Huruf Baku) *
                        </label>
                        <input
                          type="text"
                          required
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          placeholder="Contoh: Diguyur Hujan Deras, Puluhan Sawah di Sukosewu Kebanjiran..."
                          className="w-full bg-neutral-50 border border-neutral-200 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs font-sans italic text-neutral-900 placeholder-neutral-400 focus:outline-none"
                        />
                      </div>

                      {/* Info Row: Category, Region */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] uppercase text-neutral-500 font-bold tracking-widest block">
                            Kategori Kabar
                          </label>
                          <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-2.5 py-2 text-xs text-neutral-800 uppercase tracking-wider focus:outline-none focus:border-emerald-500"
                          >
                            {CATEGORIES.map((cat) => (
                              <option key={cat} value={cat}>
                                {cat.toUpperCase()}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] uppercase text-neutral-500 font-bold tracking-widest block">
                            Cakupan Region
                          </label>
                          <input
                            type="text"
                            required
                            value={region}
                            onChange={(e) => setRegion(e.target.value)}
                            placeholder="Bojonegoro"
                            className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs text-neutral-800 focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                      </div>

                      {/* Info Row: Reporter, Editor */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] uppercase text-neutral-500 font-bold tracking-widest block">
                            Nama Reporter (Jurnalis) *
                          </label>
                          <input
                            type="text"
                            required
                            value={author}
                            onChange={(e) => setAuthor(e.target.value)}
                            placeholder="Contoh: Fathur Rohman"
                            className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs text-neutral-800 focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] uppercase text-neutral-500 font-bold tracking-widest block">
                            Editor Penanggung Jawab
                          </label>
                          <input
                            type="text"
                            required
                            value={editor}
                            onChange={(e) => setEditor(e.target.value)}
                            placeholder="Tim Jurnalistik Jurnalis"
                            className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs text-neutral-800 focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                      </div>

                      {/* Isi Naskah Berita */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center">
                          <label className="text-[10px] uppercase text-neutral-500 font-bold tracking-widest">
                            Badan Isi Berita (Gunakan \n\n untuk alinea baru) *
                          </label>
                          <span className="text-[9px] font-sans text-neutral-400">
                            {body.length} Karakter | {body.split(/\s+/).filter(Boolean).length} Kata
                          </span>
                        </div>
                        <textarea
                          required
                          rows={8}
                          value={body}
                          onChange={(e) => setBody(e.target.value)}
                          placeholder="BOJONEGORO — Awali kalimat berita formal dengan dateline kota besar capital..."
                          className="w-full bg-neutral-50 border border-neutral-200 focus:border-emerald-500 rounded-xl p-3 text-xs leading-relaxed font-sans text-neutral-800 placeholder-neutral-400 focus:outline-none"
                        />
                      </div>

                      {/* Media URL Coverage */}
                      <div className="space-y-3.5 bg-neutral-50 p-4 rounded-xl border border-neutral-200">
                        <span className="text-[9px] uppercase font-sans tracking-widest font-black text-emerald-600 block border-b border-neutral-200 pb-1.5">
                          TAUTAN MULTIMEDIA (INTEGRASI AUDIO/VIDEO SIMULASI)
                        </span>

                        <div className="space-y-1 px-1">
                          <label className="text-[9px] uppercase text-neutral-500 font-bold tracking-widest block">
                            Tautan Loop Video Jurnalisme (MP4)
                          </label>
                          <input
                            type="text"
                            value={videoUrl}
                            onChange={(e) => setVideoUrl(e.target.value)}
                            placeholder="Tinggalkan kosong untuk memakai simulator standar"
                            className="w-full bg-white border border-neutral-200 focus:border-emerald-500 rounded-lg px-3 py-1.5 text-xs text-emerald-600 font-bold font-sans focus:outline-none"
                          />
                          <p className="text-[9px] text-neutral-400 font-sans">
                            Contoh: URL mp4 awan badai atau laporan drone (akan diputar di panel TV simulator).
                          </p>
                        </div>

                        {/* Preset image selection */}
                        <div className="space-y-2 px-1 pt-1.5">
                          <label className="text-[9px] uppercase text-neutral-500 font-bold tracking-widest block">
                            Foto Sampul Utama (Hubungkan asset atau masukkan URL)
                          </label>
                          <input
                            type="text"
                            value={imageUrl}
                            onChange={(e) => setImageUrl(e.target.value)}
                            className="w-full bg-white border border-neutral-200 focus:border-emerald-500 rounded-lg px-3 py-1.5 text-xs text-neutral-800 font-sans focus:outline-none"
                          />
                          
                          <div className="flex gap-2.5 pt-1.5">
                            {PHOTO_ASSETS.map(photo => (
                              <button
                                key={photo.id}
                                type="button"
                                onClick={() => {
                                  setImageUrl(photo.url);
                                  setImageCaption(photo.defaultCaption);
                                }}
                                className={`h-11 w-16 rounded-lg overflow-hidden border shrink-0 relative transition-all ${imageUrl === photo.url ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'border-neutral-200 hover:border-neutral-400'}`}
                                title={photo.name}
                              >
                                <img src={photo.url} alt="" className="h-full w-full object-cover" />
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Drag and Drop File Upload for Custom Images */}
                        <div className="space-y-1.5 px-1 pt-1">
                          <label className="text-[9px] uppercase text-neutral-500 font-bold tracking-widest block">
                            Atau Unggah Foto Sendiri (Drag & Drop / Klik)
                          </label>
                          <div
                            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                            onDragLeave={() => setIsDragging(false)}
                            onDrop={(e) => {
                              e.preventDefault();
                              setIsDragging(false);
                              const file = e.dataTransfer.files?.[0];
                              if (file && file.type.startsWith("image/")) {
                                const reader = new FileReader();
                                reader.onload = (ev) => {
                                  setImageUrl(ev.target?.result as string);
                                  triggerToast("✔️ Foto berhasil diunggah!");
                                };
                                reader.readAsDataURL(file);
                              } else {
                                alert("Harap unggah berkas gambar!");
                              }
                            }}
                            onClick={() => document.getElementById("cms-file-upload")?.click()}
                            className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${
                              isDragging 
                                ? "border-emerald-500 bg-emerald-50" 
                                : "border-neutral-300 bg-neutral-100/30 hover:border-neutral-400 hover:bg-neutral-100/50"
                            }`}
                          >
                            <input
                              id="cms-file-upload"
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onload = (ev) => {
                                    setImageUrl(ev.target?.result as string);
                                    triggerToast("✔️ Foto berhasil diunggah!");
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                            />
                            <div className="flex flex-col items-center justify-center gap-1">
                              <span className="text-xs text-neutral-600 font-medium font-sans">
                                📁 Seret & Taruh foto di sini, atau <span className="text-emerald-600 font-bold underline">klik untuk mengunggah</span>
                              </span>
                              <span className="text-[9px] text-neutral-400 font-sans">Mendukung format PNG, JPG, JPEG, GIF, WEBP</span>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-1.5 px-1 pt-1">
                          <label className="text-[9px] uppercase text-neutral-500 font-bold tracking-widest block">
                            Keterangan Foto Jurnalistik (Caption & Kredit Foto)
                          </label>
                          <textarea
                            rows={2}
                            value={imageCaption}
                            onChange={(e) => setImageCaption(e.target.value)}
                            placeholder="Contoh: KONDISI BANJIR — Warga mengungsi di Bojonegoro..."
                            className="w-full bg-white border border-neutral-200 focus:border-emerald-500 rounded-lg p-2.5 text-xs text-neutral-800 focus:outline-none"
                          />
                        </div>
                      </div>

                      {/* Bullet points */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase text-neutral-500 font-bold tracking-widest">
                          3 Poin Ringkasan Berita Terpenting
                        </label>
                        {bullets.map((bullet, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <span className="w-5 text-right text-xs font-sans text-neutral-400">{idx + 1}.</span>
                            <input
                              type="text"
                              value={bullet}
                              onChange={(e) => {
                                const newBullets = [...bullets];
                                newBullets[idx] = e.target.value;
                                setBullets(newBullets);
                              }}
                              placeholder={`Poin penting nomor ${idx + 1}...`}
                              className="w-full bg-neutral-50 border border-neutral-200 focus:border-emerald-500 rounded-lg px-3 py-1.5 text-xs text-neutral-800 focus:outline-none"
                            />
                          </div>
                        ))}
                      </div>

                    </div>

                    {/* Right Column: SEO Optimizations Suite */}
                    <div className="space-y-6 bg-neutral-50/40 p-5 rounded-2xl border border-neutral-200 self-stretch">
                      <div className="flex items-center gap-2 border-b border-neutral-200 pb-2">
                        <Globe className="h-4 w-4 text-emerald-600" />
                        <span className="text-[11px] font-black tracking-widest text-[#10b981] uppercase block">
                          BAGIAN II: DOKUMEN SEO FRIENDLY METADATA
                        </span>
                      </div>

                      {/* SEO Score meter card */}
                      <div className="bg-emerald-50/50 border border-emerald-500/20 p-4 rounded-xl space-y-2">
                        <div className="flex justify-between items-center text-xs">
                          <div className="flex items-center gap-1.5 text-emerald-700 font-bold">
                            <Sparkles className="h-4 w-4 text-amber-500 animate-spin" />
                            <span>SKOR KEAHLIAN SEO SITEMAP</span>
                          </div>
                          <span className="font-sans text-lg font-black text-emerald-600">
                            {seoRating.score}/100 Poin
                          </span>
                        </div>

                        {/* Bar */}
                        <div className="w-full bg-neutral-200 h-2 rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all duration-300 ${seoRating.score > 80 ? 'bg-emerald-500' : seoRating.score > 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                            style={{ width: `${seoRating.score}%` }}
                          ></div>
                        </div>

                        {/* List of improvements */}
                        {seoRating.errors.length > 0 ? (
                          <div className="pt-2 text-[10px] font-sans text-amber-700 space-y-1">
                            <p className="font-bold underline uppercase">Saran Perbaikan SEO:</p>
                            <ul className="list-disc pl-4 space-y-1">
                              {seoRating.errors.map((err, i) => (
                                <li key={i}>{err}</li>
                              ))}
                            </ul>
                          </div>
                        ) : (
                          <p className="text-[10px] font-sans text-emerald-700 font-bold">
                            🎉 Sempurna! Skrip metadata Anda memenuhi standar indeks Google & SEO Friendly mutlak.
                          </p>
                        )}
                      </div>

                      {/* Slug */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center">
                          <label className="text-[10px] uppercase text-neutral-500 font-bold tracking-widest block">
                            SEO URL Slug (Hanya huruf kecil, tanda hubung - dan tanpa spasi) *
                          </label>
                          <button
                            type="button"
                            onClick={() => setSlug(generateSlug(title))}
                            className="text-[9px] font-bold text-emerald-650 underline hover:text-[#059669]"
                          >
                            Hasilkan ulang otomatis
                          </button>
                        </div>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[10px] font-sans text-neutral-450">
                            unugiri-terkini.id/read/
                          </span>
                          <input
                            type="text"
                            required
                            value={slug}
                            onChange={(e) => setSlug(e.target.value.replace(/\s+/g, '-').toLowerCase())}
                            placeholder="banjir-luapan-sungai-pacal-bojonegoro"
                            className="w-full bg-white border border-neutral-200 rounded-lg pl-[140px] pr-3 py-2 text-xs font-sans text-emerald-650 font-bold focus:outline-none"
                          />
                        </div>
                      </div>

                      {/* Meta Title */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center">
                          <label className="text-[10px] uppercase text-neutral-500 font-bold tracking-widest">
                            SEO Meta Title (Maks 65 char)
                          </label>
                          <span className={`text-[9px] font-sans ${metaTitle.length >= 30 && metaTitle.length <= 65 ? 'text-emerald-600 font-bold' : 'text-red-500'}`}>
                            {metaTitle.length} / 65 karakter
                          </span>
                        </div>
                        <input
                          type="text"
                          value={metaTitle}
                          onChange={(e) => setMetaTitle(e.target.value)}
                          placeholder="Masukkan judul pencarian Google..."
                          className="w-full bg-white border border-neutral-200 focus:border-emerald-500 rounded-lg px-3 py-2 text-xs text-neutral-800 focus:outline-none"
                        />
                      </div>

                      {/* Meta Description */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center">
                          <label className="text-[10px] uppercase text-neutral-500 font-bold tracking-widest">
                            Meta Description (Ringkasan penelusuran search engine, ideal: 120-160 char)
                          </label>
                          <span className={`text-[9px] font-sans ${metaDescription.length >= 120 && metaDescription.length <= 165 ? 'text-emerald-600 font-bold' : 'text-red-500'}`}>
                            {metaDescription.length} / 160 karakter
                          </span>
                        </div>
                        <textarea
                          rows={3}
                          value={metaDescription}
                          onChange={(e) => setMetaDescription(e.target.value)}
                          placeholder="Hujan intensitas tinggi akibatkan luapan Sungai Pacal di Sukosewu Bojonegoro..."
                          className="w-full bg-white border border-neutral-200 focus:border-emerald-500 rounded-lg p-3 text-xs text-neutral-800 focus:outline-none"
                        />
                      </div>

                      {/* Keywords */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase text-neutral-500 font-bold tracking-widest">
                          Meta Kata Kunci (Keyword Tags, Pisahkan dengan koma)
                        </label>
                        <input
                          type="text"
                          value={metaKeywordsText}
                          onChange={(e) => setMetaKeywordsText(e.target.value)}
                          placeholder="Bojonegoro, Banjir, Sungai Pacal, UNUGIRI Berita"
                          className="w-full bg-white border border-neutral-200 focus:border-emerald-500 rounded-lg px-3 py-2 text-xs text-emerald-650 font-bold font-sans focus:outline-none"
                        />
                      </div>

                      {/* Simulated Google Search Result Snippet */}
                      <div className="space-y-2 bg-white p-4 rounded-xl border border-neutral-200 shadow-xs">
                        <span className="text-[9px] uppercase font-sans tracking-widest text-[#10b981] font-black block border-b border-neutral-100 pb-1.5 flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          PRATINJAU GOOGLE SERP SNIPPET (GOOGLE SEARCH MOCKUP)
                        </span>

                        <div className="space-y-1.5 pt-1.5">
                          {/* Breadcrumb path */}
                          <div className="text-[11px] font-sans text-neutral-500 flex items-center gap-1 leading-none">
                            <span>https://unugiri-terkini.id</span>
                            <span className="text-neutral-300 text-[9px]">&gt;</span>
                            <span className="text-neutral-500 truncate">read</span>
                            <span className="text-neutral-300 text-[9px]">&gt;</span>
                            <span className="text-emerald-600 italic max-w-[120px] truncate">
                              {slug || "banjir-hujan-lebat"}
                            </span>
                          </div>

                          {/* Interactive Blue Title */}
                          <h4 className="text-lg leading-normal font-sans hover:underline text-[#1a0dab] font-medium cursor-pointer break-words line-clamp-1">
                            {metaTitle || title || "Judul Berita Ditampilkan di Google Penelusuran"}
                          </h4>

                          {/* Dynamic grey description snippets */}
                          <p className="text-[12px] leading-relaxed font-sans text-[#4d5156] break-all line-clamp-2">
                            <span className="text-neutral-400 font-sans tracking-wide">22 Mei 2026 — </span> 
                            {metaDescription || body.substring(0, 150) || "Draf laporan yang Anda rampungkan akan diinspeksi oleh mesin crawlers untuk menyajikan deskripsi cuplikan rilis jurnalistik terbaik di sini..."}
                          </p>
                        </div>
                      </div>

                    </div>

                  </div>

                  {/* Buttons */}
                  <div className="pt-5 border-t border-neutral-200 flex items-center justify-end gap-3.5">
                    <button
                      type="button"
                      onClick={() => setIsFormOpen(false)}
                      className="px-5 py-2.5 bg-neutral-100 hover:bg-neutral-200 rounded-xl border border-neutral-300 text-neutral-600 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2.5 bg-[#10b981] hover:bg-emerald-600 rounded-xl text-white text-xs font-black uppercase tracking-wider transition-all duration-250 cursor-pointer shadow active:scale-95"
                    >
                      {selectedArticle ? "💾 SIMPAN PERUBAHAN RILIS" : "📢 TERBITKAN SEKARANG"}
                    </button>
                  </div>

                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
