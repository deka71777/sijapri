export type NavSection =
  | 'dashboard'
  | 'agenda'
  | 'kalender'
  | 'booking'
  | 'maintenance'
  | 'chatbot'
  | 'users'
  | 'pengaturan';

export type UserRole = 'Super Admin' | 'Operator' | 'Pimpinan' | 'Pemohon';

export interface UserAccount {
  id: string;
  name: string;
  nip: string;
  username: string;
  password: string;
  phoneWa: string;
  unitName: string;
  role: UserRole;
  isActive: boolean;
  lastLogin: string;
}

export interface AuditLogEntry {
  id: string;
  userName: string;
  userRole: UserRole;
  action: string;
  target: string;
  timestamp: string;
}

export type LeaderRole = 'Camat' | 'Sekcam' | 'Kasi Pemerintahan' | 'Kasi Kesos' | 'Kasi Trantib';

export type AgendaStatus = 'Terjadwal' | 'Berlangsung' | 'Selesai' | 'Ditunda';

export interface AgendaItem {
  id: string;
  title: string;
  leaderName: string;
  leaderRole: LeaderRole;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  location: string;
  status: AgendaStatus;
  disposition: string;
  priority: 'Tinggi' | 'Normal';
}

export type RoomStatus = 'Tersedia' | 'Digunakan' | 'Pemeliharaan';

export interface Room {
  id: string;
  name: string;
  building: string;
  capacity: number;
  facilities: string[];
  status: RoomStatus;
  imageUrl?: string;
}

export type BookingStatus = 'Disetujui' | 'Pending' | 'Ditolak' | 'Dibatalkan';

export interface RoomBooking {
  id: string;
  roomId: string;
  roomName: string;
  requesterName: string;
  unitOrVillage: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  purpose: string;
  attendees: number;
  status: BookingStatus;
}

export type MaintenancePriority = 'Mendesak' | 'Tinggi' | 'Normal';
export type MaintenanceStatus = 'Menunggu' | 'Dalam Proses' | 'Selesai';

export interface MaintenanceTicket {
  id: string;
  roomId: string;
  roomName: string;
  assetName: string;
  issue: string;
  reportedBy: string;
  reportedDate: string; // YYYY-MM-DD
  priority: MaintenancePriority;
  status: MaintenanceStatus;
  technician: string;
}

export interface InstansiSettings {
  namaInstansi: string;
  kabupaten: string;
  alamat: string;
  telepon: string;
  jamLayanan: string;
  camatNama: string;
  sekcamNama: string;
  notifikasiWa: boolean;
  notifikasiEmail: boolean;
  autoKonflikCheck: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
  isError?: boolean;
}
