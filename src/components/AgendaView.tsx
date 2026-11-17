import { useState } from 'react';
import { Lock, Plus, Search, Trash2, X } from 'lucide-react';
import { LEADER_AVATARS, TODAY_ISO } from '../data/initialData';
import type {
  AgendaItem,
  AgendaStatus,
  InstansiSettings,
  LeaderRole,
  Room,
} from '../types/sijapri';
import { StatusIndicator } from './StatusIndicator';

interface AgendaViewProps {
  agendas: AgendaItem[];
  rooms: Room[];
  settings: InstansiSettings;
  canManageAgendas: boolean;
  onAddAgenda: (agenda: Omit<AgendaItem, 'id'>) => void;
  onUpdateStatus: (id: string, status: AgendaStatus) => void;
  onDeleteAgenda: (id: string) => void;
}

const ROLE_FILTERS: Array<'Semua' | LeaderRole> = [
  'Semua',
  'Camat',
  'Sekcam',
  'Kasi Pemerintahan',
  'Kasi Kesos',
  'Kasi Trantib',
];

const KASI_DEFAULT_NAME: Record<Exclude<LeaderRole, 'Camat' | 'Sekcam'>, string> = {
  'Kasi Pemerintahan': 'Hendra Kusuma, S.Sos.',
  'Kasi Kesos': 'Siti Aminah, S.Pd.',
  'Kasi Trantib': 'Agus Prasetyo, S.H.',
};

function resolveLeaderName(role: LeaderRole, settings: InstansiSettings): string {
  if (role === 'Camat') {
    return settings.camatNama.trim() || 'Camat Krembung';
  }
  if (role === 'Sekcam') {
    return settings.sekcamNama.trim() || 'Sekretaris Camat Krembung';
  }
  return KASI_DEFAULT_NAME[role];
}

