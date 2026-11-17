import { useRef, useState } from 'react';
import { AlertCircle, Bot, Loader2, Send, User } from 'lucide-react';
import { TODAY_ISO } from '../data/initialData';
import type {
  AgendaItem,
  ChatMessage,
  InstansiSettings,
  MaintenanceTicket,
  Room,
  RoomBooking,
} from '../types/sijapri';

interface ChatbotViewProps {
  agendas: AgendaItem[];
  rooms: Room[];
  bookings: RoomBooking[];
  maintenance: MaintenanceTicket[];
  settings: InstansiSettings;
}

const SUGGESTED_PROMPTS = [
  'Kapan jadwal Pak Camat hari ini?',
  'Apakah Pendopo Kecamatan kosong besok jam 9 pagi?',
  'Bagaimana status ruangan dan tiket maintenance hari ini?',
  'Buatkan draf surat undangan rapat koordinasi Forkopimka.',
];

export function ChatbotView({
  agendas,
  rooms,
  bookings,
  maintenance,
  settings,
}: ChatbotViewProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: 'Selamat datang di Asisten Cerdas SIJAPRI Kecamatan Krembung. Saya terhubung langsung dengan data agenda pimpinan, ketersediaan ruangan, dan tiket pemeliharaan saat ini. Ada yang dapat saya bantu?',
      timestamp: '08:00',
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const sendMessage = async (textToSend: string) => {
    const trimmed = textToSend.trim();
    if (!trimmed || isLoading) return;

    const nowTime = new Date().toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: trimmed,
      timestamp: nowTime,
    };

    const nextHistory = [...messages, userMsg];
    setMessages(nextHistory);
    setInput('');
    setIsLoading(true);

    setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 50);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          history: messages.slice(-6).map((m) => ({ role: m.role, text: m.text })),
          context: {
            today: TODAY_ISO,
            instansi: `${settings.namaInstansi} (${settings.kabupaten})`,
            agendas,
            rooms: rooms.map(({ imageUrl: _img, ...rest }) => rest),
            bookings,
            maintenance,
          },
        }),
      });

      const data = (await response.json()) as { reply?: string; error?: string };

      if (!response.ok || !data.reply) {
        throw new Error(data.error || 'Gagal mendapatkan respons dari Asisten AI.');
      }

      const replyMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        role: 'assistant',
        text: data.reply,
        timestamp: new Date().toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
        }),
      };
      setMessages((prev) => [...prev, replyMsg]);
    } catch (err) {
      const errText =
        err instanceof Error ? err.message : 'Terjadi gangguan koneksi ke layanan AI.';
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          text: errText,
          timestamp: new Date().toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit',
          }),
          isError: true,
        },
      ]);
    } finally {
      setIsLoading(false);
      setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 50);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl flex flex-col h-[calc(100vh-11rem)] min-h-[520px] overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-slate-900 text-white flex items-center justify-center shrink-0">
            <Bot className="w-5 h-5" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Asisten AI SIJAPRI Kecamatan Krembung
            </h2>
            <p className="text-xs text-slate-500">
              Pencarian jadwal pimpinan, cek bentrok ruangan, dan penyusunan draf surat rapat
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() =>
            setMessages([
              {
                id: 'welcome-reset',
                role: 'assistant',
                text: 'Percakapan telah dimulai ulang. Silakan ajukan pertanyaan mengenai jadwal pimpinan atau pemakaian ruangan Kecamatan Krembung.',
                timestamp: new Date().toLocaleTimeString('id-ID', {
                  hour: '2-digit',
                  minute: '2-digit',
                }),
              },
            ])
          }
          className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
        >
          Percakapan Baru
        </button>
      </div>

      {/* Quick Prompt Suggestions */}
      <div className="px-6 py-3 border-b border-slate-100 bg-slate-50/70 flex flex-wrap gap-2">
        {SUGGESTED_PROMPTS.map((prompt) => (
          <button
            key={prompt}
            type="button"
            disabled={isLoading}
            onClick={() => sendMessage(prompt)}
            className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:border-blue-400 hover:text-blue-700 rounded-lg transition-colors text-left"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/40">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-3 ${
              msg.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            {msg.role === 'assistant' && (
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${
                  msg.isError
                    ? 'bg-red-50 border-red-200 text-red-600'
                    : 'bg-slate-900 border-slate-800 text-white'
                }`}
              >
                {msg.isError ? (
                  <AlertCircle className="w-4 h-4" aria-hidden="true" />
                ) : (
                  <Bot className="w-4 h-4" aria-hidden="true" />
                )}
              </div>
            )}

            <div
              className={`max-w-2xl rounded-xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : msg.isError
                    ? 'bg-red-50 border border-red-200 text-red-800'
                    : 'bg-white border border-slate-200 text-slate-800'
              }`}
            >
              <div>{msg.text}</div>
              <div
                className={`mt-1.5 text-[11px] font-mono tabular-nums ${
                  msg.role === 'user' ? 'text-blue-100' : 'text-slate-400'
                }`}
              >
                {msg.timestamp}
              </div>
            </div>

            {msg.role === 'user' && (
              <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center shrink-0">
                <User className="w-4 h-4" aria-hidden="true" />
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4" aria-hidden="true" />
            </div>
            <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-600 inline-flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-blue-600" aria-hidden="true" />
              <span>Memeriksa data jadwal &amp; menyusun jawaban...</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          sendMessage(input);
        }}
        className="p-4 border-t border-slate-200 bg-white flex items-center gap-3"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={isLoading}
          placeholder="Tanyakan jadwal Camat, ketersediaan Pendopo, atau minta draf undangan rapat..."
          className="flex-1 px-4 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600 disabled:bg-slate-50"
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 rounded-lg transition-colors whitespace-nowrap shrink-0"
        >
          <Send className="w-4 h-4" aria-hidden="true" />
          <span>Kirim</span>
        </button>
      </form>
    </div>
  );
}
