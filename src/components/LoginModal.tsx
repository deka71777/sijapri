import { useState } from 'react';
import { Lock, LogIn, ShieldAlert, X } from 'lucide-react';
import type { UserAccount } from '../types/sijapri';

interface LoginModalProps {
  users: UserAccount[];
  currentUser: UserAccount;
  onLoginSuccess: (user: UserAccount) => void;
  onClose: () => void;
}

export function LoginModal({ users, currentUser, onLoginSuccess, onClose }: LoginModalProps) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const idClean = identifier.trim().toLowerCase();
    const matched = users.find(
      (u) => u.username.toLowerCase() === idClean || (u.nip !== '-' && u.nip === identifier.trim()),
    );

    if (!matched) {
      setErrorMsg('Username atau NIP tidak ditemukan dalam Master Pengguna.');
      return;
    }
    if (!matched.isActive) {
      setErrorMsg('Akun ini sedang dinonaktifkan oleh Super Admin.');
      return;
    }
    if (matched.password !== password) {
      setErrorMsg('Kata sandi tidak sesuai.');
      return;
    }

    onLoginSuccess(matched);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60">
      <div className="bg-white border border-slate-200 rounded-xl w-full max-w-lg shadow-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Lock className="w-4 h-4 text-blue-600" aria-hidden="true" />
            <h3 className="text-base font-semibold text-slate-900">
              Autentikasi &amp; Uji Hak Akses Role (FR-01)
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
            aria-label="Tutup dialog login"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800 flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 text-red-600 shrink-0 mt-0.5" aria-hidden="true" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Username atau NIP
              </label>
              <input
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="Misal: pranata / operator / kesos"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Kata Sandi</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Default: password123"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-mono"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 px-4 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg inline-flex items-center justify-center gap-2"
          >
            <LogIn className="w-4 h-4" aria-hidden="true" />
            <span>Masuk ke SIJAPRI</span>
          </button>

          <div className="pt-4 border-t border-slate-200">
            <div className="text-xs font-semibold text-slate-700 mb-2">
              Peralihan Cepat Akun Uji RBAC (Klik untuk langsung masuk):
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {users
                .filter((u) => u.isActive)
                .map((u) => {
                  const isCurrent = u.id === currentUser.id;
                  return (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => onLoginSuccess(u)}
                      className={`p-2.5 rounded-lg border text-left transition-colors ${
                        isCurrent
                          ? 'border-blue-600 bg-blue-50/70'
                          : 'border-slate-200 hover:border-blue-400 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-slate-900 truncate">
                          {u.name}
                        </span>
                        <span className="text-[11px] font-semibold text-blue-700 shrink-0">
                          {u.role}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 truncate mt-0.5">
                        user: <span className="font-mono">{u.username}</span> · {u.unitName}
                      </div>
                    </button>
                  );
                })}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
