import { useState } from 'react';
import {
  Edit2,
  KeyRound,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  UserCheck,
  UserX,
  X,
} from 'lucide-react';
import type { AuditLogEntry, UserAccount, UserRole } from '../types/sijapri';
import { StatusIndicator } from './StatusIndicator';

interface UserManagementViewProps {
  users: UserAccount[];
  currentUser: UserAccount;
  auditLogs: AuditLogEntry[];
  onAddUser: (user: Omit<UserAccount, 'id' | 'lastLogin'>) => void;
  onUpdateUser: (id: string, patch: Partial<UserAccount>) => void;
  onDeleteUser: (id: string) => void;
}

const ROLE_OPTIONS: UserRole[] = ['Super Admin', 'Operator', 'Pimpinan', 'Pemohon'];

const RBAC_MATRIX: Array<{
  role: UserRole;
  title: string;
  capabilities: string;
  restrictions: string;
}> = [
  {
    role: 'Super Admin',
    title: 'Super Admin (Pranata Komputer)',
    capabilities:
      'Manajemen akun pengguna, pengaturan role, master data ruangan & pimpinan, konfigurasi WhatsApp API, dan audit log.',
    restrictions: 'Tidak ada batasan akses sistem.',
  },
  {
    role: 'Operator',
    title: 'Operator / Ajudan / Bagian Umum',
    capabilities:
      'Input & edit jadwal pimpinan, persetujuan (approve/reject) peminjaman ruangan, pengelolaan tiket maintenance, dan rekap.',
    restrictions: 'Tidak dapat mengakses Manajemen User atau Pengaturan Sistem.',
  },
  {
    role: 'Pimpinan',
    title: 'Pimpinan (Camat / Sekcam)',
    capabilities:
      'Melihat dashboard ringkasan, agenda pimpinan, kalender terpadu, memperbarui status agenda, dan menggunakan Chatbot AI Assistant.',
    restrictions:
      'Tidak memiliki akses ke menu Booking Ruangan, Maintenance, Manajemen User, maupun Pengaturan Sistem.',
  },
  {
    role: 'Pemohon',
    title: 'Pemohon (Seksi / Staf / Desa)',
    capabilities:
      'Melihat kalender ketersediaan, mengajukan form peminjaman Pendopo atau Ruang Rapat, dan melaporkan kerusakan sarana pada menu Maintenance.',
    restrictions:
      'Dilarang menyetujui/menolak permohonan booking, mengubah status perbaikan Maintenance, mengubah agenda pimpinan, atau mengakses Pengaturan & Manajemen User.',
  },
];

