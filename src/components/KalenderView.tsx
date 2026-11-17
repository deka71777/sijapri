import { useState } from 'react';
import { ChevronLeft, ChevronRight, DoorOpen, UserCheck } from 'lucide-react';
import { TODAY_ISO } from '../data/initialData';
import type { AgendaItem, NavSection, RoomBooking } from '../types/sijapri';
import { StatusIndicator } from './StatusIndicator';

interface KalenderViewProps {
  agendas: AgendaItem[];
  bookings: RoomBooking[];
  canAccessBookingAndMaintenance: boolean;
  onNavigate: (section: NavSection) => void;
}

type CalendarLayerFilter = 'Semua' | 'Agenda' | 'Pendopo' | 'Ruang Rapat';

const MONTH_NAMES_ID = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

const DAY_HEADERS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

function isPendopoBooking(booking: RoomBooking): boolean {
  return booking.roomId === 'R-01' || booking.roomName.toLowerCase().includes('pendopo');
}

export function KalenderView({
  agendas,
  bookings,
  canAccessBookingAndMaintenance,
  onNavigate,
}: KalenderViewProps) {
  const [year, setYear] = useState(2026);
  const [month, setMonth] = useState(10); // 0-indexed: 10 = November
  const [selectedDate, setSelectedDate] = useState(TODAY_ISO);
  const [layerFilter, setLayerFilter] = useState<CalendarLayerFilter>('Semua');

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const handlePrevMonth = () => {
    if (month === 0) {
      setYear((y) => y - 1);
      setMonth(11);
    } else {
      setMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (month === 11) {
      setYear((y) => y + 1);
      setMonth(0);
    } else {
      setMonth((m) => m + 1);
    }
  };

  const formatIso = (day: number) => {
    const mm = String(month + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    return `${year}-${mm}-${dd}`;
  };

  const activeBookings = bookings.filter(
    (b) => b.status !== 'Dibatalkan' && b.status !== 'Ditolak',
  );

  const selectedAgendas = agendas
    .filter((a) => a.date === selectedDate)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const selectedPendopoBookings = activeBookings
    .filter((b) => b.date === selectedDate && isPendopoBooking(b))
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const selectedMeetingRoomBookings = activeBookings
    .filter((b) => b.date === selectedDate && !isPendopoBooking(b))
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
      {/* Left 8 Cols: Interactive Monthly Calendar Grid */}
      <div className="xl:col-span-8 bg-white border border-slate-200 rounded-xl p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              {MONTH_NAMES_ID[month]} {year}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Menandai jadwal kegiatan pimpinan, peminjaman Pendopo, dan Ruang Rapat
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setYear(2026);
                setMonth(10);
                setSelectedDate(TODAY_ISO);
              }}
              className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
            >
              Hari Ini
            </button>
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-2 border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50"
              aria-label="Bulan sebelumnya"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-2 border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50"
              aria-label="Bulan berikutnya"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filter & Legend Strip */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-lg self-start">
            {(['Semua', 'Agenda', 'Pendopo', 'Ruang Rapat'] as const).map((layer) => (
              <button
                key={layer}
                type="button"
                onClick={() => setLayerFilter(layer)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  layerFilter === layer
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {layer}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-xs bg-blue-600 shrink-0" aria-hidden="true" />
              <span>Agenda Pimpinan</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-xs bg-emerald-600 shrink-0" aria-hidden="true" />
              <span>Pendopo</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-xs bg-amber-600 shrink-0" aria-hidden="true" />
              <span>Ruang Rapat</span>
            </span>
          </div>
        </div>

        {/* Day Column Headers */}
        <div className="grid grid-cols-7 gap-2 text-center text-xs font-semibold text-slate-500 pb-1 border-b border-slate-100">
          {DAY_HEADERS.map((d) => (
            <div key={d} className="py-1">
              {d}
            </div>
          ))}
        </div>

        {/* Calendar Cells */}
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: firstDayOfMonth }).map((_, idx) => (
            <div key={`empty-${idx}`} className="h-24 sm:h-28 rounded-lg bg-slate-50/60" />
          ))}

          {Array.from({ length: daysInMonth }).map((_, idx) => {
            const day = idx + 1;
            const iso = formatIso(day);

            const dayAgendas =
              layerFilter === 'Semua' || layerFilter === 'Agenda'
                ? agendas.filter((a) => a.date === iso)
                : [];

            const dayPendopo =
              layerFilter === 'Semua' || layerFilter === 'Pendopo'
                ? activeBookings.filter((b) => b.date === iso && isPendopoBooking(b))
                : [];

            const dayMeetingRooms =
              layerFilter === 'Semua' || layerFilter === 'Ruang Rapat'
                ? activeBookings.filter((b) => b.date === iso && !isPendopoBooking(b))
                : [];

            const isSelected = iso === selectedDate;
            const isToday = iso === TODAY_ISO;
            const hasEvents =
              dayAgendas.length > 0 || dayPendopo.length > 0 || dayMeetingRooms.length > 0;

            return (
              <button
                key={iso}
                type="button"
                onClick={() => setSelectedDate(iso)}
                className={`h-24 sm:h-28 p-2 rounded-lg border text-left flex flex-col justify-between transition-colors ${
                  isSelected
                    ? 'border-blue-600 bg-blue-50/50 ring-1 ring-blue-600'
                    : isToday
                      ? 'border-blue-300 bg-slate-50 hover:bg-slate-100/70'
                      : hasEvents
                        ? 'border-slate-300 bg-white hover:bg-slate-50'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span
                    className={`text-xs font-mono tabular-nums font-semibold ${
                      isSelected || isToday ? 'text-blue-700' : 'text-slate-800'
                    }`}
                  >
                    {day}
                  </span>
                  {isToday && (
                    <span className="hidden sm:inline text-[10px] font-semibold text-blue-700">
                      Hari Ini
                    </span>
                  )}
                </div>

                <div className="space-y-1 w-full overflow-hidden">
                  {dayAgendas.length > 0 && (
                    <div className="flex items-center gap-1 text-[11px] font-medium text-blue-700 truncate">
                      <span
                        className="w-1.5 h-1.5 rounded-xs bg-blue-600 shrink-0"
                        aria-hidden="true"
                      />
                      <span className="truncate">{dayAgendas.length} Pimpinan</span>
                    </div>
                  )}
                  {dayPendopo.length > 0 && (
                    <div className="flex items-center gap-1 text-[11px] font-medium text-emerald-700 truncate">
                      <span
                        className="w-1.5 h-1.5 rounded-xs bg-emerald-600 shrink-0"
                        aria-hidden="true"
                      />
                      <span className="truncate">Pendopo ({dayPendopo.length})</span>
                    </div>
                  )}
                  {dayMeetingRooms.length > 0 && (
                    <div className="flex items-center gap-1 text-[11px] font-medium text-amber-700 truncate">
                      <span
                        className="w-1.5 h-1.5 rounded-xs bg-amber-600 shrink-0"
                        aria-hidden="true"
                      />
                      <span className="truncate">R. Rapat ({dayMeetingRooms.length})</span>
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Right 4 Cols: Selected Date Detail */}
      <div className="xl:col-span-4 bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Detail Jadwal Tanggal</h3>
            <p className="text-xs font-mono tabular-nums text-slate-500 mt-0.5">{selectedDate}</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => onNavigate('agenda')}
              className="text-xs font-medium text-slate-600 hover:text-slate-900 whitespace-nowrap"
            >
              + Agenda
            </button>
            {canAccessBookingAndMaintenance && (
              <button
                type="button"
                onClick={() => onNavigate('booking')}
                className="text-xs font-medium text-blue-600 hover:text-blue-800 whitespace-nowrap"
              >
                + Booking
              </button>
            )}
          </div>
        </div>

        <div className="p-5 space-y-5">
          {/* Kegiatan Pimpinan */}
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 mb-2.5">
              <UserCheck className="w-3.5 h-3.5 text-blue-600" aria-hidden="true" />
              <span>Kegiatan Pimpinan ({selectedAgendas.length})</span>
            </div>
            {selectedAgendas.length === 0 ? (
              <p className="text-xs text-slate-500 py-1.5">Tidak ada agenda pimpinan tercatat.</p>
            ) : (
              <div className="divide-y divide-slate-100 border-t border-slate-100">
                {selectedAgendas.map((a) => (
                  <div key={a.id} className="py-3 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-mono tabular-nums font-medium text-slate-700">
                        {a.startTime} – {a.endTime} WIB
                      </span>
                      <StatusIndicator status={a.status} />
                    </div>
                    <div className="text-xs font-semibold text-slate-900">{a.title}</div>
                    <div className="text-xs text-slate-500">
                      {a.leaderName} · {a.location}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Peminjaman Pendopo */}
          <div className="pt-4 border-t border-slate-200">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 mb-2.5">
              <DoorOpen className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
              <span>Peminjaman Pendopo ({selectedPendopoBookings.length})</span>
            </div>
            {selectedPendopoBookings.length === 0 ? (
              <p className="text-xs text-slate-500 py-1.5">
                Pendopo Kecamatan tersedia sepanjang hari.
              </p>
            ) : (
              <div className="divide-y divide-slate-100 border-t border-slate-100">
                {selectedPendopoBookings.map((b) => (
                  <div key={b.id} className="py-3 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-mono tabular-nums font-medium text-slate-700">
                        {b.startTime} – {b.endTime} WIB
                      </span>
                      <StatusIndicator status={b.status} />
                    </div>
                    <div className="text-xs font-semibold text-slate-900">{b.purpose}</div>
                    <div className="text-xs text-slate-500">
                      {b.unitOrVillage} · {b.attendees} peserta
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Peminjaman Ruang Rapat */}
          <div className="pt-4 border-t border-slate-200">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 mb-2.5">
              <DoorOpen className="w-3.5 h-3.5 text-amber-600" aria-hidden="true" />
              <span>Peminjaman Ruang Rapat ({selectedMeetingRoomBookings.length})</span>
            </div>
            {selectedMeetingRoomBookings.length === 0 ? (
              <p className="text-xs text-slate-500 py-1.5">
                Ruang Rapat &amp; Aula kosong pada tanggal ini.
              </p>
            ) : (
              <div className="divide-y divide-slate-100 border-t border-slate-100">
                {selectedMeetingRoomBookings.map((b) => (
                  <div key={b.id} className="py-3 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-mono tabular-nums font-medium text-slate-700">
                        {b.startTime} – {b.endTime} WIB
                      </span>
                      <StatusIndicator status={b.status} />
                    </div>
                    <div className="text-xs font-semibold text-slate-900">
                      {b.roomName} — {b.purpose}
                    </div>
                    <div className="text-xs text-slate-500">
                      {b.unitOrVillage} · {b.attendees} peserta
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
