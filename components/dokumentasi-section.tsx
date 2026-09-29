import Image from 'next/image';
import { cn } from '@/lib/utils';
import { createPublicClient } from '@/lib/supabase/public';
import { FALLBACK_DOKUMENTASI } from '@/lib/site-media';

export async function DokumentasiSection() {
  let items: { url: string; alt: string }[] = [];
  try {
    const supabase = createPublicClient();
    const { data } = await supabase
      .from('dokumentasi_foto')
      .select('file_url, nama_kegiatan')
      .eq('is_visible', true)
      .order('created_at', { ascending: false })
      .limit(40);
    items = (data || [])
      .filter((row) => Boolean(row.file_url))
      .map((row) => ({
        url: row.file_url as string,
        alt: row.nama_kegiatan || 'Dokumentasi kegiatan laboratorium',
      }));
  } catch (error) {
    console.error('Gagal membaca dokumentasi:', error);
  }

  if (items.length === 0) {
    items = FALLBACK_DOKUMENTASI.map((url) => ({
      url,
      alt: 'Dokumentasi kegiatan laboratorium',
    }));
  }

  // 2. Gandakan array 4 kali agar bisa looping sempurna tanpa putus di layar lebar
  const infiniteItems = [...items, ...items, ...items, ...items];

  // Fungsi untuk ngasih gaya miring/ukuran acak supaya terkesan "unik"
  const getStyles = (index: number) => {
    const rotations = [
      '-rotate-2',
      'rotate-3',
      '-rotate-1',
      'rotate-2',
      'rotate-0',
      '-rotate-3',
    ];
    const aspects = [
      'aspect-[4/3]',
      'aspect-[3/4]',
      'aspect-square',
      'aspect-[5/4]',
    ];
    const margins = ['mt-0', 'mt-6', 'mt-[-10px]', 'mt-8', 'mt-2'];

    return cn(
      rotations[index % rotations.length],
      aspects[index % aspects.length],
      margins[index % margins.length],
    );
  };

  return (
    <section className='bg-slate-50 py-20 lg:py-28 overflow-hidden'>
      {/* Inject animasi CSS langsung tanpa perlu repot edit tailwind.config */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); } /* Geser separuh jalan lalu reset */
        }
        .animate-marquee {
          display: flex;
          width: max-content;
          animation: marquee 60s linear infinite; /* Ubah 60s untuk mengatur kecepatan */
        }
        .animate-marquee:hover {
          animation-play-state: paused; /* Berhenti saat di-hover */
        }
      `,
        }}
      />

      <div className='mx-auto max-w-7xl px-4 lg:px-8 mb-12'>
        <h2 className='text-center text-3xl font-bold text-slate-800 sm:text-4xl'>
          Dokumentasi Kegiatan
        </h2>
        <p className='mx-auto mt-4 max-w-2xl text-center text-slate-600'>
          Galeri visual fasilitas dan aktivitas di lingkungan laboratorium kami
        </p>
      </div>

      {/* Kontainer Utama Marquee */}
      <div className='relative w-full py-8'>
        {/* Efek gradien putih di ujung kiri dan kanan biar muncul/hilangnya smooth */}
        <div className='pointer-events-none absolute inset-y-0 left-0 z-10 w-20 md:w-32 bg-gradient-to-r from-slate-50 to-transparent'></div>
        <div className='pointer-events-none absolute inset-y-0 right-0 z-10 w-20 md:w-32 bg-gradient-to-l from-slate-50 to-transparent'></div>

        {/* Track yang berjalan */}
        <div className='animate-marquee items-center gap-4 px-4 sm:gap-6'>
          {infiniteItems.map((item, index) => (
            <div
              key={`${index}-${item.url}`}
              className={cn(
                'group relative w-[220px] md:w-[280px] lg:w-[320px] flex-shrink-0 overflow-hidden rounded-2xl bg-slate-200 shadow-md transition-all duration-500 ease-out hover:z-20 hover:scale-110 hover:shadow-2xl cursor-pointer',
                getStyles(index),
              )}>
              <Image
                src={item.url}
                alt={item.alt}
                width={400}
                height={400}
                className='h-full w-full object-cover transition-all duration-500 group-hover:brightness-110'
              />
              {/* Overlay gelap tipis, akan hilang saat di hover biar fotonya "menyala" */}
              <div className='absolute inset-0 bg-slate-900/10 transition-opacity duration-300 group-hover:opacity-0'></div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
