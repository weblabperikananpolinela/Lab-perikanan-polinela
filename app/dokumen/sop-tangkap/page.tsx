import Link from 'next/link';
import { ArrowLeft, FileText, Download, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createPublicClient } from '@/lib/supabase/public';
import {
  FALLBACK_SOP_TANGKAP,
  dokumenToItem,
  fetchDokumenPublik,
  type PublicDocItem,
} from '@/lib/dokumen';

export const revalidate = 300;

export default async function SOPTangkapPage() {
  let items: PublicDocItem[] = FALLBACK_SOP_TANGKAP.map((row, index) => ({
    id: `fallback-${index}`,
    judul: row.judul,
    sub: `PDF Document · ${row.size}`,
    deskripsi: null as string | null,
    href: row.href,
  }));
  try {
    const supabase = createPublicClient();
    const rows = await fetchDokumenPublik(supabase, 'sop-tangkap');
    if (rows.length > 0) {
      items = rows.map(dokumenToItem);
    }
  } catch {
    // Fallback statis tetap dipakai.
  }

  return (
    <div className='min-h-screen bg-slate-50 pt-24 pb-12 px-4 md:px-8'>
      <div className='max-w-5xl mx-auto'>
        <div className='mb-8'>
          <Link
            href='/'
            className='inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-6 font-medium transition-colors'>
            <ArrowLeft size={18} /> Kembali ke Beranda
          </Link>

          <div className='flex items-center gap-3 mb-2'>
            <div className='p-3 bg-blue-100 text-blue-700 rounded-xl'>
              <ShieldCheck className='size-8' />
            </div>
            <h1 className='text-3xl md:text-4xl font-bold text-slate-900'>
              SOP Lab. Perikanan Tangkap
            </h1>
          </div>
          <p className='text-slate-600 md:text-lg max-w-3xl mt-4'>
            Kumpulan dokumen Standar Operasional Prosedur (SOP) untuk memastikan
            keamanan, ketertiban, dan kelancaran kegiatan di lingkungan
            Laboratorium Perikanan Tangkap.
          </p>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 mt-8'>
          {items.map((sop) => (
            <div
              key={sop.id}
              className='bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all flex items-start gap-4 group'>
              <div className='p-3 bg-red-50 text-red-500 rounded-lg shrink-0 group-hover:bg-red-100 transition-colors'>
                <FileText className='size-6' />
              </div>
              <div className='flex-1'>
                <h3 className='font-bold text-slate-800 leading-tight mb-1 group-hover:text-blue-700 transition-colors'>
                  {sop.judul}
                </h3>
                {sop.deskripsi && (
                  <p className='text-sm text-slate-600 mb-2'>{sop.deskripsi}</p>
                )}
                <p className='text-xs font-medium text-slate-400 mb-4'>
                  {sop.sub || 'PDF Document'}
                </p>
                <div className='flex gap-2'>
                  <Button
                    asChild
                    variant='outline'
                    size='sm'
                    className='h-8 text-xs font-semibold hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200'>
                    <Link
                      href={sop.href}
                      target='_blank'
                      rel='noopener noreferrer'>
                      Buka Dokumen
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant='ghost'
                    size='sm'
                    className='h-8 w-8 p-0 text-slate-400 hover:text-blue-600'>
                    <a href={sop.href} download>
                      <Download className='size-4' />
                      <span className='sr-only'>Download</span>
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
