import Link from 'next/link';
import { ArrowLeft, ShieldCheck, Users } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { createPublicClient } from '@/lib/supabase/public';
import {
  FALLBACK_PIMPINAN,
  initialsFromName,
  parsePimpinan,
  type Pimpinan,
} from '@/lib/site-media';
import { pageMetadata } from '@/lib/site-seo';

export const metadata = pageMetadata({
  title: 'Organisasi Lab Perikanan Polinela',
  description:
    'Struktur organisasi laboratorium Jurusan Perikanan dan Kelautan Politeknik Negeri Lampung: pimpinan jurusan dan penanggung jawab 18 laboratorium serta teaching factory.',
  path: '/organisasi',
});

export const revalidate = 300;

type Coordinator = {
  lab: string;
  name: string;
  type: 'perikanan' | 'tangkap';
  facility: string;
  initials: string;
  image: string;
};

async function loadOrganisasi(): Promise<{
  pimpinan: Pimpinan[];
  coordinators: Coordinator[];
}> {
  try {
    const supabase = createPublicClient();
    const [{ data: setting }, { data: labs }] = await Promise.all([
      supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'organisasi_pimpinan')
        .maybeSingle(),
      supabase
        .from('laboratorium')
        .select('id, nama_lab, jenis, kategori, pj_nama, pj_foto_url')
        .order('id'),
    ]);
    const parsed = parsePimpinan(setting?.value);
    const pimpinan = parsed.length > 0 ? parsed : FALLBACK_PIMPINAN;
    const coordinators: Coordinator[] = (labs || [])
      .filter((lab) => lab.pj_nama)
      .map((lab) => ({
        lab: lab.nama_lab,
        name: lab.pj_nama as string,
        type: (lab.kategori || '').toLowerCase().includes('tangkap')
          ? 'tangkap'
          : 'perikanan',
        facility: lab.jenis === 'TEFA' ? 'TEFA' : 'LAB',
        initials: initialsFromName(lab.pj_nama as string),
        image: lab.pj_foto_url || '',
      }));
    return { pimpinan, coordinators };
  } catch {
    return { pimpinan: FALLBACK_PIMPINAN, coordinators: [] };
  }
}

