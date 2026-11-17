import { useState } from 'react';
import {
  Building2,
  Clock,
  Eye,
  EyeOff,
  Lock,
  LogIn,
  MapPin,
  ShieldAlert,
  ShieldCheck,
  User,
} from 'lucide-react';
import type { InstansiSettings, UserAccount } from '../types/sijapri';

interface LoginViewProps {
  users: UserAccount[];
  settings: InstansiSettings;
  onLoginSuccess: (user: UserAccount) => void;
}

const ROLE_DESCRIPTIONS: { role: string; summary: string }[] = [
  { role: 'Super Admin', summary: 'Kontrol penuh seluruh modul, user, dan pengaturan instansi' },
  { role: 'Operator', summary: 'Kelola agenda pimpinan, verifikasi booking, dan tiket sarana' },
  { role: 'Pimpinan', summary: 'Pantau dashboard, kalender terpadu, dan status agenda pimpinan' },
  { role: 'Pemohon', summary: 'Ajukan peminjaman ruangan serta laporkan kerusakan sarana' },
];

export function LoginView({ users, settings, onLoginSuccess }: LoginViewProps) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const idClean = identifier.trim().toLowerCase();
    if (!idClean || !password) {
      setErrorMsg('Harap masukkan Username / NIP dan Kata Sandi terlebih dahulu.');
      return;
    }

    const matched = users.find(
      (u) => u.username.toLowerCase() === idClean || (u.nip !== '-' && u.nip === identifier.trim()),
    );

    if (!matched) {
      setErrorMsg('Username atau NIP tidak ditemukan dalam Master Pengguna.');
      return;
    }
    if (!matched.isActive) {
      setErrorMsg('Akun ini sedang dinonaktifkan oleh Super Admin. Hubungi administrator.');
      return;
    }
    if (matched.password !== password) {
      setErrorMsg('Kata sandi yang Anda masukkan tidak sesuai.');
      return;
    }

    onLoginSuccess(matched);
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-slate-50 text-slate-900">
      {/* Left Institutional Panel */}
      <aside className="lg:col-span-5 bg-[#0F172A] text-slate-100 p-8 sm:p-10 lg:p-12 flex flex-col justify-between gap-8 border-b lg:border-b-0 lg:border-r border-slate-800">
        <div className="space-y-8">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center shrink-0">
              <svg
                viewBox="0 0 24 24"
                className="w-6 h-6 text-blue-400"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                aria-hidden="true"
              >
                <path d="M12 2L4 5.5v5.5c0 5 3.4 9.6 8 11 4.6-1.4 8-6 8-11V5.5L12 2z" />
                <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <div className="text-xl font-bold tracking-tight text-white leading-none">
                SIJAPRI
              </div>
              <div className="text-xs text-slate-400 mt-1">
                Sistem Informasi Jadwal Pimpinan &amp; Pemakaian Ruangan
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-2 border-t border-slate-800/80">
            <div className="text-xs font-semibold uppercase tracking-wider text-blue-400">
              Portal Resmi Instansi
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white leading-snug">
              {settings.namaInstansi}
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">{settings.kabupaten}</p>

            <div className="pt-2 space-y-2 text-xs text-slate-400">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" aria-hidden="true" />
                <span>{settings.alamat}</span>
              </div>
              <div className="flex items-start gap-2.5">
                <Clock className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" aria-hidden="true" />
                <span>{settings.jamLayanan}</span>
              </div>
              <div className="flex items-start gap-2.5">
                <Building2 className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" aria-hidden="true" />
                <span>
                  Camat: <span className="text-slate-200">{settings.camatNama}</span>
                </span>
              </div>
            </div>
          </div>

          <div className="hidden sm:block pt-4 border-t border-slate-800/80 space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
              <ShieldCheck className="w-4 h-4 text-blue-400" aria-hidden="true" />
              <span>Hak Akses Berbasis Role (RBAC)</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2">
              {ROLE_DESCRIPTIONS.map((item) => (
                <div
                  key={item.role}
                  className="px-3 py-2 rounded-lg bg-slate-900/70 border border-slate-800 text-xs"
                >
                  <span className="font-semibold text-white">{item.role}</span>
                  <span className="text-slate-400"> — {item.summary}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="text-xs text-slate-500 border-t border-slate-800/80 pt-4">
          &copy; 2026 {settings.namaInstansi} · Terintegrasi Pengelolaan Jadwal &amp; Sarana
        </div>
      </aside>

      {/* Right Login Form Area */}
      <main className="lg:col-span-7 flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Masuk ke Aplikasi SIJAPRI</h2>
            <p className="text-xs text-slate-500 mt-1">
              Masukkan Username atau NIP beserta kata sandi akun instansi Anda.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMsg && (
              <div
                role="alert"
                className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800 flex items-start gap-2.5"
              >
                <ShieldAlert className="w-4 h-4 text-red-600 shrink-0 mt-0.5" aria-hidden="true" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div>
              <label
                htmlFor="login-identifier"
                className="block text-xs font-semibold text-slate-700 mb-1.5"
              >
                Username atau NIP
              </label>
              <div className="relative">
                <User
                  className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                  aria-hidden="true"
                />
                <input
                  id="login-identifier"
                  type="text"
                  autoFocus
                  autoComplete="username"
                  required
                  value={identifier}
                  onChange={(e) => {
                    setIdentifier(e.target.value);
                    setErrorMsg(null);
                  }}
                  placeholder="Masukkan username atau NIP"
                  className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-300 rounded-lg font-mono focus:outline-none focus:border-blue-600"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="login-password"
                className="block text-xs font-semibold text-slate-700 mb-1.5"
              >
                Kata Sandi
              </label>
              <div className="relative">
                <Lock
                  className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                  aria-hidden="true"
                />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setErrorMsg(null);
                  }}
                  placeholder="Masukkan kata sandi"
                  className="w-full pl-9 pr-10 py-2.5 text-sm border border-slate-300 rounded-lg font-mono focus:outline-none focus:border-blue-600"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 rounded"
                  aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" aria-hidden="true" />
                  ) : (
                    <Eye className="w-4 h-4" aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors inline-flex items-center justify-center gap-2"
            >
              <LogIn className="w-4 h-4" aria-hidden="true" />
              <span>Masuk ke Aplikasi</span>
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
