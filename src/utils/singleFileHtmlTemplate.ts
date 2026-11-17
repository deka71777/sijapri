export function generateSingleFileHtml(): string {
  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>SIJAPRI — Sistem Informasi Jadwal Pimpinan &amp; Pemakaian Ruangan Kecamatan Krembung</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
  <script>
    tailwind.config = {
      theme: {
        extend: {
          fontFamily: {
            sans: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
            mono: ['JetBrains Mono', 'monospace'],
          }
        }
      }
    };
  </script>
</head>
<body class="bg-slate-50 text-slate-900 font-sans antialiased" x-data="sijapriApp()">
  <div class="min-h-screen flex">
    <!-- Backdrop Mobile -->
    <div x-show="sidebarOpen" x-transition.opacity @click="sidebarOpen = false" class="fixed inset-0 bg-slate-950/60 z-40 lg:hidden"></div>

    <!-- Sidebar Kiri (Navy / Slate Tua) -->
    <aside :class="sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'"
      class="fixed lg:sticky top-0 left-0 z-50 h-screen w-64 bg-slate-900 text-slate-100 flex flex-col border-r border-slate-800 transition-transform duration-200 shrink-0">
      <div class="px-5 py-5 border-b border-slate-800 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold">S</div>
          <div>
            <div class="text-base font-bold text-white leading-tight">SIJAPRI</div>
            <div class="text-xs text-slate-400">Kecamatan Krembung</div>
          </div>
        </div>
        <button @click="sidebarOpen = false" class="lg:hidden text-slate-400 hover:text-white p-1" aria-label="Tutup menu">✕</button>
      </div>

      <nav class="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <template x-for="item in visibleMenuItems" :key="item.id">
          <button @click="selectMenu(item.id)"
            :class="activeTab === item.id ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'"
            class="w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors text-left">
            <span x-text="item.label"></span>
            <span x-show="item.id === 'booking' && pendingBookingsCount > 0" x-text="pendingBookingsCount" class="text-xs font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300"></span>
            <span x-show="item.id === 'maintenance' && openMaintenanceCount > 0" x-text="openMaintenanceCount" class="text-xs font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300"></span>
          </button>
        </template>
      </nav>

      <div class="px-4 py-4 border-t border-slate-800 space-y-2 text-xs">
        <div>
          <div class="font-semibold text-white truncate" x-text="currentUser.name"></div>
          <div class="text-blue-400 font-medium" x-text="currentUser.role + ' · ' + currentUser.unitName"></div>
        </div>
        <div>
          <label class="block text-[11px] text-slate-400 mb-1">Uji Role (RBAC)</label>
          <select x-model="currentUserId" @change="onRoleChanged()" class="w-full px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-xs">
            <template x-for="u in users.filter(x => x.isActive)" :key="u.id">
              <option :value="u.id" x-text="u.role + ' — ' + u.name"></option>
            </template>
          </select>
        </div>
      </div>
    </aside>

    <!-- Area Konten Kanan -->
    <div class="flex-1 flex flex-col min-w-0">
      <header class="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4">
        <div class="flex items-center gap-3 min-w-0">
          <button @click="sidebarOpen = true" class="lg:hidden p-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50" aria-label="Buka menu">☰</button>
          <div class="text-sm text-slate-500 truncate">
            <span>SIJAPRI</span>
            <span class="mx-1.5">/</span>
            <span class="font-semibold text-slate-900" x-text="currentTitle"></span>
          </div>
        </div>
        <div class="flex items-center gap-4 shrink-0">
          <span class="hidden sm:inline text-xs text-slate-500 font-mono">Senin, 16 November 2026</span>
          <button x-show="activeTab === 'booking' && canAccessBookingAndMaintenance" @click="selectMenu('booking')" class="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors whitespace-nowrap">
            + Booking Ruangan
          </button>
        </div>
      </header>

      <main class="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto space-y-6">
        <!-- Panel Dashboard -->
        <section x-show="activeTab === 'dashboard'" class="space-y-6">
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            <div class="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between">
              <div class="text-xs font-medium text-slate-500">Total Fasilitas</div>
              <div class="mt-2.5 flex items-baseline gap-2">
                <span class="text-2xl font-bold font-mono text-slate-900" x-text="rooms.length"></span>
                <span class="text-xs text-slate-500">ruangan gedung</span>
              </div>
              <div class="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-600 font-mono" x-text="totalCapacity + ' total kursi'"></div>
            </div>

            <div class="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between">
              <div class="text-xs font-medium text-slate-500">Status Ruangan Aktif</div>
              <div class="mt-2.5 flex items-baseline gap-2">
                <span class="text-2xl font-bold font-mono text-slate-900" x-text="activeRoomsCount + ' / ' + rooms.length"></span>
                <span class="text-xs text-slate-500">siap operasional</span>
              </div>
              <div class="mt-3 pt-3 border-t border-slate-100 text-xs font-medium text-emerald-700" x-text="availableRoomsCount + ' ruang kosong saat ini'"></div>
            </div>

            <div class="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between">
              <div class="text-xs font-medium text-slate-500">Booking Hari Ini</div>
              <div class="mt-2.5 flex items-baseline gap-2">
                <span class="text-2xl font-bold font-mono text-slate-900" x-text="todayBookingsCount"></span>
                <span class="text-xs text-slate-500">sesi pemakaian</span>
              </div>
              <div class="mt-3 pt-3 border-t border-slate-100 text-xs font-medium text-blue-700" x-text="pendingBookingsCount + ' pending verifikasi'"></div>
            </div>

            <div class="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between">
              <div class="text-xs font-medium text-slate-500">Tingkat Utilisasi</div>
              <div class="mt-2.5 flex items-baseline gap-2">
                <span class="text-2xl font-bold font-mono text-slate-900" x-text="utilizationRate + '%'"></span>
                <span class="text-xs text-slate-500">jam layanan</span>
              </div>
              <div class="mt-3 pt-3 border-t border-slate-100 space-y-1.5">
                <div class="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div class="h-full bg-blue-600 rounded-full" :style="'width: ' + utilizationRate + '%'"></div>
                </div>
                <div class="text-[11px] font-mono text-slate-500">Kapasitas operasional harian</div>
              </div>
            </div>

            <div class="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between sm:col-span-2 lg:col-span-1">
              <div class="text-xs font-medium text-slate-500">Open Maintenance Ticket</div>
              <div class="mt-2.5 flex items-baseline gap-2">
                <span class="text-2xl font-bold font-mono text-slate-900" x-text="openMaintenanceCount"></span>
                <span class="text-xs text-slate-500">tiket terbuka</span>
              </div>
              <div class="mt-3 pt-3 border-t border-slate-100 text-xs font-medium text-amber-700" x-text="urgentMaintenanceCount + ' prioritas mendesak'"></div>
            </div>
          </div>

          <div class="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div class="px-6 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 class="text-base font-semibold text-slate-900">Tabel Ringkasan Kegiatan Harian</h2>
                <p class="text-xs text-slate-500 mt-0.5">Senin, 16 November 2026 · Agenda Pimpinan dan Pemakaian Ruangan</p>
              </div>
              <div class="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
                <template x-for="cat in ['Semua', 'Agenda Pimpinan', 'Pemakaian Ruangan']" :key="cat">
                  <button @click="dashboardTableFilter = cat"
                    :class="dashboardTableFilter === cat ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'"
                    class="px-2.5 py-1 text-xs font-medium rounded-md transition-colors" x-text="cat"></button>
                </template>
              </div>
            </div>
            <div class="overflow-x-auto">
              <table class="w-full text-left text-sm border-collapse">
                <thead class="bg-slate-50 border-b border-slate-200 text-xs text-slate-500">
                  <tr>
                    <th class="px-6 py-3 font-semibold">Waktu</th>
                    <th class="px-6 py-3 font-semibold">Kategori</th>
                    <th class="px-6 py-3 font-semibold">Kegiatan / Keperluan</th>
                    <th class="px-6 py-3 font-semibold">Pejabat / Pemohon</th>
                    <th class="px-6 py-3 font-semibold">Lokasi / Ruangan</th>
                    <th class="px-6 py-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  <template x-for="row in filteredDailySummary" :key="row.key">
                    <tr class="hover:bg-slate-50">
                      <td class="px-6 py-3.5 font-mono text-xs text-slate-800 whitespace-nowrap" x-text="row.time"></td>
                      <td class="px-6 py-3.5 text-xs font-medium text-slate-600 whitespace-nowrap" x-text="row.category"></td>
                      <td class="px-6 py-3.5 font-semibold text-slate-900" x-text="row.title"></td>
                      <td class="px-6 py-3.5 text-xs text-slate-600" x-text="row.pic"></td>
                      <td class="px-6 py-3.5 text-xs text-slate-700" x-text="row.location"></td>
                      <td class="px-6 py-3.5 text-xs font-semibold whitespace-nowrap"
                        :class="(row.status === 'Selesai' || row.status === 'Disetujui') ? 'text-emerald-700' : (row.status === 'Pending' ? 'text-amber-700' : 'text-blue-700')"
                        x-text="row.status"></td>
                    </tr>
                  </template>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <!-- Panel Agenda Pimpinan -->
        <section x-show="activeTab === 'agenda'" class="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div class="px-5 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <h2 class="text-base font-semibold text-slate-900">Daftar Agenda Pimpinan Kecamatan Krembung</h2>
            <input type="text" x-model="agendaSearch" placeholder="Cari agenda atau pimpinan..." class="px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600" />
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-left text-sm">
              <thead class="bg-slate-50 border-b border-slate-200 text-xs text-slate-500">
                <tr>
                  <th class="px-5 py-3 font-semibold">Tanggal &amp; Jam</th>
                  <th class="px-5 py-3 font-semibold">Kegiatan</th>
                  <th class="px-5 py-3 font-semibold">Pimpinan</th>
                  <th class="px-5 py-3 font-semibold">Lokasi</th>
                  <th class="px-5 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                <template x-for="item in filteredAgendas" :key="item.id">
                  <tr class="hover:bg-slate-50">
                    <td class="px-5 py-3.5 font-mono text-xs text-slate-700 whitespace-nowrap" x-text="item.date + ' · ' + item.startTime + ' - ' + item.endTime"></td>
                    <td class="px-5 py-3.5 font-medium text-slate-900" x-text="item.title"></td>
                    <td class="px-5 py-3.5 text-slate-600" x-text="item.leader"></td>
                    <td class="px-5 py-3.5 text-slate-600" x-text="item.location"></td>
                    <td class="px-5 py-3.5 text-xs font-semibold" :class="item.status === 'Selesai' ? 'text-emerald-700' : 'text-blue-700'" x-text="item.status"></td>
                  </tr>
                </template>
              </tbody>
            </table>
          </div>
        </section>

        <!-- Panel Kalender Interaktif -->
        <section x-show="activeTab === 'kalender'" class="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          <div class="xl:col-span-8 bg-white border border-slate-200 rounded-xl p-6 space-y-5">
            <div class="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200">
              <div>
                <h2 class="text-lg font-semibold text-slate-900" x-text="monthName + ' ' + calYear"></h2>
                <p class="text-xs text-slate-500 mt-0.5">Menandai tanggal kegiatan pimpinan, peminjaman Pendopo, dan Ruang Rapat</p>
              </div>
              <div class="flex items-center gap-2">
                <button @click="calYear = 2026; calMonth = 10; selectedCalDate = '2026-11-16'" class="px-3 py-1.5 text-xs font-medium bg-slate-100 hover:bg-slate-200 rounded-lg">Hari Ini</button>
                <button @click="prevMonth()" class="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg hover:bg-slate-50">‹</button>
                <button @click="nextMonth()" class="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg hover:bg-slate-50">›</button>
              </div>
            </div>

            <div class="flex flex-wrap items-center justify-between gap-3">
              <div class="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-lg">
                <template x-for="layer in ['Semua', 'Agenda', 'Pendopo', 'Ruang Rapat']" :key="layer">
                  <button @click="calLayer = layer"
                    :class="calLayer === layer ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'"
                    class="px-2.5 py-1 text-xs font-medium rounded-md transition-colors" x-text="layer"></button>
                </template>
              </div>
              <div class="flex flex-wrap items-center gap-4 text-xs text-slate-600">
                <span class="inline-flex items-center gap-1.5"><span class="w-2.5 h-2.5 bg-blue-600 rounded-xs inline-block"></span> Agenda Pimpinan</span>
                <span class="inline-flex items-center gap-1.5"><span class="w-2.5 h-2.5 bg-emerald-600 rounded-xs inline-block"></span> Pendopo</span>
                <span class="inline-flex items-center gap-1.5"><span class="w-2.5 h-2.5 bg-amber-600 rounded-xs inline-block"></span> Ruang Rapat</span>
              </div>
            </div>

            <div class="grid grid-cols-7 gap-2 text-center text-xs font-semibold text-slate-500 pb-1 border-b border-slate-100">
              <div>Min</div><div>Sen</div><div>Sel</div><div>Rab</div><div>Kam</div><div>Jum</div><div>Sab</div>
            </div>

            <div class="grid grid-cols-7 gap-2">
              <template x-for="blank in firstDayOffset" :key="'b-' + blank">
                <div class="h-24 rounded-lg bg-slate-50/60"></div>
              </template>
              <template x-for="day in daysInCurrentMonth" :key="day">
                <button @click="selectedCalDate = formatCalIso(day)"
                  class="h-24 p-2 border rounded-lg text-left flex flex-col justify-between transition-colors"
                  :class="selectedCalDate === formatCalIso(day) ? 'border-blue-600 bg-blue-50/50 ring-1 ring-blue-600' : 'border-slate-200 hover:bg-slate-50'">
                  <div class="flex items-center justify-between w-full">
                    <span class="text-xs font-mono font-semibold" :class="formatCalIso(day) === '2026-11-16' ? 'text-blue-700' : 'text-slate-800'" x-text="day"></span>
                    <span x-show="formatCalIso(day) === '2026-11-16'" class="text-[10px] font-semibold text-blue-700">Hari Ini</span>
                  </div>
                  <div class="space-y-0.5 w-full overflow-hidden">
                    <div x-show="(calLayer === 'Semua' || calLayer === 'Agenda') && countDayAgendas(formatCalIso(day)) > 0"
                      class="text-[11px] font-medium text-blue-700 truncate"
                      x-text="countDayAgendas(formatCalIso(day)) + ' Pimpinan'"></div>
                    <div x-show="(calLayer === 'Semua' || calLayer === 'Pendopo') && countDayPendopo(formatCalIso(day)) > 0"
                      class="text-[11px] font-medium text-emerald-700 truncate"
                      x-text="'Pendopo (' + countDayPendopo(formatCalIso(day)) + ')'"></div>
                    <div x-show="(calLayer === 'Semua' || calLayer === 'Ruang Rapat') && countDayRapat(formatCalIso(day)) > 0"
                      class="text-[11px] font-medium text-amber-700 truncate"
                      x-text="'R. Rapat (' + countDayRapat(formatCalIso(day)) + ')'"></div>
                  </div>
                </button>
              </template>
            </div>
          </div>

          <div class="xl:col-span-4 bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div class="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 class="text-sm font-semibold text-slate-900">Detail Jadwal Tanggal</h3>
                <p class="text-xs font-mono text-slate-500 mt-0.5" x-text="selectedCalDate"></p>
              </div>
              <button x-show="canAccessBookingAndMaintenance" @click="selectMenu('booking')" class="text-xs font-medium text-blue-600 hover:underline">+ Booking</button>
            </div>
            <div class="p-5 space-y-4 text-xs">
              <div>
                <div class="font-semibold text-blue-700 mb-2">Kegiatan Pimpinan</div>
                <template x-if="selectedDateAgendas.length === 0">
                  <p class="text-slate-500">Tidak ada agenda pimpinan pada tanggal ini.</p>
                </template>
                <div class="divide-y divide-slate-100">
                  <template x-for="a in selectedDateAgendas" :key="a.id">
                    <div class="py-2">
                      <div class="font-mono text-slate-600" x-text="a.startTime + ' - ' + a.endTime"></div>
                      <div class="font-semibold text-slate-900 mt-0.5" x-text="a.title"></div>
                      <div class="text-slate-500" x-text="a.leader + ' · ' + a.location"></div>
                    </div>
                  </template>
                </div>
              </div>
              <div class="pt-3 border-t border-slate-200">
                <div class="font-semibold text-emerald-700 mb-2">Peminjaman Pendopo &amp; Ruang Rapat</div>
                <template x-if="selectedDateBookings.length === 0">
                  <p class="text-slate-500">Seluruh ruangan tersedia sepanjang hari.</p>
                </template>
                <div class="divide-y divide-slate-100">
                  <template x-for="b in selectedDateBookings" :key="b.id">
                    <div class="py-2">
                      <div class="font-mono text-slate-600" x-text="b.date + ' · ' + b.startTime + ' - ' + b.endTime"></div>
                      <div class="font-semibold text-slate-900 mt-0.5" x-text="b.room + ' — ' + b.purpose"></div>
                      <div class="text-slate-500" x-text="b.unit + ' (' + b.status + ')'"></div>
                    </div>
                  </template>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- Panel Booking Ruangan (Formulir, Anti-Bentrok Real-Time, Tabel Status Pengajuan) -->
        <section x-show="activeTab === 'booking'" class="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          <form @submit.prevent="submitBooking()" class="xl:col-span-5 bg-white border border-slate-200 rounded-xl p-6 space-y-4">
            <div class="flex items-start justify-between gap-3">
              <div>
                <h2 class="text-base font-semibold text-slate-900">Formulir Peminjaman Ruangan</h2>
                <p class="text-xs text-slate-500 mt-0.5">Validasi anti-bentrok (Conflict Detection) otomatis</p>
              </div>
              <button type="button" @click="simulateConflict()" class="px-2.5 py-1.5 text-xs font-medium text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg whitespace-nowrap">
                Uji Bentrok
              </button>
            </div>

            <!-- Peringatan Merah Anti-Bentrok -->
            <div x-show="bookingConflictMessage" role="alert" class="p-3.5 rounded-lg bg-red-50 border border-red-300 text-xs text-red-900">
              <div class="font-semibold text-red-800">Peringatan Validasi Anti-Bentrok</div>
              <div class="mt-0.5" x-text="bookingConflictMessage"></div>
            </div>

            <div x-show="bookingSuccessMsg && !bookingConflictMessage" class="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-900" x-text="bookingSuccessMsg"></div>

            <div>
              <label class="block text-xs font-medium text-slate-700 mb-1">Nama Pemohon / Seksi</label>
              <input type="text" required x-model="newBooking.unit" placeholder="Contoh: Kasi Kesos / Pemdes Mojoruntut" class="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600" />
            </div>

            <div>
              <label class="block text-xs font-medium text-slate-700 mb-1">Pilih Ruangan</label>
              <select x-model="newBooking.room" class="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-blue-600">
                <template x-for="r in rooms" :key="r.name">
                  <option :value="r.name" x-text="r.name + ' (' + r.status + ')'"></option>
                </template>
              </select>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label class="block text-xs font-medium text-slate-700 mb-1">Tanggal</label>
                <input type="date" required x-model="newBooking.date" class="w-full px-2.5 py-2 text-xs border border-slate-300 rounded-lg font-mono" />
              </div>
              <div>
                <label class="block text-xs font-medium text-slate-700 mb-1">Jam Mulai</label>
                <input type="time" required x-model="newBooking.startTime" class="w-full px-2.5 py-2 text-xs border border-slate-300 rounded-lg font-mono" />
              </div>
              <div>
                <label class="block text-xs font-medium text-slate-700 mb-1">Jam Selesai</label>
                <input type="time" required x-model="newBooking.endTime" class="w-full px-2.5 py-2 text-xs border border-slate-300 rounded-lg font-mono" />
              </div>
            </div>

            <div>
              <label class="block text-xs font-medium text-slate-700 mb-1">Keperluan</label>
              <input type="text" required x-model="newBooking.purpose" placeholder="Judul kegiatan rapat atau musyawarah" class="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600" />
            </div>

            <button type="submit" :class="bookingConflictMessage ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'"
              class="w-full py-2.5 text-white text-sm font-semibold rounded-lg transition-colors"
              x-text="bookingConflictMessage ? 'Slot Bentrok — Pilih Waktu Lain' : 'Ajukan Peminjaman Ruangan'"></button>
          </form>

          <!-- Tabel Daftar Status Pengajuan -->
          <div class="xl:col-span-7 bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div class="px-6 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 class="text-base font-semibold text-slate-900">Daftar Status Pengajuan Ruangan</h2>
                <p class="text-xs text-slate-500 mt-0.5">Status permohonan: Pending, Disetujui, Ditolak</p>
              </div>
              <div class="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
                <template x-for="st in ['Semua', 'Pending', 'Disetujui', 'Ditolak']" :key="st">
                  <button @click="bookingFilter = st"
                    :class="bookingFilter === st ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'"
                    class="px-2.5 py-1 text-xs font-medium rounded-md transition-colors" x-text="st"></button>
                </template>
              </div>
            </div>
            <div class="overflow-x-auto">
              <table class="w-full text-left text-sm border-collapse">
                <thead class="bg-slate-50 border-b border-slate-200 text-xs text-slate-500">
                  <tr>
                    <th class="px-5 py-3 font-semibold">Tanggal &amp; Jam</th>
                    <th class="px-5 py-3 font-semibold">Ruangan</th>
                    <th class="px-5 py-3 font-semibold">Pemohon / Seksi</th>
                    <th class="px-5 py-3 font-semibold">Keperluan</th>
                    <th class="px-5 py-3 font-semibold">Status</th>
                    <th class="px-5 py-3 font-semibold text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  <template x-for="b in filteredBookings" :key="b.id">
                    <tr class="hover:bg-slate-50">
                      <td class="px-5 py-3.5 font-mono text-xs text-slate-800 whitespace-nowrap">
                        <div class="font-semibold" x-text="b.date"></div>
                        <div class="text-slate-500" x-text="b.startTime + ' - ' + b.endTime"></div>
                      </td>
                      <td class="px-5 py-3.5 text-xs font-semibold text-slate-900" x-text="b.room"></td>
                      <td class="px-5 py-3.5 text-xs text-slate-700" x-text="b.unit"></td>
                      <td class="px-5 py-3.5 text-xs text-slate-700" x-text="b.purpose"></td>
                      <td class="px-5 py-3.5 text-xs font-semibold whitespace-nowrap"
                        :class="b.status === 'Disetujui' ? 'text-emerald-700' : (b.status === 'Ditolak' ? 'text-red-700' : 'text-amber-700')"
                        x-text="b.status"></td>
                      <td class="px-5 py-3.5 text-right whitespace-nowrap text-xs">
                        <div x-show="b.status === 'Pending' && canVerifyBookings" class="inline-flex gap-1.5">
                          <button @click="verifyBooking(b, 'Disetujui')" class="px-2 py-1 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100">Setujui</button>
                          <button @click="verifyBooking(b, 'Ditolak')" class="px-2 py-1 rounded bg-red-50 text-red-700 border border-red-200 hover:bg-red-100">Tolak</button>
                        </div>
                        <span x-show="b.status === 'Pending' && !canVerifyBookings" class="text-slate-400">Menunggu Operator</span>
                      </td>
                    </tr>
                  </template>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <!-- Panel Maintenance -->
        <section x-show="activeTab === 'maintenance'" class="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div class="px-5 py-4 border-b border-slate-200 font-semibold text-slate-900">Pemeliharaan Sarana &amp; Prasarana</div>
          <div class="divide-y divide-slate-100">
            <template x-for="m in maintenance" :key="m.id">
              <div class="px-5 py-4 flex items-center justify-between gap-4">
                <div>
                  <div class="text-sm font-semibold text-slate-900" x-text="m.asset + ' (' + m.room + ')'"></div>
                  <div class="text-xs text-slate-500 mt-1" x-text="m.issue"></div>
                </div>
                <span class="text-xs font-semibold shrink-0" :class="m.status === 'Selesai' ? 'text-emerald-700' : 'text-amber-700'" x-text="m.status"></span>
              </div>
            </template>
          </div>
        </section>

        <!-- Panel Chatbot AI Assistant -->
        <section x-show="activeTab === 'chatbot'" class="bg-white border border-slate-200 rounded-xl flex flex-col h-[560px] overflow-hidden">
          <div class="px-6 py-4 border-b border-slate-200 flex items-center justify-between gap-4">
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 rounded-lg bg-slate-900 text-white flex items-center justify-center text-xs font-bold shrink-0">AI</div>
              <div>
                <h2 class="text-base font-semibold text-slate-900">Chatbot AI Assistant SIJAPRI</h2>
                <p class="text-xs text-slate-500">Tanyakan jadwal pimpinan, status Pendopo, atau ketersediaan Ruang Rapat</p>
              </div>
            </div>
            <button @click="resetChat()" class="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg">Percakapan Baru</button>
          </div>
          <div class="px-6 py-2.5 border-b border-slate-100 bg-slate-50 flex flex-wrap gap-2">
            <button @click="askPreset('Kapan jadwal Pak Camat hari ini?')" class="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:border-blue-400 hover:text-blue-700 rounded-lg">Kapan jadwal Pak Camat hari ini?</button>
            <button @click="askPreset('Apakah Pendopo Kecamatan kosong besok jam 9 pagi?')" class="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:border-blue-400 hover:text-blue-700 rounded-lg">Apakah Pendopo Kecamatan kosong besok jam 9 pagi?</button>
            <button @click="askPreset('Bagaimana status ruangan dan tiket maintenance saat ini?')" class="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:border-blue-400 hover:text-blue-700 rounded-lg">Status ruangan &amp; maintenance?</button>
          </div>
          <div class="flex-1 p-5 space-y-4 overflow-y-auto bg-slate-50/50">
            <template x-for="(msg, idx) in chatMessages" :key="idx">
              <div class="flex items-start gap-2.5" :class="msg.role === 'user' ? 'justify-end' : 'justify-start'">
                <div x-show="msg.role === 'assistant'" class="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center text-xs font-bold shrink-0">AI</div>
                <div class="max-w-xl px-4 py-3 rounded-xl text-sm whitespace-pre-line leading-relaxed"
                  :class="msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-800'">
                  <div x-text="msg.text"></div>
                  <div class="mt-1 text-[11px] font-mono" :class="msg.role === 'user' ? 'text-blue-100' : 'text-slate-400'" x-text="msg.time || '08:00'"></div>
                </div>
                <div x-show="msg.role === 'user'" class="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center text-xs font-bold shrink-0">U</div>
              </div>
            </template>
          </div>
          <form @submit.prevent="sendChat()" class="p-4 border-t border-slate-200 flex gap-3 bg-white">
            <input type="text" x-model="chatInput" placeholder="Ketik pertanyaan, misal: Kapan jadwal Pak Camat hari ini?" class="flex-1 px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600" />
            <button type="submit" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg">Kirim</button>
          </form>
        </section>

        <!-- Panel Manajemen User (Super Admin Only - Sesuai PRD) -->
        <section x-show="activeTab === 'users' && currentUser.role === 'Super Admin'" class="space-y-6">
          <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <template x-for="rName in ['Super Admin', 'Operator', 'Pimpinan', 'Pemohon']" :key="rName">
              <div class="bg-white border border-slate-200 rounded-xl p-4">
                <div class="text-xs font-medium text-slate-500" x-text="'Role ' + rName"></div>
                <div class="mt-2 text-2xl font-bold font-mono text-slate-900" x-text="users.filter(u => u.role === rName).length"></div>
              </div>
            </template>
          </div>

          <div class="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
            <form @submit.prevent="addUser()" class="xl:col-span-4 bg-white border border-slate-200 rounded-xl p-5 space-y-3">
              <h2 class="text-base font-semibold text-slate-900">Tambah Akun Pengguna</h2>
              <div>
                <label class="block text-xs font-medium text-slate-700 mb-1">Nama Lengkap</label>
                <input type="text" required x-model="newUser.name" placeholder="Nama lengkap &amp; gelar" class="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg" />
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs font-medium text-slate-700 mb-1">Username</label>
                  <input type="text" required x-model="newUser.username" placeholder="username" class="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg" />
                </div>
                <div>
                  <label class="block text-xs font-medium text-slate-700 mb-1">NIP / ID</label>
                  <input type="text" required x-model="newUser.nip" placeholder="1985..." class="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg" />
                </div>
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs font-medium text-slate-700 mb-1">Unit / Seksi / Desa</label>
                  <input type="text" required x-model="newUser.unitName" placeholder="Seksi / Pemdes" class="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg" />
                </div>
                <div>
                  <label class="block text-xs font-medium text-slate-700 mb-1">Role (RBAC)</label>
                  <select x-model="newUser.role" class="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white">
                    <option value="Pemohon">Pemohon</option>
                    <option value="Operator">Operator</option>
                    <option value="Pimpinan">Pimpinan</option>
                    <option value="Super Admin">Super Admin</option>
                  </select>
                </div>
              </div>
              <button type="submit" class="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg">Simpan Pengguna Baru</button>
            </form>

            <div class="xl:col-span-8 bg-white border border-slate-200 rounded-xl overflow-hidden">
              <div class="px-5 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 class="text-base font-semibold text-slate-900">Master Pengguna &amp; Audit Log</h2>
                  <p class="text-xs text-slate-500">Kontrol akses berbasis peran sesuai PRD Bab 2.1</p>
                </div>
                <div class="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
                  <button @click="userSubTab = 'list'" :class="userSubTab === 'list' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'" class="px-2.5 py-1 text-xs font-medium rounded-md">Daftar User</button>
                  <button @click="userSubTab = 'audit'" :class="userSubTab === 'audit' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'" class="px-2.5 py-1 text-xs font-medium rounded-md">Audit Log</button>
                </div>
              </div>
              <div x-show="userSubTab === 'list'" class="overflow-x-auto">
                <table class="w-full text-left text-sm">
                  <thead class="bg-slate-50 border-b border-slate-200 text-xs text-slate-500">
                    <tr>
                      <th class="px-5 py-3 font-semibold">Nama &amp; Username</th>
                      <th class="px-5 py-3 font-semibold">Unit / Seksi</th>
                      <th class="px-5 py-3 font-semibold">Role</th>
                      <th class="px-5 py-3 font-semibold">Status</th>
                      <th class="px-5 py-3 font-semibold text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-100">
                    <template x-for="u in users" :key="u.id">
                      <tr class="hover:bg-slate-50">
                        <td class="px-5 py-3">
                          <div class="font-semibold text-slate-900" x-text="u.name"></div>
                          <div class="text-xs font-mono text-slate-500" x-text="'@' + u.username + ' · NIP ' + u.nip"></div>
                        </td>
                        <td class="px-5 py-3 text-xs text-slate-600" x-text="u.unitName"></td>
                        <td class="px-5 py-3 text-xs font-semibold text-blue-700" x-text="u.role"></td>
                        <td class="px-5 py-3 text-xs font-semibold" :class="u.isActive ? 'text-emerald-700' : 'text-red-700'" x-text="u.isActive ? 'Aktif' : 'Nonaktif'"></td>
                        <td class="px-5 py-3 text-right text-xs space-x-2">
                          <button @click="toggleUserActive(u)" x-show="u.id !== currentUserId" class="text-blue-600 hover:underline" x-text="u.isActive ? 'Nonaktifkan' : 'Aktifkan'"></button>
                          <button @click="deleteUser(u.id)" x-show="u.id !== currentUserId" class="text-red-600 hover:underline">Hapus</button>
                        </td>
                      </tr>
                    </template>
                  </tbody>
                </table>
              </div>
              <div x-show="userSubTab === 'audit'" class="divide-y divide-slate-100 max-h-96 overflow-y-auto">
                <template x-for="log in auditLogs" :key="log.id">
                  <div class="px-5 py-3 flex items-center justify-between gap-4 text-xs">
                    <div>
                      <span class="font-semibold text-slate-900" x-text="log.userName"></span>
                      <span class="text-slate-500" x-text="' (' + log.userRole + ') — ' + log.action"></span>
                    </div>
                    <span class="font-mono text-slate-400 shrink-0" x-text="log.timestamp"></span>
                  </div>
                </template>
              </div>
            </div>
          </div>
        </section>

        <!-- Panel Pengaturan (Super Admin Only) -->
        <section x-show="activeTab === 'pengaturan' && currentUser.role === 'Super Admin'" class="bg-white border border-slate-200 rounded-xl p-6 max-w-2xl space-y-4">
          <h2 class="text-base font-semibold text-slate-900">Pengaturan Instansi</h2>
          <div>
            <label class="block text-xs font-medium text-slate-700 mb-1">Nama Instansi</label>
            <input type="text" value="Pemerintah Kecamatan Krembung" class="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg" />
          </div>
          <div>
            <label class="block text-xs font-medium text-slate-700 mb-1">Alamat Kantor</label>
            <input type="text" value="Jl. Raya Krembung No. 45, Kabupaten Sidoarjo" class="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg" />
          </div>
          <button @click="alertSaved = true; setTimeout(() => alertSaved = false, 2500)" class="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg">
            Simpan Perubahan
          </button>
          <p x-show="alertSaved" class="text-xs font-medium text-emerald-700">Pengaturan instansi berhasil disimpan.</p>
        </section>
      </main>
    </div>
  </div>

  <script>
    function sijapriApp() {
      return {
        activeTab: 'dashboard',
        sidebarOpen: false,
        agendaSearch: '',
        dashboardTableFilter: 'Semua',
        bookingFilter: 'Semua',
        bookingSuccessMsg: '',
        calYear: 2026,
        calMonth: 10,
        selectedCalDate: '2026-11-16',
        calLayer: 'Semua',
        alertSaved: false,
        chatInput: '',
        userSubTab: 'list',
        currentUserId: 'USR-001',
        newUser: { name: '', username: '', nip: '', unitName: '', role: 'Pemohon' },
        menuItems: [
          { id: 'dashboard', label: 'Dashboard', superAdminOnly: false, hideForPimpinan: false },
          { id: 'agenda', label: 'Agenda Pimpinan', superAdminOnly: false, hideForPimpinan: false },
          { id: 'kalender', label: 'Kalender', superAdminOnly: false, hideForPimpinan: false },
          { id: 'booking', label: 'Booking Ruangan', superAdminOnly: false, hideForPimpinan: true },
          { id: 'maintenance', label: 'Maintenance', superAdminOnly: false, hideForPimpinan: true },
          { id: 'chatbot', label: 'Chatbot AI Assistant', superAdminOnly: false, hideForPimpinan: false },
          { id: 'users', label: 'Manajemen User', superAdminOnly: true, hideForPimpinan: false },
          { id: 'pengaturan', label: 'Pengaturan', superAdminOnly: true, hideForPimpinan: false }
        ],
        users: [
          { id: 'USR-001', name: 'Rizky Pratama, S.Kom.', nip: '199304122020121006', username: 'admin.krembung', unitName: 'Subbag Umum & Kepegawaian', role: 'Super Admin', isActive: true },
          { id: 'USR-002', name: 'Siti Rahmawati, S.AP.', nip: '198908172014032004', username: 'operator.umum', unitName: 'Sekretariat Kecamatan', role: 'Operator', isActive: true },
          { id: 'USR-003', name: 'Drs. H. Ahmad Fauzi, M.Si.', nip: '197205141994031005', username: 'camat.krembung', unitName: 'Pimpinan Kecamatan', role: 'Pimpinan', isActive: true },
          { id: 'USR-004', name: 'Budi Santoso', nip: '3515071208910002', username: 'pemdes.mojoruntut', unitName: 'Pemerintah Desa Mojoruntut', role: 'Pemohon', isActive: true }
        ],
        auditLogs: [
          { id: 'AUD-101', userName: 'Rizky Pratama, S.Kom.', userRole: 'Super Admin', action: 'Memperbarui konfigurasi user & RBAC', timestamp: '2026-11-16 07:45 WIB' },
          { id: 'AUD-102', userName: 'Siti Rahmawati, S.AP.', userRole: 'Operator', action: 'Menyetujui booking Pendopo Kecamatan', timestamp: '2026-11-16 08:15 WIB' }
        ],
        agendas: [
          { id: 1, date: '2026-11-16', startTime: '07:15', endTime: '08:00', title: 'Apel Pagi ASN & Evaluasi Mingguan', leader: 'Camat Krembung', location: 'Halaman Kecamatan', status: 'Selesai' },
          { id: 2, date: '2026-11-16', startTime: '08:30', endTime: '11:00', title: 'Rakor Forkopimka & Kepala Desa', leader: 'Camat Krembung', location: 'Pendopo Kecamatan Krembung', status: 'Berlangsung' },
          { id: 3, date: '2026-11-16', startTime: '10:00', endTime: '12:00', title: 'Sinkronisasi Laporan SAKIP 2026', leader: 'Sekcam Krembung', location: 'Ruang Rapat Utama', status: 'Terjadwal' },
          { id: 4, date: '2026-11-17', startTime: '09:00', endTime: '11:30', title: 'Peninjauan Saluran Irigasi Desa Rejeni', leader: 'Camat Krembung', location: 'Balai Desa Rejeni', status: 'Terjadwal' },
          { id: 5, date: '2026-11-18', startTime: '08:00', endTime: '12:00', title: 'Bimtek Kader Posyandu & Stunting', leader: 'Kasi Kesos', location: 'Pendopo Kecamatan Krembung', status: 'Terjadwal' }
        ],
        rooms: [
          { name: 'Pendopo Kecamatan Krembung', capacity: 150, status: 'Digunakan' },
          { name: 'Ruang Rapat Utama', capacity: 30, status: 'Tersedia' },
          { name: 'Aula Pelayanan Terpadu', capacity: 60, status: 'Tersedia' },
          { name: 'Ruang Koordinasi Lt. 2', capacity: 16, status: 'Pemeliharaan' }
        ],
        bookings: [
          { id: 1, room: 'Pendopo Kecamatan Krembung', unit: 'Sekretariat Kecamatan', date: '2026-11-16', startTime: '08:00', endTime: '11:30', purpose: 'Rakor Forkopimka & Kades', status: 'Disetujui' },
          { id: 2, room: 'Ruang Rapat Utama', unit: 'Subbag Perencanaan', date: '2026-11-16', startTime: '10:00', endTime: '12:00', purpose: 'Sinkronisasi SAKIP 2026', status: 'Disetujui' },
          { id: 3, room: 'Aula Pelayanan Terpadu', unit: 'Desa Mojoruntut', date: '2026-11-17', startTime: '09:00', endTime: '12:00', purpose: 'Musyawarah Data Bansos', status: 'Pending' },
          { id: 4, room: 'Pendopo Kecamatan Krembung', unit: 'UPTD Puskesmas Krembung', date: '2026-11-18', startTime: '08:00', endTime: '12:30', purpose: 'Bimtek Kader Posyandu', status: 'Disetujui' },
          { id: 5, room: 'Ruang Rapat Utama', unit: 'Panitia Pemilihan BPD', date: '2026-11-20', startTime: '13:00', endTime: '15:30', purpose: 'Rapat Pleno BPD', status: 'Pending' }
        ],
        maintenance: [
          { id: 1, room: 'Ruang Koordinasi Lt. 2', asset: 'Unit AC Split 2 PK', issue: 'Kompresor mati mendadak', priority: 'Mendesak', status: 'Dalam Proses' },
          { id: 2, room: 'Pendopo Kecamatan Krembung', asset: 'Mikrofon Podium #2', issue: 'Baterai receiver lemah', priority: 'Tinggi', status: 'Menunggu' },
          { id: 3, room: 'Aula Pelayanan Terpadu', asset: 'Lampu LED Panel Timur', issue: 'Dua unit panel redup', priority: 'Normal', status: 'Menunggu' }
        ],
        newBooking: { room: 'Ruang Rapat Utama', unit: '', date: '2026-11-17', startTime: '09:00', endTime: '11:00', purpose: '' },
        chatMessages: [
          { role: 'assistant', text: 'Halo! Saya Asisten SIJAPRI Kecamatan Krembung. Silakan tanyakan jadwal pimpinan atau ketersediaan ruangan.' }
        ],
        get currentUser() {
          return this.users.find(u => u.id === this.currentUserId) || this.users[0];
        },
        get visibleMenuItems() {
          const isSuper = this.currentUser.role === 'Super Admin';
          const isPimpinan = this.currentUser.role === 'Pimpinan';
          return this.menuItems.filter(m => (!m.superAdminOnly || isSuper) && !(m.hideForPimpinan && isPimpinan));
        },
        get canAccessBookingAndMaintenance() {
          return this.currentUser.role !== 'Pimpinan';
        },
        get canVerifyBookings() {
          return this.currentUser.role === 'Super Admin' || this.currentUser.role === 'Operator';
        },
        get currentTitle() {
          const found = this.menuItems.find(m => m.id === this.activeTab);
          return found ? found.label : 'Dashboard';
        },
        get totalCapacity() {
          return this.rooms.reduce((sum, r) => sum + r.capacity, 0);
        },
        get activeRoomsCount() {
          return this.rooms.filter(r => r.status !== 'Pemeliharaan').length;
        },
        get availableRoomsCount() {
          return this.rooms.filter(r => r.status === 'Tersedia').length;
        },
        get todayBookingsCount() {
          return this.bookings.filter(b => b.date === '2026-11-16' && b.status !== 'Ditolak').length;
        },
        get pendingBookingsCount() {
          return this.bookings.filter(b => b.status === 'Pending').length;
        },
        get utilizationRate() {
          const active = Math.max(1, this.activeRoomsCount);
          return Math.min(100, Math.round((this.todayBookingsCount * 2.5 / (active * 8)) * 100));
        },
        get openMaintenanceCount() {
          return this.maintenance.filter(m => m.status !== 'Selesai').length;
        },
        get urgentMaintenanceCount() {
          return this.maintenance.filter(m => m.priority === 'Mendesak' && m.status !== 'Selesai').length;
        },
        get bookingConflictMessage() {
          const roomObj = this.rooms.find(r => r.name === this.newBooking.room);
          if (roomObj && roomObj.status === 'Pemeliharaan') {
            return 'Ruangan tidak tersedia: ' + roomObj.name + ' sedang dalam pemeliharaan.';
          }
          if (!this.newBooking.date || !this.newBooking.startTime || !this.newBooking.endTime) return '';
          if (this.newBooking.startTime >= this.newBooking.endTime) {
            return 'Jam selesai harus lebih lambat daripada jam mulai.';
          }
          const conflict = this.bookings.find(b =>
            b.room === this.newBooking.room &&
            b.date === this.newBooking.date &&
            (b.status === 'Disetujui' || b.status === 'Pending') &&
            this.newBooking.startTime < b.endTime &&
            this.newBooking.endTime > b.startTime
          );
          if (conflict) {
            return 'Ruangan tidak tersedia: slot ' + this.newBooking.startTime + '-' + this.newBooking.endTime +
              ' pada ' + this.newBooking.date + ' di ' + this.newBooking.room +
              ' bentrok dengan "' + conflict.purpose + '" (' + conflict.startTime + '-' + conflict.endTime + ').';
          }
          return '';
        },
        get filteredBookings() {
          return this.bookingFilter === 'Semua'
            ? this.bookings
            : this.bookings.filter(b => b.status === this.bookingFilter);
        },
        get filteredDailySummary() {
          const rows = [
            ...this.agendas.filter(a => a.date === '2026-11-16').map(a => ({
              key: 'a-' + a.id, category: 'Agenda Pimpinan', time: a.startTime + ' - ' + a.endTime, title: a.title, pic: a.leader, location: a.location, status: a.status
            })),
            ...this.bookings.filter(b => b.date === '2026-11-16').map(b => ({
              key: 'b-' + b.id, category: 'Pemakaian Ruangan', time: b.startTime + ' - ' + b.endTime, title: b.purpose, pic: b.unit, location: b.room, status: b.status
            }))
          ].sort((x, y) => x.time.localeCompare(y.time));
          return this.dashboardTableFilter === 'Semua' ? rows : rows.filter(r => r.category === this.dashboardTableFilter);
        },
        get filteredAgendas() {
          const q = this.agendaSearch.toLowerCase();
          return this.agendas.filter(a => a.title.toLowerCase().includes(q) || a.leader.toLowerCase().includes(q));
        },
        get monthName() {
          return ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'][this.calMonth];
        },
        get firstDayOffset() {
          return new Date(this.calYear, this.calMonth, 1).getDay();
        },
        get daysInCurrentMonth() {
          return new Date(this.calYear, this.calMonth + 1, 0).getDate();
        },
        get selectedDateAgendas() {
          return this.agendas.filter(a => a.date === this.selectedCalDate);
        },
        get selectedDateBookings() {
          return this.bookings.filter(b => b.date === this.selectedCalDate && b.status !== 'Ditolak');
        },
        formatCalIso(day) {
          return this.calYear + '-' + String(this.calMonth + 1).padStart(2, '0') + '-' + String(day).padStart(2, '0');
        },
        countDayAgendas(iso) {
          return this.agendas.filter(a => a.date === iso).length;
        },
        countDayPendopo(iso) {
          return this.bookings.filter(b => b.date === iso && b.status !== 'Ditolak' && b.room.toLowerCase().includes('pendopo')).length;
        },
        countDayRapat(iso) {
          return this.bookings.filter(b => b.date === iso && b.status !== 'Ditolak' && !b.room.toLowerCase().includes('pendopo')).length;
        },
        prevMonth() {
          if (this.calMonth === 0) { this.calYear--; this.calMonth = 11; } else { this.calMonth--; }
        },
        nextMonth() {
          if (this.calMonth === 11) { this.calYear++; this.calMonth = 0; } else { this.calMonth++; }
        },
        selectMenu(id) {
          if ((id === 'users' || id === 'pengaturan') && this.currentUser.role !== 'Super Admin') {
            this.activeTab = 'dashboard';
          } else if ((id === 'booking' || id === 'maintenance') && this.currentUser.role === 'Pimpinan') {
            this.activeTab = 'dashboard';
          } else {
            this.activeTab = id;
          }
          this.sidebarOpen = false;
        },
        onRoleChanged() {
          if ((this.activeTab === 'users' || this.activeTab === 'pengaturan') && this.currentUser.role !== 'Super Admin') {
            this.activeTab = 'dashboard';
          } else if ((this.activeTab === 'booking' || this.activeTab === 'maintenance') && this.currentUser.role === 'Pimpinan') {
            this.activeTab = 'dashboard';
          }
          this.auditLogs.unshift({
            id: 'AUD-' + Date.now(),
            userName: this.currentUser.name,
            userRole: this.currentUser.role,
            action: 'Beralih sesi ke role ' + this.currentUser.role,
            timestamp: '2026-11-16 ' + new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB'
          });
        },
        addUser() {
          if (!this.newUser.name.trim() || !this.newUser.username.trim()) return;
          const created = {
            id: 'USR-' + Date.now(),
            name: this.newUser.name.trim(),
            username: this.newUser.username.trim().toLowerCase(),
            nip: this.newUser.nip.trim(),
            unitName: this.newUser.unitName.trim(),
            role: this.newUser.role,
            isActive: true
          };
          this.users.unshift(created);
          this.auditLogs.unshift({
            id: 'AUD-' + Date.now(),
            userName: this.currentUser.name,
            userRole: this.currentUser.role,
            action: 'Menambahkan user ' + created.name + ' (' + created.role + ')',
            timestamp: '2026-11-16 ' + new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB'
          });
          this.newUser = { name: '', username: '', nip: '', unitName: '', role: 'Pemohon' };
        },
        toggleUserActive(u) {
          if (u.id === this.currentUserId) return;
          u.isActive = !u.isActive;
          this.auditLogs.unshift({
            id: 'AUD-' + Date.now(),
            userName: this.currentUser.name,
            userRole: this.currentUser.role,
            action: (u.isActive ? 'Mengaktifkan ' : 'Menonaktifkan ') + u.name,
            timestamp: '2026-11-16 ' + new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB'
          });
        },
        deleteUser(id) {
          if (id === this.currentUserId) return;
          const target = this.users.find(u => u.id === id);
          this.users = this.users.filter(u => u.id !== id);
          if (target) {
            this.auditLogs.unshift({
              id: 'AUD-' + Date.now(),
              userName: this.currentUser.name,
              userRole: this.currentUser.role,
              action: 'Menghapus akun ' + target.name,
              timestamp: '2026-11-16 ' + new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB'
            });
          }
        },
        verifyBooking(b, status) {
          if (!this.canVerifyBookings) return;
          b.status = status;
          this.auditLogs.unshift({
            id: 'AUD-' + Date.now(),
            userName: this.currentUser.name,
            userRole: this.currentUser.role,
            action: 'Mengubah status booking ' + b.room + ' menjadi ' + status,
            timestamp: '2026-11-16 ' + new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB'
          });
        },
        simulateConflict() {
          this.bookingSuccessMsg = '';
          this.newBooking.room = 'Pendopo Kecamatan Krembung';
          this.newBooking.unit = 'Seksi Pemerintahan Kec. Krembung';
          this.newBooking.date = '2026-11-16';
          this.newBooking.startTime = '09:00';
          this.newBooking.endTime = '10:30';
          this.newBooking.purpose = 'Simulasi Uji Bentrok Jadwal Pendopo';
        },
        submitBooking() {
          if (this.bookingConflictMessage) return;
          this.bookings.unshift({ id: Date.now(), ...this.newBooking, status: 'Pending' });
          this.bookingSuccessMsg = 'Pengajuan peminjaman ' + this.newBooking.room + ' berhasil disimpan dengan status Pending.';
          this.newBooking.unit = '';
          this.newBooking.purpose = '';
        },
        askPreset(text) {
          this.chatInput = text;
          this.sendChat();
        },
        resetChat() {
          this.chatMessages = [
            { role: 'assistant', time: '08:00', text: 'Halo! Saya Asisten AI SIJAPRI Kecamatan Krembung. Silakan tanyakan jadwal pimpinan atau ketersediaan ruangan.' }
          ];
        },
        sendChat() {
          if (!this.chatInput.trim()) return;
          const q = this.chatInput.trim();
          const lower = q.toLowerCase();
          const nowStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
          this.chatMessages.push({ role: 'user', time: nowStr, text: q });
          this.chatInput = '';

          let reply = '';
          if (lower.includes('camat') && (lower.includes('hari ini') || lower.includes('jadwal'))) {
            const camatToday = this.agendas.filter(a => a.date === '2026-11-16' && a.leader.toLowerCase().includes('camat') && !a.leader.toLowerCase().includes('sekcam'));
            if (camatToday.length > 0) {
              reply = 'Jadwal Bapak Camat Krembung hari ini (Senin, 16 November 2026):\n' +
                camatToday.map((a, i) => (i + 1) + '. ' + a.startTime + '–' + a.endTime + ' WIB: ' + a.title + ' di ' + a.location + ' [' + a.status + ']').join('\n');
            } else {
              reply = 'Tidak ada agenda Bapak Camat yang tercatat untuk hari ini.';
            }
          } else if (lower.includes('pendopo') && (lower.includes('besok') || lower.includes('2026-11-17'))) {
            const targetTime = lower.includes('9') ? '09:00' : '09:00';
            const conflict = this.bookings.find(b =>
              b.room.toLowerCase().includes('pendopo') &&
              b.date === '2026-11-17' &&
              b.status !== 'Ditolak' &&
              targetTime >= b.startTime && targetTime < b.endTime
            );
            if (conflict) {
              reply = 'Pendopo Kecamatan Krembung pada besok (Selasa, 17 Nov 2026) pukul 09.00 WIB SUDAH TERISI oleh ' + conflict.unit + ' (' + conflict.purpose + ').';
            } else {
              reply = 'Ya, Pendopo Kecamatan Krembung besok (Selasa, 17 November 2026) pukul 09.00 WIB berstatus KOSONG / TERSEDIA. Anda dapat langsung mengajukan peminjaman melalui menu Booking Ruangan.';
            }
          } else if (lower.includes('ruang') || lower.includes('maintenance') || lower.includes('status')) {
            const roomLines = this.rooms.map(r => '- ' + r.name + ' (' + r.capacity + ' kursi): ' + r.status).join('\n');
            const openMaint = this.maintenance.filter(m => m.status !== 'Selesai');
            reply = 'Status Ruangan Kecamatan Krembung saat ini:\n' + roomLines +
              '\n\nTiket Maintenance terbuka (' + openMaint.length + '):\n' +
              openMaint.map(m => '- ' + m.asset + ' (' + m.room + ') — ' + m.status).join('\n');
          } else {
            const todayAg = this.agendas.filter(a => a.date === '2026-11-16');
            reply = 'Ringkasan SIJAPRI Hari Ini (16 Nov 2026):\n' +
              '- Terdapat ' + todayAg.length + ' agenda pimpinan terjadwal.\n' +
              '- Ruangan tersedia saat ini: ' + this.rooms.filter(r => r.status === 'Tersedia').map(r => r.name).join(', ') + '.\n' +
              'Silakan tanyakan spesifik seperti "Kapan jadwal Pak Camat hari ini?" atau "Apakah Pendopo Kecamatan kosong besok jam 9 pagi?".';
          }

          setTimeout(() => {
            this.chatMessages.push({ role: 'assistant', time: nowStr, text: reply });
          }, 250);
        }
      };
    }
  </script>
</body>
</html>`;
}
