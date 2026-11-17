import { useState } from 'react';
import { Lock, Plus, X } from 'lucide-react';
import { TODAY_ISO } from '../data/initialData';
import type {
  MaintenancePriority,
  MaintenanceStatus,
  MaintenanceTicket,
  Room,
  UserAccount,
} from '../types/sijapri';
import { StatusIndicator } from './StatusIndicator';

interface MaintenanceViewProps {
  tickets: MaintenanceTicket[];
  rooms: Room[];
  currentUser: UserAccount;
  canManageMaintenance: boolean;
  onAddTicket: (ticket: Omit<MaintenanceTicket, 'id' | 'status'>) => void;
  onUpdateTicketStatus: (id: string, status: MaintenanceStatus) => void;
}

export function MaintenanceView({
  tickets,
  rooms,
  currentUser,
  canManageMaintenance,
  onAddTicket,
  onUpdateTicketStatus,
}: MaintenanceViewProps) {
  const [statusFilter, setStatusFilter] = useState<'Semua' | MaintenanceStatus>('Semua');
  const [showModal, setShowModal] = useState(false);

  const [roomId, setRoomId] = useState(rooms[0]?.id ?? 'R-01');
  const [assetName, setAssetName] = useState('');
  const [issue, setIssue] = useState('');
  const [priority, setPriority] = useState<MaintenancePriority>('Normal');
  const [technician, setTechnician] = useState('Teknisi Internal (Suryadi)');

  const lockedReporter = `${currentUser.name} · ${currentUser.unitName}`;

  const filtered = tickets.filter((t) =>
    statusFilter === 'Semua' ? true : t.status === statusFilter,
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const room = rooms.find((r) => r.id === roomId);
    if (!room || !assetName.trim() || !issue.trim()) return;

    onAddTicket({
      roomId: room.id,
      roomName: room.name,
      assetName: assetName.trim(),
      issue: issue.trim(),
      reportedBy: lockedReporter,
      reportedDate: TODAY_ISO,
      priority,
      technician: canManageMaintenance
        ? technician.trim() || 'Teknisi Internal'
        : 'Menunggu Penugasan Bagian Umum',
    });

    setAssetName('');
    setIssue('');
    setShowModal(false);
  };

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
          {(['Semua', 'Menunggu', 'Dalam Proses', 'Selesai'] as const).map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                statusFilter === status
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors whitespace-nowrap shrink-0"
        >
          <Plus className="w-4 h-4" aria-hidden="true" />
          <span>Laporkan Kerusakan</span>
        </button>
      </div>

      {/* Maintenance Tickets Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-10 text-center text-xs text-slate-500">
            Tidak ada tiket pemeliharaan sarana pada status ini.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold text-slate-500">
                  <th className="px-5 py-3.5">Kode &amp; Tanggal</th>
                  <th className="px-5 py-3.5">Perangkat &amp; Keluhan</th>
                  <th className="px-5 py-3.5">Ruangan</th>
                  <th className="px-5 py-3.5">Prioritas</th>
                  <th className="px-5 py-3.5">Teknisi</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filtered.map((ticket) => (
                  <tr key={ticket.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-3.5 whitespace-nowrap align-top">
                      <div className="font-mono tabular-nums text-xs font-semibold text-slate-900">
                        {ticket.id}
                      </div>
                      <div className="font-mono tabular-nums text-xs text-slate-500 mt-0.5">
                        {ticket.reportedDate}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 align-top max-w-sm">
                      <div className="font-semibold text-slate-900">{ticket.assetName}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{ticket.issue}</div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        Pelapor: {ticket.reportedBy}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-700 align-top">
                      {ticket.roomName}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap align-top">
                      <StatusIndicator status={ticket.priority} />
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-700 align-top">
                      {ticket.technician}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap align-top">
                      <StatusIndicator status={ticket.status} />
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-right align-top">
                      {!canManageMaintenance ? (
                        <span className="text-xs text-slate-400">
                          {ticket.status === 'Selesai' ? 'Terverifikasi' : 'Menunggu Petugas'}
                        </span>
                      ) : (
                        <>
                          {ticket.status === 'Menunggu' && (
                            <button
                              type="button"
                              onClick={() => onUpdateTicketStatus(ticket.id, 'Dalam Proses')}
                              className="px-3 py-1 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-md"
                            >
                              Proses Perbaikan
                            </button>
                          )}
                          {ticket.status === 'Dalam Proses' && (
                            <button
                              type="button"
                              onClick={() => onUpdateTicketStatus(ticket.id, 'Selesai')}
                              className="px-3 py-1 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-md"
                            >
                              Tandai Selesai
                            </button>
                          )}
                          {ticket.status === 'Selesai' && (
                            <span className="text-xs text-slate-400">Terverifikasi</span>
                          )}
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Tambah Laporan Maintenance */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60">
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-lg shadow-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-900">
                Laporkan Pemeliharaan Sarana Ruangan
              </h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
                aria-label="Tutup modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Ruangan</label>
                <select
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
                >
                  {rooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Nama Perangkat / Fasilitas
                  </label>
                  <input
                    type="text"
                    required
                    value={assetName}
                    onChange={(e) => setAssetName(e.target.value)}
                    placeholder="Contoh: Proyektor LCD Epson"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Prioritas</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as MaintenancePriority)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="Normal">Normal</option>
                    <option value="Tinggi">Tinggi</option>
                    <option value="Mendesak">Mendesak</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Deskripsi Keluhan
                </label>
                <textarea
                  rows={3}
                  required
                  value={issue}
                  onChange={(e) => setIssue(e.target.value)}
                  placeholder="Jelaskan kondisi kerusakan secara ringkas..."
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className={canManageMaintenance ? '' : 'sm:col-span-2'}>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Pelapor / Unit (Terkunci)
                  </label>
                  <div className="w-full px-3 py-2 text-sm border border-slate-200 bg-slate-50 text-slate-700 rounded-lg flex items-center justify-between gap-2 select-none">
                    <span className="truncate font-medium">{lockedReporter}</span>
                    <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" aria-hidden="true" />
                  </div>
                  <p className="mt-1 text-[11px] text-slate-500">
                    Otomatis mengikuti data akun pengguna yang sedang aktif.
                  </p>
                </div>
                {canManageMaintenance && (
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Teknisi Penanggung Jawab
                    </label>
                    <input
                      type="text"
                      value={technician}
                      onChange={(e) => setTechnician(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                    />
                  </div>
                )}
              </div>
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
                  Kirim Laporan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