export function UserManagementView({
  users,
  currentUser,
  auditLogs,
  onAddUser,
  onUpdateUser,
  onDeleteUser,
}: UserManagementViewProps) {
  const [activeTab, setActiveTab] = useState<'users' | 'rbac' | 'audit'>('users');
  const [roleFilter, setRoleFilter] = useState<'Semua' | UserRole>('Semua');
  const [searchQuery, setSearchQuery] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);
  const [resetTarget, setResetTarget] = useState<UserAccount | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [nip, setNip] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('password123');
  const [phoneWa, setPhoneWa] = useState('');
  const [unitName, setUnitName] = useState('');
  const [role, setRole] = useState<UserRole>('Pemohon');
  const [isActive, setIsActive] = useState(true);

  const openCreateModal = () => {
    setEditingUser(null);
    setFormError(null);
    setName('');
    setNip('');
    setUsername('');
    setPassword('password123');
    setPhoneWa('');
    setUnitName('');
    setRole('Pemohon');
    setIsActive(true);
    setShowModal(true);
  };

  const openEditModal = (user: UserAccount) => {
    setEditingUser(user);
    setFormError(null);
    setName(user.name);
    setNip(user.nip);
    setUsername(user.username);
    setPassword(user.password);
    setPhoneWa(user.phoneWa);
    setUnitName(user.unitName);
    setRole(user.role);
    setIsActive(user.isActive);
    setShowModal(true);
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const cleanUsername = username.trim().toLowerCase();
    if (!name.trim() || !cleanUsername || !unitName.trim()) {
      setFormError('Nama lengkap, username, dan seksi/desa asal wajib diisi.');
      return;
    }

    const duplicate = users.find(
      (u) => u.username.toLowerCase() === cleanUsername && u.id !== editingUser?.id,
    );
    if (duplicate) {
      setFormError(`Username "${cleanUsername}" sudah digunakan oleh ${duplicate.name}.`);
      return;
    }

    if (editingUser) {
      onUpdateUser(editingUser.id, {
        name: name.trim(),
        nip: nip.trim() || '-',
        username: cleanUsername,
        phoneWa: phoneWa.trim() || '-',
        unitName: unitName.trim(),
        role,
        isActive,
      });
    } else {
      if (password.trim().length < 6) {
        setFormError('Kata sandi minimal 6 karakter.');
        return;
      }
      onAddUser({
        name: name.trim(),
        nip: nip.trim() || '-',
        username: cleanUsername,
        password: password.trim(),
        phoneWa: phoneWa.trim() || '-',
        unitName: unitName.trim(),
        role,
        isActive,
      });
    }

    setShowModal(false);
  };

  const handleConfirmResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetTarget || newPassword.trim().length < 6) return;
    onUpdateUser(resetTarget.id, { password: newPassword.trim() });
    setResetTarget(null);
    setNewPassword('');
  };

  const filteredUsers = users
    .filter((u) => (roleFilter === 'Semua' ? true : u.role === roleFilter))
    .filter((u) => {
      const q = searchQuery.trim().toLowerCase();
      if (!q) return true;
      return (
        u.name.toLowerCase().includes(q) ||
        u.nip.toLowerCase().includes(q) ||
        u.username.toLowerCase().includes(q) ||
        u.unitName.toLowerCase().includes(q)
      );
    });

  return (
    <div className="space-y-6">
      {/* 4-Card Role Distribution Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {ROLE_OPTIONS.map((r) => {
          const countAll = users.filter((u) => u.role === r).length;
          const countActive = users.filter((u) => u.role === r && u.isActive).length;
          return (
            <div
              key={r}
              className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Role {r}</span>
                <ShieldCheck className="w-4 h-4 text-blue-600" aria-hidden="true" />
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-bold font-mono tabular-nums text-slate-900">
                  {countAll}
                </span>
                <span className="text-xs text-slate-500">akun terdaftar</span>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-emerald-700 font-medium">
                {countActive} akun aktif
              </div>
            </div>
          );
        })}
      </div>

      {/* Sub-navigation Tabs */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg self-start">
          <button
            type="button"
            onClick={() => setActiveTab('users')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              activeTab === 'users'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Daftar Pengguna ({users.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('rbac')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              activeTab === 'rbac'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Matriks Hak Akses (RBAC)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('audit')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              activeTab === 'audit'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Audit Log ({auditLogs.length})
          </button>
        </div>

        {activeTab === 'users' && (
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 sm:w-60">
              <Search
                className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"
                aria-hidden="true"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama, NIP, unit..."
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600"
              />
            </div>

            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as 'Semua' | UserRole)}
              aria-label="Filter role pengguna"
              className="px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white text-slate-700"
            >
              <option value="Semua">Semua Role</option>
              {ROLE_OPTIONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              <Plus className="w-4 h-4" aria-hidden="true" />
              <span>Tambah User</span>
            </button>
          </div>
        )}
      </div>

      {/* Tab 1: Master Pengguna Table */}
      {activeTab === 'users' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          {filteredUsers.length === 0 ? (
            <div className="p-10 text-center text-xs text-slate-500">
              Tidak ditemukan akun pengguna sesuai filter pencarian.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold text-slate-500">
                    <th className="px-5 py-3.5">Nama Lengkap &amp; NIP</th>
                    <th className="px-5 py-3.5">Username</th>
                    <th className="px-5 py-3.5">Seksi / Desa Asal</th>
                    <th className="px-5 py-3.5">No. WhatsApp</th>
                    <th className="px-5 py-3.5">Role Akses</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5 text-right">Tindakan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {filteredUsers.map((user) => {
                    const isSelf = user.id === currentUser.id;
                    return (
                      <tr key={user.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-5 py-3.5 align-top">
                          <div className="font-semibold text-slate-900">
                            {user.name}
                            {isSelf && (
                              <span className="ml-2 text-[11px] font-medium text-blue-600">
                                (Sesi Aktif)
                              </span>
                            )}
                          </div>
                          <div className="font-mono tabular-nums text-xs text-slate-500 mt-0.5">
                            NIP: {user.nip}
                          </div>
                        </td>
                        <td className="px-5 py-3.5 align-top font-mono text-xs text-slate-700">
                          {user.username}
                        </td>
                        <td className="px-5 py-3.5 align-top text-xs text-slate-700">
                          {user.unitName}
                        </td>
                        <td className="px-5 py-3.5 align-top font-mono tabular-nums text-xs text-slate-700">
                          {user.phoneWa}
                        </td>
                        <td className="px-5 py-3.5 align-top whitespace-nowrap">
                          <span
                            className={`text-xs font-semibold ${
                              user.role === 'Super Admin'
                                ? 'text-blue-700'
                                : user.role === 'Operator'
                                  ? 'text-emerald-700'
                                  : user.role === 'Pimpinan'
                                    ? 'text-amber-700'
                                    : 'text-slate-700'
                            }`}
                          >
                            {user.role}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 align-top whitespace-nowrap">
                          <StatusIndicator status={user.isActive ? 'Aktif' : 'Nonaktif'} />
                        </td>
                        <td className="px-5 py-3.5 align-top whitespace-nowrap text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => openEditModal(user)}
                              className="p-1.5 rounded-md text-slate-500 hover:text-blue-700 hover:bg-blue-50"
                              title="Ubah Data & Role"
                              aria-label={`Ubah ${user.name}`}
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setResetTarget(user);
                                setNewPassword('');
                              }}
                              className="p-1.5 rounded-md text-slate-500 hover:text-amber-700 hover:bg-amber-50"
                              title="Reset Kata Sandi"
                              aria-label={`Reset kata sandi ${user.name}`}
                            >
                              <KeyRound className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              disabled={isSelf}
                              onClick={() => onUpdateUser(user.id, { isActive: !user.isActive })}
                              className={`p-1.5 rounded-md ${
                                isSelf
                                  ? 'text-slate-300 cursor-not-allowed'
                                  : user.isActive
                                    ? 'text-slate-500 hover:text-amber-700 hover:bg-amber-50'
                                    : 'text-emerald-600 hover:bg-emerald-50'
                              }`}
                              title={user.isActive ? 'Nonaktifkan Akun' : 'Aktifkan Akun'}
                              aria-label={`${user.isActive ? 'Nonaktifkan' : 'Aktifkan'} ${user.name}`}
                            >
                              {user.isActive ? (
                                <UserX className="w-4 h-4" />
                              ) : (
                                <UserCheck className="w-4 h-4" />
                              )}
                            </button>
                            <button
                              type="button"
                              disabled={isSelf}
                              onClick={() => onDeleteUser(user.id)}
                              className={`p-1.5 rounded-md ${
                                isSelf
                                  ? 'text-slate-300 cursor-not-allowed'
                                  : 'text-slate-400 hover:text-red-600 hover:bg-red-50'
                              }`}
                              title="Hapus Akun"
                              aria-label={`Hapus ${user.name}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: RBAC Matrix */}
      {activeTab === 'rbac' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200">
            <h2 className="text-base font-semibold text-slate-900">
              Matriks Hak Akses (Role-Based Access Control) — PRD Bab 2.1
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Pembagian kewenangan operasional di lingkungan Kantor Kecamatan Krembung
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold text-slate-500">
                  <th className="px-6 py-3.5">Role Sistem</th>
                  <th className="px-6 py-3.5">Kewenangan Utama</th>
                  <th className="px-6 py-3.5">Batasan Keamanan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {RBAC_MATRIX.map((row) => (
                  <tr key={row.role} className="hover:bg-slate-50/70">
                    <td className="px-6 py-4 font-semibold text-slate-900 whitespace-nowrap align-top">
                      {row.title}
                    </td>
                    <td className="px-6 py-4 text-slate-700 leading-relaxed align-top">
                      {row.capabilities}
                    </td>
                    <td className="px-6 py-4 text-slate-500 leading-relaxed align-top">
                      {row.restrictions}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Audit Logs */}
      {activeTab === 'audit' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200">
            <h2 className="text-base font-semibold text-slate-900">
              Audit Trail Aktivitas Pengguna (PRD Bab 12)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Catatan otomatis perubahan akun, jadwal pimpinan, dan verifikasi ruangan
            </p>
          </div>
          <div className="divide-y divide-slate-100">
            {auditLogs.map((log) => (
              <div
                key={log.id}
                className="px-6 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs hover:bg-slate-50/60"
              >
                <div>
                  <span className="font-semibold text-slate-900">{log.userName}</span>
                  <span className="text-slate-400 mx-1.5">·</span>
                  <span className="font-medium text-blue-700">{log.userRole}</span>
                  <div className="mt-0.5 text-slate-700">{log.action}</div>
                </div>
                <div className="text-left sm:text-right shrink-0">
                  <div className="font-medium text-slate-600">{log.target}</div>
                  <div className="font-mono tabular-nums text-slate-400 mt-0.5">
                    {log.timestamp}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal Tambah / Edit User */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60">
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-lg shadow-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-900">
                {editingUser ? 'Ubah Data Pengguna' : 'Tambah Akun Pengguna Baru'}
              </h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
                aria-label="Tutup modal pengguna"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmitForm} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Nama Lengkap
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Nama lengkap & gelar"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    NIP (Opsional untuk Desa)
                  </label>
                  <input
                    type="text"
                    value={nip}
                    onChange={(e) => setNip(e.target.value)}
                    placeholder="18 digit NIP atau -"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Username</label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="huruf kecil tanpa spasi"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-mono"
                  />
                </div>
                {!editingUser ? (
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Kata Sandi Awal
                    </label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-mono"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Nomor WhatsApp
                    </label>
                    <input
                      type="text"
                      value={phoneWa}
                      onChange={(e) => setPhoneWa(e.target.value)}
                      placeholder="0812..."
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-mono"
                    />
                  </div>
                )}
              </div>

              {!editingUser && (
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Nomor WhatsApp (Gateway Notifikasi)
                  </label>
                  <input
                    type="text"
                    value={phoneWa}
                    onChange={(e) => setPhoneWa(e.target.value)}
                    placeholder="Contoh: 081234567890"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-mono"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Seksi / Unit / Desa Asal
                  </label>
                  <input
                    type="text"
                    required
                    value={unitName}
                    onChange={(e) => setUnitName(e.target.value)}
                    placeholder="Contoh: Seksi Trantib / Desa Rejeni"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Role Akses</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
                  >
                    {ROLE_OPTIONS.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <label className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 accent-blue-600"
                />
                <span>Akun Aktif (diizinkan masuk ke aplikasi SIJAPRI)</span>
              </label>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
                >
                  {editingUser ? 'Simpan Perubahan' : 'Daftarkan Pengguna'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Reset Password */}
      {resetTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60">
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-md shadow-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-900">Reset Kata Sandi</h3>
              <button
                type="button"
                onClick={() => setResetTarget(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
                aria-label="Tutup reset sandi"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleConfirmResetPassword} className="p-6 space-y-4">
              <p className="text-xs text-slate-600">
                Masukkan kata sandi baru untuk akun{' '}
                <span className="font-semibold text-slate-900">{resetTarget.name}</span> (
                <span className="font-mono">{resetTarget.username}</span>).
              </p>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Kata Sandi Baru (min. 6 karakter)
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-mono"
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setResetTarget(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg"
                >
                  Simpan Kata Sandi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
