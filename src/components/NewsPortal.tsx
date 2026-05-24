import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Newspaper, 
  Flame, 
  TrendingUp, 
  ChevronRight, 
  ChevronLeft,
  Clock, 
  User, 
  Sliders, 
  MapPin,
  Sparkles,
  Award,
  Search,
  Share2,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Video,
  X,
  Check,
  Facebook,
  Twitter,
  MessageSquare,
  MessageCircle,
  Instagram,
  Linkedin,
  Smartphone,
  Laptop,
  ShoppingBag,
  Sun,
  Menu
} from "lucide-react";
import { Article } from "../types";
import ArticleDetailView from "./ArticleDetailView";

interface NewsPortalProps {
  articles: Article[];
  currentHeadlineId: string;
  onSetHeadlineId: (id: string) => void;
  onNavigateToLab: (initialArticleId?: string) => void;
  onNavigateToCms: () => void;
}

const CATEGORY_TABS = [
  "Semua",
  "Berita Regional",
  "Warta Kampus",
  "Opini",
  "Olahraga",
  "Seni Budaya",
  "Iptek"
];

export default function NewsPortal({
  articles,
  currentHeadlineId,
  onSetHeadlineId,
  onNavigateToLab,
  onNavigateToCms
}: NewsPortalProps) {
  // Navigation & Search states
  const [selectedCategory, setSelectedCategory] = useState("Semua");
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"feed" | "detail">("feed");

  // Clickable Tools State Managers
  const [activeLanguage, setActiveLanguage] = useState<"id" | "en">("id");
  const [readingComfort, setReadingComfort] = useState<"standard" | "cozy" | "midnight">("standard");
  const [isPremiumActivated, setIsPremiumActivated] = useState(false);
  const [isPremiumModalOpen, setIsPremiumModalOpen] = useState(false);
  const [isShopModalOpen, setIsShopModalOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [premiumPromoCode, setPremiumPromoCode] = useState("");

  // Translate dictionary helper
  const translations = {
    id: {
      backToFeed: "Kembali ke Beranda Utama",
      premiumKBadge: "Akses Premium K+ 🌟",
      premiumKActive: "✨ K+ Premium Aktif",
      editorLab: "Lab Editor",
      cmsTitle: "CMS Redaktur",
      shopHub: "Shop Hub",
      readingComfort: "Kenyamanan A",
      sedangTren: "SEDANG TREN:",
      sorotanUtama: "SOROTAN UTAMA:",
      pillsCategory: "DAFTAR KATEGORI PORTAL",
      mediaSearchHub: "Media Search Hub",
      placeholderSearch: "Cari berita...",
      dapurRedaksi: "DAPUR REDAKSI ACADEMY",
      selengkapnya: "Selengkapnya",
      beritaJurnalistik: "Berita Jurnalistik",
      terpopuler: "Terpopuler",
      kembali: "Kembali",
      bahasa: "Bahasa",
      noArticles: "Nihil naskah terbit dalam penyaringan kriteria Anda.",
      editorialLabDesc: "Mulai Praktikum Editor",
      brandSlogan: "JERNIH MELIHAT DUNIA"
    },
    en: {
      backToFeed: "Back to Main Feed",
      premiumKBadge: "Premium K+ Access 🌟",
      premiumKActive: "✨ K+ Premium Active",
      editorLab: "Editor Lab",
      cmsTitle: "CMS Editor-in-Chief",
      shopHub: "Shop Hub",
      readingComfort: "Read Comfort A",
      sedangTren: "TRENDING NOW:",
      sorotanUtama: "MAIN REPORT:",
      pillsCategory: "PORTAL CATEGORIES",
      mediaSearchHub: "Media Search Hub",
      placeholderSearch: "Search news articles...",
      dapurRedaksi: "NEWSROOM ACADEMY",
      selengkapnya: "Read More",
      beritaJurnalistik: "Journalistic Reports",
      terpopuler: "Most Popular",
      kembali: "Back",
      bahasa: "Language",
      noArticles: "No matching journalistic articles found in your database.",
      editorialLabDesc: "Launch Editorial Practice",
      brandSlogan: "CLEAR VIEW TO THE WORLD"
    }
  };

  const t = translations[activeLanguage];

  // Handler to open an article in a dedicated detail reading layout
  const handleOpenArticle = (id: string) => {
    onSetHeadlineId(id);
    setViewMode("detail");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Carousel Slide setup
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [isCarouselPlaying, setIsCarouselPlaying] = useState(true);
  
  // Media Players: Audio Synthesis Narrator
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [audioSpeed, setAudioSpeed] = useState(1.0);
  const [selectedVoiceGender, setSelectedVoiceGender] = useState<"female" | "male">("female");
  const [audioProgress, setAudioProgress] = useState(0);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Equalizer visual bars state
  const [eqHeights, setEqHeights] = useState<number[]>([15, 25, 10, 40, 20, 35, 18, 30, 12, 16]);

  // Video Live TV Broadcast Simulator
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(true);
  const [videoTimer, setVideoTimer] = useState(0);

  // Share widgets
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Real-time fetched factual states (gold price, weather, trending lists)
  const [realtimeData, setRealtimeData] = useState({
    goldPrice: "1,45 jt/gr",
    goldChange: "↗ (+0,34%)",
    weatherTemp: "29°C",
    weatherDesc: "Cerah Berawan",
    weatherHumidity: "Kelembaban: 76%",
    matchAcronym1: "PSB",
    matchAcronym2: "PSLA",
    matchTeams: "Persibo Bojonegoro vs Persela Lamongan",
    matchSchedule: "Sabtu, 15:30 WIB",
    trending: [
      "Suhu Panas Ekstrem di Indonesia",
      "Rilis Pendaftaran CPNS Terbaru",
      "Kemenangan Dramatis Timnas Garuda",
      "Harga Emas BSI Alami Kenaikan",
      "Siklus Debit Air Bendung Pacal"
    ]
  });
  const [isLoadingRealtime, setIsLoadingRealtime] = useState(false);

  useEffect(() => {
    let active = true;
    const fetchRealtime = async () => {
      setIsLoadingRealtime(true);
      try {
        const res = await fetch("/api/realtime-info");
        const data = await res.json();
        if (active && data && data.goldPrice) {
          setRealtimeData(data);
        }
      } catch (err) {
        console.error("Gagal menjangkau info real-time:", err);
      } finally {
        if (active) setIsLoadingRealtime(false);
      }
    };
    fetchRealtime();
    const interval = setInterval(fetchRealtime, 300000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  const activeArticle = articles.find((a) => a.id === currentHeadlineId) || articles[0];

  // List of top carousel articles
  const carouselArticles = articles.slice(0, 4);

  // Auto-slide carousel effect
  useEffect(() => {
    if (!isCarouselPlaying) return;
    const interval = setInterval(() => {
      setCarouselIndex((prev) => (prev + 1) % carouselArticles.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [isCarouselPlaying, carouselArticles.length]);

  // EQ Animation timer during audio playback
  useEffect(() => {
    if (!isAudioPlaying) {
      setEqHeights([5, 5, 5, 5, 5, 5, 5, 5, 5, 5]);
      return;
    }
    const interval = setInterval(() => {
      setEqHeights(Array.from({ length: 10 }, () => Math.floor(Math.random() * 32) + 6));
    }, 150);
    return () => clearInterval(interval);
  }, [isAudioPlaying]);

  // Video Broadcast counting timer
  useEffect(() => {
    if (!isVideoModalOpen) {
      setVideoTimer(0);
      return;
    }
    const interval = setInterval(() => {
      setVideoTimer((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isVideoModalOpen]);

  // Handle Speech Synthesis Lifecycle
  useEffect(() => {
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // Trigger web speech synthesis narrator
  const handleToggleAudioNarrator = () => {
    if (!window.speechSynthesis) {
      triggerToast("⚠️ speech_synthesis tidak disupport di browser Anda!");
      return;
    }

    if (isAudioPlaying) {
      window.speechSynthesis.cancel();
      setIsAudioPlaying(false);
      setAudioProgress(0);
      return;
    }

    window.speechSynthesis.cancel();

    // Compose text
    const textToRead = `Penyiar khusus unugiri terkini melaporkan. ${activeArticle.title}. Ditulis oleh ${activeArticle.author}. ${activeArticle.body.substring(0, 350)}`;
    
    const utterance = new SpeechSynthesisUtterance(textToRead);
    utteranceRef.current = utterance;
    
    // Attempt to locate Indonesian Voice
    const voices = window.speechSynthesis.getVoices();
    let selectedVoice = voices.find(v => v.lang.startsWith("id") || v.lang.startsWith("id-ID"));
    
    // Gender approximation if available
    if (selectedVoiceGender === "male") {
      const maleVoice = voices.find(v => (v.lang.startsWith("id") || v.lang.startsWith("id-ID")) && v.name.toLowerCase().includes("male"));
      if (maleVoice) selectedVoice = maleVoice;
    } else {
      const femaleVoice = voices.find(v => (v.lang.startsWith("id") || v.lang.startsWith("id-ID")) && v.name.toLowerCase().includes("female"));
      if (femaleVoice) selectedVoice = femaleVoice;
    }

    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }
    
    utterance.rate = audioSpeed;
    utterance.pitch = selectedVoiceGender === "female" ? 1.1 : 0.95;

    utterance.onend = () => {
      setIsAudioPlaying(false);
      setAudioProgress(100);
    };

    utterance.onboundary = (event) => {
      const totalChars = textToRead.length;
      if (totalChars > 0) {
        setAudioProgress(Math.min(100, Math.round((event.charIndex / totalChars) * 100)));
      }
    };

    setIsAudioPlaying(true);
    window.speechSynthesis.speak(utterance);
    triggerToast("🎙️ Penyiar AI UNUGIRI mengudara...");
  };

  const handleCopyLink = () => {
    const fakeUrl = `https://unugiri-terkini.id/read/${activeArticle.slug || "luapan-sungai-pacal"}`;
    navigator.clipboard.writeText(fakeUrl)
      .then(() => {
        triggerToast("📋 Tautan rilis pers disalin ke papan klip!");
      })
      .catch(() => {
        triggerToast("⚠️ Gagal menyalin tautan.");
      });
  };

  // Filtering list based on search and category tab
  const filteredArticles = articles.filter((art) => {
    const matchesCategory = selectedCategory === "Semua" || art.category === selectedCategory;
    const matchesSearch = 
      art.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      art.body.toLowerCase().includes(searchQuery.toLowerCase()) ||
      art.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      art.region.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const formattedVideoTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const currentCarouselArticle = carouselArticles[carouselIndex];

  return (
    <div className="min-h-screen bg-[#fafbfc] text-slate-900 font-sans antialiased selection:bg-[#00a2b9]/40 selection:text-slate-900 overflow-x-hidden">
      
      {/* Dynamic Toast Notice */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed bottom-6 right-6 z-55 bg-slate-900 border border-[#00a2b9]/40 text-[#00cce5] py-3.5 px-6 rounded shadow-2xl flex items-center gap-3 font-sans text-xs font-bold"
          >
            <div className="h-2 w-2 rounded-full bg-[#00a2b9] animate-ping"></div>
            <span>{toastMessage.toUpperCase()}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Custom unugiri.terkini High-Fidelity Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-neutral-200/80 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.05)] font-sans antialiased text-neutral-900">
        {/* Level 1: Branding Header Row */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            
            {/* Left Side: Dynamic Clickable Utility Tools on desktop */}
            <div className="hidden md:flex items-center gap-3 text-neutral-600 font-sans text-xs font-semibold select-none">
              {/* Interactive Language Selector */}
              <button 
                onClick={() => {
                  const nextLang = activeLanguage === "id" ? "en" : "id";
                  setActiveLanguage(nextLang);
                  triggerToast(nextLang === "id" ? "🌐 Bahasa Berhasil Diubah ke Indonesia!" : "🌐 Language changed to English successfully!");
                }} 
                className="flex items-center gap-1.5 hover:text-neutral-950 transition-colors cursor-pointer bg-neutral-100/80 hover:bg-neutral-200/80 px-3 py-1.5 rounded-full border border-neutral-200"
                aria-label="Language selector"
                title="Alihkan Bahasa (ID / EN)"
              >
                <span>🌐 {activeLanguage === "id" ? "INDONESIA" : "ENGLISH"}</span>
                <span className="text-[8px]">▼</span>
              </button>

              <span className="text-neutral-200 select-none">|</span>

              {/* Interactive Reading Comfort Cycler */}
              <button 
                onClick={() => {
                  let nextMode: "standard" | "cozy" | "midnight" = "standard";
                  if (readingComfort === "standard") nextMode = "cozy";
                  else if (readingComfort === "cozy") nextMode = "midnight";
                  setReadingComfort(nextMode);
                  
                  const msgs = {
                    standard: "Kenyamanan Baca: Terang Standar ☀️",
                    cozy: "Kenyamanan Baca: Sepia Hangat 🎨",
                    midnight: "Kenyamanan Baca: Gelap Midnight 🌙"
                  };
                  triggerToast(msgs[nextMode]);
                }}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-full border cursor-pointer transition-colors ${
                  readingComfort === "standard" 
                    ? "bg-neutral-100 hover:bg-neutral-200 text-neutral-700 border-neutral-200" 
                    : readingComfort === "cozy"
                    ? "bg-[#faf6ee] text-[#2c1810] hover:bg-[#f6f0e2] border-amber-200"
                    : "bg-slate-900 text-slate-100 hover:bg-slate-800 border-slate-705"
                }`}
                title="Kenyamanan Menbaca Layar"
              >
                <Sun className={`h-3.5 w-3.5 ${readingComfort !== "standard" ? "text-amber-500" : ""}`} />
                <span className="text-[10px] font-sans font-bold uppercase shrink-0">
                  {readingComfort === "standard" ? "TERANG" : readingComfort === "cozy" ? "COZY" : "MIDNIGHT"}
                </span>
              </button>

              <span className="text-neutral-200 select-none">|</span>

              {/* Interactive Shop Hub */}
              <button 
                onClick={() => setIsShopModalOpen(true)}
                className="flex items-center gap-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 px-3 py-1.5 rounded-full border border-neutral-200 cursor-pointer relative"
                title="UNUGIRI Bookstore & Merchandise Hub"
              >
                <ShoppingBag className="h-3.5 w-3.5 text-neutral-600" />
                <span className="text-[10px] font-sans font-bold uppercase shrink-0">SHOP HUB</span>
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-650 text-white text-[8px] h-4.5 w-4.5 rounded-full flex items-center justify-center font-black animate-bounce shadow">
                    {cartCount}
                  </span>
                )}
              </button>

              <span className="text-neutral-200 select-none">|</span>
              
              <button 
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
                className="p-1 hover:text-[#10b981] transition-all cursor-pointer rounded hover:bg-neutral-50" 
                title="Semua Kategori"
              >
                <Menu className="h-5 w-5" />
              </button>
            </div>

            {/* Left Side for MOBILE (Show logo on the left, matching mockup right page) */}
            <div 
              className="flex md:hidden flex-col cursor-pointer select-none"
              onClick={() => { setSelectedCategory("Semua"); setSearchQuery(""); setViewMode("feed"); }}
            >
              <h1 className="font-serif font-black italic text-xl tracking-tight leading-none text-neutral-950 uppercase">
                unugiri<span className="text-[#10b981] font-serif font-extrabold not-italic text-xl">.terkini</span>
              </h1>
              <p className="text-[6.5px] uppercase font-sans font-bold tracking-[0.25em] text-neutral-500 mt-1 leading-none">
                {t.brandSlogan}
              </p>
            </div>

            {/* Center: Brand logo ‘unugiri.terkini’ (Visible and CENTERED on desktop/larger screen, matching mockup left page) */}
            <div 
              className="hidden md:flex flex-col items-center cursor-pointer select-none text-center"
              onClick={() => { setSelectedCategory("Semua"); setSearchQuery(""); setViewMode("feed"); }}
            >
              <h1 className="font-serif font-extrabold italic text-4xl lg:text-4.5xl tracking-tighter leading-none text-neutral-950 lowercase">
                unugiri<span className="text-[#10b981] font-serif font-bold">.terkini</span>
              </h1>
              <p className="text-[8px] uppercase font-sans font-extrabold tracking-[0.35em] text-neutral-500 mt-2 leading-none">
                {t.brandSlogan}
              </p>
            </div>

            {/* Right Side: Quick Search Bar and Management Actions styled like modern minimalist news page */}
            <div className="flex items-center gap-2 sm:gap-4 select-none">
              
              {/* CMS & Lab tools nicely integrated as sleek pills */}
              <div className="flex items-center gap-1.5 sm:gap-2 mr-1 md:mr-3 border-r border-neutral-200 pr-2.5 md:pr-4">
                {/* Premium Button Indicator */}
                <button
                  onClick={() => setIsPremiumModalOpen(true)}
                  className={`px-3 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-widest transition-all cursor-pointer flex items-center gap-1.5 border hover:scale-[1.02] active:scale-[0.98] ${
                    isPremiumActivated 
                      ? "bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 text-white border-amber-300 font-black shadow-sm" 
                      : "bg-white hover:bg-neutral-50 text-amber-600 border-amber-200"
                  }`}
                  title="Akses Premium K+ UNUGIRI"
                >
                  <span className="text-xs">👑</span>
                  <span className="hidden lg:inline">{isPremiumActivated ? "K+ PREMIUM AKTIF" : "PREMIUM K+"}</span>
                </button>

                <button
                  id="btn-nav-to-cms"
                  onClick={onNavigateToCms}
                  className="bg-[#1a1a1a] hover:bg-zinc-800 text-white px-2.5 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1"
                  title="Kelola rilis berita di CMS"
                >
                  <span className="text-amber-500 text-xs">🎛️</span>
                  <span className="hidden sm:inline">CMS</span>
                </button>

                <button
                  id="btn-nav-to-lab"
                  onClick={() => onNavigateToLab(activeArticle.id)}
                  className="bg-[#10b981] hover:bg-[#059669] text-white px-3 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1 shadow-sm hover:scale-[1.02]"
                >
                  <Sliders className="h-3 w-3 text-white" />
                  <span className="hidden sm:inline">Lab Editor</span>
                </button>
              </div>

              {/* Sleek pill Search input bar on the right (Desktop matches mockup search bar) */}
              <div className="hidden lg:flex items-center relative w-48 xl:w-56">
                <input
                  type="text"
                  placeholder={t.placeholderSearch}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-neutral-150 hover:bg-neutral-200 border border-neutral-300 text-xs text-neutral-800 pl-4 pr-9 py-1.5 focus:outline-none focus:bg-white focus:border-neutral-400 rounded-full font-sans transition-colors"
                />
                <Search className="absolute right-3.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400 pointer-events-none" />
              </div>

              {/* Mobile Header elements on the right (matches mockup right sheet top: 🌐 EN ∨ | ☰) */}
              <div className="flex md:hidden items-center gap-2">
                <button 
                  onClick={() => {
                    const nextLang = activeLanguage === "id" ? "en" : "id";
                    setActiveLanguage(nextLang);
                    triggerToast(nextLang === "id" ? "🌐 Berhasil beralih ke Bahasa Indonesia!" : "🌐 Swapped to English!");
                  }} 
                  className="flex items-center gap-0.5 text-neutral-605 bg-neutral-100 hover:bg-neutral-200 text-[10px] font-black py-1.5 px-2.5 rounded border border-neutral-250 cursor-pointer"
                >
                  <span className="uppercase">{activeLanguage === "id" ? "ID" : "EN"}</span>
                  <span className="text-[7px]">▼</span>
                </button>
                <span className="text-zinc-200 select-none">|</span>
                <button 
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="text-neutral-700 hover:text-[#10b981] transition-colors cursor-pointer focus:outline-none p-1.5 rounded hover:bg-neutral-50"
                >
                  <Menu className="h-5.5 w-5.5" />
                </button>
              </div>

            </div>
          </div>
        </div>

        {/* Level 2: Minimalist Category Horizontal Scrolling Bar with borders */}
        <div className="bg-white border-y border-neutral-250 text-neutral-800 overflow-x-auto no-scrollbar scroll-smooth">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-5 sm:gap-7 h-12 text-xs whitespace-nowrap select-none font-bold justify-start md:justify-center">
            
            <button
              onClick={() => { setSelectedCategory("Semua"); setSearchQuery(""); setViewMode("feed"); }}
              className={`transition-all shrink-0 text-[11px] sm:text-xs cursor-pointer px-3.5 py-1.5 uppercase font-bold tracking-wider ${
                selectedCategory === "Semua" 
                  ? "bg-neutral-950 text-white rounded-md font-sans font-bold" 
                  : "text-neutral-500 hover:text-neutral-950 font-sans"
              }`}
            >
              Terpopuler
            </button>

            <button
              onClick={() => { setSelectedCategory("Warta Kampus"); setSearchQuery(""); setViewMode("feed"); }}
              className={`transition-all shrink-0 text-[11px] sm:text-xs cursor-pointer px-3.5 py-1.5 uppercase font-bold tracking-wider ${
                selectedCategory === "Warta Kampus" 
                  ? "bg-neutral-950 text-white rounded-md font-sans font-bold" 
                  : "text-neutral-500 hover:text-neutral-950 font-sans"
              }`}
            >
              News
            </button>

            <button
              onClick={() => { setSelectedCategory("Berita Regional"); setSearchQuery(""); setViewMode("feed"); }}
              className={`transition-all shrink-0 text-[11px] sm:text-xs cursor-pointer px-3.5 py-1.5 uppercase font-bold tracking-wider ${
                selectedCategory === "Berita Regional" 
                  ? "bg-neutral-950 text-white rounded-md font-sans font-bold" 
                  : "text-neutral-500 hover:text-neutral-950 font-sans"
              }`}
            >
              Regional
            </button>

            <button
              onClick={() => { setSelectedCategory("Opini"); setSearchQuery(""); setViewMode("feed"); }}
              className={`transition-all shrink-0 text-[11px] sm:text-xs cursor-pointer px-3.5 py-1.5 uppercase font-bold tracking-wider ${
                selectedCategory === "Opini" 
                  ? "bg-neutral-950 text-white rounded-md font-sans font-bold" 
                  : "text-neutral-500 hover:text-neutral-950 font-sans"
              }`}
            >
              Kolom
            </button>

            <button
              onClick={() => { setSelectedCategory("Seni Budaya"); setSearchQuery(""); setViewMode("feed"); triggerToast("Melihat Agenda Seni Budaya terbaru!"); }}
              className={`transition-all shrink-0 text-[11px] sm:text-xs cursor-pointer px-3.5 py-1.5 uppercase font-bold tracking-wider relative ${
                selectedCategory === "Seni Budaya" 
                  ? "bg-neutral-950 text-white rounded-md font-sans font-bold" 
                  : "text-neutral-500 hover:text-neutral-950 font-sans"
              }`}
            >
              Event
              <span className="absolute -top-[2px] right-0 bg-red-600 text-[6px] font-sans font-black text-white px-0.5 rounded leading-none shrink-0 py-[1px] animate-pulse">
                NEW
              </span>
            </button>

            <button
              onClick={() => { setSelectedCategory("Seni Budaya"); setSearchQuery(""); setViewMode("feed"); }}
              className="text-neutral-500 hover:text-neutral-950 hover:underline transition-colors shrink-0 uppercase text-[11px] sm:text-xs tracking-wider cursor-pointer font-sans"
            >
              Cahaya
            </button>

            <button
              onClick={() => { setSelectedCategory("Iptek"); setSearchQuery(""); setViewMode("feed"); }}
              className={`transition-all shrink-0 text-[11px] sm:text-xs cursor-pointer px-3.5 py-1.5 uppercase font-bold tracking-wider ${
                selectedCategory === "Iptek" 
                  ? "bg-neutral-950 text-white rounded-md font-sans font-bold" 
                  : "text-neutral-500 hover:text-neutral-950 font-sans"
              }`}
            >
              Tekno
            </button>

            <button
              onClick={() => { setSelectedCategory("Olahraga"); setSearchQuery(""); setViewMode("feed"); }}
              className={`transition-all shrink-0 text-[11px] sm:text-xs cursor-pointer px-3.5 py-1.5 uppercase font-bold tracking-wider ${
                selectedCategory === "Olahraga" 
                  ? "bg-neutral-950 text-white rounded-md font-sans font-bold" 
                  : "text-neutral-500 hover:text-neutral-950 font-sans"
              }`}
            >
              Olahraga
            </button>
          </div>
        </div>

        {/* Level 3: Clean Minimalist Trending Bar with pale highlight */}
        <div className="bg-neutral-50 border-b border-neutral-200/60 text-neutral-600 py-3 overflow-x-auto no-scrollbar">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center text-xs whitespace-nowrap">
            <span className="font-extrabold text-[#10b981] tracking-wider uppercase mr-3 sm:mr-4 shrink-0 flex items-center gap-1 select-none text-[10px] sm:text-xs">
              <Flame className="h-3.5 w-3.5 animate-pulse text-neutral-800" />
              SEDANG TREN:
            </span>
            <div className="flex items-center gap-1.5 text-neutral-700 text-[11px] sm:text-xs font-semibold select-none overflow-x-auto no-scrollbar scroll-smooth">
              {realtimeData.trending.map((topic, idx) => (
                <React.Fragment key={topic}>
                  <button 
                    onClick={() => { setSearchQuery(topic); triggerToast(`Mencari informasi aktual mengenai "${topic}"`); }}
                    className="hover:text-black hover:underline cursor-pointer bg-white border border-neutral-200 hover:border-neutral-300 rounded px-2.5 py-0.5 transition-all whitespace-nowrap shadow-sm text-neutral-600 font-sans animate-fade-in"
                  >
                    {topic}
                  </button>
                  {idx < realtimeData.trending.length - 1 && <span className="text-neutral-300 px-0.5 shrink-0 select-none">|</span>}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile menu panel overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-45 bg-black/60 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)}>
            <motion.div 
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#082c33] text-white w-72 h-full p-6 shadow-2xl relative flex flex-col justify-between border-r border-[#00a2b9]/20"
            >
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div className="flex flex-col">
                    <span className="text-lg font-black uppercase text-white tracking-tight font-sans italic">
                      unugiri<span className="text-[#10b981] font-sans font-black">.terkini</span>
                    </span>
                    <span className="text-[7px] text-zinc-400 font-bold uppercase tracking-widest leading-none mt-1">JERNIH MELIHAT DUNIA</span>
                  </div>
                  <button 
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-1 text-slate-400 hover:text-white focus:outline-none"
                    aria-label="Tutup mobile menu"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Mobile Menu Quick Access Tools */}
                <div className="space-y-2 pb-4 border-b border-slate-800">
                  <p className="text-[9px] text-[#00cce5] font-black uppercase tracking-widest font-sans">DAPUR REDAKSI & FITUR</p>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        onNavigateToCms();
                      }}
                      className="bg-[#1a1a1a] hover:bg-neutral-850 text-white px-2 py-1.5 rounded text-[9px] font-bold uppercase tracking-wider border border-zinc-800 flex items-center justify-center gap-1.5 cursor-pointer text-center matches-mobile-button"
                    >
                      <span>🎛️</span>
                      <span className="text-zinc-300">CMS Redaktur</span>
                    </button>
                    
                    <button
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        if (activeArticle) onNavigateToLab(activeArticle.id);
                      }}
                      className="bg-[#10b981] hover:bg-[#059669] text-white px-2 py-1.5 rounded text-[9px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer text-center tools-action-btn"
                    >
                      <Sliders className="h-3.5 w-3.5 text-white" />
                      <span>Lab Editor</span>
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    {/* Shopping Bag in mobile drawer */}
                    <button 
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        setIsShopModalOpen(true);
                      }}
                      className="bg-zinc-900 hover:bg-zinc-805 px-2 py-1.5 rounded text-[9px] font-bold uppercase tracking-wider border border-zinc-800 text-zinc-300 hover:text-white flex items-center justify-center gap-1.5 cursor-pointer text-center relative"
                    >
                      <ShoppingBag className="h-3.5 w-3.5 text-zinc-300" />
                      <span>Shop Hub</span>
                      {cartCount > 0 && (
                        <span className="absolute -top-1 right-1 bg-red-650 text-white font-sans text-[7px] h-3.5 w-3.5 rounded-full flex items-center justify-center font-bold">
                          {cartCount}
                        </span>
                      )}
                    </button>
                    
                    {/* Reading comfort in mobile drawer */}
                    <button 
                      onClick={() => {
                        let nextMode: "standard" | "cozy" | "midnight" = "standard";
                        if (readingComfort === "standard") nextMode = "cozy";
                        else if (readingComfort === "cozy") nextMode = "midnight";
                        setReadingComfort(nextMode);
                        const msgs = {
                          standard: "Kenyamanan Baca: Terang Standar ☀️",
                          cozy: "Kenyamanan Baca: Sepia Hangat 🎨",
                          midnight: "Kenyamanan Baca: Gelap Midnight 🌙"
                        };
                        triggerToast(msgs[nextMode]);
                      }}
                      className="bg-zinc-900 hover:bg-zinc-805 px-2 py-1.5 rounded text-[9px] font-bold uppercase tracking-wider border border-zinc-800 text-zinc-300 hover:text-white flex items-center justify-center gap-1.5 cursor-pointer text-center"
                    >
                      <Sun className="h-3.5 w-3.5 text-zinc-300" />
                      <span>{readingComfort.toUpperCase()} A</span>
                    </button>
                  </div>

                  {/* Golden Premium Badge */}
                  <button 
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      setIsPremiumModalOpen(true);
                    }}
                    className={`w-full font-extrabold text-[8px] py-1.5 rounded uppercase tracking-widest text-center cursor-pointer transition-all border ${
                      isPremiumActivated 
                        ? "bg-gradient-to-r from-amber-500 to-yellow-400 text-white border-amber-400 font-extrabold animate-pulse" 
                        : "bg-[#1a1a1a] hover:bg-zinc-850 text-amber-500 border-zinc-850"
                    }`}
                  >
                    {isPremiumActivated ? "👑 K+ Premium Aktif 🌟" : "Akses Premium K+ 🌟"}
                  </button>
                </div>

                <div className="space-y-3.5">
                  <p className="text-[10px] text-zinc-400 bg-zinc-900 p-2.5 border border-zinc-800 uppercase tracking-widest font-sans">DAFTAR KATEGORI PORTAL</p>
                  {CATEGORY_TABS.map((tab) => (
                    <button
                      key={tab}
                      onClick={() => {
                        setSelectedCategory(tab);
                        setIsMobileMenuOpen(false);
                      }}
                      className={`w-full text-left py-2 px-3 text-xs font-bold uppercase tracking-wider rounded transition-colors ${
                        selectedCategory === tab
                          ? "bg-[#10b981] text-white"
                          : "text-zinc-300 hover:bg-slate-800 hover:text-white"
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                {/* Search in mobile frame */}
                <div className="pt-4 border-t border-slate-800">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Cari berita..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 text-xs text-white pl-9 pr-4 py-2 rounded focus:outline-none font-sans"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 text-[10px] font-sans text-slate-500 uppercase tracking-widest leading-normal">
                Pratiktum Jurnalistik Mahasiswa UNUGIRI Bojonegoro • 2026
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Breaking Marquee Banner */}
      <div className="bg-neutral-50 border-b border-neutral-200 py-3 overflow-hidden select-none">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-4 text-xs font-sans">
          <div className="flex items-center gap-1 font-sans font-extrabold text-red-650 shrink-0 uppercase tracking-wider">
            <Flame className="h-4 w-4 animate-bounce text-red-600" />
            SOROTAN UTAMA:
          </div>
          <div className="text-neutral-700 italic truncate flex-1 leading-snug">
            &quot;{articles[0]?.title || "Aktualitas Jurnalisme Kampus"}&quot; — Reporter: {articles[0]?.author || "Redaksi"}.
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 shadow-none">
        {viewMode === "feed" ? (
          <div className="space-y-10">
            {/* Category Pills Filters & Stats */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-5 border-b border-zinc-200 pb-5">
              {/* Pills selectors */}
              <div className="flex flex-wrap items-center gap-1.5">
                {CATEGORY_TABS.map((tab) => (
                  <button
                    key={tab}
                    onClick={() => {
                      setSelectedCategory(tab);
                      setViewMode("feed");
                    }}
                    className={`py-1.5 px-4 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer border ${
                      selectedCategory === tab
                        ? "bg-neutral-950 text-white border-neutral-950 shadow-sm"
                        : "bg-neutral-100 hover:bg-neutral-200 text-neutral-600 border-transparent"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Quick Stats */}
              <div className="font-sans text-[10px] text-neutral-500 font-bold bg-neutral-100 px-3 py-1.5 rounded-full border border-neutral-200 uppercase tracking-widest self-start md:self-auto shrink-0 select-none">
                TERALIHKAN <span className="text-neutral-950 font-black text-xs">{filteredArticles.length}</span> BERITA JURNALISTIK
              </div>
            </div>

        {/* Premium Headline Sorotan Slideshow Card / Banner */}
        {currentCarouselArticle && (
          <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-sm hover:shadow-md transition-all duration-305">
            <div className="grid grid-cols-1 lg:grid-cols-12">
              <div 
                onClick={() => handleOpenArticle(currentCarouselArticle.id)}
                className="lg:col-span-7 relative h-64 sm:h-80 md:h-[380px] overflow-hidden bg-neutral-950 group cursor-pointer"
              >
                <img 
                  src={currentCarouselArticle.imageUrl}
                  alt={currentCarouselArticle.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  style={{
                    transform: `scale(${currentCarouselArticle.cropZoom})`,
                    filter: `brightness(${currentCarouselArticle.brightness}%) contrast(${currentCarouselArticle.contrast}%) saturate(${currentCarouselArticle.saturation}%) hue-rotate(${currentCarouselArticle.hueRotate || 0}deg)`
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/20 to-transparent z-10" />
                
                <div className="absolute top-4 left-4 bg-red-650 text-white font-sans font-black text-[10px] uppercase tracking-wider px-3 py-1.5 rounded shadow z-20 select-none animate-pulse">
                  Sorotan Utama
                </div>

                <div className="absolute bottom-6 left-6 right-6 z-20 flex flex-col gap-2">
                  <span className="text-[10px] sm:text-xs font-sans font-bold text-neutral-300 tracking-widest uppercase">
                    📍 {currentCarouselArticle.category.toUpperCase()} • KAB. {currentCarouselArticle.region.toUpperCase()}
                  </span>
                  <h2 className="font-serif font-black text-xl sm:text-2xl md:text-3xl text-white leading-tight tracking-tight hover:text-[#10b981] transition-colors break-words line-clamp-2">
                    {currentCarouselArticle.title}
                  </h2>
                </div>
              </div>

              <div className="lg:col-span-5 p-6 sm:p-8 flex flex-col justify-between space-y-4 bg-neutral-50/40">
                <div className="space-y-3">
                  <div className="flex items-center gap-1.5 text-[9px] font-sans font-black text-neutral-450 uppercase tracking-widest">
                    <span>Reporter: {currentCarouselArticle.author}</span>
                    <span>•</span>
                    <span>{currentCarouselArticle.date}</span>
                  </div>
                  <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed font-sans line-clamp-5">
                    {currentCarouselArticle.body}
                  </p>
                </div>

                <div className="pt-4 border-t border-neutral-200 flex items-center justify-between gap-4">
                  {/* Interactive indicator dots */}
                  <div className="flex gap-2 items-center">
                    {carouselArticles.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCarouselIndex(idx)}
                        aria-label={`Lihat Berita Sorotan ${idx + 1}`}
                        className={`h-2.5 rounded-full transition-all duration-350 cursor-pointer ${
                          carouselIndex === idx ? "w-6 bg-[#10b981]" : "w-2 bg-neutral-300 hover:bg-neutral-400"
                        }`}
                      />
                    ))}
                  </div>

                  <button
                    onClick={() => handleOpenArticle(currentCarouselArticle.id)}
                    className="bg-neutral-950 hover:bg-neutral-800 text-white font-sans text-[10px] font-bold uppercase tracking-widest py-2 px-4 rounded-full transition-all flex items-center gap-1 cursor-pointer transform hover:scale-[1.02] active:scale-[0.98] shadow-sm font-bold"
                  >
                    <span>Selengkapnya</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Split feed layout index */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pt-4">
          
          {/* List Cards Columns (col-span-8) */}
          <div className="lg:col-span-8 space-y-6">
            <div className="flex items-center gap-2.5 pb-2 border-b border-neutral-200">
              <div className="w-1.5 bg-[#10b981] h-4.5 rounded-sm"></div>
              <h3 className="text-xs font-sans font-bold tracking-widest text-neutral-800 uppercase">
                RILIS PERS MAHASISWA {selectedCategory !== "Semua" ? `// ${selectedCategory.toUpperCase()}` : ""}
              </h3>
            </div>

            {filteredArticles.length === 0 ? (
              <div className="bg-white rounded-2xl border border-neutral-250/70 p-12 text-center shadow-sm">
                <Newspaper className="h-12 w-12 text-neutral-300 mx-auto mb-3 animate-pulse" />
                <p className="font-sans text-xs text-neutral-400 uppercase italic">
                  Nihil naskah terbit dalam penyaringan kriteria Anda.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 font-sans">
                {filteredArticles.map((art) => (
                  <div
                    key={art.id}
                    onClick={() => handleOpenArticle(art.id)}
                    className="bg-white rounded-2xl border border-neutral-205 p-4 flex flex-col justify-between hover:border-[#10b981]/60 group transition-all duration-300 cursor-pointer shadow-sm hover:shadow-md"
                  >
                    <div className="space-y-3">
                      <div className="h-44 bg-neutral-100 rounded-xl overflow-hidden border border-neutral-200 relative mb-1">
                        <img 
                          src={art.imageUrl} 
                          alt="" 
                          className="w-full h-full object-cover transform scale-100 group-hover:scale-105 transition-transform duration-500"
                          style={{
                            transform: `scale(${art.cropZoom})`,
                            filter: `brightness(${art.brightness}%) contrast(${art.contrast}%) saturate(${art.saturation}%) hue-rotate(${art.hueRotate || 0}deg)`
                          }}
                        />
                        <span className="absolute bottom-2.5 left-2.5 bg-neutral-900/85 backdrop-blur-sm text-white text-[8px] font-sans font-black px-2 py-0.5 rounded tracking-wider uppercase z-20">
                          {art.category}
                        </span>
                        {art.isCustomEdited && (
                          <span className="absolute top-2.5 right-2.5 bg-emerald-600 text-white text-[7px] font-sans font-black px-1.5 py-0.5 rounded shadow z-20 uppercase tracking-widest">
                            QC Lolos
                          </span>
                        )}
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-[8px] font-sans font-bold text-neutral-400 uppercase tracking-wider">
                          <span>✍️ {art.author}</span>
                          <span>•</span>
                          <span>{art.date}</span>
                        </div>
                        <h4 className="font-serif font-black text-base text-neutral-900 group-hover:text-[#10b981] leading-snug tracking-tight transition-colors line-clamp-2">
                          {art.title}
                        </h4>
                        <p className="text-xs text-neutral-500 leading-relaxed font-sans line-clamp-3">
                          {art.body}
                        </p>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-neutral-100 mt-4 flex items-center justify-between text-[10px] font-sans">
                      <span className="text-[#10b981] font-bold tracking-wider uppercase group-hover:underline flex items-center gap-0.5">
                        Baca Selengkapnya
                      </span>
                      <span className="text-neutral-400 font-bold uppercase select-none">
                        KAB. {art.region}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar columns (col-span-4) */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Media Search Hub */}
            <div className="bg-neutral-950 text-white rounded-2xl p-5 shadow border border-neutral-900 space-y-4">
              <div className="flex items-center gap-2.5 pb-2.5 border-b border-neutral-800">
                <div className="w-1 bg-[#10b981] h-4"></div>
                <h3 className="text-xs font-serif font-black uppercase tracking-wider text-neutral-100">Media Search Hub</h3>
              </div>

              <div className="space-y-3">
                <p className="text-[11px] text-neutral-400 leading-normal">
                  Saring naskah dengan kata kunci atau nama reporter langsung dari database praktikum mahasiswa.
                </p>
                
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-500" />
                  <input
                    type="text"
                    placeholder="Ketik topik atau nama reporter..."
                    value={searchQuery}
                    aria-label="Ketik topik atau nama reporter"
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-800 text-xs text-white pl-9 pr-4 py-2.5 focus:outline-none focus:border-[#10b981] rounded font-sans"
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-450 hover:text-white font-black">&times;</button>
                  )}
                </div>
              </div>
            </div>

            {/* Editorial Lab Promo Panel */}
            <div className="bg-[#0b1712] text-white rounded-2xl p-5 shadow-lg border border-neutral-800 space-y-4">
              <span className="text-[9px] font-sans bg-emerald-950/40 text-emerald-400 px-2.5 py-1 border border-emerald-900/30 rounded uppercase tracking-widest font-black inline-block">
                DAPUR REDAKSI ACADEMY
              </span>
              <h4 className="font-sans italic font-bold text-lg text-neutral-100">
                Penyelarasan Naskah via Edisi AI Editor
              </h4>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Silakan masuk ke Lab Dapur Jurnalistik kami untuk mempelajari tata bahasa baku sesuai ejaan EYD/PUEBI, serta pengaturan filter visual crop foto hasil jurnalisme.
              </p>
              <button
                onClick={() => onNavigateToLab(activeArticle.id)}
                className="w-full bg-neutral-900 hover:bg-[#10b981] text-white font-black text-xs uppercase tracking-widest py-3 rounded transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer border border-neutral-800"
              >
                <span>Mulai Praktikum Editor</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

          </div>

        </div>
      </div>
    ) : (
      <ArticleDetailView
        activeArticle={activeArticle}
        onNavigateToLab={onNavigateToLab}
        onBackToFeed={() => setViewMode("feed")}
        isShareModalOpen={isShareModalOpen}
        setIsShareModalOpen={setIsShareModalOpen}
        filteredArticles={filteredArticles}
        currentHeadlineId={currentHeadlineId}
        handleOpenArticle={handleOpenArticle}
        triggerToast={triggerToast}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        activeLanguage={activeLanguage}
        isPremiumActivated={isPremiumActivated}
        readingComfort={readingComfort}
      />
    )}
      </div>

      {/* Share Social Media Modal Drawer */}
      <AnimatePresence>
        {isShareModalOpen && (
          <div className="fixed inset-0 z-55 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white text-neutral-900 border border-neutral-200 w-full max-w-md rounded-2xl shadow-xl p-6 relative"
            >
              <button
                onClick={() => setIsShareModalOpen(false)}
                className="absolute top-4 right-4 text-neutral-450 hover:text-neutral-950 font-bold text-xl"
              >
                &times;
              </button>

              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-neutral-200 pb-3">
                  <Share2 className="h-5 w-5 text-[#10b981]" />
                  <h4 className="text-sm font-black tracking-widest font-sans uppercase text-neutral-905">BAGIKAN RILIS PERS INI</h4>
                </div>

                <p className="text-xs text-neutral-600 leading-normal font-sans italic text-justify">
                  &quot;{activeArticle.title}&quot;
                </p>

                {/* Simulated direct action buttons */}
                <div className="grid grid-cols-3 gap-2.5 py-2">
                  <a
                    href={`https://api.whatsapp.com/send?text=${encodeURIComponent(activeArticle.title + ' | ' + 'https://unugiri-terkini.id/read/' + activeArticle.slug)}`}
                    target="_blank"
                    referrerPolicy="no-referrer"
                    rel="noopener noreferrer"
                    onClick={() => {
                      triggerToast("📱 WhatsApp diarahkan...");
                      setIsShareModalOpen(false);
                    }}
                    className="bg-neutral-50 hover:bg-neutral-100 border border-neutral-100 rounded-xl p-3 text-center transition-all flex flex-col items-center justify-center gap-1.5 text-xs text-neutral-700 cursor-pointer"
                  >
                    <MessageSquare className="h-5 w-5 text-emerald-550" />
                    <span className="font-sans text-[9px] font-bold">WHATSAPP</span>
                  </a>

                  <a
                    href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(activeArticle.title)}&hashtags=UNUGIRITerkini`}
                    target="_blank"
                    referrerPolicy="no-referrer"
                    rel="noopener noreferrer"
                    onClick={() => {
                      triggerToast("🐦 Twitter diarahkan...");
                      setIsShareModalOpen(false);
                    }}
                    className="bg-neutral-50 hover:bg-neutral-100 border border-neutral-100 rounded-xl p-3 text-center transition-all flex flex-col items-center justify-center gap-1.5 text-xs text-neutral-700 cursor-pointer"
                  >
                    <Twitter className="h-5 w-5 text-neutral-900" />
                    <span className="font-sans text-[9px] font-bold">X / TWITTER</span>
                  </a>

                  <button
                    onClick={() => {
                      triggerToast("🔵 Menghubungkan metadata ke Facebook...");
                      setIsShareModalOpen(false);
                    }}
                    className="bg-neutral-50 hover:bg-neutral-100 border border-neutral-100 rounded-xl p-3 text-center transition-all flex flex-col items-center justify-center gap-1.5 text-xs text-neutral-700 cursor-pointer"
                  >
                    <Facebook className="h-5 w-5 text-[#10b981]" />
                    <span className="font-sans text-[9px] font-bold">FACEBOOK</span>
                  </button>
                </div>

                {/* Clipboard copy helper */}
                <div className="space-y-1 pt-3 border-t border-neutral-200">
                  <label className="text-[9px] font-sans text-neutral-450 uppercase tracking-widest block font-black">
                    Short URL Akademik
                  </label>
                  <div className="flex bg-neutral-50 border border-neutral-200 rounded overflow-hidden">
                    <span className="text-[10px] text-emerald-600 font-sans px-3 py-2 flex-1 truncate select-all">
                      https://unugiri-terkini.id/read/{activeArticle.slug || "banjir-pacal"}
                    </span>
                    <button
                      onClick={handleCopyLink}
                      className="bg-neutral-950 hover:bg-neutral-800 text-white font-black text-[10px] tracking-wider uppercase px-4 py-2 shrink-0 cursor-pointer font-sans"
                    >
                      Salin Link
                    </button>
                  </div>
                </div>

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 🌟 Interactive Premium K+ Club Subscription Modal */}
      <AnimatePresence>
        {isPremiumModalOpen && (
          <div className="fixed inset-0 z-55 overflow-y-auto bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="bg-zinc-950 text-white border border-amber-500/40 w-full max-w-xl rounded-2xl shadow-xl overflow-hidden relative"
            >
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600"></div>
              
              <button
                onClick={() => setIsPremiumModalOpen(false)}
                className="absolute top-4 right-4 text-neutral-400 hover:text-white font-black text-xl z-20"
              >
                &times;
              </button>

              <div className="p-6 sm:p-8 space-y-6">
                <div className="text-center space-y-2">
                  <span className="text-[10px] font-sans bg-amber-500/20 text-amber-300 font-extrabold px-3 py-1 rounded-full uppercase tracking-widest border border-amber-500/30">
                    👑 UNUGIRI PREMIUM SUBSCRIPTION
                  </span>
                  <h3 className="font-serif font-black text-2xl sm:text-3xl text-neutral-100">
                    Gabung Akses Premium K+
                  </h3>
                  <p className="text-xs text-neutral-400 max-w-md mx-auto leading-relaxed">
                    Tingkatkan pengalaman jurnalisme ke taraf profesional dengan naskah berkualitas tinggi bebas iklan dari ekosistem pers mahasiswa UNUGIRI.
                  </p>
                </div>

                {isPremiumActivated ? (
                  <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-xl p-6 text-center space-y-3.5">
                    <span className="text-4xl">🎉</span>
                    <h4 className="text-sm font-black tracking-widest font-sans text-emerald-400 uppercase">AKUN PREMIUM K+ AKTIF!</h4>
                    <p className="text-xs text-emerald-100/80 leading-relaxed">
                      Selamat! Akun Mahasiswa Pers Anda telah ditingkatkan ke Akses Premium K+. Anda sekarang menikmati naskah jurnalisme murni tanpa gangguan iklan, dengan suara penyiar realistis tanpa batas.
                    </p>
                    <button
                      onClick={() => {
                        setIsPremiumActivated(false);
                        triggerToast("🔴 Mode K+ Premium dinonaktifkan.");
                      }}
                      className="bg-neutral-900 border border-neutral-800 text-xs px-4 py-2 hover:bg-neutral-800 rounded font-sans uppercase tracking-wider"
                    >
                      Matikan Simulasi Premium
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Perks showcase */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div className="bg-zinc-900 border border-zinc-800 p-3.5 rounded-xl space-y-1">
                        <p className="text-xs font-bold text-amber-400">🗞️ Rilis Prioritas Eksklusif</p>
                        <p className="text-[10.5px] text-zinc-400 leading-relaxed">Akses naskah opini dan liputan investigasi jurnalis pertama kali sebelum terbit umum.</p>
                      </div>
                      <div className="bg-zinc-900 border border-zinc-800 p-3.5 rounded-xl space-y-1">
                        <p className="text-xs font-bold text-amber-400">🎙️ Suara Penyiar Multi-Bahasa</p>
                        <p className="text-[10.5px] text-zinc-400 leading-relaxed">Buka model pembaca berita dengan variasi karakter suara profesional yang super jernih.</p>
                      </div>
                      <div className="bg-zinc-900 border border-zinc-800 p-3.5 rounded-xl space-y-1">
                        <p className="text-xs font-bold text-amber-400">🔇 Bebas Total Iklan Sponsor</p>
                        <p className="text-[10.5px] text-zinc-400 leading-relaxed">Menghilangkan seluruh banner iklan luar, meningkatkan konsentrasi telaah pers Anda.</p>
                      </div>
                      <div className="bg-zinc-900 border border-zinc-800 p-3.5 rounded-xl space-y-1">
                        <p className="text-xs font-bold text-amber-400">📥 Unduh Pers Rilis Resmi</p>
                        <p className="text-[10.5px] text-zinc-400 leading-relaxed">Ekspor naskah ke dokumen PDF universitas untuk rujukan berita media regional.</p>
                      </div>
                    </div>

                    {/* Subscription billing options cards */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-neutral-900 border border-amber-500/20 hover:border-amber-500/50 p-4 rounded-xl text-center cursor-pointer transition-all group">
                        <p className="text-[9px] font-sans text-zinc-400 tracking-wider">PAKET BULANAN</p>
                        <p className="text-lg font-extrabold text-amber-400 mt-1">Rp 5.000<span className="text-[10px] text-zinc-500 font-normal">/bln</span></p>
                        <p className="text-[9px] text-zinc-500 mt-1 uppercase font-bold">Hemat 15% Mahasiswa</p>
                      </div>
                      <div className="bg-neutral-900 border border-amber-500/20 hover:border-amber-500/50 p-4 rounded-xl text-center cursor-pointer transition-all group">
                        <p className="text-[9px] font-sans text-zinc-400 tracking-wider">PAKET TAHUNAN</p>
                        <p className="text-lg font-extrabold text-amber-400 mt-1">Rp 45.000<span className="text-[10px] text-zinc-500 font-normal">/thn</span></p>
                        <p className="text-[9px] text-emerald-400 mt-1 uppercase font-bold">Terpopuler // Hemat Besar</p>
                      </div>
                    </div>

                    {/* Simulation activating box with promo keys */}
                    <div className="space-y-3 pt-2">
                      <div className="space-y-1">
                        <label className="text-[9px] font-sans text-zinc-400 uppercase tracking-widest font-bold">Aktivasi Kode Voucher / Mahasiswa Aktif</label>
                        <div className="flex bg-neutral-900 border border-zinc-800 rounded overflow-hidden">
                          <input
                            type="text"
                            placeholder="Ketik KPLUS atau voucher anda..."
                            value={premiumPromoCode}
                            onChange={(e) => setPremiumPromoCode(e.target.value)}
                            className="bg-transparent pl-3 pr-2 py-2 text-xs text-white flex-1 focus:outline-none placeholder-zinc-650"
                          />
                          <button
                            onClick={() => {
                              const code = premiumPromoCode.toUpperCase().trim();
                              if (code === "KPLUS" || code === "UNUGIRI" || code === "MAHASISWA") {
                                setIsPremiumActivated(true);
                                triggerToast("👑 Berhasil! Akses Premium K+ Anda Telah Aktif!");
                              } else if (!code) {
                                triggerToast("✍️ Masukkan kode voucher seperti 'KPLUS' atau klik tombol simulasi di bawah");
                              } else {
                                triggerToast("❌ Kode voucher tidak ditemukan. Coba: KPLUS");
                              }
                            }}
                            className="bg-amber-500 hover:bg-amber-600 text-black font-extrabold text-[10px] px-4 uppercase tracking-wider font-sans cursor-pointer"
                          >
                            Klaim Voucher
                          </button>
                        </div>
                        <p className="text-[9.5px] text-zinc-500 italic">Voucher demo instan: <span className="text-amber-400 font-sans">KPLUS</span> atau <span className="text-amber-400 font-sans">MAHASISWA</span></p>
                      </div>

                      <button
                        onClick={() => {
                          setIsPremiumActivated(true);
                          triggerToast("🎉 Sukses mengaktifkan simulasi Akses Premium K+!");
                        }}
                        className="w-full bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-600 hover:to-yellow-500 text-black font-black text-xs uppercase tracking-widest py-3.5 rounded-xl transition-all duration-200 cursor-pointer shadow-md"
                      >
                        Aktifkan Simulasi Premium K+ Gratis
                      </button>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 👜 Interactive UNUGIRI Bookstore & Merchant Hub Modal */}
      <AnimatePresence>
        {isShopModalOpen && (
          <div className="fixed inset-0 z-55 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="bg-white text-zinc-900 border border-neutral-200 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden relative font-sans"
            >
              {/* Header and Branding line */}
              <div className="bg-[#0b1712] text-white p-5 flex justify-between items-center relative">
                <div className="space-y-0.5">
                  <span className="text-[8px] bg-emerald-950/40 text-[#10b981] px-2.5 py-0.5 border border-emerald-900/30 rounded font-sans font-black uppercase tracking-widest">
                    MARCHANDISE & PORTAL BOOKSTORE
                  </span>
                  <h3 className="font-serif font-black text-lg tracking-tight uppercase">
                    UNUGIRI <span className="text-[#10b981]">SHOP HUB</span>
                  </h3>
                </div>
                
                <button
                  onClick={() => setIsShopModalOpen(false)}
                  className="text-neutral-400 hover:text-white font-black text-2xl"
                  aria-label="Tutup Shop Hub"
                >
                  &times;
                </button>
              </div>

              <div className="p-5 sm:p-6 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-emerald-50 border border-emerald-100 p-3.5 rounded-xl">
                  <p className="text-xs text-emerald-800 leading-normal font-sans">
                     🎁 <strong>Diskon Eksklusif Anggota Pers!</strong> Seluruh mahasiwa aktif Universitas Nahdlatul Ulama Sunan Giri berhak atas potongan harga 10% untuk buku pegangan PUEBI dan jurnalisme berizin.
                  </p>
                  <div className="bg-emerald-600 text-white font-sans text-[10px] font-bold px-3 py-1.5 rounded uppercase tracking-wider shrink-0 text-center">
                    Kode: PERSMAHASISWA
                  </div>
                </div>

                {/* Merchandise items directory list */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Item 1 */}
                  <div className="border border-neutral-200 hover:border-[#10b981]/50 rounded-xl p-4 space-y-3 transition-colors bg-white hover:shadow-xs">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <span className="text-[8px] font-sans text-[#10b981] uppercase font-black tracking-widest bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">Official Apparel</span>
                        <h4 className="font-sans font-bold text-sm text-neutral-900 mt-1.5 min-h-[36px] line-clamp-2">Jaket Varsity Redaksi Official unugiri.terkini</h4>
                      </div>
                      <span className="text-xs font-black font-sans text-emerald-600 bg-neutral-50 px-2.5 py-1 rounded">Rp 185k</span>
                    </div>
                    <p className="text-[10.5px] text-neutral-500 leading-relaxed line-clamp-2">Jaket bahan tebal premium dengan bordir logo pers mahasiswa unugiri eksklusif.</p>
                    <button
                      onClick={() => {
                        setCartCount(prev => prev + 1);
                        triggerToast("🛒 Varsity Jacket ditambahkan ke keranjang!");
                      }}
                      className="w-full bg-neutral-905 hover:bg-[#10b981] text-white text-[10px] font-sans tracking-widest uppercase font-black py-2 rounded-lg transition-all cursor-pointer"
                    >
                      + Tambah Ke Belanja
                    </button>
                  </div>

                  {/* Item 2 */}
                  <div className="border border-neutral-200 hover:border-[#10b981]/50 rounded-xl p-4 space-y-3 transition-colors bg-white hover:shadow-xs">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <span className="text-[8px] font-sans text-[#10b981] uppercase font-black tracking-widest bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">Buku Pegangan</span>
                        <h4 className="font-sans font-bold text-sm text-neutral-900 mt-1.5 min-h-[36px] line-clamp-2">Buku Panduan Jurnalistik EYD & PUEBI Jilid II</h4>
                      </div>
                      <span className="text-xs font-black font-sans text-emerald-600 bg-neutral-50 px-2.5 py-1 rounded">Rp 45k</span>
                    </div>
                    <p className="text-[10.5px] text-neutral-500 leading-relaxed line-clamp-2">Buku wajib pedoman penguasaan EYD, teknik penyuntingan rilisan, dan penulisan berita murni.</p>
                    <button
                      onClick={() => {
                        setCartCount(prev => prev + 1);
                        triggerToast("🛒 Buku Panduan EYD ditambahkan ke keranjang!");
                      }}
                      className="w-full bg-neutral-905 hover:bg-[#10b981] text-white text-[10px] font-sans tracking-widest uppercase font-black py-2 rounded-lg transition-all cursor-pointer"
                    >
                      + Tambah Ke Belanja
                    </button>
                  </div>

                  {/* Item 3 */}
                  <div className="border border-neutral-200 hover:border-[#10b981]/50 rounded-xl p-4 space-y-3 transition-colors bg-white hover:shadow-xs">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <span className="text-[8px] font-sans text-[#10b981] uppercase font-black tracking-widest bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">Aksesoris Redaksi</span>
                        <h4 className="font-sans font-bold text-sm text-neutral-900 mt-1.5 min-h-[36px] line-clamp-2">Lanyard & ID Holder Eksklusif Pers Mahasiswa</h4>
                      </div>
                      <span className="text-xs font-black font-sans text-emerald-600 bg-neutral-50 px-2.5 py-1 rounded">Rp 15k</span>
                    </div>
                    <p className="text-[10.5px] text-neutral-500 leading-relaxed line-clamp-2">Tali lanyard tenun halus berkualitas tinggi dengan badge holder silikon tebal.</p>
                    <button
                      onClick={() => {
                        setCartCount(prev => prev + 1);
                        triggerToast("🛒 Lanyard Pers ditambahkan ke keranjang!");
                      }}
                      className="w-full bg-neutral-905 hover:bg-[#10b981] text-white text-[10px] font-sans tracking-widest uppercase font-black py-2 rounded-lg transition-all cursor-pointer"
                    >
                      + Tambah Ke Belanja
                    </button>
                  </div>

                  {/* Item 4 */}
                  <div className="border border-neutral-200 hover:border-[#10b981]/50 rounded-xl p-4 space-y-3 transition-colors bg-white hover:shadow-xs">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <span className="text-[8px] font-sans text-[#10b981] uppercase font-black tracking-widest bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">Alat Tulis</span>
                        <h4 className="font-sans font-bold text-sm text-neutral-900 mt-1.5 min-h-[36px] line-clamp-2">Notebook Jurnalis Waterproof Khasiat Lapangan</h4>
                      </div>
                      <span className="text-xs font-black font-sans text-emerald-600 bg-neutral-50 px-2.5 py-1 rounded">Rp 25k</span>
                    </div>
                    <p className="text-[10.5px] text-neutral-500 leading-relaxed line-clamp-2">Buku catatan saku kedap air yang andal dalam cuaca ekstrem saat peliputan banjir pacal.</p>
                    <button
                      onClick={() => {
                        setCartCount(prev => prev + 1);
                        triggerToast("🛒 Notebook Lapangan ditambahkan ke keranjang!");
                      }}
                      className="w-full bg-neutral-905 hover:bg-[#10b981] text-white text-[10px] font-sans tracking-widest uppercase font-black py-2 rounded-lg transition-all cursor-pointer"
                    >
                      + Tambah Ke Belanja
                    </button>
                  </div>
                </div>

                {/* Checkout Section with cart recap */}
                <div className="border-t border-neutral-200 pt-5 flex items-center justify-between gap-4 font-sans text-xs">
                  <div className="space-y-1">
                    <p className="font-semibold text-neutral-500">Jumlah Keranjang Belanja:</p>
                    <p className="text-base font-black text-neutral-905 font-sans">{cartCount} Barang Aktif</p>
                  </div>

                  <div className="flex gap-2.5">
                    {cartCount > 0 && (
                      <button
                        onClick={() => {
                          setCartCount(0);
                          triggerToast("🗑️ Keranjang belanja telah dikosongkan.");
                        }}
                        className="bg-neutral-100 hover:bg-neutral-200 text-neutral-700 px-4 py-3 rounded-xl font-bold uppercase tracking-wider cursor-pointer"
                      >
                        Reset
                      </button>
                    )}

                    <button
                      onClick={() => {
                        if (cartCount === 0) {
                          triggerToast("⚠️ Keranjang belanja Anda masih kosong! Tambahkan barang pers lebih dlu.");
                        } else {
                          setCartCount(0);
                          setIsShopModalOpen(false);
                          triggerToast("🎉 Sukses! Simulasi Pemesanan Merchant UNUGIRI dikirim ke WA Koperasi!");
                        }
                      }}
                      className="bg-[#10b981] hover:bg-[#059669] text-white px-6 py-3 rounded-xl font-bold uppercase tracking-widest transition-colors cursor-pointer"
                    >
                      Checkout Simulasi
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer block */}
      <footer className="bg-neutral-950 text-neutral-400 py-12 border-t border-neutral-800 mt-16 text-center text-xs">
        <div className="max-w-7xl mx-auto px-4 space-y-4">
          <p className="text-2xl font-serif font-black tracking-tighter uppercase text-white">
            UNUGIRI<span className="text-[#10b981]">TERKINI</span>
          </p>
          <p className="max-w-md mx-auto text-neutral-450 font-sans leading-relaxed">
            Aplikasi Praktikum Jurnalistik Mahasiswa Universitas Nahdlatul Ulama Sunan Giri Bojonegoro. Didesain untuk pembekalan reporter muda menguasai teknik penulisan baku EYD, penyelarasan berita murni, dan tuning tata laksana visual multi-platform.
          </p>
          <div className="pt-6 border-t border-neutral-900 flex flex-col items-center justify-center gap-4">
            <div className="flex items-center justify-center gap-6">
              {/* WhatsApp */}
              <a
                href="https://wa.me/"
                target="_blank"
                rel="noreferrer"
                aria-label="WhatsApp"
                className="w-10 h-10 rounded-full bg-[#111] text-[#25d366]/90 hover:text-[#25d366] hover:bg-emerald-950/40 flex items-center justify-center border border-neutral-800 hover:border-[#25d366]/50 transition-all duration-300 transform hover:scale-110 shadow-lg hover:shadow-[#25d366]/10"
              >
                <MessageCircle className="h-5 w-5" />
              </a>
              {/* Instagram */}
              <a
                href="https://instagram.com/"
                target="_blank"
                rel="noreferrer"
                aria-label="Instagram"
                className="w-10 h-10 rounded-full bg-[#111] text-[#e1306c]/90 hover:text-[#e1306c] hover:bg-rose-950/40 flex items-center justify-center border border-neutral-800 hover:border-[#e1306c]/50 transition-all duration-300 transform hover:scale-110 shadow-lg hover:shadow-[#e1306c]/10"
              >
                <Instagram className="h-5 w-5" />
              </a>
              {/* LinkedIn */}
              <a
                href="https://linkedin.com/"
                target="_blank"
                rel="noreferrer"
                aria-label="LinkedIn"
                className="w-10 h-10 rounded-full bg-[#111] text-[#0077b5]/90 hover:text-[#0077b5] hover:bg-sky-950/40 flex items-center justify-center border border-neutral-800 hover:border-[#0077b5]/50 transition-all duration-300 transform hover:scale-110 shadow-lg hover:shadow-[#0077b5]/10"
              >
                <Linkedin className="h-5 w-5" />
              </a>
              {/* Facebook */}
              <a
                href="https://facebook.com/"
                target="_blank"
                rel="noreferrer"
                aria-label="Facebook"
                className="w-10 h-10 rounded-full bg-[#111] text-[#1877f2]/90 hover:text-[#1877f2] hover:bg-blue-950/40 flex items-center justify-center border border-neutral-800 hover:border-[#1877f2]/50 transition-all duration-300 transform hover:scale-110 shadow-lg hover:shadow-[#1877f2]/10"
              >
                <Facebook className="h-5 w-5" />
              </a>
            </div>
            <p className="text-[9px] text-neutral-600 font-sans tracking-widest uppercase">
              HUBUNGI REDAKSI UNUGIRI TERKINI • MEDIA UTAMA JURNALISME KAMPUS
            </p>
          </div>
        </div>
      </footer>

    </div>
  );
}