export default async function OrganisasiPage() {
  const { pimpinan, coordinators } = await loadOrganisasi();
  const kajur = pimpinan[0];
  const kalabPerikanan = pimpinan[1];
  const kalabTangkap = pimpinan[2];

  return (
    <div className='min-h-screen bg-slate-50 pt-24 pb-20 px-4 md:px-8'>
      <div className='max-w-7xl mx-auto'>
        <div className='mb-12'>
          <Link
            href='/'
            className='inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-6 font-medium transition-colors'>
            <ArrowLeft size={18} /> Kembali ke Beranda
          </Link>
          <div className='flex items-center gap-4'>
            <div className='p-3 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-200'>
              <Users size={32} />
            </div>
            <div>
              <h1 className='text-3xl md:text-4xl font-extrabold text-slate-900'>
                Struktur Organisasi
              </h1>
              <p className='text-slate-500 md:text-lg'>
                Personel pengelola fasilitas Laboratorium dan Teaching Factory.
              </p>
            </div>
          </div>
        </div>

        <div className='flex flex-col items-center mb-24 relative'>
          {kajur && (
            <div className='w-full max-w-[340px] z-10'>
              <BigProfileCard
                member={{
                  name: kajur.nama,
                  role: kajur.jabatan,
                  initials: initialsFromName(kajur.nama),
                  image: kajur.foto_url,
                }}
                color='bg-slate-900'
              />
            </div>
          )}

          <div className='hidden md:flex flex-col items-center w-full'>
            <div className='w-0.5 h-12 bg-slate-200' />
            <div className='w-[60%] h-0.5 bg-slate-200 relative'>
              <div className='absolute left-0 top-0 w-0.5 h-12 bg-slate-200' />
              <div className='absolute right-0 top-0 w-0.5 h-12 bg-slate-200' />
            </div>
          </div>
          <div className='md:hidden h-10 w-0.5 bg-slate-200 my-2' />

          <div className='grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-32 w-full max-w-5xl md:mt-12'>
            {kalabPerikanan && (
              <BigProfileCard
                member={{
                  name: kalabPerikanan.nama,
                  role: kalabPerikanan.jabatan,
                  initials: initialsFromName(kalabPerikanan.nama),
                  image: kalabPerikanan.foto_url,
                }}
                color='bg-blue-600'
              />
            )}
            {kalabTangkap && (
              <BigProfileCard
                member={{
                  name: kalabTangkap.nama,
                  role: kalabTangkap.jabatan,
                  initials: initialsFromName(kalabTangkap.nama),
                  image: kalabTangkap.foto_url,
                }}
                color='bg-cyan-600'
              />
            )}
          </div>
        </div>

        <div className='pt-12 border-t border-slate-200'>
          <div className='text-center mb-10'>
            <h2 className='text-2xl font-bold text-slate-800 flex items-center justify-center gap-3'>
              <ShieldCheck className='text-emerald-500 size-7' /> Penanggung
              Jawab Lab & TEFA
            </h2>
            <p className='text-slate-500 mt-2'>
              Daftar dosen dan instruktur yang bertanggung jawab atas
              masing-masing fasilitas.
            </p>
          </div>

          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'>
            {coordinators.map((coord) => (
              <Card
                key={coord.lab}
                className='border border-slate-200 shadow-sm hover:shadow-md transition-all group overflow-hidden bg-white'>
                <div
                  className={`h-1 w-full ${coord.type === 'tangkap' ? 'bg-cyan-500' : 'bg-blue-600'}`}
                />
                <CardContent className='p-4 flex items-center gap-4'>
                  <Avatar
                    className={`size-14 ring-2 transition-transform group-hover:scale-105 ${coord.type === 'tangkap' ? 'ring-cyan-100' : 'ring-blue-100'}`}>
                    <AvatarImage src={coord.image} className='object-cover' />
                    <AvatarFallback
                      className={`${coord.type === 'tangkap' ? 'bg-cyan-50 text-cyan-700' : 'bg-blue-50 text-blue-700'} font-bold`}>
                      {coord.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className='overflow-hidden flex-1'>
                    <p
                      className='font-bold text-slate-800 text-sm truncate'
                      title={coord.name}>
                      {coord.name}
                    </p>
                    <p
                      className='text-xs font-medium text-slate-500 truncate mt-0.5'
                      title={coord.lab}>
                      {coord.lab}
                    </p>
                    <div className='mt-2'>
                      <span
                        className={`inline-flex items-center text-[9px] px-2 py-0.5 rounded-full font-bold tracking-wider uppercase ${
                          coord.facility === 'TEFA'
                            ? 'bg-purple-100 text-purple-700 border border-purple-200'
                            : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                        }`}>
                        {coord.facility}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function BigProfileCard({
  member,
  color,
}: {
  member: { name: string; role: string; initials: string; image: string };
  color: string;
}) {
  return (
    <Card className='border-0 shadow-xl shadow-slate-200 overflow-hidden group hover:-translate-y-2 transition-all duration-300'>
      <div className={`h-2 w-full ${color}`} />
      <CardContent className='p-8 flex flex-col items-center text-center'>
        <Avatar className='size-28 ring-4 ring-white shadow-lg mb-6 group-hover:scale-105 transition-transform duration-300'>
          <AvatarImage src={member.image} className='object-cover' />
          <AvatarFallback className={`${color} text-white text-2xl font-bold`}>
            {member.initials}
          </AvatarFallback>
        </Avatar>
        <h3 className='text-xl font-bold text-slate-900'>{member.name}</h3>
        <p
          className={`font-semibold mt-1 uppercase tracking-wider text-sm ${color.replace('bg-', 'text-')}`}>
          {member.role}
        </p>
      </CardContent>
    </Card>
  );
}
