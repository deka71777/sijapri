import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  PauseCircle,
  PlayCircle,
  Wrench,
  XCircle,
} from 'lucide-react';

interface StatusIndicatorProps {
  status: string;
}

export function StatusIndicator({ status }: StatusIndicatorProps) {
  switch (status) {
    case 'Tersedia':
    case 'Disetujui':
    case 'Selesai':
    case 'Aktif':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 whitespace-nowrap">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" aria-hidden="true" />
          <span>{status}</span>
        </span>
      );
    case 'Berlangsung':
    case 'Digunakan':
    case 'Terjadwal':
    case 'Dalam Proses':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-700 whitespace-nowrap">
          {status === 'Berlangsung' || status === 'Digunakan' ? (
            <PlayCircle className="w-3.5 h-3.5 text-blue-600 shrink-0" aria-hidden="true" />
          ) : (
            <Clock className="w-3.5 h-3.5 text-blue-600 shrink-0" aria-hidden="true" />
          )}
          <span>{status}</span>
        </span>
      );
    case 'Menunggu':
    case 'Pending':
    case 'Pemeliharaan':
    case 'Ditunda':
    case 'Tinggi':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700 whitespace-nowrap">
          {status === 'Pemeliharaan' ? (
            <Wrench className="w-3.5 h-3.5 text-amber-600 shrink-0" aria-hidden="true" />
          ) : status === 'Ditunda' ? (
            <PauseCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" aria-hidden="true" />
          ) : (
            <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" aria-hidden="true" />
          )}
          <span>{status}</span>
        </span>
      );
    case 'Mendesak':
    case 'Ditolak':
    case 'Dibatalkan':
    case 'Nonaktif':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-red-700 whitespace-nowrap">
          {status === 'Mendesak' ? (
            <AlertTriangle className="w-3.5 h-3.5 text-red-600 shrink-0" aria-hidden="true" />
          ) : (
            <XCircle className="w-3.5 h-3.5 text-red-600 shrink-0" aria-hidden="true" />
          )}
          <span>{status}</span>
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 whitespace-nowrap">
          <span>{status}</span>
        </span>
      );
  }
}
