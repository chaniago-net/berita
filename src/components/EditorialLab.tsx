import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  ArrowLeft, 
  Sparkles, 
  Edit3, 
  Image as ImageIcon, 
  CheckCircle, 
  RotateCcw, 
  HelpCircle,
  Sliders,
  Crop,
  Sun,
  Contrast,
  SlidersHorizontal,
  ChevronRight,
  TrendingUp,
  FileText,
  AlertTriangle,
  Flame,
  Phone,
  Laptop,
  Check,
  Award,
  Upload
} from "lucide-react";
import { PHOTO_ASSETS } from "../data";
import { Article } from "../types";

interface EditorialLabProps {
  currentArticleId: string;
  articles: Article[];
  onPublishNews: (updatedArticle: Article) => void;
  onNavigateBack: () => void;
}

// Simple helper to parse our backend's markdown notes into beautiful HTML lists
function parseSimpleMarkdown(markdownText: string) {
  if (!markdownText) return null;
  const lines = markdownText.split("\n");
  return (
    <ul className="space-y-2.5">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) return null;

        // Bullet list item check
        if (trimmed.startsWith("-") || trimmed.startsWith("*")) {
          let content = trimmed.substring(1).trim();
          // Check for bold notation **content**
          const boldRegex = /\*\*(.*?)\*\*/g;
          const parts = [];
          let lastIndex = 0;
          let match;

          while ((match = boldRegex.exec(content)) !== null) {
            if (match.index > lastIndex) {
              parts.push({ text: content.substring(lastIndex, match.index), bold: false });
            }
            parts.push({ text: match[1], bold: true });
            lastIndex = boldRegex.lastIndex;
          }
          if (lastIndex < content.length) {
            parts.push({ text: content.substring(lastIndex), bold: false });
          }

          if (parts.length === 0) parts.push({ text: content, bold: false });

          return (
            <li key={idx} className="flex items-start gap-2 text-xs sm:text-sm text-neutral-700">
              <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0"></span>
              <span className="leading-relaxed">
                {parts.map((p, pIdx) => (
                  <span key={pIdx} className={p.bold ? "font-bold text-neutral-900" : ""}>
                    {p.text}
                  </span>
                ))}
              </span>
            </li>
          );
        }
        return (
          <p key={idx} className="text-xs sm:text-sm text-neutral-700 leading-relaxed my-1">
            {trimmed}
          </p>
        );
      })}
    </ul>
  );
}

// Tips rotation for the loading screen
const JOURNALISM_TIPS = [
  "Rumus Jurnalistik Klasik: Gunakan struktur Piramida Terbalik (Inverted Pyramid) untuk menaruh fakta terpenting di baris teratas.",
  "Hindari kata kerja/sifat tidak baku dari reporter seperti 'bikin' (mengakibatkan), 'ngungsiin' (mengevakuasi), atau 'gampang' (mudah).",
  "PUEBI/EYD menggariskan nama kota (Bojonegoro), desa (Sukosewu, Klepek), serta nama lembaga diawali dengan huruf kapital murni.",
  "Caption karya foto jurnalistik wajib mengusung rumus 'Caption 5W+1H' ringkas dan menyertakan nama/jabatan reporter di penutup.",
  "Saat memotong foto (cropping), hilangkan bagian langit yang berlebihan untuk mengunci fokus mata audiens ke subjek utama banjir."
];

