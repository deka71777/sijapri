import { Fragment, useMemo, useState } from 'react';
import {
  ArrowRight,
  BarChart3,
  Building2,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Search,
  UserCheck,
} from 'lucide-react';
import { LEADER_AVATARS, TODAY_ISO } from '../data/initialData';
import type {
  AgendaItem,
  AgendaStatus,
  MaintenanceTicket,
  NavSection,
  Room,
  RoomBooking,
} from '../types/sijapri';
import { StatusIndicator } from './StatusIndicator';

interface DashboardViewProps {
  agendas: AgendaItem[];
  rooms: Room[];
  bookings: RoomBooking[];
  maintenance: MaintenanceTicket[];
  canManageAgendas: boolean;
  canAccessBookingAndMaintenance: boolean;
  onNavigate: (section: NavSection) => void;
  onQuickBookRoom: (roomId: string) => void;
  onUpdateAgendaStatus: (id: string, status: AgendaItem['status']) => void;
}

interface DailySummaryRow {
  id: string;
  category: 'Agenda Pimpinan' | 'Pemakaian Ruangan';
  startTime: string;
  endTime: string;
  title: string;
  pic: string;
  location: string;
  status: string;
  detailNote: string;
  isAgenda: boolean;
}

const DATE_OPTIONS = [
  { iso: '2026-11-16', shortLabel: 'Sen, 16 Nov', fullLabel: 'Senin, 16 November 2026' },
  { iso: '2026-11-17', shortLabel: 'Sel, 17 Nov', fullLabel: 'Selasa, 17 November 2026' },
  { iso: '2026-11-18', shortLabel: 'Rab, 18 Nov', fullLabel: 'Rabu, 18 November 2026' },
  { iso: '2026-11-19', shortLabel: 'Kam, 19 Nov', fullLabel: 'Kamis, 19 November 2026' },
  { iso: '2026-11-20', shortLabel: 'Jum, 20 Nov', fullLabel: 'Jumat, 20 November 2026' },
];

const TIMELINE_START_MIN = 7 * 60; // 07:00
const TIMELINE_END_MIN = 16 * 60; // 16:00
const TIMELINE_SPAN = TIMELINE_END_MIN - TIMELINE_START_MIN; // 540 mins
const TIMELINE_HOURS = ['07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00'];

function parseMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

interface PieSlice {
  id: string;
  label: string;
  value: number;
  color: string;
  unit?: string;
}

interface InteractivePieCardProps {
  title: string;
  subtitle: string;
  slices: PieSlice[];
  centerValue: string;
  centerLabel: string;
  footerLeft: string;
  actionLabel?: string;
  onAction?: () => void;
}

function buildArcPath(
  cx: number,
  cy: number,
  outerR: number,
  innerR: number,
  startDeg: number,
  endDeg: number,
): string {
  const toRad = (deg: number) => ((deg - 90) * Math.PI) / 180;
  const x1 = cx + outerR * Math.cos(toRad(startDeg));
  const y1 = cy + outerR * Math.sin(toRad(startDeg));
  const x2 = cx + outerR * Math.cos(toRad(endDeg));
  const y2 = cy + outerR * Math.sin(toRad(endDeg));
  const x3 = cx + innerR * Math.cos(toRad(endDeg));
  const y3 = cy + innerR * Math.sin(toRad(endDeg));
  const x4 = cx + innerR * Math.cos(toRad(startDeg));
  const y4 = cy + innerR * Math.sin(toRad(startDeg));
  const largeArc = endDeg - startDeg > 180 ? 1 : 0;

  return [
    `M ${x1.toFixed(2)} ${y1.toFixed(2)}`,
    `A ${outerR} ${outerR} 0 ${largeArc} 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`,
    `L ${x3.toFixed(2)} ${y3.toFixed(2)}`,
    `A ${innerR} ${innerR} 0 ${largeArc} 0 ${x4.toFixed(2)} ${y4.toFixed(2)}`,
    'Z',
  ].join(' ');
}

