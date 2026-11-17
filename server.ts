import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;

interface ChatHistoryEntry {
  role: 'user' | 'assistant';
  text: string;
}

interface ChatRequestBody {
  message?: string;
  history?: ChatHistoryEntry[];
  context?: {
    today?: string;
    instansi?: string;
    agendas?: unknown[];
    rooms?: unknown[];
    bookings?: unknown[];
    maintenance?: unknown[];
  };
}

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function isTransientOverloadError(err: unknown): boolean {
  if (!err) return false;
  const text = err instanceof Error ? err.message : String(err);
  const status = (err as { status?: number; code?: number })?.status ?? (err as { code?: number })?.code;
  return (
    status === 503 ||
    status === 429 ||
    text.includes('503') ||
    text.includes('UNAVAILABLE') ||
    text.toLowerCase().includes('high demand')
  );
}

function formatGeminiError(err: unknown): { status: number; message: string } {
  const raw = err instanceof Error ? err.message : String(err);
  if (raw.includes('503') || raw.includes('UNAVAILABLE') || raw.toLowerCase().includes('high demand')) {
    return {
      status: 503,
      message:
        'Layanan Gemini AI sedang mengalami lonjakan permintaan sementara (503 UNAVAILABLE). Silakan tunggu beberapa detik dan coba kirim ulang pesan Anda.',
    };
  }
  if (raw.includes('429') || raw.includes('RESOURCE_EXHAUSTED')) {
    return {
      status: 429,
      message:
        'Batas kuota permintaan Gemini API tercapai sementara (429 RESOURCE_EXHAUSTED). Silakan coba lagi beberapa saat.',
    };
  }
  if (raw.includes('403') || raw.includes('400') || raw.includes('API_KEY_INVALID')) {
    return {
      status: 403,
      message:
        'Kunci API Gemini tidak valid atau belum memiliki izin. Periksa pengaturan GEMINI_API_KEY di panel Settings > Secrets.',
    };
  }
  return {
    status: 500,
    message: raw || 'Terjadi kesalahan saat menghubungi layanan Gemini AI.',
  };
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function generateWithRetry(ai: GoogleGenAI, prompt: string) {
  const systemInstruction =
    'Anda adalah Asisten Cerdas SIJAPRI (Sistem Informasi Jadwal Pimpinan dan Pemakaian Ruangan) Pemerintah Kecamatan Krembung, Kabupaten Sidoarjo. Jawablah dalam bahasa Indonesia yang resmi, lugas, sopan, dan terstruktur. Gunakan hanya data jadwal, ruangan, booking, dan pemeliharaan yang tersedia pada konteks JSON saat menjawab fakta operasional. Jika pengguna meminta draf surat undangan, nota dinas, atau pengumuman rapat, susunlah dengan format administrasi pemerintahan daerah yang rapi dan siap pakai.';

  const attempts: Array<{ model: string; thinkingLevel: ThinkingLevel; delayMs: number }> = [
    { model: 'gemini-4-hydrogen', thinkingLevel: ThinkingLevel.LOW, delayMs: 0 },
    { model: 'gemini-4-hydrogen', thinkingLevel: ThinkingLevel.LOW, delayMs: 900 },
    { model: 'gemini-3.1-flash-lite', thinkingLevel: ThinkingLevel.MINIMAL, delayMs: 1500 },
  ];

  let lastError: unknown;
  for (const attempt of attempts) {
    if (attempt.delayMs > 0) {
      await sleep(attempt.delayMs);
    }
    try {
      return await ai.models.generateContent({
        model: attempt.model,
        contents: prompt,
        config: {
          systemInstruction,
          thinkingConfig: {
            thinkingLevel: attempt.thinkingLevel,
          },
        },
      });
    } catch (err) {
      lastError = err;
      if (!isTransientOverloadError(err)) {
        throw err;
      }
    }
  }
  throw lastError;
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', service: 'sijapri-krembung' });
  });

  app.post('/api/chat', async (req, res) => {
    try {
      const body = req.body as ChatRequestBody;
      const userMessage = body.message?.trim();
      if (!userMessage) {
        res.status(400).json({ error: 'Pesan tidak boleh kosong.' });
        return;
      }

      const ai = getGeminiClient();
      if (!ai) {
        res.status(503).json({
          error:
            'GEMINI_API_KEY belum dikonfigurasi pada environment server. Silakan periksa panel Settings > Secrets.',
        });
        return;
      }

      const contextSummary = JSON.stringify(
        {
          tanggalHariIni: body.context?.today ?? '2026-11-16',
          instansi: body.context?.instansi ?? 'Pemerintah Kecamatan Krembung, Kabupaten Sidoarjo',
          agendaPimpinan: body.context?.agendas ?? [],
          daftarRuangan: body.context?.rooms ?? [],
          bookingRuangan: body.context?.bookings ?? [],
          laporanMaintenance: body.context?.maintenance ?? [],
        },
        null,
        2,
      );

      const historyText = (body.history ?? [])
        .slice(-8)
        .map((item) => `${item.role === 'user' ? 'Pengguna' : 'Asisten SIJAPRI'}: ${item.text}`)
        .join('\n');

      const prompt = [
        'Berikut adalah data operasional terkini SIJAPRI Kecamatan Krembung dalam format JSON:',
        contextSummary,
        historyText ? `\nRiwayat percakapan sebelumnya:\n${historyText}` : '',
        `\nPertanyaan/Instruksi pengguna saat ini:\n${userMessage}`,
      ]
        .filter(Boolean)
        .join('\n');

      const response = await generateWithRetry(ai, prompt);

      const replyText = response.text?.trim();
      if (!replyText) {
        res.status(502).json({ error: 'Model tidak mengembalikan teks respons.' });
        return;
      }

      res.json({ reply: replyText });
    } catch (err) {
      console.error('Error /api/chat:', err);
      const formatted = formatGeminiError(err);
      res.status(formatted.status).json({ error: formatted.message });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SIJAPRI Kecamatan Krembung server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