export default function EditorialLab({
  currentArticleId,
  articles,
  onPublishNews,
  onNavigateBack
}: EditorialLabProps) {
  
  // Find current article data
  const targetArticle = articles.find((a) => a.id === currentArticleId) || articles[0];

  const isPresetImage = PHOTO_ASSETS.some(p => p.url === targetArticle.imageUrl);
  const initialCustomPhoto = !isPresetImage && targetArticle.imageUrl 
    ? { url: targetArticle.imageUrl, name: "Foto Unggahan Kustom" }
    : null;

  const [customPhoto, setCustomPhoto] = useState<{ url: string; name: string } | null>(initialCustomPhoto);
  const [selectedPhotoId, setSelectedPhotoId] = useState<string>(() => {
    if (!isPresetImage && targetArticle.imageUrl) {
      return "custom_uploaded";
    }
    return PHOTO_ASSETS.find(p => p.url === targetArticle.imageUrl)?.id || PHOTO_ASSETS[0].id;
  });

  const [activeStep, setActiveStep] = useState<"text" | "photo" | "publish">("text");

  // Text state
  const [draftText, setDraftText] = useState<string>(
    targetArticle.isCustomEdited && targetArticle.rawDraft ? targetArticle.rawDraft : PHOTO_ASSETS[0].defaultDraft
  );
  
  // Editorial adjustments
  const [newsTitle, setNewsTitle] = useState<string>(targetArticle.title);
  const [newsBody, setNewsBody] = useState<string>(targetArticle.body);
  const [newsCaption, setNewsCaption] = useState<string>(targetArticle.imageCaption);
  const [newsBullets, setNewsBullets] = useState<string[]>(targetArticle.bullets || []);
  const [newsEvaluation, setNewsEvaluation] = useState<string>(targetArticle.evaluationNote || "");
  const [hasRunAI, setHasRunAI] = useState<boolean>(targetArticle.isCustomEdited === true);

  // Photo state
  const [cropZoom, setCropZoom] = useState<number>(targetArticle.cropZoom);
  const [brightness, setBrightness] = useState<number>(targetArticle.brightness);
  const [contrast, setContrast] = useState<number>(targetArticle.contrast);
  const [saturation, setSaturation] = useState<number>(targetArticle.saturation);
  const [hueRotate, setHueRotate] = useState<number>(targetArticle.hueRotate);

  // AI loading support
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [tipIndex, setTipIndex] = useState<number>(0);
  const [aiError, setAiError] = useState<string | null>(null);

  // Toast notice
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [isDragging, setIsDragging] = useState<boolean>(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      handlePhotoFile(file);
    } else {
      showToast("Maaf, file harus berupa gambar format valid!");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handlePhotoFile(file);
    }
  };

  const handlePhotoFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setCustomPhoto({
        url: dataUrl,
        name: file.name
      });
      setSelectedPhotoId("custom_uploaded");
      showToast(`Foto kustom "${file.name}" berhasil dimuat! 📸`);
    };
    reader.readAsDataURL(file);
  };

  // Sync state if selected asset changes
  const handlePhotoAssetChange = (assetId: string) => {
    const asset = PHOTO_ASSETS.find(p => p.id === assetId);
    if (asset) {
      setSelectedPhotoId(assetId);
      setDraftText(asset.defaultDraft);
      setNewsTitle(asset.name + " - Draf");
      setNewsBody(asset.defaultDraft);
      setNewsCaption(asset.defaultCaption);
      setNewsBullets([]);
      setNewsEvaluation("");
      setHasRunAI(false);
      
      // Default photographic values
      setCropZoom(1.15);
      setBrightness(115);
      setContrast(110);
      setSaturation(100);
      setHueRotate(0);
    }
  };

  // Timer for tips on loading screen
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isAiLoading) {
      interval = setInterval(() => {
        setTipIndex((prev) => (prev + 1) % JOURNALISM_TIPS.length);
      }, 4000);
    }
    return () => clearInterval(interval);
  }, [isAiLoading]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // call server API endpoint to run copyediting
  const handleOptimizeWithAI = async () => {
    setIsAiLoading(true);
    setAiError(null);
    setTipIndex(0);

    try {
      const response = await fetch("/api/gemini/editor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ draft: draftText }),
      });

      if (!response.ok) {
        throw new Error("Respon server bermasalah saat mengakses Gemini.");
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      setNewsTitle(data.title || "");
      setNewsBody(data.body || "");
      setNewsCaption(data.caption || "");
      setNewsEvaluation(data.evaluation || "");
      setNewsBullets(data.bullets || []);
      setHasRunAI(true);
      showToast("Draf berita dikaji & diperbaiki secara tuntas oleh AI Kantor Redaksi! ✨");
    } catch (err: any) {
      console.error(err);
      setAiError(err.message || "Gagal menghubungkan ke server model.");
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleResetAdjustments = () => {
    setCropZoom(1.15);
    setBrightness(115);
    setContrast(110);
    setSaturation(100);
    setHueRotate(0);
    showToast("Parameter visual foto dikembalikan ke draf default.");
  };

  const handlePublish = () => {
    // Build updated article model
    const imgUrlToPublish = (selectedPhotoId === "custom_uploaded" && customPhoto) 
      ? customPhoto.url 
      : (PHOTO_ASSETS.find((p) => p.id === selectedPhotoId)?.url || targetArticle.imageUrl);

    const updatedArticle: Article = {
      id: targetArticle.id,
      title: newsTitle,
      body: newsBody,
      author: targetArticle.author, // keep original author mapping
      editor: "Editor Lab & Gemini AI",
      date: "Kamis, 21 Mei 2026",
      time: "18:30 WIB",
      category: "Berita Regional",
      region: "Bojonegoro",
      imageUrl: imgUrlToPublish,
      imageCaption: newsCaption,
      bullets: newsBullets,
      
      cropZoom: cropZoom,
      brightness: brightness,
      contrast: contrast,
      saturation: saturation,
      hueRotate: hueRotate,
      
      rawDraft: draftText,
      evaluationNote: newsEvaluation,
      isCustomEdited: true
    };

    onPublishNews(updatedArticle);
  };

  const currentPhotoAsset = (selectedPhotoId === "custom_uploaded" && customPhoto)
    ? {
        id: "custom_uploaded",
        name: customPhoto.name,
        url: customPhoto.url,
        description: "Foto kustom yang Anda unggah secara langsung.",
        defaultCaption: newsCaption || "DOKUMENTASI PRIBADI — Foto kustom yang diunggah secara mandiri oleh redaktur.",
        defaultDraft: draftText
      }
    : (PHOTO_ASSETS.find(p => p.id === selectedPhotoId) || PHOTO_ASSETS[0]);

  return (
    <div className="min-h-screen bg-[#fafbfc] text-neutral-900 font-sans selection:bg-[#10b981]/20 selection:text-neutral-900">
      
      {/* Toast Notifier */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white font-bold text-xs sm:text-sm px-6 py-3.5 rounded-full shadow-2xl flex items-center gap-2 border border-emerald-500"
          >
            <CheckCircle className="h-5 w-5 animate-pulse shrink-0" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Editor Header */}
      <header className="sticky top-0 z-45 bg-white border-b border-neutral-200 px-4 sm:px-6 lg:px-8 py-4 shadow-sm text-neutral-900">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onNavigateBack}
              className="p-2 bg-neutral-100 hover:bg-neutral-200 active:bg-neutral-300 rounded text-neutral-600 hover:text-neutral-900 transition-all cursor-pointer border border-neutral-200"
              id="btn-back-to-portal"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <h1 
                onClick={onNavigateBack}
                className="text-xl sm:text-2xl font-sans font-black italic tracking-tight leading-none text-neutral-900 uppercase select-none cursor-pointer"
              >
                unugiri<span className="text-[#10b981] font-sans font-extrabold not-italic text-xl">.terkini</span>
                <span className="text-[9px] bg-emerald-600/10 text-emerald-600 px-2.5 py-0.5 rounded-sm uppercase font-sans tracking-wider font-bold border border-emerald-500/20 ml-2 inline-block">DAPUR REDAKSI</span>
              </h1>
              <p className="text-[10px] sm:text-xs text-neutral-500 font-sans tracking-tight mt-1">
                Ruang Praktek Tata Penulisan Baku & Penyelarasan Jurnalistik Kampus
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-neutral-100 p-1.5 rounded border border-neutral-200">
            <button
              onClick={onNavigateBack}
              className="text-xs font-black tracking-wider uppercase px-4 py-2 text-neutral-700 hover:text-neutral-950 hover:bg-neutral-200 rounded transition-all cursor-pointer font-sans"
            >
              🔙 KEMBALI KE PORTAL UTAMA
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Step Guide Wizard */}
        <div className="mb-8 grid grid-cols-3 max-w-2xl mx-auto bg-neutral-100/80 rounded-xl p-1.5 border border-neutral-200 shadow-sm flex-wrap">
          <button
            onClick={() => setActiveStep("text")}
            className={`flex items-center justify-center gap-2 py-2.5 px-1.5 text-center text-xs font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer ${
              activeStep === "text"
                ? "bg-red-650 text-white shadow-md text-slate-100"
                : "text-neutral-500 hover:text-neutral-800"
            }`}
          >
            <Edit3 className="h-4 w-4 shrink-0" />
            <span className="hidden sm:inline">1. Penulisan</span>
            <span className="sm:hidden">1. Teks</span>
          </button>
          <button
            onClick={() => setActiveStep("photo")}
            className={`flex items-center justify-center gap-2 py-2.5 px-1.5 text-center text-xs font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer ${
              activeStep === "photo"
                ? "bg-[#10b981] text-white shadow-md text-slate-100"
                : "text-neutral-500 hover:text-neutral-800"
            }`}
          >
            <ImageIcon className="h-4 w-4 shrink-0" />
            <span className="hidden sm:inline">2. Tata Foto</span>
            <span className="sm:hidden">2. Foto</span>
          </button>
          <button
            onClick={() => setActiveStep("publish")}
            className={`flex items-center justify-center gap-2 py-2.5 px-1.5 text-center text-xs font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer ${
              activeStep === "publish"
                ? "bg-emerald-600 text-white shadow-md text-slate-100"
                : "text-neutral-500 hover:text-neutral-800"
            }`}
          >
            <CheckCircle className="h-4 w-4 shrink-0" />
            <span className="hidden sm:inline">3. Terbitkan</span>
            <span className="sm:hidden">3. Terbit</span>
          </button>
        </div>

        {/* Step Content Panels */}
        <div className="min-h-[500px]">
            {/* STEP 1: TEXT ANALYSIS */}
          {activeStep === "text" && (
            <div className="space-y-6">
              
              {/* Asset Selection Bar */}
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-neutral-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                  <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-widest font-sans mb-1">
                    Skenario Studi Kasus Jurnalistik
                  </h4>
                  <p className="text-xs text-neutral-600 leading-relaxed max-w-xl">
                    Pilih salah satu skenario liputan mahasiswa di bawah ini untuk memuat foto mentah dan naskah buram yang perlu diselaraskan.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2.5 w-full md:w-auto">
                  {PHOTO_ASSETS.map((asset) => (
                    <button
                      key={asset.id}
                      onClick={() => handlePhotoAssetChange(asset.id)}
                      className={`flex-1 md:flex-initial text-xs font-bold px-3.5 py-2.5 rounded-xl border transition-all cursor-pointer ${
                        selectedPhotoId === asset.id
                          ? "bg-[#10b981] text-white border-emerald-600 shadow-md"
                          : "bg-neutral-100 text-neutral-700 border-neutral-200 hover:bg-neutral-200"
                      }`}
                    >
                      {asset.name}
                    </button>
                  ))}
                  {customPhoto && (
                    <button
                      onClick={() => setSelectedPhotoId("custom_uploaded")}
                      className={`flex-1 md:flex-initial text-xs font-bold px-3.5 py-2.5 rounded-xl border transition-all cursor-pointer ${
                        selectedPhotoId === "custom_uploaded"
                          ? "bg-emerald-600 text-white border-emerald-700 shadow-md"
                          : "bg-neutral-100 text-neutral-700 border-neutral-200 hover:bg-neutral-200"
                      }`}
                    >
                      📷 {customPhoto.name.substring(0, 15)}{customPhoto.name.length > 15 ? "..." : ""}
                    </button>
                  )}
                </div>
              </div>

              {/* Drag & Drop File Upload Section */}
              <div 
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => document.getElementById("editorial-fileupload-elem")?.click()}
                className={`bg-neutral-50 p-6 rounded-2xl border-2 border-dashed transition-all cursor-pointer text-center relative overflow-hidden ${
                  isDragging 
                    ? "border-emerald-500 bg-emerald-50 text-emerald-800 scale-[1.01]" 
                    : "border-neutral-300 hover:border-neutral-450 hover:bg-neutral-100/70 text-neutral-600"
                }`}
              >
                <input 
                  type="file" 
                  id="editorial-fileupload-elem"
                  accept="image/*"
                  className="hidden" 
                  onChange={handleFileChange}
                />
                <div className="flex flex-col items-center justify-center gap-2.5 max-w-lg mx-auto">
                  <div className="bg-neutral-100 p-3 rounded-full border border-neutral-250 shadow-inner">
                    <Upload className="h-5.5 w-5.5 text-emerald-600 animate-bounce" />
                  </div>
                  <div>
                    <h5 className="text-sm font-bold text-neutral-800 uppercase tracking-wider font-sans">
                      Unggah File Foto Anda Sendiri
                    </h5>
                    <p className="text-xs text-neutral-600 mt-1">
                      Seret & taruh naskah gambar/foto liputan di sini, atau <span className="text-emerald-600 font-bold underline">klik untuk menelusuri file</span> komputer Anda.
                    </p>
                    <p className="text-[10px] text-neutral-500 font-sans mt-1 uppercase tracking-widest leading-none">
                      Mendukung format PNG, JPG, JPEG, WEBP, GIF (Akan diolah seketika di Dapur Visual)
                    </p>
                  </div>
                </div>
              </div>

              {/* Grid Text Editorial */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* Drawer Mentah */}
                <div className="bg-white rounded-2xl border border-neutral-250 p-5 sm:p-6 shadow-sm flex flex-col justify-between">
                  <div className="space-y-3.5 w-full">
                    <div className="flex items-center justify-between">
                      <span className="text-red-650 text-xs font-bold flex items-center gap-1 font-sans uppercase tracking-widest">
                        <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />
                        ⚠️ Draf Mentah Reporter Magang
                      </span>
                      <span className="text-[10px] text-neutral-500 bg-neutral-100 px-2 py-1 rounded font-sans">
                        Karakter: {draftText.length}
                      </span>
                    </div>

                    <div className="text-xs bg-red-50 text-red-800 border border-red-200/60 p-3 rounded-xl flex items-start gap-2">
                      <HelpCircle className="h-4 w-4 shrink-0 text-red-500 mt-0.5" />
                      <p className="leading-relaxed">
                        Teks draf di bawah ini diringkas terburu-buru dengan banyak bahasa percakapan non-baku. Silakan ubah sesuka hati, lalu kirim ke AI Redaksi.
                      </p>
                    </div>

                    <div className="relative">
                      <textarea
                        value={draftText}
                        onChange={(e) => setDraftText(e.target.value)}
                        placeholder="Tulis draf kasar berita disini..."
                        rows={10}
                        className="w-full bg-neutral-50 text-neutral-850 p-4 rounded-xl border border-neutral-300 font-sans text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-emerald-500/25 focus:border-[#10b981] resize-none-important"
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-neutral-200 mt-4 flex items-center justify-between flex-wrap gap-3">
                    <div className="text-xs text-neutral-500 italic">
                      Linguistik: Slang Bojonegoroan & tidak terstruktur.
                    </div>
                    
                    <button
                      onClick={handleOptimizeWithAI}
                      disabled={isAiLoading || draftText.trim().length === 0}
                      className="w-full sm:w-auto bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 active:from-emerald-700 disabled:opacity-50 text-white font-bold text-xs sm:text-sm tracking-wide uppercase px-5 py-3 rounded-xl shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2 cursor-pointer border border-emerald-450"
                    >
                      <Sparkles className="h-4.5 w-4.5 animate-pulse text-yellow-300" />
                      <span>Optimasi & Penyelarasan AI ✨</span>
                    </button>
                  </div>
                </div>

                {/* Drawer Teks Hasil Pengkajian */}
                <div className="bg-white rounded-2xl border border-neutral-250 p-5 sm:p-6 shadow-sm flex flex-col justify-between">
                  <div className="space-y-4">
                    <span className="text-emerald-700 text-xs font-bold flex items-center gap-1 font-sans uppercase tracking-widest">
                      <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
                      ✅ Hasil Suntingan Redaktur Senior
                    </span>

                    {/* Loading Screen */}
                    {isAiLoading && (
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="bg-neutral-50/90 rounded-xl p-8 border border-neutral-200 flex flex-col items-center justify-center min-h-[320px] text-center space-y-6"
                      >
                        <div className="relative">
                          <div className="h-14 w-14 rounded-full border-4 border-neutral-200 border-t-emerald-600 animate-spin"></div>
                          <Sparkles className="h-6 w-6 text-yellow-500 absolute top-4 left-4 animate-ping" />
                        </div>
                        <div className="space-y-2 max-w-sm">
                          <p className="text-xs font-bold font-sans tracking-widest text-neutral-500 uppercase">
                            MENYELARASKAN NASKAH KASAR...
                          </p>
                          <p className="text-[11px] text-neutral-600 leading-relaxed italic">
                            &quot;{JOURNALISM_TIPS[tipIndex]}&quot;
                          </p>
                        </div>
                      </motion.div>
                    )}

                    {/* Error Screen */}
                    {aiError && !isAiLoading && (
                      <div className="bg-red-50 rounded-xl p-6 border border-red-200 border-dashed text-center space-y-4">
                        <AlertTriangle className="h-10 w-10 text-red-500 mx-auto" />
                        <div className="space-y-1">
                          <h4 className="text-sm font-bold text-red-700">Penyuntingan Gagal</h4>
                          <p className="text-xs text-neutral-600 leading-relaxed max-w-sm mx-auto">
                            Terjadi kendala teknis saat menghubungi Redaktur AI: {aiError}. Kami memfungsikan simulasi redaksi temporer. Silakan tekan tombol kembali.
                          </p>
                        </div>
                        <button
                          onClick={handleOptimizeWithAI}
                          className="text-xs font-bold bg-neutral-100 hover:bg-neutral-200 text-neutral-800 px-3.5 py-2 rounded-lg border border-neutral-350"
                        >
                          Coba Lagi
                        </button>
                      </div>
                    )}

                    {/* Standard Placeholder */}
                    {!hasRunAI && !isAiLoading && !aiError && (
                      <div className="bg-neutral-50 rounded-xl p-8 border border-neutral-200 border-dashed text-center py-20">
                        <FileText className="h-12 w-12 text-neutral-350 mx-auto mb-4" />
                        <h4 className="text-sm font-bold text-neutral-500 mb-1.5 font-sans">Menunggu Instruksi Optimasi</h4>
                        <p className="text-xs text-neutral-500 max-w-xs mx-auto leading-relaxed">
                          Tekan tombol <span className="text-[#10b981] font-bold">Optimasi & Penyelarasan AI</span> untuk mentransformasi draf mentah Anda ke format piramida terbalik dan EYD baku.
                        </p>
                      </div>
                    )}

                    {/* Clean Generated Output (Only when hasRunAI is true and loading is done) */}
                    {hasRunAI && !isAiLoading && !aiError && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="space-y-4 max-h-[380px] overflow-y-auto pr-1"
                      >
                        {/* Title and Body */}
                        <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-200 space-y-2">
                          <span className="text-[10px] font-sans font-bold text-neutral-500 bg-neutral-200 px-2 py-0.5 rounded tracking-widest uppercase">
                            JUDUL EDITORIAL:
                          </span>
                          <h3 className="font-sans text-sm sm:text-base font-extrabold text-neutral-900 leading-snug">
                            {newsTitle}
                          </h3>
                        </div>

                        <div className="bg-white text-neutral-800 p-4 rounded-xl shadow-inner text-xs sm:text-sm leading-relaxed max-h-[220px] overflow-y-auto font-sans text-justify space-y-3 font-normal border border-neutral-200/80">
                          <p className="news-body-editorial">
                            {newsBody.split("\n\n")[0]}
                          </p>
                          {newsBody.split("\n\n").slice(1).map((para, pIdx) => (
                            <p key={pIdx} className="news-body-editorial">
                              {para}
                            </p>
                          ))}
                        </div>

                        {/* Bullets */}
                        {newsBullets.length > 0 && (
                          <div className="bg-emerald-50/50 border border-emerald-500/20 p-3.5 rounded-xl space-y-2">
                            <span className="text-[10px] font-sans text-emerald-700 font-bold uppercase tracking-wider block">
                              3 POIN UTAMA RINGKASAN:
                            </span>
                            <ul className="space-y-1 text-xs text-neutral-700">
                              {newsBullets.map((bullet, bIdx) => (
                                <li key={bIdx} className="flex items-start gap-1.5">
                                  <span className="text-emerald-500 font-bold">•</span>
                                  <span>{bullet}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Educative Critique (Evaluation block) */}
                        {newsEvaluation && (
                          <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-200 space-y-3">
                            <h4 className="text-[10px] font-sans text-red-600 font-bold tracking-widest uppercase pb-1.5 border-b border-neutral-200 flex items-center gap-1.5">
                              <Award className="h-4 w-4 text-emerald-600" />
                              CATATAN EVALUASI REDAKSI (BAHAN AJAR KULIAH):
                            </h4>
                            <div className="space-y-1">
                              {parseSimpleMarkdown(newsEvaluation)}
                            </div>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </div>

                  {/* Flow controls */}
                  <div className="pt-4 border-t border-neutral-200 mt-4 flex justify-end">
                    <button
                      onClick={() => {
                        if (!hasRunAI) {
                          showToast("Harap selaraskan teks berita menggunakan AI terlebih dahulu.");
                          return;
                        }
                        setActiveStep("photo");
                      }}
                      className={`w-full sm:w-auto px-5 py-3 rounded-xl font-bold text-xs sm:text-sm uppercase flex items-center justify-center gap-1.5 shadow cursor-pointer transition-all ${
                        hasRunAI 
                          ? "bg-[#10b981] hover:bg-[#059669] text-white hover:translate-x-0.5 active:translate-x-0" 
                          : "bg-neutral-200 text-neutral-450 cursor-not-allowed border border-neutral-300"
                      }`}
                    >
                      <span>Lanjut ke Dapur Visual (Foto)</span>
                      <ChevronRight className="h-4.5 w-4.5" />
                    </button>
                  </div>
                </div>

              </div>

            </div>
          )}            {/* STEP 2: PHOTO EDITING */}
          {activeStep === "photo" && (
            <div className="space-y-6">
              
              <div className="bg-neutral-50 p-4 sm:p-5 rounded-2xl border border-neutral-200 flex flex-col md:flex-row gap-4 items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-emerald-700 flex items-center gap-1.5 font-sans uppercase tracking-widest">
                    <Crop className="h-4.5 w-4.5" />
                    Dapur Seni Visual: Cropping & Color Equalizer
                  </h3>
                  <p className="text-xs text-neutral-550 mt-1 max-w-xl font-sans">
                    Lakukan pemotongan ruang berlebih (Cropping) dan penyesuaian pencahayaan/warna agar detail foto banjir atau kegiatan di Bojonegoro tampil tajam dan dramatis.
                  </p>
                </div>
                
                <button
                  onClick={handleResetAdjustments}
                  className="bg-neutral-100 hover:bg-neutral-200 active:bg-neutral-250 text-neutral-700 px-4 py-2.5 rounded-xl text-xs font-bold border border-neutral-200 flex items-center gap-1.5 cursor-pointer font-sans"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Reset Foto ke Default
                </button>
              </div>

              {/* Grid Photo adjustment */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* Visual View (Cropping Split Side) (Cols 7) */}
                <div className="lg:col-span-7 bg-white rounded-2xl border border-neutral-250 p-5 sm:p-6 shadow-sm flex flex-col justify-between">
                  <div className="space-y-5">
                    
                    {/* Visual Comparison Split Block */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      
                      {/* Before (Wide, Underexposed, raw photo frame) */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-[11px] font-sans">
                          <span className="text-red-500 font-bold flex items-center gap-1 uppercase">
                            <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-ping"></span>
                            FOTO MENTAH (Sebelum Edit)
                          </span>
                          <span className="text-neutral-500 bg-red-50 border border-red-200/50 px-1.5 py-0.5 rounded">
                            Eksposur Rendah & Wide
                          </span>
                        </div>
                        
                        <div className="relative h-64 sm:h-72 bg-neutral-900 rounded-xl overflow-hidden border-2 border-red-500/40 p-2.5 flex items-center justify-center">
                          {/* Inner container mimicking dark/underexposed raw file */}
                          <div className="w-full h-full relative overflow-hidden bg-black/90 rounded-md">
                            <img
                              src={currentPhotoAsset.url}
                              alt="Sebelum"
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-contain filter brightness-65 contrast-80 grayscale-10 scale-95 opacity-65"
                            />
                            {/* Dummy Cropping Red Box guidelines overlay */}
                            <div className="absolute inset-x-4 inset-y-6 border border-dashed border-red-500 p-1 flex items-center justify-center">
                              <span className="text-[9px] bg-red-650 text-white font-sans rounded px-1.5 py-0.5 scale-90 border border-red-500 font-bold select-none">
                                TARGET TIGHT SHOT (CROP AREA)
                              </span>
                            </div>
                          </div>
                        </div>
                        <p className="text-[11px] text-neutral-500 italic leading-relaxed text-center">
                          Visual mentah terkesan gelap karena cuaca mendung, dan miring/terlalu jauh.
                        </p>
                      </div>

                      {/* After (Dynamic Crop, tuned bright layout) */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-[11px] font-sans">
                          <span className="text-emerald-600 font-bold flex items-center gap-1 uppercase">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            FOTO SIAP BERITA (Sesudah Edit)
                          </span>
                          <span className="text-neutral-600 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                            Hasil Tuning Real-Time
                          </span>
                        </div>
                        
                        <div className="relative h-64 sm:h-72 bg-neutral-900 rounded-xl overflow-hidden border-2 border-emerald-500 flex items-center justify-center">
                          {/* Inner container applying scale and filter effects live in browser! */}
                          <div className="w-full h-full relative overflow-hidden bg-slate-900">
                            <img
                              src={currentPhotoAsset.url}
                              alt="Sesudah"
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover transition-all duration-150 transform"
                              style={{
                                transform: `scale(${cropZoom})`,
                                filter: `
                                  brightness(${brightness}%) 
                                  contrast(${contrast}%) 
                                  saturate(${saturation}%) 
                                  hue-rotate(${hueRotate}deg)
                                `
                              }}
                            />
                            
                            {/* Dummy Grid camera overlay */}
                            <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3 opacity-30">
                              <div className="border-r border-b border-white border-dashed"></div>
                              <div className="border-r border-b border-white border-dashed"></div>
                              <div className="border-b border-white border-dashed"></div>
                              <div className="border-r border-b border-white border-dashed"></div>
                              <div className="border-r border-b border-white border-dashed"></div>
                              <div className="border-b border-white border-dashed"></div>
                              <div className="border-r border-white border-dashed"></div>
                              <div className="border-r border-white border-dashed"></div>
                              <div></div>
                            </div>
                          </div>
                        </div>
                        <p className="text-[11px] text-neutral-500 italic leading-relaxed text-center">
                          Fokus subjek dikunci dekat dan warna dinaikkan guna menambah bobot ekspresi.
                        </p>
                      </div>

                    </div>

                    {/* Image caption box which is also editable by user */}
                    <div className="space-y-2.5">
                      <label className="text-[10px] font-sans text-neutral-550 font-bold uppercase tracking-widest block">
                        Keterangan Foto Jurnalistik (Caption Editor):
                      </label>
                      <input
                        type="text"
                        value={newsCaption}
                        onChange={(e) => setNewsCaption(e.target.value)}
                        className="w-full bg-neutral-50 text-neutral-950 border border-neutral-250 rounded-xl px-4 py-3 text-xs sm:text-sm font-sans"
                        placeholder="Ubah tulisan caption di bawah berita..."
                      />
                    </div>

                  </div>

                  <div className="pt-4 border-t border-neutral-200 mt-4 text-[11px] font-sans text-neutral-450 uppercase tracking-wider">
                    DIUJI SESUAI METODE EDITING FOTO JURNALISTIK BOJONEGORO
                  </div>
                </div>

                {/* Adjuster sliders (Cols 5) */}
                <div className="lg:col-span-5 bg-white rounded-2xl border border-neutral-250 p-5 sm:p-6 shadow-sm flex flex-col justify-between">
                  <div className="space-y-6">
                    <span className="text-neutral-600 text-xs font-bold flex items-center gap-1.5 font-sans uppercase tracking-widest pb-3 border-b border-neutral-200">
                      <SlidersHorizontal className="h-4.5 w-4.5 text-emerald-600" />
                      Parameter Visual Digital
                    </span>

                    {/* Crop slider */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs font-bold text-neutral-750 font-sans">
                        <span className="flex items-center gap-1.5">
                          <Crop className="h-3.5 w-3.5 text-red-500" />
                          1. Crop Zoom Jarak Fokus
                        </span>
                        <span>{cropZoom.toFixed(2)}x</span>
                      </div>
                      <input
                        type="range"
                        min="1.0"
                        max="2.5"
                        step="0.05"
                        value={cropZoom}
                        onChange={(e) => setCropZoom(parseFloat(e.target.value))}
                        className="w-full accent-red-500 h-2 bg-neutral-100 rounded-lg appearance-none cursor-pointer border border-neutral-200/50"
                      />
                      <p className="text-[10px] text-neutral-500 font-medium">
                        Zoom mendekat (Tight Shot) mengeliminasi gangguan di tepi gambar.
                      </p>
                    </div>

                    {/* Brightness slider */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs font-bold text-neutral-750 font-sans">
                        <span className="flex items-center gap-1.5">
                          <Sun className="h-3.5 w-3.5 text-amber-500" />
                          2. Eksposur Kecerahan (Brightness)
                        </span>
                        <span>{brightness}%</span>
                      </div>
                      <input
                        type="range"
                        min="70"
                        max="160"
                        step="5"
                        value={brightness}
                        onChange={(e) => setBrightness(parseInt(e.target.value))}
                        className="w-full accent-amber-500 h-2 bg-neutral-100 rounded-lg appearance-none cursor-pointer border border-neutral-200/50"
                      />
                    </div>

                    {/* Contrast slider */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs font-bold text-neutral-750 font-sans">
                        <span className="flex items-center gap-1.5">
                          <Contrast className="h-3.5 w-3.5 text-emerald-600" />
                          3. Kontras Pencahayaan (Contrast)
                        </span>
                        <span>{contrast}%</span>
                      </div>
                      <input
                        type="range"
                        min="70"
                        max="150"
                        step="5"
                        value={contrast}
                        onChange={(e) => setContrast(parseInt(e.target.value))}
                        className="w-full accent-emerald-500 h-2 bg-neutral-100 rounded-lg appearance-none cursor-pointer border border-neutral-200/50"
                      />
                    </div>

                    {/* Saturation slider */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs font-bold text-neutral-750 font-sans">
                        <span className="flex items-center gap-1.5">
                          <Sliders className="h-3.5 w-3.5 text-emerald-600" />
                          4. Saturasi Warna (Saturate)
                        </span>
                        <span>{saturation}%</span>
                      </div>
                      <input
                        type="range"
                        min="50"
                        max="180"
                        step="5"
                        value={saturation}
                        onChange={(e) => setSaturation(parseInt(e.target.value))}
                        className="w-full accent-emerald-500 h-2 bg-neutral-100 rounded-lg appearance-none cursor-pointer border border-neutral-200/50"
                      />
                    </div>

                    {/* Hue shift slider */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs font-bold text-neutral-750 font-sans">
                        <span className="flex items-center gap-1.5">
                          <SlidersHorizontal className="h-3.5 w-3.5 text-purple-600" />
                          5. Keseimbangan Warna (Hue shift)
                        </span>
                        <span>{hueRotate} deg</span>
                      </div>
                      <input
                        type="range"
                        min="-30"
                        max="30"
                        step="2"
                        value={hueRotate}
                        onChange={(e) => setHueRotate(parseInt(e.target.value))}
                        className="w-full accent-purple-600 h-2 bg-neutral-100 rounded-lg appearance-none cursor-pointer border border-neutral-200/50"
                      />
                    </div>

                  </div>

                  {/* Flow controls */}
                  <div className="pt-4 border-t border-neutral-200 mt-8 flex flex-col sm:flex-row justify-between gap-3 font-sans">
                    <button
                      onClick={() => setActiveStep("text")}
                      className="bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold text-xs uppercase px-4 py-3 rounded-xl cursor-pointer text-center border border-neutral-250"
                    >
                      ⬅ KEMBALI (REVISI TEKS)
                    </button>
                    <button
                      onClick={() => {
                        setActiveStep("publish");
                        showToast("Visual foto berhasil diselaraskan dengan naskah berita! 📸");
                      }}
                      className="bg-[#10b981] hover:bg-[#059669] text-white font-bold text-xs sm:text-sm uppercase tracking-wider px-5 py-3 rounded-xl shadow transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span>Lanjut ke Pratinjau Terbit</span>
                      <ChevronRight className="h-4.5 w-4.5" />
                    </button>
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* STEP 3: PREVIEW & PUBLISH */}
          {activeStep === "publish" && (
            <div className="space-y-8">
              
              <div className="bg-white p-5 rounded-2xl border border-neutral-200 text-center max-w-2xl mx-auto space-y-4 shadow-sm">
                <div className="bg-emerald-50 text-emerald-600 border border-emerald-200 p-2.5 rounded-full inline-flex items-center justify-center">
                  <Check className="h-6 w-6 animate-pulse" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-sans text-lg sm:text-xl font-bold text-emerald-600 leading-tight">
                    Naskah & Foto Siap Tayang!
                  </h3>
                  <p className="text-xs text-neutral-600 leading-relaxed max-w-md mx-auto font-sans">
                    Kombinasi naskah berita (EYD compliant) dan modifikasi layout visual foto Anda siap diterbitkan. Silakan ulas pratinjau gawai/desktop sebelum menekan tombol rilis.
                  </p>
                </div>
              </div>

              {/* Mockup Platforms Display */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* Smartphone Preview Mockup */}
                <div className="space-y-3.5">
                  <span className="text-[10px] sm:text-xs font-sans text-neutral-500 font-bold uppercase tracking-widest flex items-center gap-1.5">
                    <Phone className="h-4 w-4 text-emerald-600" />
                    Pratinjau Smartphone (UNUGIRI Terkini Mobile App)
                  </span>

                  {/* Device shell */}
                  <div className="relative mx-auto max-w-[290px] h-[580px] bg-slate-950 rounded-[40px] border-[12px] border-slate-800 shadow-2xl relative overflow-hidden ring-4 ring-slate-800/50">
                    
                    {/* Camera notch */}
                    <div className="absolute top-0 inset-x-0 h-4.5 bg-slate-800 rounded-b-xl z-20 flex justify-center items-center">
                      <div className="h-2 w-12 bg-black rounded-full mb-1"></div>
                    </div>

                    <div className="absolute inset-0 bg-slate-50 text-slate-900 overflow-y-auto pt-5 pb-8 flex flex-col justify-between selection:bg-[#10b981]/25">
                      
                      {/* Brand Header */}
                      <div className="bg-slate-900 text-white font-sans font-black text-center text-xs tracking-wide py-2 uppercase py-1 border-b border-slate-800 flex items-center justify-center gap-1">
                        <span className="text-white text-[9px]">UNUGIRI</span>
                        <span className="text-emerald-500 text-[9px]">TERKINI</span>
                      </div>

                      {/* Content info */}
                      <div className="p-3 space-y-3 text-left">
                        <span className="text-[9px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full uppercase font-sans">
                          {targetArticle.category} &gt; {targetArticle.region}
                        </span>

                        <h3 className="font-sans text-sm font-extrabold text-slate-900 leading-tight">
                          {newsTitle}
                        </h3>

                        <div className="text-[9px] text-slate-400 font-sans pb-2 border-b border-slate-100 flex justify-between items-center">
                          <span>Oleh: {targetArticle.author}</span>
                          <span>Kamis, 18:30 WIB</span>
                        </div>

                        {/* Image inside mockup */}
                        <div className="relative rounded-lg overflow-hidden h-36 bg-slate-900">
                          <img
                            src={currentPhotoAsset.url}
                            alt="Mockup Image"
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover transition-all"
                            style={{
                              transform: `scale(${cropZoom})`,
                              filter: `
                                brightness(${brightness}%) 
                                contrast(${contrast}%) 
                                saturate(${saturation}%) 
                                hue-rotate(${hueRotate}deg)
                              `
                            }}
                          />
                        </div>
                        <div className="text-[9px] text-slate-500 bg-slate-50 p-2 rounded-md border-l-2 border-emerald-500 italic">
                          {newsCaption}
                        </div>

                        {/* Body text display inside smartphone app */}
                        <div className="text-[10px] leading-relaxed font-sans text-slate-805 space-y-2 text-justify">
                          <p>
                            <b>BOJONEGORO</b> — {newsBody.split("\n\n")[0]?.substring(0, 160)}...
                          </p>
                        </div>
                      </div>

                      {/* Footer Inside smartphone */}
                      <div className="bg-slate-100 text-slate-400 py-2.5 text-center text-[7px] border-t border-slate-200">
                        © 2026 UNUGIRI TERKINI. Diterbitkan via lab.
                      </div>

                    </div>
                  </div>
                </div>

                {/* Desktop Headline preview card mockup */}
                <div className="space-y-4">
                  <span className="text-[10px] sm:text-xs font-sans text-neutral-500 font-bold uppercase tracking-widest flex items-center gap-1.5">
                    <Laptop className="h-4 w-4 text-emerald-600" />
                    Tampilan Kartu Headline Portal Utama (Beranda Web)
                  </span>

                  <div className="bg-white rounded-2xl border border-neutral-200 text-slate-900 p-5 sm:p-6 shadow-md space-y-4">
                    
                    {/* Header bar mimic */}
                    <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                      <div className="font-sans font-black text-sm tracking-wider uppercase text-neutral-800">
                        UNUGIRI <span className="text-[#10b981]">TERKINI</span>
                      </div>
                      <span className="text-[9px] text-neutral-500 uppercase font-sans font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                        Rilis Baru Terjadwal
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-center">
                      
                      <div className="sm:col-span-4 h-28 bg-slate-900 rounded-xl overflow-hidden relative">
                        <img
                          src={currentPhotoAsset.url}
                          alt="Web Card Mockup"
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                          style={{
                            transform: `scale(${cropZoom})`,
                            filter: `
                              brightness(${brightness}%) 
                              contrast(${contrast}%) 
                              saturate(${saturation}%) 
                              hue-rotate(${hueRotate}deg)
                            `
                          }}
                        />
                      </div>

                      <div className="sm:col-span-8 space-y-2 text-left">
                        <span className="text-[9px] font-bold text-emerald-700 uppercase tracking-widest block font-sans">
                          Bojonegoro &gt; Berita Regional
                        </span>
                        <h4 className="font-sans font-bold text-sm sm:text-base text-slate-900 line-clamp-2 leading-snug">
                          {newsTitle}
                        </h4>
                        <p className="text-[10px] sm:text-xs text-slate-500 line-clamp-2 leading-relaxed font-sans">
                          {newsBody.substring(0, 130)}...
                        </p>
                        <div className="text-[10px] text-slate-400 flex items-center gap-1 font-medium italic font-sans_">
                          <span>Oleh {targetArticle.author}</span>
                          <span>•</span>
                          <span>Kamis, 18:30 WIB</span>
                        </div>
                      </div>

                    </div>
                  </div>

                  {/* Summary takeaways panel */}
                  <div className="bg-white rounded-2xl border border-neutral-200 p-5 shadow-sm">
                    <h4 className="text-xs font-bold text-neutral-700 font-sans uppercase tracking-wider pb-2 border-b border-neutral-100 mb-3 flex items-center gap-1.5">
                      <TrendingUp className="h-4 w-4 text-emerald-600" />
                      Konfirmasi Data Redaksi
                    </h4>
                    
                    <div className="grid grid-cols-2 gap-4 text-xs font-sans">
                      <div className="bg-neutral-50 p-3 rounded-xl border border-neutral-250">
                        <span className="text-neutral-500 block font-sans pb-1 font-bold text-[10px] uppercase">Reporter:</span>
                        <span className="text-neutral-800 font-medium">{targetArticle.author}</span>
                      </div>
                      <div className="bg-neutral-50 p-3 rounded-xl border border-neutral-250">
                        <span className="text-neutral-500 block font-sans pb-1 font-bold text-[10px] uppercase">Editor Pengesah:</span>
                        <span className="text-emerald-600 font-bold">AI Redaksi &amp; Dosen</span>
                      </div>
                    </div>

                    {/* Step wizard controls */}
                    <div className="pt-6 mt-4 border-t border-neutral-150 flex flex-col sm:flex-row justify-between gap-3 font-sans">
                      <button
                        onClick={() => setActiveStep("photo")}
                        className="bg-neutral-100 hover:bg-neutral-250 text-neutral-700 border border-neutral-250 font-bold text-xs uppercase px-4 py-3 rounded-xl cursor-pointer text-center"
                      >
                        ⬅ KEMBALI (TATA FOTO)
                      </button>

                      <button
                        onClick={handlePublish}
                        className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 active:from-emerald-750 text-white font-black text-xs sm:text-sm uppercase tracking-wider px-6 py-4 rounded-xl shadow-md hover:shadow-lg hover:translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2 cursor-pointer border border-emerald-450"
                        id="btn-publish-final"
                      >
                        <Sparkles className="h-4.5 w-4.5" />
                        <span>Terbitkan Berita Resmi ke Portal Utama! 🚀</span>
                      </button>
                    </div>
                  </div>

                </div>

              </div>

            </div>
          )}

        </div>

      </div>

    </div>
  );
}
