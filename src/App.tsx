import { useState } from 'react';
import { Menu, Plus } from 'lucide-react';
import { AgendaView } from './components/AgendaView';
import { BookingView } from './components/BookingView';
import { ChatbotView } from './components/ChatbotView';
import { DashboardView } from './components/DashboardView';
import { KalenderView } from './components/KalenderView';
import { LoginModal } from './components/LoginModal';
import { LoginView } from './components/LoginView';
import { MaintenanceView } from './components/MaintenanceView';
import { SettingsView } from './components/SettingsView';
import { Sidebar } from './components/Sidebar';
import { UserManagementView } from './components/UserManagementView';
import {
  INITIAL_AGENDAS,
  INITIAL_AUDIT_LOGS,
  INITIAL_BOOKINGS,
  INITIAL_MAINTENANCE,
  INITIAL_ROOMS,
  INITIAL_SETTINGS,
  INITIAL_USERS,
} from './data/initialData';
import type {
  AgendaItem,
  AgendaStatus,
  AuditLogEntry,
  BookingStatus,
  InstansiSettings,
  MaintenanceStatus,
  MaintenanceTicket,
  NavSection,
  Room,
  RoomBooking,
  UserAccount,
} from './types/sijapri';

const SECTION_META: Record<NavSection, { title: string; subtitle: string }> = {
  dashboard: {
    title: 'Dashboard',
    subtitle: 'Ringkasan jadwal pimpinan, okupansi ruangan, dan status sarana',
  },
  agenda: {
    title: 'Agenda Pimpinan',
    subtitle: 'Jadwal kegiatan resmi Camat, Sekcam, dan Kepala Seksi',
  },
  kalender: {
    title: 'Kalender',
    subtitle: 'Tampilan kalender terpadu agenda pimpinan dan pemakaian ruangan',
  },
  booking: {
    title: 'Booking Ruangan',
    subtitle: 'Pengajuan peminjaman dan verifikasi ketersediaan ruangan kantor',
  },
  maintenance: {
    title: 'Maintenance',
    subtitle: 'Pelaporan kerusakan dan pemeliharaan fasilitas ruangan',
  },
  chatbot: {
    title: 'Chatbot AI Assistant',
    subtitle: 'Asisten cerdas informasi jadwal pimpinan, cek ruangan, dan draf surat rapat',
  },
  users: {
    title: 'Manajemen User',
    subtitle: 'Master pengguna, matriks hak akses (RBAC), dan jejak audit sesuai PRD SIJAPRI',
  },
  pengaturan: {
    title: 'Pengaturan',
    subtitle: 'Profil instansi Kecamatan Krembung dan ekspor kerangka HTML',
  },
};

const AUTH_STORAGE_KEY = 'sijapri_auth_user_id';

function readSavedAuthId(): string | null {
  try {
    return sessionStorage.getItem(AUTH_STORAGE_KEY);
  } catch {
    return null;
  }
}

