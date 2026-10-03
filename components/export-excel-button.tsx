'use client';

import { useState } from 'react';
import { FileSpreadsheet, Loader2 } from 'lucide-react';
import Swal from 'sweetalert2';

import { Button } from '@/components/ui/button';

type Kind = 'riwayat' | 'inventaris';

/**
 * Tombol unduh Excel (v5.7.0). Memanggil route server lalu menyimpan blob
 * sebagai berkas. Otorisasi & pembuatan xlsx ada di server; komponen ini
 * hanya mengurus UX (loading + pesan error).
 */
export default function ExportExcelButton({
  kind,
  labId,
  className,
  variant,
}: {
  kind: Kind;
  labId: number;
  className?: string;
  variant?: 'default' | 'outline' | 'secondary';
}) {
  const [loading, setLoading] = useState(false);

  const label = kind === 'riwayat' ? 'Unduh Riwayat (Excel)' : 'Unduh Inventaris (Excel)';

  const handleDownload = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/export/${kind}?lab_id=${labId}`);

      if (!res.ok) {
        let message = 'Gagal membuat berkas Excel.';
        try {
          const body = await res.json();
          if (body?.error) message = body.error;
        } catch {
          // respons bukan JSON — pakai pesan default
        }
        throw new Error(message);
      }

      // Nama berkas dari header Content-Disposition bila ada.
      const disposition = res.headers.get('Content-Disposition') || '';
      const match = disposition.match(/filename="?([^"]+)"?/i);
      const filename = match?.[1] || `${kind}-lab-${labId}.xlsx`;

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      Swal.fire({
        text: 'Berkas Excel berhasil diunduh.',
        icon: 'success',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 2500,
        timerProgressBar: true,
      });
    } catch (error: any) {
      Swal.fire({
        text: error?.message || 'Terjadi kesalahan saat mengunduh.',
        icon: 'error',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3500,
        timerProgressBar: true,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handleDownload}
      disabled={loading}
      variant={variant ?? 'outline'}
      className={
        className ??
        'font-bold shadow-sm text-base py-5 border-emerald-300 text-emerald-700 hover:bg-emerald-50'
      }>
      {loading ? (
        <Loader2 className='size-4 mr-2 animate-spin' />
      ) : (
        <FileSpreadsheet className='size-4 mr-2' />
      )}
      {loading ? 'Menyiapkan...' : label}
    </Button>
  );
}