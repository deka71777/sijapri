import {
  Bot,
  CalendarDays,
  CalendarRange,
  DoorOpen,
  LayoutDashboard,
  LogIn,
  Settings,
  Users,
  Wrench,
  X,
} from 'lucide-react';
import type { NavSection, UserAccount } from '../types/sijapri';

interface SidebarProps {
  activeSection: NavSection;
  onSelect: (section: NavSection) => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  pendingBookingsCount: number;
  activeMaintenanceCount: number;
  currentUser: UserAccount;
  onOpenLoginModal: () => void;
}

interface NavItem {
  id: NavSection;
  label: string;
  icon: typeof LayoutDashboard;
  badgeCount?: number;
  superAdminOnly?: boolean;
  hideForPimpinan?: boolean;
}

export function Sidebar({
  activeSection,
  onSelect,
  mobileOpen,
  onCloseMobile,
  pendingBookingsCount,
  activeMaintenanceCount,
  currentUser,
  onOpenLoginModal,
}: SidebarProps) {
  const isSuperAdmin = currentUser.role === 'Super Admin';
  const isPimpinan = currentUser.role === 'Pimpinan';

  const navItems: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'agenda', label: 'Agenda Pimpinan', icon: CalendarRange },
    { id: 'kalender', label: 'Kalender', icon: CalendarDays },
    {
      id: 'booking',
      label: 'Booking Ruangan',
      icon: DoorOpen,
      badgeCount: pendingBookingsCount,
      hideForPimpinan: true,
    },
    {
      id: 'maintenance',
      label: 'Maintenance',
      icon: Wrench,
      badgeCount: activeMaintenanceCount,
      hideForPimpinan: true,
    },
    { id: 'chatbot', label: 'Chatbot AI Assistant', icon: Bot },
    { id: 'users', label: 'Manajemen User', icon: Users, superAdminOnly: true },
    { id: 'pengaturan', label: 'Pengaturan', icon: Settings, superAdminOnly: true },
  ];

  const visibleItems = navItems.filter(
    (item) => (!item.superAdminOnly || isSuperAdmin) && !(item.hideForPimpinan && isPimpinan),
  );

  const handleSelect = (id: NavSection) => {
    onSelect(id);
    onCloseMobile();
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#0F172A] text-slate-100 select-none">
      {/* Institutional Brand Header */}
      <div className="flex items-center justify-between px-5 py-5 border-b border-slate-800/80">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center shrink-0">
            <svg
              viewBox="0 0 24 24"
              className="w-5 h-5 text-blue-400"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              aria-hidden="true"
            >
              <path d="M12 2L4 5.5v5.5c0 5 3.4 9.6 8 11 4.6-1.4 8-6 8-11V5.5L12 2z" />
              <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="min-w-0">
            <div className="text-base font-bold tracking-tight text-white leading-tight truncate">
              SIJAPRI
            </div>
            <div className="text-xs text-slate-400 truncate">Kecamatan Krembung</div>
          </div>
        </div>
        <button
          type="button"
          onClick={onCloseMobile}
          className="lg:hidden p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-blue-500"
          aria-label="Tutup menu navigasi"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto" aria-label="Menu Utama SIJAPRI">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleSelect(item.id)}
              aria-current={isActive ? 'page' : undefined}
              className={`w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-blue-400 ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <span className="flex items-center gap-3 min-w-0">
                <Icon
                  className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`}
                  aria-hidden="true"
                />
                <span className="truncate whitespace-nowrap">{item.label}</span>
              </span>
              {typeof item.badgeCount === 'number' && item.badgeCount > 0 && (
                <span
                  className={`text-xs font-mono tabular-nums px-1.5 py-0.5 rounded ${
                    isActive
                      ? 'bg-blue-700 text-white'
                      : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                  }`}
                >
                  {item.badgeCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Active User & RBAC Account Switcher */}
      <div className="px-4 py-4 border-t border-slate-800/80 space-y-3">
        <div className="min-w-0">
          <div className="text-xs font-semibold text-white truncate">{currentUser.name}</div>
          <div className="text-[11px] text-slate-400 truncate mt-0.5">
            {currentUser.role} · {currentUser.unitName}
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            onOpenLoginModal();
            onCloseMobile();
          }}
          className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors"
        >
          <LogIn className="w-3.5 h-3.5 text-blue-400" aria-hidden="true" />
          <span>Login / Ganti Role</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Fixed Sidebar */}
      <aside className="hidden lg:block w-[260px] shrink-0 border-r border-slate-800">
        <div className="sticky top-0 h-screen">{sidebarContent}</div>
      </aside>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-[1px]"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <aside className="relative w-[272px] max-w-[85vw] h-full shadow-xl z-10">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}