export default function App() {
  const [activeSection, setActiveSection] = useState<NavSection>('dashboard');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  const [users, setUsers] = useState<UserAccount[]>(INITIAL_USERS);
  const [currentUserId, setCurrentUserId] = useState<string>(() => {
    const savedId = readSavedAuthId();
    if (savedId && INITIAL_USERS.some((u) => u.id === savedId && u.isActive)) {
      return savedId;
    }
    return INITIAL_USERS[0].id;
  });
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    const savedId = readSavedAuthId();
    return Boolean(savedId && INITIAL_USERS.some((u) => u.id === savedId && u.isActive));
  });
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(INITIAL_AUDIT_LOGS);

  const [agendas, setAgendas] = useState<AgendaItem[]>(INITIAL_AGENDAS);
  const [rooms, setRooms] = useState<Room[]>(INITIAL_ROOMS);
  const [bookings, setBookings] = useState<RoomBooking[]>(INITIAL_BOOKINGS);
  const [maintenance, setMaintenance] = useState<MaintenanceTicket[]>(INITIAL_MAINTENANCE);
  const [settings, setSettings] = useState<InstansiSettings>(INITIAL_SETTINGS);
  const [preselectedRoomId, setPreselectedRoomId] = useState<string | null>(null);

  const currentUser = users.find((u) => u.id === currentUserId) ?? users[0];
  const isSuperAdmin = currentUser.role === 'Super Admin';
  const canAccessBookingAndMaintenance = currentUser.role !== 'Pimpinan';
  const canVerifyBookings = currentUser.role === 'Super Admin' || currentUser.role === 'Operator';
  const canManageMaintenance = currentUser.role === 'Super Admin' || currentUser.role === 'Operator';
  const canManageAgendas =
    currentUser.role === 'Super Admin' ||
    currentUser.role === 'Operator' ||
    currentUser.role === 'Pimpinan';

  const pendingBookingsCount = bookings.filter((b) => b.status === 'Pending').length;
  const activeMaintenanceCount = maintenance.filter((m) => m.status !== 'Selesai').length;

  const appendAudit = (action: string, target: string, actor: UserAccount = currentUser) => {
    const nowStr = `2026-11-16 ${new Date().toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    })} WIB`;
    setAuditLogs((prev) => [
      {
        id: `AUD-${104 + prev.length}`,
        userName: actor.name,
        userRole: actor.role,
        action,
        target,
        timestamp: nowStr,
      },
      ...prev,
    ]);
  };

  const handleSelectSection = (section: NavSection) => {
    if ((section === 'users' || section === 'pengaturan') && !isSuperAdmin) {
      setActiveSection('dashboard');
      return;
    }
    if ((section === 'booking' || section === 'maintenance') && !canAccessBookingAndMaintenance) {
      setActiveSection('dashboard');
      return;
    }
    setActiveSection(section);
  };

  const handleLoginSuccess = (user: UserAccount) => {
    const loginTime = `2026-11-16 ${new Date().toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    })} WIB`;
    try {
      sessionStorage.setItem(AUTH_STORAGE_KEY, user.id);
    } catch {
      // Ignore storage restriction
    }
    setUsers((prev) =>
      prev.map((u) => (u.id === user.id ? { ...u, lastLogin: loginTime } : u)),
    );
    setCurrentUserId(user.id);
    setIsAuthenticated(true);
    setShowLoginModal(false);
    appendAudit(`Login ke sistem sebagai ${user.role}`, 'Autentikasi', user);
    if (!isAuthenticated) {
      setActiveSection('dashboard');
      return;
    }
    if ((activeSection === 'users' || activeSection === 'pengaturan') && user.role !== 'Super Admin') {
      setActiveSection('dashboard');
    } else if (
      (activeSection === 'booking' || activeSection === 'maintenance') &&
      user.role === 'Pimpinan'
    ) {
      setActiveSection('dashboard');
    }
  };

  const handleLogout = () => {
    appendAudit(`Logout dari sistem`, 'Autentikasi', currentUser);
    try {
      sessionStorage.removeItem(AUTH_STORAGE_KEY);
    } catch {
      // Ignore storage restriction
    }
    setIsAuthenticated(false);
    setShowLoginModal(false);
    setMobileSidebarOpen(false);
    setActiveSection('dashboard');
  };

  const handleAddUser = (draft: Omit<UserAccount, 'id' | 'lastLogin'>) => {
    const newUser: UserAccount = {
      ...draft,
      id: `USR-${String(users.length + 1).padStart(3, '0')}`,
      lastLogin: 'Belum login',
    };
    setUsers((prev) => [newUser, ...prev]);
    appendAudit(`Menambahkan akun ${newUser.name} (${newUser.role})`, 'Manajemen User');
  };

  const handleUpdateUser = (id: string, patch: Partial<UserAccount>) => {
    const target = users.find((u) => u.id === id);
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...patch } : u)));
    if (target) {
      appendAudit(`Memperbarui data/status akun ${target.name}`, 'Manajemen User');
    }
  };

  const handleDeleteUser = (id: string) => {
    if (id === currentUser.id) return;
    const target = users.find((u) => u.id === id);
    setUsers((prev) => prev.filter((u) => u.id !== id));
    if (target) {
      appendAudit(`Menghapus akun ${target.name} (${target.username})`, 'Manajemen User');
    }
  };

  const handleAddAgenda = (draft: Omit<AgendaItem, 'id'>) => {
    const newItem: AgendaItem = {
      ...draft,
      id: `AG-2026-${String(agendas.length + 1).padStart(2, '0')}`,
    };
    setAgendas((prev) => [newItem, ...prev]);
    appendAudit(`Menambahkan agenda "${newItem.title}"`, 'Agenda Pimpinan');
  };

  const handleUpdateAgendaStatus = (id: string, status: AgendaStatus) => {
    if (!canManageAgendas) return;
    const target = agendas.find((a) => a.id === id);
    setAgendas((prev) => prev.map((item) => (item.id === id ? { ...item, status } : item)));
    if (target) {
      appendAudit(`Mengubah status "${target.title}" menjadi ${status}`, 'Agenda Pimpinan');
    }
  };

  const handleDeleteAgenda = (id: string) => {
    if (!canManageAgendas) return;
    const target = agendas.find((a) => a.id === id);
    setAgendas((prev) => prev.filter((item) => item.id !== id));
    if (target) {
      appendAudit(`Menghapus agenda "${target.title}"`, 'Agenda Pimpinan');
    }
  };

  const handleAddBooking = (draft: Omit<RoomBooking, 'id' | 'status'>) => {
    const newBooking: RoomBooking = {
      ...draft,
      id: `BK-${1100 + bookings.length + 1}`,
      status: 'Pending',
    };
    setBookings((prev) => [newBooking, ...prev]);
    appendAudit(`Mengajukan booking ${newBooking.roomName} (${newBooking.id})`, 'Booking Ruangan');
  };

  const handleUpdateBookingStatus = (id: string, status: BookingStatus) => {
    if (!canVerifyBookings) return;
    const target = bookings.find((b) => b.id === id);
    setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, status } : b)));
    if (target) {
      appendAudit(`Mengubah status booking ${target.id} menjadi ${status}`, 'Booking Ruangan');
    }
  };

  const handleAddMaintenance = (draft: Omit<MaintenanceTicket, 'id' | 'status'>) => {
    const newTicket: MaintenanceTicket = {
      ...draft,
      id: `MT-0${45 + maintenance.length}`,
      status: 'Menunggu',
    };
    setMaintenance((prev) => [newTicket, ...prev]);
    if (draft.priority === 'Mendesak') {
      setRooms((prev) =>
        prev.map((r) => (r.id === draft.roomId ? { ...r, status: 'Pemeliharaan' } : r)),
      );
    }
    appendAudit(`Melaporkan kerusakan ${newTicket.assetName} (${newTicket.id})`, 'Maintenance');
  };

  const handleUpdateMaintenanceStatus = (id: string, status: MaintenanceStatus) => {
    if (!canManageMaintenance) return;
    const target = maintenance.find((m) => m.id === id);
    setMaintenance((prev) => prev.map((m) => (m.id === id ? { ...m, status } : m)));
    if (target && status === 'Selesai') {
      setRooms((prev) =>
        prev.map((r) =>
          r.id === target.roomId && r.status === 'Pemeliharaan' ? { ...r, status: 'Tersedia' } : r,
        ),
      );
    }
    if (target) {
      appendAudit(`Memperbarui tiket ${target.id} menjadi ${status}`, 'Maintenance');
    }
  };

  const handleQuickBookRoom = (roomId: string) => {
    if (!canAccessBookingAndMaintenance) return;
    setPreselectedRoomId(roomId);
    setActiveSection('booking');
  };

  const handleSaveSettings = (next: InstansiSettings) => {
    const camatName = next.camatNama.trim() || settings.camatNama;
    const sekcamName = next.sekcamNama.trim() || settings.sekcamNama;
    const normalized: InstansiSettings = {
      ...next,
      camatNama: camatName,
      sekcamNama: sekcamName,
    };
    setSettings(normalized);
    setAgendas((prev) =>
      prev.map((item) => {
        if (item.leaderRole === 'Camat') return { ...item, leaderName: camatName };
        if (item.leaderRole === 'Sekcam') return { ...item, leaderName: sekcamName };
        return item;
      }),
    );
    setUsers((prev) =>
      prev.map((u) => {
        if (u.username === 'camat') return { ...u, name: camatName };
        if (u.username === 'sekcam') return { ...u, name: sekcamName };
        return u;
      }),
    );
    appendAudit(
      `Memperbarui pengaturan instansi (Camat: ${camatName}, Sekcam: ${sekcamName})`,
      'Pengaturan',
    );
  };

  const meta = SECTION_META[activeSection];

  if (!isAuthenticated) {
    return (
      <LoginView
        users={users}
        settings={settings}
        onLoginSuccess={handleLoginSuccess}
      />
    );
  }

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900">
      <Sidebar
        activeSection={activeSection}
        onSelect={handleSelectSection}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
        pendingBookingsCount={pendingBookingsCount}
        activeMaintenanceCount={activeMaintenanceCount}
        currentUser={currentUser}
        onOpenLoginModal={() => setShowLoginModal(true)}
        onLogout={handleLogout}
      />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar Contract: Breadcrumb Left — Single Action Right */}
        <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 sm:px-6 py-3.5 flex items-center justify-between gap-8">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50"
              aria-label="Buka menu navigasi"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-sm text-slate-500 min-w-0">
              <span className="hidden sm:inline whitespace-nowrap">SIJAPRI</span>
              <span className="hidden sm:inline text-slate-300" aria-hidden="true">
                /
              </span>
              <span className="hidden md:inline whitespace-nowrap truncate">
                {settings.namaInstansi}
              </span>
              <span className="hidden md:inline text-slate-300" aria-hidden="true">
                /
              </span>
              <h1 className="font-semibold text-slate-900 truncate whitespace-nowrap">
                {meta.title}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <span className="hidden xl:inline text-xs font-mono tabular-nums text-slate-500 whitespace-nowrap">
              Senin, 16 November 2026
            </span>
            {activeSection === 'booking' && canAccessBookingAndMaintenance && (
              <button
                type="button"
                onClick={() => {
                  const input = document.getElementById('booking-applicant');
                  input?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  input?.focus();
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors whitespace-nowrap shrink-0"
              >
                <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Booking Ruangan</span>
              </button>
            )}
          </div>
        </header>

        {/* Main Workspace Content */}
        <main className="flex-1 p-4 sm:p-6 max-w-[1440px] w-full mx-auto space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1">
            <p className="text-xs text-slate-500">{meta.subtitle}</p>
            <p className="text-xs text-slate-500">
              Masuk sebagai{' '}
              <span className="font-semibold text-slate-800">{currentUser.name}</span> ·{' '}
              <span className="font-medium text-blue-700">{currentUser.role}</span>
            </p>
          </div>

          {activeSection === 'dashboard' && (
            <DashboardView
              agendas={agendas}
              rooms={rooms}
              bookings={bookings}
              maintenance={maintenance}
              canManageAgendas={canManageAgendas}
              canAccessBookingAndMaintenance={canAccessBookingAndMaintenance}
              onNavigate={handleSelectSection}
              onQuickBookRoom={handleQuickBookRoom}
              onUpdateAgendaStatus={handleUpdateAgendaStatus}
            />
          )}

          {activeSection === 'agenda' && (
            <AgendaView
              agendas={agendas}
              rooms={rooms}
              settings={settings}
              canManageAgendas={canManageAgendas}
              onAddAgenda={handleAddAgenda}
              onUpdateStatus={handleUpdateAgendaStatus}
              onDeleteAgenda={handleDeleteAgenda}
            />
          )}

          {activeSection === 'kalender' && (
            <KalenderView
              agendas={agendas}
              bookings={bookings}
              canAccessBookingAndMaintenance={canAccessBookingAndMaintenance}
              onNavigate={handleSelectSection}
            />
          )}

          {activeSection === 'booking' && canAccessBookingAndMaintenance && (
            <BookingView
              rooms={rooms}
              bookings={bookings}
              preselectedRoomId={preselectedRoomId}
              autoKonflikCheck={settings.autoKonflikCheck}
              canVerifyBookings={canVerifyBookings}
              onAddBooking={handleAddBooking}
              onUpdateBookingStatus={handleUpdateBookingStatus}
            />
          )}

          {activeSection === 'maintenance' && canAccessBookingAndMaintenance && (
            <MaintenanceView
              tickets={maintenance}
              rooms={rooms}
              currentUser={currentUser}
              canManageMaintenance={canManageMaintenance}
              onAddTicket={handleAddMaintenance}
              onUpdateTicketStatus={handleUpdateMaintenanceStatus}
            />
          )}

          {activeSection === 'chatbot' && (
            <ChatbotView
              agendas={agendas}
              rooms={rooms}
              bookings={bookings}
              maintenance={maintenance}
              settings={settings}
            />
          )}

          {activeSection === 'users' && isSuperAdmin && (
            <UserManagementView
              users={users}
              currentUser={currentUser}
              auditLogs={auditLogs}
              onAddUser={handleAddUser}
              onUpdateUser={handleUpdateUser}
              onDeleteUser={handleDeleteUser}
            />
          )}

          {activeSection === 'pengaturan' && isSuperAdmin && (
            <SettingsView settings={settings} onSaveSettings={handleSaveSettings} />
          )}
        </main>
      </div>

      {showLoginModal && (
        <LoginModal
          users={users}
          currentUser={currentUser}
          onLoginSuccess={handleLoginSuccess}
          onClose={() => setShowLoginModal(false)}
        />
      )}
    </div>
  );
}
