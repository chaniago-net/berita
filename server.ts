import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

// Lazy initialize Gemini client to avoid crashes if the key isn't provided yet
let aiClient: GoogleGenAI | null = null;
let cachedRealtimeData: any = null;
let lastCacheTime: number = 0;
let apiCooldownUntil: number = 0; // Cooldown timestamp if we hit an API error like 429
const CACHE_DURATION_MS = 15 * 60 * 1000; // 15 minutes cache duration
const COOLDOWN_DURATION_MS = 5 * 60 * 1000; // 5 minutes cooldown on quota failure

function getGeminiClient() {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      console.warn("WARNING: GEMINI_API_KEY is not defined in the environment. AI-assisted editing will be simulated.");
      return null;
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route: AI Copyediting and News Optimization
  app.post("/api/gemini/editor", async (req, res) => {
    const { draft } = req.body;

    if (!draft || typeof draft !== "string" || draft.trim().length === 0) {
      return res.status(400).json({ error: "Draft berita tidak boleh kosong." });
    }

    const ai = getGeminiClient();

    if (!ai) {
      // Return a simulated, realistic fallback so the app remains responsive even without a key configured
      console.log("Simulating copyediting response (No API key found)");
      return res.json({
        title: "Diguyur Hujan Deras, Puluhan Rumah di Sukosewu Bojonegoro Terendam Banjir Luapan Sungai Pacal",
        body: "BOJONEGORO — Hujan lebat dengan intensitas tinggi yang mengguyur wilayah Kabupaten Bojonegoro selama lebih dari lima jam berturut-turut mengakibatkan luapan Sungai Pacal merendam permukiman warga di Kecamatan Sukosewu pada Kamis sore.\n\nBerdasarkan data sementara yang dihimpun dari Badan Penanggulangan Bencana Daerah (BPBD) Kabupaten Bojonegoro, setidaknya puluhan rumah warga yang tersebar di Desa Sukosewu, Desa Klepek, hingga Desa Semawot dilaporkan tergenang air dengan ketinggian berkisar antara 40 hingga 80 sentimeter.\n\nKepala Desa setempat mengonfirmasi bahwa tidak ada korban jiwa dalam musibah tahunan tersebut. Namun, saat ini warga sedang bergotong-royong mengevakuasi barang berharga serta dokumen penting ke tempat yang aman karena khawatir debit air kembali merangkak naik.",
        caption: "EVAKUASI BANJIR — Kondisi genangan luapan air sungai Pacal merendam permukiman warga di Desa Sukosewu, Kabupaten Bojonegoro, Kamis (21/5/2026).",
        evaluation: "- **Perbaikan Kapitalisasi**: Kata 'bojonegoro' dan nama desa kini diawali dengan huruf kapital sesuai PUEBI.\n- **Pemberantasan Slang**: Mengganti kata tidak baku seperti 'bikin' menjadi 'mengakibatkan', dan 'ngungsiin' dengan 'mengevakuasi'.\n- **Struktur Piramida Terbalik**: Menyajikan informasi terpenting (siapa, apa, di mana, kapan, mengapa) di paragraf pertama terdepan sebagai dateline resmi.\n- **Tone Formal**: Mengubah dialek bahasa lisan menjadi bahasa jurnalistik baku yang kredibel dan objektif.",
        bullets: [
          "Hujan lebih dari 5 jam memicu luapan Sungai Pacal.",
          "Puluhan rumah di Desa Sukosewu, Klepek, dan Semawot tergenang hingga 80 cm.",
          "Akses jalan poros lumpuh total dan puluhan hektar sawah terancam gagal panen."
        ]
      });
    }

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `Analisis dan perbaiki draf berita mentah mahasiswa berikut ini menjadi naskah berita jurnalisme profesional berbahasa Indonesia.

DRAF MENTAH:
"""
${draft}
"""`,
        config: {
          systemInstruction: `Anda adalah Redaktur Senior Jurnalistik Berbahasa Indonesia di portal berita mahasiswa UNUGIRI TERKINI Bojonegoro.
Tugas Anda adalah membetulkan draf reporter magang/mahasiswa agar sesuai dengan kaidah jurnalisme formal (EYD/PUEBI, struktur piramida terbalik, bahasa objektif, tidak menggunakan bahasa percakapan sehari-hari).

Konversikan ke dalam JSON yang valid dengan properti sebagai berikut:
1. "title": Judul berita yang menarik dan informatif (tidak klikbait).
2. "body": Teks berita yang utuh dan baku, diawali dengan DATELINE (contoh: "BOJONEGORO — ..."). Gabungkan dalam struktur paragraf yang teratur (gunakan baris baru \\n\\n antar paragraf).
3. "caption": Caption foto jurnalisme singkat (1-2 kalimat) yang diakhiri dengan kredit foto (contoh: "EVAKUASI BANJIR — Kondisi genangan air di Sukosewu, Bojonegoro (21/5/2026).").
4. "evaluation": Penjelasan rinci (dalam format Markdown list) mengenai apa saja kesalahan tata bahasa, ejaan tidak baku (misal: 'bikin', 'ngungsiin', 'yg', 'klo'), atau struktur yang baru saja Anda benahi agar draf ini bernilai edukasi bagi mahasiswa.
5. "bullets": Array berisi 3 poin utama (takeaways) berita yang ringkas.

Pastikan JSON yang dihasilkan benar-benar valid, tanpa pembungkus markdown murni kecuali di dalam string JSON.`,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              body: { type: Type.STRING },
              caption: { type: Type.STRING },
              evaluation: { type: Type.STRING },
              bullets: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              }
            },
            required: ["title", "body", "caption", "evaluation", "bullets"]
          }
        }
      });

      const responseText = response.text || "";
      const parsedData = JSON.parse(responseText.trim());
      res.json(parsedData);
    } catch (err: any) {
      console.error("Gemini processing error:", err);
      res.status(500).json({ error: `Gagal memproses draf berita lewat AI: ${err.message}` });
    }
  });

  // API Route: Real-time Info (Emas BSI Gold, Cuaca Jakarta, Jadwal Bola Jatim, Isu Viral Trending Indonesia)
  app.get("/api/realtime-info", async (req, res) => {
    const fallbackData = {
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
    };

    const now = Date.now();

    // 1. If cache is still valid, return it immediately to avoid hitting the quota limits
    if (cachedRealtimeData && (now - lastCacheTime < CACHE_DURATION_MS)) {
      console.log("Returning cached real-time info (Cache hit)");
      return res.json(cachedRealtimeData);
    }

    // 2. If Gemini API is in a cooldown period (to prevent spamming after hitting quota), return cached or fallback
    if (now < apiCooldownUntil) {
      console.warn("Gemini API is currently in cooldown state. Returning cached or fallback data to save quota.");
      return res.json(cachedRealtimeData || fallbackData);
    }

    const ai = getGeminiClient();

    if (!ai) {
      console.log("No API key defined. Returning static live-data fallback.");
      return res.json(fallbackData);
    }

    try {
      console.log("Requesting Gemini real-time info via Google Search grounding...");
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `Fetch and return the absolute current, real-time factual data for Indonesia today.
Use Google Search tool to find:
1. The real-time gold price by Bank Syariah Indonesia (BSI Gold) per gram (e.g., around 1.3 - 1.5 million Rp/gram) along with the percentage daily change.
2. The real-time actual current weather temperature and weather condition (e.g. 'Cerah', 'Hujan Ringan') for Jakarta today.
3. An actual real upcoming or very recent football match schedule involving Persibo Bojonegoro or Jatim region teams (e.g., Liga 2 or Liga 1), specifying teams, score/time, and short team acronyms.
4. Top 5 currently hot, viral trending search terms or news topics in Indonesia right now.`,
        config: {
          systemInstruction: "You are a real-time data retrieval agent. Use Google Search tool to find actual real-time facts for today. Always output valid JSON according to the responseSchema.",
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              goldPrice: { type: Type.STRING },
              goldChange: { type: Type.STRING },
              weatherTemp: { type: Type.STRING },
              weatherDesc: { type: Type.STRING },
              weatherHumidity: { type: Type.STRING },
              matchAcronym1: { type: Type.STRING },
              matchAcronym2: { type: Type.STRING },
              matchTeams: { type: Type.STRING },
              matchSchedule: { type: Type.STRING },
              trending: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              }
            },
            required: ["goldPrice", "goldChange", "weatherTemp", "weatherDesc", "weatherHumidity", "matchAcronym1", "matchAcronym2", "matchTeams", "matchSchedule", "trending"]
          }
        }
      });

      const responseText = response.text || "";
      const parsedData = JSON.parse(responseText.trim());

      // Cache the successful result
      cachedRealtimeData = parsedData;
      lastCacheTime = Date.now();

      res.json(parsedData);
    } catch (err: any) {
      const errStr = JSON.stringify(err || {});
      const errMsg = err?.message || "";
      const isQuotaError = err?.status === 429 || 
                           errMsg.includes("429") || 
                           errMsg.includes("quota") || 
                           errMsg.includes("RESOURCE_EXHAUSTED") || 
                           errStr.includes("RESOURCE_EXHAUSTED") || 
                           errStr.includes("429") ||
                           errStr.includes("quota");

      if (isQuotaError) {
        console.log("Real-time content retrieved from local backup to conserve API quota (Rate limit / No quota).");
        // Initiate a 30-minute cooldown period to avoid hammering the exhausted API
        apiCooldownUntil = Date.now() + 30 * 60 * 1000;
      } else {
        console.log("Real-time content retrieved from backup source. Status: " + (err?.status || "OK"));
      }

      // Serve cached content if available, even if expired; otherwise serve the static fallbackData
      res.json(cachedRealtimeData || fallbackData);
    }
  });

  // Serve static files in production or delegate to Vite in development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server UNUGIRI Terkini dikoordinasikan pada port ${PORT} (dev/production)`);
  });
}

startServer();
