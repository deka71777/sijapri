import { useMemo, useState } from 'react';
import { Check, Code2, Copy, Download, Save } from 'lucide-react';
import type { InstansiSettings } from '../types/sijapri';
import { generateSingleFileHtml } from '../utils/singleFileHtmlTemplate';

interface SettingsViewProps {
  settings: InstansiSettings;
  onSaveSettings: (next: InstansiSettings) => void;
}

export function SettingsView({ settings, onSaveSettings }: SettingsViewProps) {
  const [form, setForm] = useState<InstansiSettings>(settings);
  const [savedNotice, setSavedNotice] = useState(false);
  const [copiedHtml, setCopiedHtml] = useState(false);
  const [showHtmlPreview, setShowHtmlPreview] = useState(false);

  const singleFileHtml = useMemo(() => generateSingleFileHtml(), []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(form);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  };

  const handleCopyHtml = async () => {
    try {
      await navigator.clipboard.writeText(singleFileHtml);
      setCopiedHtml(true);
      setTimeout(() => setCopiedHtml(false), 2500);
    } catch {
      setShowHtmlPreview(true);
    }
  };

  const handleDownloadHtml = () => {
    const blob = new Blob([singleFileHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'sijapri-kecamatan-krembung.html';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left 7 Cols: Instansi Profile & Operational Rules */}
      <form
        onSubmit={handleSave}
        className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 space-y-5"
      >
        <div>
          <h2 className="text-base font-semibold text-slate-900">
            Profil Instansi &amp; Operasional SIJAPRI
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Pengaturan identitas resmi Kecamatan Krembung dan aturan validasi jadwal
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Nama Instansi</label>
            <input
              type="text"
              required
              value={form.namaInstansi}
              onChange={(e) => setForm({ ...form, namaInstansi: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Wilayah Administrasi
            </label>
            <input
              type="text"
              required
              value={form.kabupaten}
              onChange={(e) => setForm({ ...form, kabupaten: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Alamat Kantor</label>
          <input
            type="text"
            required
            value={form.alamat}
            onChange={(e) => setForm({ ...form, alamat: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Telepon Sekretariat
            </label>
            <input
              type="text"
              value={form.telepon}
              onChange={(e) => setForm({ ...form, telepon: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-mono"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Jam Layanan Publik
            </label>
            <input
              type="text"
              value={form.jamLayanan}
              onChange={(e) => setForm({ ...form, jamLayanan: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Camat Krembung</label>
            <input
              type="text"
              value={form.camatNama}
              onChange={(e) => setForm({ ...form, camatNama: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Sekretaris Camat
            </label>
            <input
              type="text"
              value={form.sekcamNama}
              onChange={(e) => setForm({ ...form, sekcamNama: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
            />
          </div>
        </div>

        <div className="pt-3 border-t border-slate-200 space-y-3">
          <label className="flex items-center justify-between gap-4 cursor-pointer">
            <div>
              <div className="text-sm font-medium text-slate-900">
                Deteksi Bentrok Jadwal Ruangan Otomatis
              </div>
              <div className="text-xs text-slate-500">
                Mencegah pengajuan peminjaman ruangan pada jam yang sudah terisi
              </div>
            </div>
            <input
              type="checkbox"
              checked={form.autoKonflikCheck}
              onChange={(e) => setForm({ ...form, autoKonflikCheck: e.target.checked })}
              className="w-4 h-4 accent-blue-600"
            />
          </label>

          <label className="flex items-center justify-between gap-4 cursor-pointer">
            <div>
              <div className="text-sm font-medium text-slate-900">
                Pengingat Agenda via WhatsApp Kedinasan
              </div>
              <div className="text-xs text-slate-500">
                Kirim ringkasan jadwal pagi pukul 06.30 WIB ke pimpinan terkait
              </div>
            </div>
            <input
              type="checkbox"
              checked={form.notifikasiWa}
              onChange={(e) => setForm({ ...form, notifikasiWa: e.target.checked })}
              className="w-4 h-4 accent-blue-600"
            />
          </label>
        </div>

        <div className="pt-2 flex items-center justify-between gap-4">
          {savedNotice ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700">
              <Check className="w-4 h-4" aria-hidden="true" />
              <span>Pengaturan berhasil disimpan.</span>
            </span>
          ) : (
            <span />
          )}
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors"
          >
            <Save className="w-4 h-4" aria-hidden="true" />
            <span>Simpan Pengaturan</span>
          </button>
        </div>
      </form>

      {/* Right 5 Cols: Single-File HTML (Tailwind CDN + Alpine.js) Export */}
      <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-slate-900 text-white flex items-center justify-center shrink-0">
            <Code2 className="w-5 h-5" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Ekspor Kerangka Single-File HTML
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Unduh atau salin versi HTML tunggal mandiri menggunakan Tailwind CSS CDN dan Alpine.js
              v3 untuk kebutuhan prototipe statis Kecamatan Krembung.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 pt-2">
          <button
            type="button"
            onClick={handleCopyHtml}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            {copiedHtml ? (
              <>
                <Check className="w-4 h-4" aria-hidden="true" />
                <span>Tersalin ke Clipboard</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" aria-hidden="true" />
                <span>Salin Kode HTML</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleDownloadHtml}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" aria-hidden="true" />
            <span>Unduh .HTML</span>
          </button>

          <button
            type="button"
            onClick={() => setShowHtmlPreview((v) => !v)}
            className="px-3 py-2 text-xs font-medium text-blue-600 hover:text-blue-800"
          >
            {showHtmlPreview ? 'Sembunyikan Kode' : 'Lihat Kode'}
          </button>
        </div>

        {showHtmlPreview && (
          <pre className="mt-3 p-3.5 rounded-lg bg-slate-900 text-slate-100 text-[11px] font-mono overflow-x-auto max-h-80 leading-relaxed">
            <code>{singleFileHtml}</code>
          </pre>
        )}
      </div>
    </div>
  );
}
