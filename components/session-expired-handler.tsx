'use client';

import { useEffect } from 'react';
import Swal from 'sweetalert2';

/**
 * Menangani landing `/?login=expired[&next=...]` (v5.9.0 session idle-expiry).
 *
 * - Menampilkan pemberitahuan sesi berakhir (toast).
 * - Menyimpan tujuan kembali ke `sessionStorage` agar setelah login ulang
 *   (OAuth Google via navbar, redirectTo `/`) pengguna dikembalikan ke
 *   halaman asal. Hanya path relatif yang diterima (anti open-redirect).
 * - Membersihkan query dari URL agar toast tidak muncul ulang saat refresh.
 *
 * Dipasang di halaman utama yang selalu menampilkan Navbar.
 */
function isSafeNext(value: string | null): value is string {
  return !!value && /^\/(?!\/)/.test(value) && value.length < 500;
}

export function SessionExpiredHandler() {
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const mode = params.get('login');
      if (mode !== 'expired' && mode !== 'required') return;
      const next = params.get('next');
      if (isSafeNext(next)) {
        sessionStorage.setItem('dolphin_next', next);
      }
      window.history.replaceState(null, '', window.location.pathname);
      Swal.fire({
        text: mode === 'expired' ? 'Sesi Anda berakhir karena tidak ada aktivitas. Silakan login kembali.' : 'Silakan login terlebih dahulu.',
        icon: 'info',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 4500,
        timerProgressBar: true,
      });
    } catch {
      /* abaikan — handler best-effort */
    }
  }, []);

  return null;
}

/** Ambil + hapus tujuan kembali yang disimpan (dipanggil navbar usai login). */
export function consumeStoredNext(): string | null {
  try {
    const next = sessionStorage.getItem('dolphin_next');
    if (!isSafeNext(next)) return null;
    sessionStorage.removeItem('dolphin_next');
    return next;
  } catch {
    return null;
  }
}