function InteractivePieCard({
  title,
  subtitle,
  slices,
  centerValue,
  centerLabel,
  footerLeft,
  actionLabel,
  onAction,
}: InteractivePieCardProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const total = slices.reduce((sum, s) => sum + Math.max(0, s.value), 0);
  const nonZeroSlices = slices.filter((s) => s.value > 0);
  const activeSlice = slices.find((s) => s.id === hoveredId) ?? null;

  let currentDeg = 0;
  const computedSegments = nonZeroSlices.map((slice) => {
    const angle = total > 0 ? (slice.value / total) * 360 : 0;
    const startDeg = currentDeg;
    const endDeg = currentDeg + angle;
    const midDeg = startDeg + angle / 2;
    currentDeg = endDeg;

    const midRad = ((midDeg - 90) * Math.PI) / 180;
    const nudgeX = Math.cos(midRad) * 4.5;
    const nudgeY = Math.sin(midRad) * 4.5;

    return {
      ...slice,
      startDeg,
      endDeg,
      pct: total > 0 ? Math.round((slice.value / total) * 100) : 0,
      nudgeX,
      nudgeY,
    };
  });

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between gap-4">
      <div className="min-w-0">
        <h3 className="text-sm font-semibold text-slate-900 truncate">{title}</h3>
        <p className="text-[11px] text-slate-500 truncate mt-0.5">{subtitle}</p>
      </div>

      <div className="flex flex-col items-center gap-4 py-1">
        <div className="relative w-44 h-44 shrink-0">
          <svg
            viewBox="0 0 160 160"
            className="w-full h-full overflow-visible"
            role="img"
            aria-label={`Diagram pie ${title}`}
          >
            {total === 0 ? (
              <circle
                cx="80"
                cy="80"
                r="53"
                fill="none"
                stroke="#E2E8F0"
                strokeWidth="30"
              />
            ) : nonZeroSlices.length === 1 ? (
              <g
                onMouseEnter={() => setHoveredId(computedSegments[0].id)}
                onMouseLeave={() => setHoveredId(null)}
                onClick={() =>
                  setHoveredId(
                    hoveredId === computedSegments[0].id ? null : computedSegments[0].id,
                  )
                }
                className="cursor-pointer transition-transform duration-150"
                style={{
                  transform:
                    hoveredId === computedSegments[0].id ? 'scale(1.03)' : 'scale(1)',
                  transformOrigin: '80px 80px',
                }}
              >
                <circle
                  cx="80"
                  cy="80"
                  r="53"
                  fill="none"
                  stroke={computedSegments[0].color}
                  strokeWidth="30"
                />
              </g>
            ) : (
              computedSegments.map((seg) => {
                const isActive = hoveredId === seg.id;
                const isDimmed = hoveredId !== null && !isActive;
                return (
                  <path
                    key={seg.id}
                    d={buildArcPath(80, 80, 68, 38, seg.startDeg, seg.endDeg)}
                    fill={seg.color}
                    stroke="#FFFFFF"
                    strokeWidth="2.5"
                    onMouseEnter={() => setHoveredId(seg.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    onClick={() => setHoveredId(isActive ? null : seg.id)}
                    className="cursor-pointer transition-all duration-150"
                    style={{
                      opacity: isDimmed ? 0.55 : 1,
                      transform: isActive
                        ? `translate(${seg.nudgeX.toFixed(2)}px, ${seg.nudgeY.toFixed(2)}px)`
                        : 'translate(0px, 0px)',
                    }}
                  />
                );
              })
            )}
          </svg>

          {/* Center Dynamic Callout */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-3">
            <span className="text-2xl font-bold font-mono tabular-nums text-slate-900 leading-none">
              {activeSlice
                ? `${activeSlice.value}${activeSlice.unit ? activeSlice.unit : ''}`
                : centerValue}
            </span>
            <span className="text-[11px] font-medium text-slate-500 mt-1.5 leading-tight max-w-[78px] line-clamp-2">
              {activeSlice ? activeSlice.label : centerLabel}
            </span>
          </div>
        </div>

        {/* Interactive Legend */}
        <div className="w-full space-y-1">
          {slices.map((slice) => {
            const pct = total > 0 ? Math.round((slice.value / total) * 100) : 0;
            const isActive = hoveredId === slice.id;
            return (
              <button
                key={slice.id}
                type="button"
                onMouseEnter={() => setHoveredId(slice.id)}
                onMouseLeave={() => setHoveredId(null)}
                onClick={() => setHoveredId(isActive ? null : slice.id)}
                className={`w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-md text-left transition-colors ${
                  isActive ? 'bg-slate-100' : 'hover:bg-slate-50'
                }`}
              >
                <span className="flex items-center gap-2 min-w-0">
                  <span
                    className="w-2.5 h-2.5 rounded-xs shrink-0"
                    style={{ backgroundColor: slice.color }}
                    aria-hidden="true"
                  />
                  <span className="text-xs text-slate-700 truncate">{slice.label}</span>
                </span>
                <span className="text-xs font-mono tabular-nums font-semibold text-slate-900 shrink-0">
                  {slice.value}
                  {slice.unit ?? ''}{' '}
                  <span className="text-[11px] font-normal text-slate-400">({pct}%)</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
        <span className="text-slate-600 font-mono tabular-nums truncate">{footerLeft}</span>
        {actionLabel && onAction && (
          <button
            type="button"
            onClick={onAction}
            className="text-blue-600 hover:text-blue-800 font-medium inline-flex items-center gap-1 whitespace-nowrap shrink-0"
          >
            <span>{actionLabel}</span>
            <ArrowRight className="w-3 h-3" aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  );
}

export function DashboardView({
  agendas,
  rooms,
  bookings,
  maintenance,
  canManageAgendas,
  canAccessBookingAndMaintenance,
  onNavigate,
  onQuickBookRoom,
  onUpdateAgendaStatus,
}: DashboardViewProps) {
  const [selectedDate, setSelectedDate] = useState<string>(TODAY_ISO);
  const [chartTab, setChartTab] = useState<'timeline' | 'weekly'>('timeline');
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [leaderFilter, setLeaderFilter] = useState<'Semua' | 'Camat' | 'Sekcam' | 'Kasi'>('Semua');
  const [tableFilter, setTableFilter] = useState<'Semua' | 'Agenda Pimpinan' | 'Pemakaian Ruangan'>(
    'Semua',
  );
  const [tableSearch, setTableSearch] = useState('');
  const [expandedRowKey, setExpandedRowKey] = useState<string | null>(null);

  const selectedDateMeta =
    DATE_OPTIONS.find((d) => d.iso === selectedDate) ?? DATE_OPTIONS[0];

  const dayAgendas = useMemo(
    () =>
      agendas
        .filter((a) => a.date === selectedDate)
        .sort((a, b) => a.startTime.localeCompare(b.startTime)),
    [agendas, selectedDate],
  );

  const dayBookings = useMemo(
    () =>
      bookings
        .filter(
          (b) => b.date === selectedDate && b.status !== 'Dibatalkan' && b.status !== 'Ditolak',
        )
        .sort((a, b) => a.startTime.localeCompare(b.startTime)),
    [bookings, selectedDate],
  );

  const filteredSpotlightAgendas = useMemo(() => {
    return dayAgendas.filter((a) => {
      if (leaderFilter === 'Semua') return true;
      if (leaderFilter === 'Kasi') return a.leaderRole.startsWith('Kasi');
      return a.leaderRole === leaderFilter;
    });
  }, [dayAgendas, leaderFilter]);

  const totalFacilities = rooms.length;
  const activeOperationalRooms = rooms.filter((r) => r.status !== 'Pemeliharaan').length;
  const availableRoomsCount = rooms.filter((r) => r.status === 'Tersedia').length;
  const inUseRoomsCount = rooms.filter((r) => r.status === 'Digunakan').length;
  const maintenanceRoomsCount = rooms.filter((r) => r.status === 'Pemeliharaan').length;

  const approvedBookingsCount = bookings.filter((b) => b.status === 'Disetujui').length;
  const pendingBookingsCount = bookings.filter((b) => b.status === 'Pending').length;
  const rejectedBookingsCount = bookings.filter(
    (b) => b.status === 'Ditolak' || b.status === 'Dibatalkan',
  ).length;

  const waitingMaintCount = maintenance.filter((m) => m.status === 'Menunggu').length;
  const inProgressMaintCount = maintenance.filter((m) => m.status === 'Dalam Proses').length;
  const doneMaintCount = maintenance.filter((m) => m.status === 'Selesai').length;
  const openMaintenanceCount = waitingMaintCount + inProgressMaintCount;

  const dayAgendaDone = dayAgendas.filter((a) => a.status === 'Selesai').length;
  const dayAgendaOngoing = dayAgendas.filter((a) => a.status === 'Berlangsung').length;
  const dayAgendaScheduled = dayAgendas.filter(
    (a) => a.status === 'Terjadwal' || a.status === 'Ditunda',
  ).length;

  const totalOperationalMinutes = Math.max(activeOperationalRooms, 1) * 8 * 60;
  const bookedMinutesSelected = dayBookings.reduce((acc, b) => {
    const diff = Math.max(0, parseMinutes(b.endTime) - parseMinutes(b.startTime));
    return acc + diff;
  }, 0);
  const bookedHoursSelected = Number((bookedMinutesSelected / 60).toFixed(1));
  const totalOperationalHours = Number((totalOperationalMinutes / 60).toFixed(1));
  const remainingHoursSelected = Number(
    Math.max(0, totalOperationalHours - bookedHoursSelected).toFixed(1),
  );
  const utilizationRate = Math.min(
    100,
    Math.round((bookedMinutesSelected / totalOperationalMinutes) * 100),
  );

  // Weekly 5-day chart data for interactive bar visualization
  const weeklyStats = useMemo(() => {
    return DATE_OPTIONS.map((d) => {
      const agCount = agendas.filter((a) => a.date === d.iso).length;
      const bkList = bookings.filter(
        (b) => b.date === d.iso && b.status !== 'Dibatalkan' && b.status !== 'Ditolak',
      );
      const hours =
        bkList.reduce(
          (sum, b) => sum + Math.max(0, parseMinutes(b.endTime) - parseMinutes(b.startTime)),
          0,
        ) / 60;
      const pct = Math.min(100, Math.round(((hours * 60) / totalOperationalMinutes) * 100));
      return {
        ...d,
        agendaCount: agCount,
        bookingCount: bkList.length,
        hours: Number(hours.toFixed(1)),
        utilizationPct: pct,
      };
    });
  }, [agendas, bookings, totalOperationalMinutes]);

  const inspectedBooking =
    dayBookings.find((b) => b.id === selectedBookingId) ?? dayBookings[0] ?? null;

  const dailyRows: DailySummaryRow[] = [
    ...dayAgendas.map((a) => ({
      id: a.id,
      category: 'Agenda Pimpinan' as const,
      startTime: a.startTime,
      endTime: a.endTime,
      title: a.title,
      pic: `${a.leaderName} (${a.leaderRole})`,
      location: a.location,
      status: a.status,
      detailNote: `Disposisi: ${a.disposition}`,
      isAgenda: true,
    })),
    ...dayBookings.map((b) => ({
      id: b.id,
      category: 'Pemakaian Ruangan' as const,
      startTime: b.startTime,
      endTime: b.endTime,
      title: b.purpose,
      pic: `${b.requesterName} · ${b.unitOrVillage}`,
      location: b.roomName,
      status: b.status,
      detailNote: `Kapasitas peserta: ${b.attendees} orang · Kode Booking: ${b.id}`,
      isAgenda: false,
    })),
  ].sort((a, b) => a.startTime.localeCompare(b.startTime));

  const visibleRows = dailyRows
    .filter((row) => (tableFilter === 'Semua' ? true : row.category === tableFilter))
    .filter((row) => {
      const q = tableSearch.trim().toLowerCase();
      if (!q) return true;
      return (
        row.title.toLowerCase().includes(q) ||
        row.pic.toLowerCase().includes(q) ||
        row.location.toLowerCase().includes(q)
      );
    });

  return (
    <div className="space-y-6">
      {/* Interactive Date Focus Bar */}
      <div className="bg-white border border-slate-200 rounded-xl px-5 py-3.5 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Clock className="w-4 h-4 text-blue-600 shrink-0" aria-hidden="true" />
          <div className="min-w-0">
            <span className="text-xs font-semibold text-slate-900">
              Tinjauan Operasional: {selectedDateMeta.fullLabel}
            </span>
            <span className="hidden sm:inline text-xs text-slate-500 ml-2">
              · Pilih tanggal di kanan untuk meninjau grafik okupansi &amp; agenda
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-lg self-start lg:self-auto">
          {DATE_OPTIONS.map((d) => (
            <button
              key={d.iso}
              type="button"
              onClick={() => {
                setSelectedDate(d.iso);
                setSelectedBookingId(null);
                setExpandedRowKey(null);
              }}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                selectedDate === d.iso
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {d.iso === TODAY_ISO ? `Hari Ini (${d.shortLabel.split(', ')[1]})` : d.shortLabel}
            </button>
          ))}
        </div>
      </div>

      {/* 4-Card Interactive Pie Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <InteractivePieCard
          title="Kesiapan Fasilitas Ruangan"
          subtitle="Distribusi kondisi operasional ruangan kantor"
          centerValue={String(totalFacilities)}
          centerLabel="Total Ruang"
          footerLeft={`${rooms.reduce((sum, r) => sum + r.capacity, 0)} total kursi`}
          actionLabel={canAccessBookingAndMaintenance ? 'Daftar' : undefined}
          onAction={canAccessBookingAndMaintenance ? () => onNavigate('booking') : undefined}
          slices={[
            { id: 'avail', label: 'Tersedia', value: availableRoomsCount, color: '#16A34A' },
            { id: 'used', label: 'Digunakan', value: inUseRoomsCount, color: '#2563EB' },
            { id: 'maint', label: 'Pemeliharaan', value: maintenanceRoomsCount, color: '#DC2626' },
          ]}
        />

        <InteractivePieCard
          title="Status Pengajuan Booking"
          subtitle="Proporsi verifikasi peminjaman ruangan"
          centerValue={String(bookings.length)}
          centerLabel="Pengajuan"
          footerLeft={`${pendingBookingsCount} pending verifikasi`}
          actionLabel={canAccessBookingAndMaintenance ? 'Tinjau' : undefined}
          onAction={canAccessBookingAndMaintenance ? () => onNavigate('booking') : undefined}
          slices={[
            { id: 'ok', label: 'Disetujui', value: approvedBookingsCount, color: '#16A34A' },
            { id: 'pend', label: 'Pending', value: pendingBookingsCount, color: '#D97706' },
            { id: 'rej', label: 'Ditolak/Batal', value: rejectedBookingsCount, color: '#DC2626' },
          ]}
        />

        <InteractivePieCard
          title="Utilisasi Jam Ruangan"
          subtitle={`Kapasitas layanan ${selectedDateMeta.shortLabel}`}
          centerValue={`${utilizationRate}%`}
          centerLabel="Terpakai"
          footerLeft={`${bookedHoursSelected}j / ${totalOperationalHours}j operasional`}
          actionLabel="Kalender"
          onAction={() => onNavigate('kalender')}
          slices={[
            {
              id: 'booked',
              label: 'Terpakai',
              value: bookedHoursSelected,
              color: '#2563EB',
              unit: 'j',
            },
            {
              id: 'free',
              label: 'Tersisa',
              value: remainingHoursSelected,
              color: '#CBD5E1',
              unit: 'j',
            },
          ]}
        />

        {canAccessBookingAndMaintenance ? (
          <InteractivePieCard
            title="Status Tiket Maintenance"
            subtitle="Rekap laporan pemeliharaan sarana"
            centerValue={String(openMaintenanceCount)}
            centerLabel="Tiket Aktif"
            footerLeft={`${maintenance.length} total laporan sarana`}
            actionLabel="Kelola"
            onAction={() => onNavigate('maintenance')}
            slices={[
              { id: 'wait', label: 'Menunggu', value: waitingMaintCount, color: '#D97706' },
              { id: 'proc', label: 'Dalam Proses', value: inProgressMaintCount, color: '#2563EB' },
              { id: 'done', label: 'Selesai', value: doneMaintCount, color: '#16A34A' },
            ]}
          />
        ) : (
          <InteractivePieCard
            title="Status Agenda Pimpinan"
            subtitle={`Jadwal pimpinan ${selectedDateMeta.shortLabel}`}
            centerValue={String(dayAgendas.length)}
            centerLabel="Agenda"
            footerLeft={`${dayAgendas.length} kegiatan pada tanggal ini`}
            actionLabel="Agenda"
            onAction={() => onNavigate('agenda')}
            slices={[
              { id: 'done', label: 'Selesai', value: dayAgendaDone, color: '#16A34A' },
              { id: 'now', label: 'Berlangsung', value: dayAgendaOngoing, color: '#2563EB' },
              { id: 'plan', label: 'Terjadwal', value: dayAgendaScheduled, color: '#D97706' },
            ]}
          />
        )}
      </div>

      {/* 2-Column Interactive Analytics Split: Room Timeline / Weekly Chart + Agenda Spotlight */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch">
        {/* Left 7 Cols: Interactive Room Occupancy Timeline & Weekly Utilization Chart */}
        <div className="xl:col-span-7 bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between gap-5">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                {chartTab === 'timeline'
                  ? `Linimasa Pemakaian Ruangan (${selectedDateMeta.shortLabel})`
                  : 'Grafik Okupansi & Agenda Mingguan (16 – 20 Nov)'}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {chartTab === 'timeline'
                  ? 'Klik blok jadwal untuk memeriksa rincian pemohon dan status peminjaman'
                  : 'Klik batang hari pada grafik untuk memfilter aktivitas harian'}
              </p>
            </div>

            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
              <button
                type="button"
                onClick={() => setChartTab('timeline')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  chartTab === 'timeline'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Linimasa Ruangan
              </button>
              <button
                type="button"
                onClick={() => setChartTab('weekly')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  chartTab === 'weekly'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Grafik 5 Hari</span>
              </button>
            </div>
          </div>

          {chartTab === 'timeline' ? (
            <div className="space-y-4">
              {/* Hour axis header */}
              <div className="grid grid-cols-12 items-center text-[11px] font-mono tabular-nums text-slate-400">
                <div className="col-span-4 font-sans font-medium text-slate-500">Fasilitas</div>
                <div className="col-span-8 grid grid-cols-9">
                  {TIMELINE_HOURS.map((h) => (
                    <span key={h} className="truncate">
                      {h.slice(0, 2)}
                    </span>
                  ))}
                </div>
              </div>

              {/* Room tracks */}
              <div className="space-y-3">
                {rooms.map((room) => {
                  const roomDayBookings = dayBookings.filter((b) => b.roomId === room.id);
                  const isMaint = room.status === 'Pemeliharaan';
                  return (
                    <div key={room.id} className="grid grid-cols-12 items-center gap-2">
                      <div className="col-span-4 min-w-0 pr-2">
                        <div className="text-xs font-semibold text-slate-900 truncate">
                          {room.name}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono tabular-nums">
                          {room.capacity} kursi · {roomDayBookings.length} sesi
                        </div>
                      </div>

                      <div className="col-span-8 relative h-9 bg-slate-50 border border-slate-200 rounded-lg overflow-hidden">
                        {/* Hour vertical grid lines */}
                        <div className="absolute inset-0 grid grid-cols-9 pointer-events-none">
                          {TIMELINE_HOURS.map((h) => (
                            <div key={h} className="border-r border-slate-200/60 last:border-r-0" />
                          ))}
                        </div>

                        {isMaint ? (
                          <div className="relative z-10 h-full w-full bg-red-50/90 flex items-center justify-center text-[11px] font-medium text-red-700">
                            Sedang Dalam Pemeliharaan Sarana
                          </div>
                        ) : roomDayBookings.length === 0 ? (
                          <div className="relative z-10 h-full w-full flex items-center justify-between px-3 text-[11px] text-slate-400">
                            <span>Kosong sepanjang jam layanan</span>
                            {canAccessBookingAndMaintenance && (
                              <button
                                type="button"
                                onClick={() => onQuickBookRoom(room.id)}
                                className="font-medium text-blue-600 hover:underline whitespace-nowrap"
                              >
                                + Pesan Slot
                              </button>
                            )}
                          </div>
                        ) : (
                          roomDayBookings.map((b) => {
                            const startOffset = Math.max(
                              0,
                              parseMinutes(b.startTime) - TIMELINE_START_MIN,
                            );
                            const endOffset = Math.min(
                              TIMELINE_SPAN,
                              parseMinutes(b.endTime) - TIMELINE_START_MIN,
                            );
                            const leftPct = (startOffset / TIMELINE_SPAN) * 100;
                            const widthPct = Math.max(
                              12,
                              ((endOffset - startOffset) / TIMELINE_SPAN) * 100,
                            );
                            const isSelectedBlock = inspectedBooking?.id === b.id;

                            return (
                              <button
                                key={b.id}
                                type="button"
                                onClick={() => setSelectedBookingId(b.id)}
                                style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                                title={`${b.startTime}–${b.endTime}: ${b.purpose}`}
                                className={`absolute top-1 bottom-1 z-10 rounded-md px-2 text-left text-[11px] font-medium truncate transition-colors ${
                                  b.status === 'Pending'
                                    ? isSelectedBlock
                                      ? 'bg-amber-600 text-white'
                                      : 'bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200'
                                    : isSelectedBlock
                                      ? 'bg-blue-700 text-white'
                                      : 'bg-emerald-600 text-white hover:bg-emerald-700'
                                }`}
                              >
                                {b.startTime} {b.purpose}
                              </button>
                            );
                          })
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Selected Booking Inspector Strip */}
              <div className="pt-3 border-t border-slate-200">
                {inspectedBooking ? (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 border border-slate-200 rounded-lg px-4 py-3">
                    <div className="min-w-0 space-y-0.5">
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="font-mono tabular-nums font-semibold text-blue-700">
                          {inspectedBooking.startTime} – {inspectedBooking.endTime} WIB
                        </span>
                        <span className="text-slate-300" aria-hidden="true">
                          ·
                        </span>
                        <span className="font-semibold text-slate-900">
                          {inspectedBooking.roomName}
                        </span>
                        <span className="text-slate-300" aria-hidden="true">
                          ·
                        </span>
                        <StatusIndicator status={inspectedBooking.status} />
                      </div>
                      <div className="text-xs font-medium text-slate-800 truncate">
                        {inspectedBooking.purpose}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Pemohon: {inspectedBooking.requesterName} ({inspectedBooking.unitOrVillage}) ·{' '}
                        <span className="font-mono tabular-nums">
                          {inspectedBooking.attendees} peserta
                        </span>
                      </div>
                    </div>
                    {canAccessBookingAndMaintenance && (
                      <button
                        type="button"
                        onClick={() => onNavigate('booking')}
                        className="px-3 py-1.5 text-xs font-semibold text-blue-700 bg-white border border-slate-200 hover:border-blue-400 rounded-lg whitespace-nowrap shrink-0 self-start sm:self-center"
                      >
                        Buka Detail Booking
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="text-xs text-slate-500 py-2 flex items-center justify-between">
                    <span>Tidak ada peminjaman ruangan terjadwal pada {selectedDateMeta.fullLabel}.</span>
                    {canAccessBookingAndMaintenance && (
                      <button
                        type="button"
                        onClick={() => onNavigate('booking')}
                        className="text-blue-600 font-medium hover:underline whitespace-nowrap"
                      >
                        + Ajukan Booking
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* 5-Day Interactive Bar Chart */
            <div className="space-y-4">
              <div className="grid grid-cols-5 gap-3 items-end h-52 pt-4 pb-2 px-2 bg-slate-50 border border-slate-200 rounded-xl">
                {weeklyStats.map((day) => {
                  const isActive = day.iso === selectedDate;
                  const barHeightPct = Math.max(12, day.utilizationPct);
                  return (
                    <button
                      key={day.iso}
                      type="button"
                      onClick={() => setSelectedDate(day.iso)}
                      className={`h-full flex flex-col justify-end items-center gap-2 p-2 rounded-lg transition-colors ${
                        isActive ? 'bg-white border border-blue-200' : 'hover:bg-white/70'
                      }`}
                    >
                      <span className="text-[11px] font-mono tabular-nums font-semibold text-slate-700">
                        {day.hours}j ({day.utilizationPct}%)
                      </span>
                      <div className="w-full max-w-[44px] flex-1 flex items-end justify-center">
                        <div
                          className={`w-full rounded-t-md transition-all duration-200 ${
                            isActive ? 'bg-blue-600' : 'bg-slate-400 hover:bg-blue-500'
                          }`}
                          style={{ height: `${barHeightPct}%` }}
                        />
                      </div>
                      <div className="text-center">
                        <div
                          className={`text-xs font-semibold ${
                            isActive ? 'text-blue-700' : 'text-slate-700'
                          }`}
                        >
                          {day.shortLabel.split(', ')[1]}
                        </div>
                        <div className="text-[10px] font-mono tabular-nums text-slate-500">
                          {day.agendaCount} ag · {day.bookingCount} bk
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 pt-1">
                <span>
                  Terpilih: <strong className="text-slate-800">{selectedDateMeta.fullLabel}</strong>
                </span>
                <span className="font-mono tabular-nums">
                  {dayAgendas.length} agenda pimpinan · {dayBookings.length} sesi ruangan
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Right 5 Cols: Interactive Agenda Pimpinan Spotlight */}
        <div className="xl:col-span-5 bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between gap-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-blue-600 shrink-0" aria-hidden="true" />
                <h2 className="text-base font-semibold text-slate-900">Agenda Pimpinan</h2>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('agenda')}
                className="text-xs font-medium text-blue-600 hover:text-blue-800 whitespace-nowrap"
              >
                Kelola Semua
              </button>
            </div>

            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
              {(['Semua', 'Camat', 'Sekcam', 'Kasi'] as const).map((roleTab) => (
                <button
                  key={roleTab}
                  type="button"
                  onClick={() => setLeaderFilter(roleTab)}
                  className={`flex-1 px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                    leaderFilter === roleTab
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {roleTab}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 divide-y divide-slate-100 max-h-72 overflow-y-auto pr-1">
            {filteredSpotlightAgendas.length === 0 ? (
              <div className="py-10 text-center space-y-2">
                <p className="text-xs text-slate-500">
                  Tidak ada agenda untuk filter pejabat ini pada {selectedDateMeta.shortLabel}.
                </p>
                <button
                  type="button"
                  onClick={() => onNavigate('agenda')}
                  className="text-xs font-medium text-blue-600 hover:underline"
                >
                  Lihat Kalender / Tambah Agenda
                </button>
              </div>
            ) : (
              filteredSpotlightAgendas.map((item) => {
                const avatar = LEADER_AVATARS[item.leaderRole];
                return (
                  <div key={item.id} className="py-3.5 space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
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
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-slate-900 truncate">
                            {item.leaderName}
                          </div>
                          <div className="text-[11px] font-mono tabular-nums text-slate-500">
                            {item.startTime} – {item.endTime} · {item.location}
                          </div>
                        </div>
                      </div>
                      <StatusIndicator status={item.status} />
                    </div>

                    <div className="text-xs font-medium text-slate-800 leading-snug">
                      {item.title}
                    </div>

                    {canManageAgendas && (
                      <div className="flex items-center justify-between gap-2 pt-1">
                        <span className="text-[11px] text-slate-500 truncate">
                          {item.disposition}
                        </span>
                        <select
                          value={item.status}
                          onChange={(e) =>
                            onUpdateAgendaStatus(item.id, e.target.value as AgendaStatus)
                          }
                          aria-label={`Status agenda ${item.title}`}
                          className="px-2 py-1 text-[11px] border border-slate-200 rounded bg-white text-slate-700 shrink-0"
                        >
                          <option value="Terjadwal">Terjadwal</option>
                          <option value="Berlangsung">Berlangsung</option>
                          <option value="Selesai">Selesai</option>
                          <option value="Ditunda">Ditunda</option>
                        </select>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Tabel Ringkasan Kegiatan Harian dengan Pencarian & Detail Expandable */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Ringkasan Kegiatan Harian Kecamatan Krembung
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {selectedDateMeta.fullLabel} · Klik baris untuk melihat disposisi atau detail peserta
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative w-full sm:w-56">
              <Search
                className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"
                aria-hidden="true"
              />
              <input
                type="text"
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
                placeholder="Cari kegiatan, pejabat..."
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600"
              />
            </div>

            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
              {(['Semua', 'Agenda Pimpinan', 'Pemakaian Ruangan'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setTableFilter(tab)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                    tableFilter === tab
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
        </div>

        {visibleRows.length === 0 ? (
          <div className="p-10 text-center space-y-2">
            <p className="text-sm font-medium text-slate-700">
              Belum ada kegiatan harian yang cocok dengan filter ini.
            </p>
            <button
              type="button"
              onClick={() => {
                setTableFilter('Semua');
                setTableSearch('');
              }}
              className="text-xs font-medium text-blue-600 hover:underline"
            >
              Atur ulang filter tabel
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold text-slate-500">
                  <th className="px-6 py-3">Waktu</th>
                  <th className="px-6 py-3">Kategori</th>
                  <th className="px-6 py-3">Kegiatan / Keperluan</th>
                  <th className="px-6 py-3">Pejabat / Pemohon</th>
                  <th className="px-6 py-3">Lokasi / Ruangan</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {visibleRows.map((row) => {
                  const rowKey = `${row.category}-${row.id}`;
                  const isExpanded = expandedRowKey === rowKey;
                  return (
                    <Fragment key={rowKey}>
                      <tr
                        onClick={() => setExpandedRowKey(isExpanded ? null : rowKey)}
                        className="hover:bg-slate-50/70 cursor-pointer"
                      >
                        <td className="px-6 py-3.5 whitespace-nowrap font-mono tabular-nums text-xs font-medium text-slate-800">
                          {row.startTime} – {row.endTime}
                        </td>
                        <td className="px-6 py-3.5 whitespace-nowrap text-xs font-medium text-slate-600">
                          {row.category}
                        </td>
                        <td className="px-6 py-3.5 font-semibold text-slate-900 max-w-xs">
                          <div className="flex items-center gap-1.5">
                            {isExpanded ? (
                              <ChevronUp className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            )}
                            <span className="truncate">{row.title}</span>
                          </div>
                        </td>
                        <td className="px-6 py-3.5 text-xs text-slate-600">{row.pic}</td>
                        <td className="px-6 py-3.5 text-xs text-slate-700">{row.location}</td>
                        <td className="px-6 py-3.5 whitespace-nowrap">
                          <StatusIndicator status={row.status} />
                        </td>
                        <td
                          className="px-6 py-3.5 whitespace-nowrap text-right"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {row.isAgenda && row.status !== 'Selesai' && canManageAgendas ? (
                            <button
                              type="button"
                              onClick={() => onUpdateAgendaStatus(row.id, 'Selesai')}
                              className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                              <span>Selesaikan</span>
                            </button>
                          ) : row.isAgenda || canAccessBookingAndMaintenance ? (
                            <button
                              type="button"
                              onClick={() => onNavigate(row.isAgenda ? 'agenda' : 'booking')}
                              className="text-xs font-medium text-slate-500 hover:text-slate-800"
                            >
                              Detail
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => onNavigate('kalender')}
                              className="text-xs font-medium text-slate-500 hover:text-slate-800"
                            >
                              Kalender
                            </button>
                          )}
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr className="bg-slate-50/80">
                          <td colSpan={7} className="px-6 py-3 text-xs text-slate-600">
                            {row.detailNote}
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Bottom Strip: Kondisi Ruangan & Fasilitas */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Kondisi Fasilitas Ruangan</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Pantau kesiapan Pendopo dan Ruang Rapat Kecamatan Krembung
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('kalender')}
            className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap"
          >
            Buka Kalender Bulanan
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-slate-100">
          {rooms.map((room) => (
            <div key={room.id} className="p-5 flex flex-col justify-between gap-3">
              <div className="flex items-start gap-3">
                {room.imageUrl ? (
                  <img
                    src={room.imageUrl}
                    alt={room.name}
                    referrerPolicy="no-referrer"
                    className="w-16 h-12 rounded-lg object-cover border border-slate-200 shrink-0"
                  />
                ) : (
                  <div className="w-16 h-12 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 shrink-0">
                    <Building2 className="w-5 h-5" aria-hidden="true" />
                  </div>
                )}
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-slate-900 leading-snug">
                    {room.name}
                  </h3>
                  <div className="mt-0.5 text-xs text-slate-500">
                    {room.building} ·{' '}
                    <span className="font-mono tabular-nums">{room.capacity} kursi</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                <StatusIndicator status={room.status} />
                {canAccessBookingAndMaintenance && (
                  <button
                    type="button"
                    disabled={room.status === 'Pemeliharaan'}
                    onClick={() => onQuickBookRoom(room.id)}
                    className={`text-xs font-medium whitespace-nowrap ${
                      room.status === 'Pemeliharaan'
                        ? 'text-slate-400 cursor-not-allowed'
                        : 'text-blue-600 hover:text-blue-800'
                    }`}
                  >
                    {room.status === 'Pemeliharaan' ? 'Perbaikan' : 'Ajukan Booking'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
