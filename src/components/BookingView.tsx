import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Building2, Check, ShieldAlert, X } from 'lucide-react';
import { TODAY_ISO } from '../data/initialData';
import type { BookingStatus, Room, RoomBooking } from '../types/sijapri';
import { StatusIndicator } from './StatusIndicator';

interface BookingViewProps {
  rooms: Room[];
  bookings: RoomBooking[];
  preselectedRoomId?: string | null;
  autoKonflikCheck: boolean;
  canVerifyBookings: boolean;
  onAddBooking: (booking: Omit<RoomBooking, 'id' | 'status'>) => void;
  onUpdateBookingStatus: (id: string, status: BookingStatus) => void;
}

function timeOverlaps(startA: string, endA: string, startB: string, endB: string): boolean {
  return startA < endB && endA > startB;
}

export function BookingView({
  rooms,
  bookings,
  preselectedRoomId,
  autoKonflikCheck,
  canVerifyBookings,
  onAddBooking,
  onUpdateBookingStatus,
}: BookingViewProps) {
  const [selectedRoomId, setSelectedRoomId] = useState(preselectedRoomId || rooms[0]?.id || 'R-01');
  const [applicantSection, setApplicantSection] = useState('');
  const [date, setDate] = useState('2026-11-17');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('11:00');
  const [purpose, setPurpose] = useState('');
  const [attendees, setAttendees] = useState(25);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<'Semua' | BookingStatus>('Semua');

  useEffect(() => {
    if (preselectedRoomId) {
      setSelectedRoomId(preselectedRoomId);
    }
  }, [preselectedRoomId]);

  const selectedRoom = rooms.find((r) => r.id === selectedRoomId) ?? rooms[0];

  // Validasi Anti-Bentrok Real-Time (Conflict Detection)
  const liveConflict = useMemo(() => {
    if (!selectedRoom || !autoKonflikCheck) return null;
    if (selectedRoom.status === 'Pemeliharaan') {
      return {
        type: 'maintenance' as const,
        message: `Ruangan tidak tersedia: ${selectedRoom.name} sedang dalam status Pemeliharaan.`,
      };
    }
    if (!date || !startTime || !endTime || startTime >= endTime) {
      return null;
    }
    const found = bookings.find(
      (b) =>
        b.roomId === selectedRoom.id &&
        b.date === date &&
        (b.status === 'Disetujui' || b.status === 'Pending') &&
        timeOverlaps(startTime, endTime, b.startTime, b.endTime),
    );
    if (found) {
      return {
        type: 'overlap' as const,
        booking: found,
        message: `Ruangan tidak tersedia: slot ${startTime}–${endTime} WIB pada ${date} di ${selectedRoom.name} bentrok dengan "${found.purpose}" (${found.startTime}–${found.endTime} WIB · ${found.unitOrVillage}).`,
      };
    }
    return null;
  }, [selectedRoom, autoKonflikCheck, date, startTime, endTime, bookings]);

  const handleSimulateConflict = () => {
    setSubmitError(null);
    setSuccessMsg(null);
    setSelectedRoomId('R-01');
    setApplicantSection('Seksi Pemerintahan Kec. Krembung');
    setDate('2026-11-16');
    setStartTime('09:00');
    setEndTime('10:30');
    setPurpose('Simulasi Uji Bentrok Jadwal Pendopo');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setSuccessMsg(null);

    if (!selectedRoom) return;
    if (!applicantSection.trim() || !purpose.trim()) {
      setSubmitError('Harap lengkapi Nama Pemohon / Seksi dan Keperluan kegiatan.');
      return;
    }
    if (startTime >= endTime) {
      setSubmitError('Jam Selesai harus lebih lambat daripada Jam Mulai.');
      return;
    }
    if (attendees > selectedRoom.capacity) {
      setSubmitError(
        `Jumlah peserta (${attendees}) melebihi kapasitas ${selectedRoom.name} (${selectedRoom.capacity} kursi).`,
      );
      return;
    }
    if (liveConflict) {
      setSubmitError(liveConflict.message);
      return;
    }

    onAddBooking({
      roomId: selectedRoom.id,
      roomName: selectedRoom.name,
      requesterName: applicantSection.trim(),
      unitOrVillage: applicantSection.trim(),
      date,
      startTime,
      endTime,
      purpose: purpose.trim(),
      attendees,
    });

    setApplicantSection('');
    setPurpose('');
    setSuccessMsg(
      `Pengajuan peminjaman ${selectedRoom.name} pada ${date} (${startTime}–${endTime} WIB) berhasil dikirim dengan status Pending.`,
    );
  };

  const filteredBookings = bookings
    .filter((b) => (filterStatus === 'Semua' ? true : b.status === filterStatus))
    .sort((a, b) => `${b.date}${b.startTime}`.localeCompare(`${a.date}${a.startTime}`));

  return (
    <div className="space-y-6">
      {/* Room Catalog Strip */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {rooms.map((room) => {
          const isSelected = room.id === selectedRoomId;
          return (
            <button
              key={room.id}
              type="button"
              onClick={() => {
                setSelectedRoomId(room.id);
                setSubmitError(null);
              }}
              className={`text-left bg-white rounded-xl border overflow-hidden transition-colors flex flex-col ${
                isSelected
                  ? 'border-blue-600 ring-1 ring-blue-600'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              {room.imageUrl ? (
                <img
                  src={room.imageUrl}
                  alt={room.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-32 object-cover"
                />
              ) : (
                <div className="w-full h-32 bg-slate-100 flex flex-col items-center justify-center text-slate-400">
                  <Building2 className="w-7 h-7" aria-hidden="true" />
                  <span className="mt-1 text-xs font-medium text-slate-500">{room.building}</span>
                </div>
              )}
              <div className="p-4 flex-1 flex flex-col justify-between gap-2">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">{room.name}</h3>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {room.building} ·{' '}
                    <span className="font-mono tabular-nums">{room.capacity} kursi</span>
                  </p>
                </div>
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <StatusIndicator status={room.status} />
                  {isSelected && <span className="text-xs font-semibold text-blue-600">Dipilih</span>}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Form + Status Pengajuan Table Split */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left 5 Cols: Formulir Pengajuan Peminjaman */}
        <form
          onSubmit={handleSubmit}
          className="xl:col-span-5 bg-white border border-slate-200 rounded-xl p-6 space-y-4"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Formulir Peminjaman Ruangan
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Validasi anti-bentrok (Conflict Detection) berjalan otomatis
              </p>
            </div>
            <button
              type="button"
              onClick={handleSimulateConflict}
              className="px-2.5 py-1.5 text-xs font-medium text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg whitespace-nowrap shrink-0"
            >
              Uji Bentrok
            </button>
          </div>

          {/* Peringatan Merah Conflict Detection */}
          {(liveConflict || submitError) && (
            <div
              role="alert"
              className="p-3.5 rounded-lg bg-red-50 border border-red-300 text-xs text-red-900 flex items-start gap-2.5"
            >
              <ShieldAlert className="w-4 h-4 text-red-600 shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <div className="font-semibold text-red-800">Peringatan Validasi Anti-Bentrok</div>
                <div className="mt-0.5 leading-relaxed">{submitError || liveConflict?.message}</div>
              </div>
            </div>
          )}

          {successMsg && !liveConflict && !submitError && (
            <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-start gap-2.5">
              <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" aria-hidden="true" />
              <span>{successMsg}</span>
            </div>
          )}

          <div>
            <label htmlFor="booking-applicant" className="block text-xs font-medium text-slate-700 mb-1">
              Nama Pemohon / Seksi
            </label>
            <input
              id="booking-applicant"
              type="text"
              required
              value={applicantSection}
              onChange={(e) => setApplicantSection(e.target.value)}
              placeholder="Contoh: Kasi Kesos / Pemerintah Desa Mojoruntut"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600"
            />
          </div>

          <div>
            <label htmlFor="booking-room" className="block text-xs font-medium text-slate-700 mb-1">
              Pilih Ruangan
            </label>
            <select
              id="booking-room"
              value={selectedRoomId}
              onChange={(e) => {
                setSelectedRoomId(e.target.value);
                setSubmitError(null);
              }}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-blue-600"
            >
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} (Kapasitas {r.capacity} orang — {r.status})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label htmlFor="booking-date" className="block text-xs font-medium text-slate-700 mb-1">
                Tanggal
              </label>
              <input
                id="booking-date"
                type="date"
                required
                min={TODAY_ISO}
                value={date}
                onChange={(e) => {
                  setDate(e.target.value);
                  setSubmitError(null);
                }}
                className="w-full px-2.5 py-2 text-xs border border-slate-300 rounded-lg font-mono focus:outline-none focus:border-blue-600"
              />
            </div>
            <div>
              <label htmlFor="booking-start" className="block text-xs font-medium text-slate-700 mb-1">
                Jam Mulai
              </label>
              <input
                id="booking-start"
                type="time"
                required
                value={startTime}
                onChange={(e) => {
                  setStartTime(e.target.value);
                  setSubmitError(null);
                }}
                className="w-full px-2.5 py-2 text-xs border border-slate-300 rounded-lg font-mono focus:outline-none focus:border-blue-600"
              />
            </div>
            <div>
              <label htmlFor="booking-end" className="block text-xs font-medium text-slate-700 mb-1">
                Jam Selesai
              </label>
              <input
                id="booking-end"
                type="time"
                required
                value={endTime}
                onChange={(e) => {
                  setEndTime(e.target.value);
                  setSubmitError(null);
                }}
                className="w-full px-2.5 py-2 text-xs border border-slate-300 rounded-lg font-mono focus:outline-none focus:border-blue-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label htmlFor="booking-purpose" className="block text-xs font-medium text-slate-700 mb-1">
                Keperluan
              </label>
              <input
                id="booking-purpose"
                type="text"
                required
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="Rapat Koordinasi, Musdes, atau Sosialisasi"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600"
              />
            </div>
            <div>
              <label htmlFor="booking-attendees" className="block text-xs font-medium text-slate-700 mb-1">
                Peserta
              </label>
              <input
                id="booking-attendees"
                type="number"
                required
                min={1}
                max={300}
                value={attendees}
                onChange={(e) => setAttendees(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-mono tabular-nums focus:outline-none focus:border-blue-600"
              />
            </div>
          </div>

          <button
            type="submit"
            className={`w-full py-2.5 px-4 text-sm font-semibold text-white rounded-lg transition-colors flex items-center justify-center gap-2 ${
              liveConflict
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {liveConflict && <AlertTriangle className="w-4 h-4" aria-hidden="true" />}
            <span>
              {liveConflict ? 'Slot Bentrok — Pilih Waktu Lain' : 'Ajukan Peminjaman Ruangan'}
            </span>
          </button>
        </form>

        {/* Right 7 Cols: Tabel Daftar Status Pengajuan */}
        <div className="xl:col-span-7 bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Daftar Status Pengajuan Ruangan
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Verifikasi permohonan berstatus Pending, Disetujui, atau Ditolak
              </p>
            </div>
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
              {(['Semua', 'Pending', 'Disetujui', 'Ditolak'] as const).map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setFilterStatus(status)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                    filterStatus === status
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {filteredBookings.length === 0 ? (
            <div className="p-10 text-center text-xs text-slate-500">
              Belum ada pengajuan peminjaman pada status {filterStatus}.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold text-slate-500">
                    <th className="px-5 py-3">Tanggal &amp; Jam</th>
                    <th className="px-5 py-3">Ruangan</th>
                    <th className="px-5 py-3">Pemohon / Seksi</th>
                    <th className="px-5 py-3">Keperluan</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {filteredBookings.map((booking) => (
                    <tr key={booking.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-5 py-3.5 whitespace-nowrap align-top">
                        <div className="font-mono tabular-nums text-xs font-semibold text-slate-900">
                          {booking.date}
                        </div>
                        <div className="font-mono tabular-nums text-xs text-slate-500 mt-0.5">
                          {booking.startTime} – {booking.endTime}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 align-top">
                        <div className="text-xs font-semibold text-slate-900">
                          {booking.roomName}
                        </div>
                        <div className="text-[11px] font-mono tabular-nums text-slate-500 mt-0.5">
                          {booking.attendees} peserta
                        </div>
                      </td>
                      <td className="px-5 py-3.5 align-top text-xs text-slate-700">
                        <div className="font-medium text-slate-900">{booking.unitOrVillage}</div>
                        {booking.requesterName !== booking.unitOrVillage && (
                          <div className="text-slate-500 mt-0.5">{booking.requesterName}</div>
                        )}
                      </td>
                      <td className="px-5 py-3.5 align-top text-xs text-slate-700 max-w-xs">
                        {booking.purpose}
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap align-top">
                        <StatusIndicator status={booking.status} />
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap text-right align-top">
                        {!canVerifyBookings ? (
                          <span className="text-xs text-slate-400">Hanya Admin/Operator</span>
                        ) : (
                          <>
                            {booking.status === 'Pending' && (
                              <div className="inline-flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => onUpdateBookingStatus(booking.id, 'Disetujui')}
                                  className="p-1.5 rounded-md bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                                  title="Setujui Pengajuan"
                                  aria-label={`Setujui ${booking.purpose}`}
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => onUpdateBookingStatus(booking.id, 'Ditolak')}
                                  className="p-1.5 rounded-md bg-red-50 text-red-700 hover:bg-red-100 border border-red-200"
                                  title="Tolak Pengajuan"
                                  aria-label={`Tolak ${booking.purpose}`}
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                            {booking.status === 'Disetujui' && (
                              <button
                                type="button"
                                onClick={() => onUpdateBookingStatus(booking.id, 'Ditolak')}
                                className="text-xs font-medium text-slate-500 hover:text-red-700"
                              >
                                Batalkan
                              </button>
                            )}
                            {(booking.status === 'Ditolak' || booking.status === 'Dibatalkan') && (
                              <button
                                type="button"
                                onClick={() => onUpdateBookingStatus(booking.id, 'Pending')}
                                className="text-xs font-medium text-blue-600 hover:text-blue-800"
                              >
                                Tinjau Ulang
                              </button>
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
      </div>
    </div>
  );
}
