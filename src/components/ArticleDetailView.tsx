import React, { useState, useEffect, useRef } from "react";
import { motion } from "motion/react";
import { 
  Clock, 
  Share2, 
  Video, 
  VolumeX, 
  Volume2, 
  Pause, 
  Play, 
  TrendingUp, 
  ChevronLeft, 
  ChevronRight,
  Search
} from "lucide-react";
import { Article } from "../types";

interface ArticleDetailViewProps {
  activeArticle: Article;
  onNavigateToLab: (initialArticleId?: string) => void;
  onBackToFeed: () => void;
  isShareModalOpen: boolean;
  setIsShareModalOpen: (open: boolean) => void;
  filteredArticles: Article[];
  currentHeadlineId: string;
  handleOpenArticle: (id: string) => void;
  triggerToast: (msg: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  activeLanguage?: "id" | "en";
  isPremiumActivated?: boolean;
  readingComfort?: "standard" | "cozy" | "midnight";
}

export default function ArticleDetailView({
  activeArticle,
  onNavigateToLab,
  onBackToFeed,
  isShareModalOpen,
  setIsShareModalOpen,
  filteredArticles,
  currentHeadlineId,
  handleOpenArticle,
  triggerToast,
  searchQuery,
  setSearchQuery,
  activeLanguage = "id",
  isPremiumActivated = false,
  readingComfort = "standard"
}: ArticleDetailViewProps) {
  // Video player and sound narrator states localized here for maximum performance
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(true);
  const [videoTimer, setVideoTimer] = useState(0);

  // Translation helpers
  const detailTranslations = {
    id: {
      backToFeed: "Kembali ke Beranda Utama",
      perks: "Ikhtisar Jurnalisme Kampus (3 Fakta Terpenting):",
      penyiarNarasi: "Penyiar Narasi UNUGIRI",
      penyiarSub: "Simulator Pembaca Berita & Redaktur Pelaksana UNUGIRI",
      tempoLambat: "Tempo: lambat (0.75x)",
      tempoNormal: "Tempo: normal (1.0x)",
      tempoCepat: "Tempo: cepat (1.25x)",
      tempoSangatCepat: "Tempo: sangat cepat (1.5x)",
      genderSuara: "Ubah Vokal Penyiar Lapangan",
      mediaSearchHub: "Media Search Hub",
      searchDesc: "Saring naskah dengan keyboard atau klik tombol kategori di atas untuk memilah rilis mahasiswa secara selektif.",
      validationBadge: "VALIDATED // #EYD2026",
      redakturFooter: "REDAKTUR PELAKSANA JURNALISTIK UNUGIRI BOJONEGORO",
      arsipTerpopuler: "Rilis Berita Terpopuler Minggu Ini",
      arsipSub: "Arsip berita aktual jurnalisme unugiri terkini"
    },
    en: {
      backToFeed: "Back to Main Feed",
      perks: "Campus Journalism Highlights (3 Essential Facts):",
      penyiarNarasi: "UNUGIRI Narration Narrator",
      penyiarSub: "News Reader Simulator & Managing Editor UNUGIRI",
      tempoLambat: "Tempo: slow (0.75x)",
      tempoNormal: "Tempo: normal (1.0x)",
      tempoCepat: "Tempo: fast (1.25x)",
      tempoSangatCepat: "Tempo: very fast (1.5x)",
      genderSuara: "Toggle Field Reporter Vocals",
      mediaSearchHub: "Media Search Hub",
      searchDesc: "Filter news articles with keyword or click category tabs above for selective reading.",
      validationBadge: "VALIDATED // #EYD2026",
      redakturFooter: "MANAGING JOURNALISM EDITOR OF UNUGIRI BOJONEGORO",
      arsipTerpopuler: "Most Popular Releases This Week",
      arsipSub: "Live archives of current journalistic reports at UNUGIRI"
    }
  };

  const dt = detailTranslations[activeLanguage] || detailTranslations.id;

  // Custom themes for reading comfort
  const theme = {
    standard: {
      card: "bg-white text-zinc-900 border-neutral-200/80",
      subcard: "bg-neutral-50 border-neutral-200 text-neutral-800",
      par: "text-neutral-800",
      headlineBg: "bg-neutral-50 border-l-4 border-neutral-950",
      text: "text-neutral-900",
      muted: "text-neutral-500",
    },
    cozy: {
      card: "bg-[#fbf8f0] text-[#3e2723] border-[#ecd9b8]",
      subcard: "bg-[#ecd9b8]/30 border-[#ecd9b8] text-[#5d4037]",
      par: "text-[#5d4037]",
      headlineBg: "bg-[#ecd9b8]/45 border-l-4 border-[#8d6e63]",
      text: "text-[#3e2723]",
      muted: "text-[#8d6e63]",
    },
    midnight: {
      card: "bg-[#0b1416] text-neutral-200 border-zinc-800/80",
      subcard: "bg-[#0f1d21] border-zinc-800 text-neutral-350",
      par: "text-neutral-300",
      headlineBg: "bg-[#0f1d21] border-l-4 border-[#10b981]",
      text: "text-neutral-100",
      muted: "text-neutral-400",
    }
  }[readingComfort] || {
    card: "bg-white text-zinc-900 border-neutral-200/80",
    subcard: "bg-neutral-50 border-neutral-200 text-neutral-800",
    par: "text-neutral-850",
    headlineBg: "bg-neutral-50 border-l-4 border-neutral-950",
    text: "text-neutral-900",
    muted: "text-neutral-500",
  };

  // Audio synthesis narrator states
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [audioSpeed, setAudioSpeed] = useState(1.0);
  const [selectedVoiceGender, setSelectedVoiceGender] = useState<"female" | "male">("female");
  const [audioProgress, setAudioProgress] = useState(0);
  const [systemVoices, setSystemVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceName, setSelectedVoiceName] = useState<string>("");
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Equalizer visual bars
  const [eqHeights, setEqHeights] = useState<number[]>([15, 25, 10, 40, 20, 35, 18, 30, 12, 16]);

  // Video Broadcast timer
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

  // EQ motion timers
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

  // Load and cache high-quality Indonesian voices
  useEffect(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      const loadBrowserVoices = () => {
        const list = window.speechSynthesis.getVoices();
        // Look for Indonesian voices, or if none, keep all as fallback
        const indonesian = list.filter(v => v.lang.startsWith("id") || v.lang.startsWith("id-ID"));
        setSystemVoices(indonesian.length > 0 ? indonesian : list);
        
        if (indonesian.length > 0) {
          // Auto prioritize Google, Microsoft, Natural or Premium Indonesian voices
          const autoBest = indonesian.find(v => 
            v.name.toLowerCase().includes("natural") || 
            v.name.toLowerCase().includes("google") || 
            v.name.toLowerCase().includes("premium") || 
            v.name.toLowerCase().includes("microsoft")
          ) || indonesian[0];
          setSelectedVoiceName(autoBest.name);
        } else if (list.length > 0) {
          setSelectedVoiceName(list[0].name);
        }
      };

      loadBrowserVoices();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = loadBrowserVoices;
      }
    }
  }, []);

  // Clean speech synthesis
  useEffect(() => {
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleToggleAudioNarrator = () => {
    if (!window.speechSynthesis) {
      triggerToast("⚠️ Pembaca naskah tidak didukung di browser ini.");
      return;
    }

    if (isAudioPlaying) {
      window.speechSynthesis.cancel();
      setIsAudioPlaying(false);
      setAudioProgress(0);
      return;
    }

    window.speechSynthesis.cancel();

    // Enhancing readability and dynamic pauses to simulate a human news anchor
    // Commas and periods create natural pauses, and slightly slower phrasing sounds much more professional.
    const textToRead = `Info Redaksi UNUGIRI Bojonegoro. ... ${activeArticle.title}. ... Ditulis oleh reporter lapangan, ${activeArticle.author}. ... Berikut naskah berita selengkapnya: ... ${activeArticle.body.substring(0, 480)} ... Demikian laporan redaktur pelaksana berita kampus.`;
    const utterance = new SpeechSynthesisUtterance(textToRead);
    utteranceRef.current = utterance;

    const voices = window.speechSynthesis.getVoices();
    let preferredVoice = voices.find(v => v.name === selectedVoiceName);

    // If no custom voice is selected, search for the best default Indonesian voice
    if (!preferredVoice) {
      preferredVoice = voices.find(v => (v.lang.startsWith("id") || v.lang.startsWith("id-ID")) && 
        (selectedVoiceGender === "male" ? v.name.toLowerCase().includes("male") : v.name.toLowerCase().includes("female"))
      ) || voices.find(v => v.lang.startsWith("id") || v.lang.startsWith("id-ID"));
    }

    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }
    
    // Slight reporter speed adjustments (0.92x rate makes Indonesian sound significantly less rushed/robotic)
    utterance.rate = audioSpeed * 0.92;
    
    // Pitch settings (0.95 and 1.02 provide a natural, human-sounding resonance)
    utterance.pitch = selectedVoiceGender === "female" ? 1.02 : 0.95;

    utterance.onend = () => {
      setIsAudioPlaying(false);
      setAudioProgress(100);
    };

    utterance.onboundary = (event) => {
      const totalChars = textToRead.length;
      if (totalChars > 0) {
        setAudioProgress(Math.min(100, Math.round((event.charIndex / totalChars) * 105)));
      }
    };

    setIsAudioPlaying(true);
    window.speechSynthesis.speak(utterance);
    triggerToast("🎙️ Pembawa Berita UNUGIRI sedang membacakan rilis...");
  };

  const formattedVideoTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="space-y-6">
      {/* Elegant Back button */}
      <button
        onClick={onBackToFeed}
        className="flex items-center gap-2.5 text-xs text-neutral-605 hover:text-[#10b981] font-bold uppercase tracking-wider transition-all duration-200 group cursor-pointer bg-neutral-105/70 hover:bg-neutral-100 py-2.5 px-5 rounded-full border border-neutral-200/80 w-fit"
      >
        <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1 text-neutral-500 hover:text-[#10b981]" />
        <span>{dt.backToFeed}</span>
      </button>

      {/* Dynamic Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Main Article Content */}
        <main className="lg:col-span-8 space-y-7">
          <motion.article 
            key={activeArticle.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className={`${theme.card} rounded-2xl border p-6 sm:p-8 md:p-10 shadow-sm relative overflow-hidden`}
          >
            {/* Header Badge */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <span className={`${theme.subcard} text-[10px] font-bold px-2.5 py-1 tracking-widest rounded-full uppercase font-sans border`}>
                📍 {activeArticle.category.toUpperCase()} • KAB. {activeArticle.region.toUpperCase()}
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsShareModalOpen(true)}
                  className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-655 rounded-md transition-colors text-xs font-bold font-sans tracking-wider flex items-center gap-1 cursor-pointer"
                >
                  <Share2 className="h-3.5 w-3.5" />
                  <span>{activeLanguage === "id" ? "Bagikan" : "Share"}</span>
                </button>
                
                {activeArticle.isCustomEdited && (
                  <span className="text-[9px] bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded border border-emerald-100 uppercase tracking-widest font-sans font-bold">
                    LOLOS QC REDAKSI
                  </span>
                )}
              </div>
            </div>

            {/* Title display */}
            <h1 
              onClick={() => onNavigateToLab(activeArticle.id)}
              className={`font-serif font-black text-2xl sm:text-3xl md:text-4xl lg:text-5xl ${theme.text} leading-tight tracking-tight mb-4 hover:text-[#10b981] transition-all cursor-pointer`}
              title="Buka rilis berita ini di Dapur Redaksi"
            >
              {activeArticle.title}
            </h1>

            {/* Reporter Info Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-4 border-y border-neutral-200 mb-6 text-[10px] font-black text-neutral-450 font-sans tracking-widest uppercase select-none">
              <div className="space-y-1">
                <p className="font-sans italic normal-case text-neutral-500 font-bold">{activeLanguage === "id" ? "Reporter Lapangan & Editor:" : "Field Reporter & Editor:"}</p>
                <p className={`${theme.text} text-[11px]`}>✍️ {activeArticle.author.toUpperCase()}</p>
                <p className="text-neutral-500 text-[9px] lowercase italic font-normal">Editor: {activeArticle.editor}</p>
              </div>
              <div className="space-y-1 sm:text-right">
                <p className="font-sans italic normal-case text-neutral-500 font-bold">{activeLanguage === "id" ? "Waktu Rilis Aktual:" : "Actual Publication Time:"}</p>
                <p className={`${theme.text} text-[11px] flex items-center sm:justify-end gap-1 font-sans`}>
                  <Clock className="h-3.5 w-3.5 text-neutral-400 inline" />
                  <span>{activeArticle.date.toUpperCase()} | {activeArticle.time.toUpperCase()}</span>
                </p>
              </div>
            </div>

            {/* Visual Multimedia Area */}
            <div className="space-y-2 mb-6">
              <div className="flex gap-2.5">
                <button
                  onClick={() => setIsVideoModalOpen(false)}
                  className={`py-1.5 px-3.5 text-[9px] font-black uppercase tracking-wider rounded transition-all cursor-pointer ${
                    !isVideoModalOpen 
                      ? 'bg-neutral-955 text-white shadow' 
                      : 'bg-neutral-100/85 text-neutral-600 border border-transparent'
                  }`}
                >
                  {activeLanguage === "id" ? "📸 Foto Jurnalistik" : "📸 Photo Journalism"}
                </button>
                {activeArticle.videoUrl && (
                  <button
                    onClick={() => {
                      setIsVideoModalOpen(true);
                      setIsVideoMuted(true);
                    }}
                    className={`py-1.5 px-3.5 text-[9px] font-black uppercase tracking-wider rounded transition-all cursor-pointer flex items-center gap-1.5 ${
                      isVideoModalOpen 
                        ? 'bg-red-650 text-white shadow' 
                        : 'bg-neutral-10s text-neutral-600 border border-transparent'
                    }`}
                  >
                    <Video className="h-3.5 w-3.5" />
                    <span>{activeLanguage === "id" ? "🎥 Siaran TV Kampus" : "🎥 Campus Broadcast TV"}</span>
                  </button>
                )}
              </div>

              {/* Display Frame */}
              {!isVideoModalOpen ? (
                <div 
                  onClick={() => onNavigateToLab(activeArticle.id)}
                  className="relative group rounded-xl overflow-hidden bg-neutral-950 shadow aspect-[16/10] max-h-[380px] border border-neutral-200 cursor-pointer hover:border-[#10b981] transition-transform duration-300 hover:scale-[1.01]"
                  title="Buka rilis berita ini di Dapur Redaksi"
                >
                  <img 
                    src={activeArticle.imageUrl} 
                    alt={activeArticle.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover transition-transform duration-500 transform group-hover:scale-105"
                    style={{
                      transform: `scale(${activeArticle.cropZoom})`,
                      filter: `brightness(${activeArticle.brightness}%) contrast(${activeArticle.contrast}%) saturate(${activeArticle.saturation}%) hue-rotate(${activeArticle.hueRotate || 0}deg)`
                    }}
                  />
                  
                  <div className="absolute top-4 left-4 bg-neutral-950 text-white font-sans font-black text-[11px] sm:text-xs uppercase tracking-wider px-4 py-1.5 rounded shadow z-20 select-none">
                    Headline
                  </div>

                  <div className="absolute bottom-3 right-3 bg-black/75 backdrop-blur-sm px-2 py-1 rounded text-[8px] font-sans text-neutral-300 pointer-events-none">
                    Z: {activeArticle.cropZoom.toFixed(2)}x | B: {activeArticle.brightness}% | C: {activeArticle.contrast}%
                  </div>
                </div>
              ) : (
                /* Live Direct TV Broadcast Simulator */
                <div className="relative rounded-xl overflow-hidden bg-black aspect-[16/10] max-h-[380px] border border-neutral-300 shadow flex flex-col justify-between">
                  <div className="absolute inset-0 z-0 bg-slate-950">
                    <video 
                      key={activeArticle.videoUrl} 
                      src={activeArticle.videoUrl} 
                      autoPlay 
                      loop 
                      muted={isVideoMuted}
                      playsInline
                      className="w-full h-full object-cover opacity-70"
                    />
                  </div>

                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent pointer-events-none z-10" />
                  
                  <div className="p-4 z-20 flex justify-between items-start font-sans text-[9px] font-bold text-white uppercase drop-shadow">
                    <div className="flex items-center gap-1.5 bg-red-650 px-2 py-0.5 rounded shadow">
                      <span className="h-1.5 w-1.5 rounded-full bg-white animate-ping"></span>
                      <span>SATELLITE INTERACTIVE • LIVE</span>
                    </div>
                    <div className="text-right text-slate-350">
                      <p>CH: 12 // BROADCAST DEPT</p>
                      <p className="text-[8px] text-emerald-450">LAT: 7.150°S // LON: 111.881°E</p>
                    </div>
                  </div>

                  <div className="absolute bottom-16 left-4 z-20 bg-neutral-900/90 backdrop-blur-sm border border-neutral-800 p-2.5 rounded-lg max-w-xs flex gap-2.5 text-white">
                    <div className="h-8 w-8 rounded-full bg-neutral-950 flex items-center justify-center text-xs font-black font-sans shadow border border-neutral-700">
                      TV
                    </div>
                    <div className="space-y-0.5 text-[10px]">
                      <p className="font-bold font-sans tracking-wider text-emerald-550">Bojonegoro Reporter</p>
                      <p className="text-[9px] text-neutral-300 line-clamp-1">Kondisi Luapan Air Terkini</p>
                    </div>
                  </div>

                  <div className="absolute bottom-16 right-4 z-20 flex gap-2">
                    <button
                      onClick={() => setIsVideoMuted(!isVideoMuted)}
                      className="bg-black/60 hover:bg-black/90 p-1.5 rounded-full text-white border border-white/10"
                    >
                      {isVideoMuted ? <VolumeX className="h-3.5 w-3.5 text-red-500" /> : <Volume2 className="h-3.5 w-3.5 text-green-400" />}
                    </button>
                    <span className="bg-black/60 p-1 px-2 rounded-full font-sans text-[8px] text-slate-300 self-center">
                      TIME: {formattedVideoTime(videoTimer)}
                    </span>
                  </div>

                  <div className="bg-neutral-950 border-t border-neutral-800 py-2.5 overflow-hidden z-25 relative shrink-0">
                    <div className="text-[10px] text-white flex items-center gap-4 px-4 font-sans font-bold whitespace-nowrap">
                      <span className="bg-red-650 text-white px-2 py-0.5 rounded text-[8px] tracking-widest uppercase animate-pulse shrink-0 banner-label font-black">
                        BREAKING NEWS
                      </span>
                      <div className="marquee-scroller-inner italic">
                        MAHASISWA UNUGIRI BOJONEGORO AKTIF MEMANTAU DATA LUAPAN FLUKTUASI SUNGAI PACAL // DATA BPBD SEBUTKAN PULUHAN HEKTAR TANAH PRODUKTIF TERGENANG DI SUKOSEWU // LAPORAN SELESAI.
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className={`text-xs sm:text-sm p-4 rounded-lg ${theme.headlineBg} ${theme.muted} italic leading-relaxed select-none`}>
                {activeArticle.imageCaption}
              </div>
            </div>

            {/* Narrator Player Section */}
            <div className={`mb-6 ${theme.subcard} rounded-xl p-4 sm:p-5 border space-y-4 shadow-sm`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-200/50">
                <div className="flex items-center gap-2">
                  <div className="bg-neutral-950 p-1.5 rounded shadow-sm">
                    <Volume2 className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <h4 className={`text-xs font-serif font-black uppercase tracking-wider ${theme.text}`}>{dt.penyiarNarasi}</h4>
                    <p className={`text-[10px] ${theme.muted} font-sans`}>{dt.penyiarSub}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {/* Dynamic Voice Select dropdown */}
                  {systemVoices.length > 0 && (
                    <select
                      value={selectedVoiceName}
                      aria-label="Pilih Karakter Suara"
                      onChange={(e) => {
                        setSelectedVoiceName(e.target.value);
                        if (isAudioPlaying) {
                          window.speechSynthesis.cancel();
                          setIsAudioPlaying(false);
                          setAudioProgress(0);
                        }
                      }}
                      className="bg-white border border-neutral-300 text-[10px] rounded px-2 py-1 text-neutral-700 max-w-[130px] sm:max-w-[200px] truncate"
                    >
                      {systemVoices.map((voice) => (
                        <option key={voice.name} value={voice.name}>
                          🗣️ {voice.name.replace("Microsoft", "MS").replace("Google", "Google")}
                        </option>
                      ))}
                    </select>
                  )}

                  <select
                    value={audioSpeed}
                    aria-label="Kecepatan suara penyiar"
                    onChange={(e) => {
                      setAudioSpeed(parseFloat(e.target.value));
                      if (isAudioPlaying) {
                        window.speechSynthesis.cancel();
                        setIsAudioPlaying(false);
                        setAudioProgress(0);
                      }
                    }}
                    className="bg-white border border-neutral-300 text-[10px] rounded px-2.5 py-1 text-neutral-700"
                  >
                    <option value="0.75">{dt.tempoLambat}</option>
                    <option value="1.0">{dt.tempoNormal}</option>
                    <option value="1.25">{dt.tempoCepat}</option>
                    <option value="1.5">{dt.tempoSangatCepat}</option>
                  </select>

                  <button
                    onClick={() => {
                      setSelectedVoiceGender(selectedVoiceGender === "female" ? "male" : "female");
                      if (isAudioPlaying) {
                        window.speechSynthesis.cancel();
                        setIsAudioPlaying(false);
                        setAudioProgress(0);
                      }
                    }}
                    className="bg-white border border-neutral-300 text-[10px] font-sans rounded px-2.5 py-1 text-neutral-755 hover:bg-neutral-50 cursor-pointer"
                  >
                    {activeLanguage === "id" ? "Jalur" : "Voice"}: {selectedVoiceGender === "female" ? (activeLanguage === "id" ? "👩 Larasati" : "👩 Sarah") : (activeLanguage === "id" ? "👨 Bambang" : "👨 Brandon")}
                  </button>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 justify-between">
                <button
                  onClick={handleToggleAudioNarrator}
                  className="bg-neutral-950 hover:bg-neutral-800 text-white font-bold text-xs uppercase tracking-wider py-2.5 px-5 rounded flex items-center justify-center gap-2 transition-all cursor-pointer shadow active:scale-95 shrink-0"
                >
                  {isAudioPlaying ? (
                    <>
                      <Pause className="h-4 w-4" />
                      <span>{activeLanguage === "id" ? "Hentikan Siaran" : "Stop Broadcast"}</span>
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 text-emerald-450" />
                      <span>{activeLanguage === "id" ? "🎙️ Mainkan Audio" : "🎙️ Play Audio Story"}</span>
                    </>
                  )}
                </button>

                <div className="flex items-end justify-center h-8 gap-1 bg-white p-2 rounded-lg border border-neutral-200 px-4 flex-1">
                  {eqHeights.map((h, i) => (
                    <motion.div
                      key={i}
                      animate={{ height: h }}
                      transition={{ duration: 0.15 }}
                      className="w-1.5 rounded-t bg-gradient-to-t from-neutral-850 to-neutral-400"
                      style={{ height: `${h}px` }}
                    />
                  ))}
                  <span className="text-[8px] font-sans text-neutral-500 uppercase font-bold ml-4 pr-1 tracking-widest leading-none">
                    {isAudioPlaying ? "ONLINE STREAM" : "MUTED"}
                  </span>
                </div>
              </div>

              {isAudioPlaying && (
                <div className="space-y-1 pt-1 animate-pulse">
                  <div className="flex justify-between text-[9px] font-sans text-neutral-500">
                    <span>MEMBACA TEKS NASKAH AKTUAL...</span>
                    <span>EST: {audioProgress}%</span>
                  </div>
                  <div className="w-full bg-neutral-200 h-1 rounded-full overflow-hidden">
                    <div className="bg-neutral-850 h-full transition-all duration-350" style={{ width: `${audioProgress}%` }} />
                  </div>
                </div>
              )}
            </div>

            {/* Bullet Point Summaries */}
            {activeArticle.bullets && activeArticle.bullets.length > 0 && (
              <div className={`mb-6 ${theme.subcard} border rounded-xl p-5`}>
                <h4 className={`flex items-center gap-1.5 text-xs font-serif font-black ${theme.text} uppercase tracking-wider mb-3`}>
                  <TrendingUp className="h-3.5 w-3.5" />
                  {dt.perks}
                </h4>
                <ul className={`space-y-2.5 text-xs sm:text-sm ${theme.par} font-sans`}>
                  {activeArticle.bullets.map((bullet, idx) => (
                    <li key={idx} className="flex items-start gap-2.5">
                      <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-[#10b981] shrink-0"></span>
                      <span className="leading-relaxed">{bullet}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Content Body */}
            <div className={`news-body prose prose-slate max-w-none ${theme.text} font-sans text-base sm:text-lg leading-relaxed space-y-4 text-justify`}>
              {activeArticle.body.split("\n\n").map((pText, index) => {
                if (index === 0) {
                  return (
                    <p key={index} className={`text-justify font-sans first-letter:text-5xl first-letter:font-serif first-letter:font-black first-letter:text-[#10b981] first-letter:mr-2.5 first-letter:float-left first-letter:leading-none ${theme.par}`}>
                      {pText}
                    </p>
                  );
                }
                return (
                  <p key={index} className={`text-justify font-sans ${theme.par}`}>
                    {pText}
                  </p>
                );
              })}
            </div>

            {/* Bottom layout metadata footer */}
            <div className="mt-8 pt-5 border-t border-neutral-200/50 flex flex-wrap items-center justify-between text-[10px] font-sans text-neutral-450 gap-3">
              <span className="font-bold tracking-wider">{dt.redakturFooter}</span>
              <span className="bg-[#10b981]/10 text-neutral-650 font-bold px-2 py-0.5 rounded border border-neutral-200">{dt.validationBadge}</span>
            </div>
          </motion.article>
        </main>

        {/* Sidebar Archives list & Tools */}
        <aside className="lg:col-span-4 space-y-6">
          {/* Media Search Hub */}
          <div className="bg-neutral-950 text-white rounded-2xl p-5 shadow-md border border-neutral-900 space-y-4">
            <div className="flex items-center gap-2.5 pb-2.5 border-b border-neutral-800">
              <div className="w-1 bg-[#10b981] h-4"></div>
              <h3 className="text-xs font-serif font-black uppercase tracking-wider text-neutral-100">{dt.mediaSearchHub}</h3>
            </div>

            <div className="space-y-3">
              <p className="text-[11px] text-neutral-400 leading-normal">
                {dt.searchDesc}
              </p>
              
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-500" />
                <input
                  type="text"
                  placeholder={activeLanguage === "id" ? "Ketik topik atau nama reporter..." : "Type topic or reporter name..."}
                  value={searchQuery}
                  aria-label="Ketik topik atau nama reporter"
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 text-xs text-white pl-9 pr-4 py-2.5 focus:outline-none focus:border-[#10b981] rounded font-sans"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-400 hover:text-white font-black">&times;</button>
                )}
              </div>
            </div>
          </div>

          {/* Silsilah berita archive sidebar list */}
          <div className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-0.5 bg-[#10b981]"></div>
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-700 font-sans">
                {activeLanguage === "id" ? "SILSILAH BERITA ARSIP" : "CHRONOLOGY OF NEWS ARCHIVES"}
              </h3>
            </div>

            <div className="divide-y divide-neutral-100 max-h-[460px] overflow-y-auto pr-1">
              {filteredArticles.length === 0 ? (
                <p className="py-6 text-center text-xs font-sans text-neutral-400 uppercase italic">
                  {activeLanguage === "id" ? "Nihil hasil penelusuran." : "No news results found."}
                </p>
              ) : (
                filteredArticles.map((art) => (
                  <div
                    key={art.id}
                    onClick={() => handleOpenArticle(art.id)}
                    className={`py-3 flex gap-3 cursor-pointer group transition-all hover:bg-neutral-50/80 hover:px-2 rounded-lg ${art.id === currentHeadlineId ? 'bg-neutral-50 px-2 rounded-lg border-l-2 border-[#10b981]' : ''}`}
                  >
                    <div className="h-14 w-16 bg-neutral-100 rounded-md overflow-hidden shrink-0 border border-neutral-250 relative">
                      <img 
                        src={art.imageUrl} 
                        alt="" 
                        className="h-full w-full object-cover select-none transform group-hover:scale-105 transition-all duration-300"
                      />
                    </div>

                    <div className="space-y-0.5 min-w-0">
                      <span className="text-[9px] font-sans uppercase bg-neutral-100 text-neutral-500 font-black px-1.5 py-0.5 border border-neutral-200 rounded-sm inline-block tracking-wider">
                        {art.category}
                      </span>
                      <h4 className="text-xs font-sans font-bold italic text-neutral-850 hover:text-[#10b981] line-clamp-2 leading-relaxed">
                        {art.title}
                      </h4>
                      <span className="text-[8px] font-sans text-neutral-400 block uppercase font-black">
                        📆 {art.date}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Dapur Redaksi promotion Academy card */}
          <div className="bg-[#0b1712] text-white rounded-2xl p-5 shadow-lg border border-neutral-800 space-y-4">
            <span className="text-[9px] font-sans bg-emerald-950/40 text-emerald-400 px-2.5 py-1 border border-emerald-900/30 rounded uppercase tracking-widest font-black inline-block">
              DAPUR REDAKSI ACADEMY
            </span>
            <h4 className="font-sans italic font-bold text-lg text-neutral-100">
              {activeLanguage === "id" ? "Penyelarasan Naskah via Edisi Lab Editor" : "Manuscript Editing via Lab Editor Edition"}
            </h4>
            <p className="text-xs text-neutral-400 leading-relaxed">
              {activeLanguage === "id" 
                ? "Silakan masuk ke Lab Dapur Jurnalistik kami untuk mempelajari tata bahasa baku sesuai ejaan EYD/PUEBI, serta pengaturan filter visual crop foto jurnalis." 
                : "Enter our Journalism Lab to study standard spelling rules alongside news photography crop tuning."}
            </p>
            <button
              onClick={() => onNavigateToLab(activeArticle.id)}
              className="w-full bg-neutral-900 hover:bg-[#10b981] text-white font-black text-xs uppercase tracking-widest py-3 rounded transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer border border-neutral-800"
            >
              <span>{activeLanguage === "id" ? "Mulai Praktikum Editor" : "Start Editorial Lab Practicum"}</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </aside>

      </div>
    </div>
  );
}