export function AgendaView({
  agendas,
  rooms,
  settings,
  canManageAgendas,
  onAddAgenda,
  onUpdateStatus,
  onDeleteAgenda,
}: AgendaViewProps) {
  const [roleFilter, setRoleFilter] = useState<'Semua' | LeaderRole>('Semua');
  const [statusFilter, setStatusFilter] = useState<'Semua' | AgendaStatus>('Semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  const [formTitle, setFormTitle] = useState('');
  const [formRole, setFormRole] = useState<LeaderRole>('Camat');
  const [formDate, setFormDate] = useState(TODAY_ISO);
  const [formStart, setFormStart] = useState('09:00');
  const [formEnd, setFormEnd] = useState('11:00');
  const [formLocation, setFormLocation] = useState(rooms[0]?.name ?? 'Pendopo Kecamatan Krembung');
  const [formDisposition, setFormDisposition] = useState('');
  const [formPriority, setFormPriority] = useState<'Tinggi' | 'Normal'>('Normal');

  const lockedLeaderName = resolveLeaderName(formRole, settings);

  const filtered = agendas
    .filter((item) => (roleFilter === 'Semua' ? true : item.leaderRole === roleFilter))
    .filter((item) => (statusFilter === 'Semua' ? true : item.status === statusFilter))
    .filter((item) => {
      const q = searchQuery.trim().toLowerCase();
      if (!q) return true;
      return (
        item.title.toLowerCase().includes(q) ||
        item.leaderName.toLowerCase().includes(q) ||
        item.location.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => `${a.date}${a.startTime}`.localeCompare(`${b.date}${b.startTime}`));

  const handleRoleChange = (role: LeaderRole) => {
    setFormRole(role);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;
    onAddAgenda({
      title: formTitle.trim(),
      leaderName: lockedLeaderName,
      leaderRole: formRole,
      date: formDate,
      startTime: formStart,
      endTime: formEnd,
      location: formLocation.trim() || 'Kantor Kecamatan Krembung',
      status: 'Terjadwal',
      disposition: formDisposition.trim() || 'Koordinasi sekretariat kecamatan.',
      priority: formPriority,
    });
    setFormTitle('');
    setFormDisposition('');
    setShowAddModal(false);
  };

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-lg">
          {ROLE_FILTERS.map((role) => (
            <button
              key={role}
              type="button"
              onClick={() => setRoleFilter(role)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                roleFilter === role
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {role}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 sm:w-64">
            <Search
              className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"
              aria-hidden="true"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari kegiatan, pimpinan, lokasi..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'Semua' | AgendaStatus)}
            aria-label="Filter status agenda"
            className="px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white text-slate-700 focus:outline-none focus:border-blue-600"
          >
            <option value="Semua">Semua Status</option>
            <option value="Terjadwal">Terjadwal</option>
            <option value="Berlangsung">Berlangsung</option>
            <option value="Selesai">Selesai</option>
            <option value="Ditunda">Ditunda</option>
          </select>

          {canManageAgendas && (
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              <Plus className="w-4 h-4" aria-hidden="true" />
              <span>Tambah Agenda</span>
            </button>
          )}
        </div>
      </div>

      {/* High-Density Agenda Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <p className="text-sm font-medium text-slate-700">
              Tidak ada agenda pimpinan yang sesuai dengan filter pencarian.
            </p>
            <button
              type="button"
              onClick={() => {
                setRoleFilter('Semua');
                setStatusFilter('Semua');
                setSearchQuery('');
              }}
              className="text-xs font-medium text-blue-600 hover:underline"
            >
              Atur ulang filter
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold text-slate-500">
                  <th className="px-5 py-3.5">Tanggal &amp; Jam</th>
                  <th className="px-5 py-3.5">Kegiatan &amp; Disposisi</th>
                  <th className="px-5 py-3.5">Pejabat Pimpinan</th>
                  <th className="px-5 py-3.5">Lokasi</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Tindakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filtered.map((item) => {
                  const avatar = LEADER_AVATARS[item.leaderRole];
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-5 py-3.5 whitespace-nowrap align-top">
                        <div className="font-mono tabular-nums text-xs font-semibold text-slate-900">
                          {item.date}
                        </div>
                        <div className="font-mono tabular-nums text-xs text-slate-500 mt-0.5">
                          {item.startTime} – {item.endTime}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 align-top max-w-md">
                        <div className="font-semibold text-slate-900 leading-snug">{item.title}</div>
                        <div className="mt-1 text-xs text-slate-500">{item.disposition}</div>
                        {item.priority === 'Tinggi' && (
                          <div className="mt-1 text-xs font-medium text-amber-700">
                            Prioritas Tinggi
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap align-top">
                        <div className="flex items-center gap-2.5">
                          {avatar ? (
                            <img
                              src={avatar}
                              alt={item.leaderName}
                              referrerPolicy="no-referrer"
                              className="w-8 h-8 rounded-md object-cover border border-slate-200 shrink-0"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-md bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-semibold text-slate-700 shrink-0">
                              {item.leaderRole.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div className="text-xs font-semibold text-slate-900">
                              {item.leaderName}
                            </div>
                            <div className="text-xs text-slate-500">{item.leaderRole}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-slate-700 align-top">
                        {item.location}
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap align-top">
                        <StatusIndicator status={item.status} />
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap text-right align-top">
                        {canManageAgendas ? (
                          <div className="inline-flex items-center gap-2">
                            <select
                              value={item.status}
                              onChange={(e) =>
                                onUpdateStatus(item.id, e.target.value as AgendaStatus)
                              }
                              aria-label={`Ubah status ${item.title}`}
                              className="px-2 py-1 text-xs border border-slate-200 rounded-md bg-white text-slate-700 focus:outline-none focus:border-blue-600"
                            >
                              <option value="Terjadwal">Terjadwal</option>
                              <option value="Berlangsung">Berlangsung</option>
                              <option value="Selesai">Selesai</option>
                              <option value="Ditunda">Ditunda</option>
                            </select>
                            <button
                              type="button"
                              onClick={() => onDeleteAgenda(item.id)}
                              className="p-1.5 text-slate-400 hover:text-red-600 rounded-md hover:bg-red-50 transition-colors"
                              aria-label={`Hapus agenda ${item.title}`}
                            >
                              <Trash2 className="w-4 h-4" aria-hidden="true" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">Hanya Baca</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Tambah Agenda */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60">
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-lg shadow-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-900">
                Tambah Agenda Pimpinan Baru
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
                aria-label="Tutup formulir"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Nama Kegiatan / Rapat
                </label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Contoh: Rapat Evaluasi Pelayanan Publik Triwulan IV"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Jabatan</label>
                  <select
                    value={formRole}
                    onChange={(e) => handleRoleChange(e.target.value as LeaderRole)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="Camat">Camat</option>
                    <option value="Sekcam">Sekcam</option>
                    <option value="Kasi Pemerintahan">Kasi Pemerintahan</option>
                    <option value="Kasi Kesos">Kasi Kesos</option>
                    <option value="Kasi Trantib">Kasi Trantib</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Nama Pejabat (Terkunci)
                  </label>
                  <div className="w-full px-3 py-2 text-sm border border-slate-200 bg-slate-50 text-slate-700 rounded-lg flex items-center justify-between gap-2 select-none">
                    <span className="truncate font-medium">{lockedLeaderName}</span>
                    <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" aria-hidden="true" />
                  </div>
                  <p className="mt-1 text-[11px] text-slate-500">
                    Otomatis mengikuti nama pejabat pada menu Pengaturan.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Tanggal</label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Mulai</label>
                  <input
                    type="time"
                    required
                    value={formStart}
                    onChange={(e) => setFormStart(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Selesai</label>
                  <input
                    type="time"
                    required
                    value={formEnd}
                    onChange={(e) => setFormEnd(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Lokasi</label>
                  <input
                    type="text"
                    required
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value)}
                    placeholder="Ruang Rapat Utama / Luar Kantor"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Prioritas</label>
                  <select
                    value={formPriority}
                    onChange={(e) => setFormPriority(e.target.value as 'Tinggi' | 'Normal')}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="Normal">Normal</option>
                    <option value="Tinggi">Tinggi</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Catatan / Disposisi
                </label>
                <textarea
                  rows={2}
                  value={formDisposition}
                  onChange={(e) => setFormDisposition(e.target.value)}
                  placeholder="Instruksi singkat atau unit kerja pendamping..."
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
                >
                  Simpan Agenda
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
