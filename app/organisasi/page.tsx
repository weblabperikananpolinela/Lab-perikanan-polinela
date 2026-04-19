'use client';

import Link from 'next/link';
import {
  ArrowLeft,
  Users,
  Building2,
  Anchor,
  FlaskConical,
  ShieldCheck,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';

const leaders = {
  kajur: {
    name: 'Dr. Nama Kepala Jurusan, M.Si',
    role: 'Ketua Jurusan',
    initials: 'KJ',
    image: '/placeholder-kajur.jpg',
  },
  kalabPerikanan: {
    name: 'Nama Kalab Perikanan, S.Pi., M.Si',
    role: 'Kepala Lab. Perikanan',
    initials: 'KP',
    image: '/placeholder-kalab1.jpg',
  },
  kalabTangkap: {
    name: 'Ari Setiawan, S.Tr.Pi.',
    role: 'Kepala Lab. Perikanan Tangkap',
    initials: 'AS',
    image: '/placeholder-kalab2.jpg',
  },
};

// Data Koordinator ditambahkan image, initials, dan status facility (LAB/TEFA)
const coordinators = [
  {
    lab: 'Lab. Kesehatan Ikan',
    name: 'Mulya Septika, S.Tr.Pi',
    type: 'perikanan',
    facility: 'LAB',
    initials: 'MS',
    image: '/placeholder-coord.jpg',
  },
  {
    lab: 'Lab. Kualitas Air',
    name: 'Citra Mulia, S.Pi',
    type: 'perikanan',
    facility: 'LAB',
    initials: 'CM',
    image: '/placeholder-coord.jpg',
  },
  {
    lab: 'Lab. Pengolahan',
    name: 'Ririn Ramadhani, S.Tr.Pi',
    type: 'perikanan',
    facility: 'LAB',
    initials: 'RR',
    image: '/placeholder-coord.jpg',
  },
  {
    lab: 'Bangsal Pakan Alami',
    name: 'Nurma Elwinda, S.Pi',
    type: 'perikanan',
    facility: 'LAB',
    initials: 'NE',
    image: '/placeholder-coord.jpg',
  },
  {
    lab: 'Lab. Perikanan (SFS)',
    name: 'Agung Kurniawan, M.Tr.Pi',
    type: 'perikanan',
    facility: 'LAB',
    initials: 'AK',
    image: '/placeholder-coord.jpg',
  },
  {
    lab: 'Lab. Pembenihan',
    name: 'Iwan Haryadi, A.Md',
    type: 'perikanan',
    facility: 'LAB',
    initials: 'IH',
    image: '/placeholder-coord.jpg',
  },
  {
    lab: 'Lab. Ikan Hias',
    name: 'Riky Andri Saputra, S.Tr.Pi',
    type: 'perikanan',
    facility: 'LAB',
    initials: 'RA',
    image: '/placeholder-coord.jpg',
  },
  {
    lab: 'Lab. Nutrisi',
    name: 'MP. Irsan, S.Tr.Pi',
    type: 'perikanan',
    facility: 'LAB',
    initials: 'MI',
    image: '/placeholder-coord.jpg',
  },
  {
    lab: 'Polyfeed',
    name: 'Dr. Rakhmawati, S.Pi., M.Si.',
    type: 'perikanan',
    facility: 'TEFA',
    initials: 'DR',
    image: '/placeholder-coord.jpg',
  },
  {
    lab: 'POFA',
    name: 'Pindo Witoko, S.Pi., M.P.',
    type: 'perikanan',
    facility: 'TEFA',
    initials: 'PW',
    image: '/placeholder-coord.jpg',
  },
  {
    lab: 'Galangan Kapal',
    name: 'Dona Setya, S.Tr.Pi., M.Si.',
    type: 'perikanan',
    facility: 'TEFA',
    initials: 'DS',
    image: '/placeholder-coord.jpg',
  },
  {
    lab: 'Alat Tangkap Ikan',
    name: 'Dona Setya, S.Tr.Pi., M.Si.',
    type: 'perikanan',
    facility: 'TEFA',
    initials: 'DS',
    image: '/placeholder-coord.jpg',
  },
  {
    lab: 'KJA',
    name: 'Dona Setya & Harbani',
    type: 'perikanan',
    facility: 'TEFA',
    initials: 'DH',
    image: '/placeholder-coord.jpg',
  },
  {
    lab: 'FISHTECH',
    name: 'Epro Baradez',
    type: 'perikanan',
    facility: 'TEFA',
    initials: 'EB',
    image: '/placeholder-coord.jpg',
  },
  {
    lab: 'FISH MARKET',
    name: 'Rahmadiaziz',
    type: 'perikanan',
    facility: 'TEFA',
    initials: 'R',
    image: '/placeholder-coord.jpg',
  },
  {
    lab: 'Polyfish',
    name: 'Iwan Haryadi, A.Md',
    type: 'perikanan',
    facility: 'TEFA',
    initials: 'IH',
    image: '/placeholder-coord.jpg',
  },
  {
    lab: 'Lab Simulator',
    name: 'Ari Setiawan, S.Tr.Pi.',
    type: 'tangkap',
    facility: 'TEFA',
    initials: 'AS',
    image: '/placeholder-coord.jpg',
  },
  {
    lab: 'Lab Radar',
    name: 'Ari Setiawan, S.Tr.Pi.',
    type: 'tangkap',
    facility: 'TEFA',
    initials: 'AS',
    image: '/placeholder-coord.jpg',
  },
];

export default function OrganisasiPage() {
  return (
    <div className='min-h-screen bg-slate-50 pt-24 pb-20 px-4 md:px-8'>
      <div className='max-w-7xl mx-auto'>
        {/* Header */}
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

        {/* --- STRUKTUR PIMPINAN --- */}
        <div className='flex flex-col items-center mb-24 relative'>
          <div className='w-full max-w-[340px] z-10'>
            <BigProfileCard member={leaders.kajur} color='bg-slate-900' />
          </div>

          <div className='hidden md:flex flex-col items-center w-full'>
            <div className='w-0.5 h-12 bg-slate-200' />
            <div className='w-[60%] h-0.5 bg-slate-200 relative'>
              <div className='absolute left-0 top-0 w-0.5 h-12 bg-slate-200' />
              <div className='absolute right-0 top-0 w-0.5 h-12 bg-slate-200' />
            </div>
          </div>
          <div className='md:hidden h-10 w-0.5 bg-slate-200 my-2' />

          <div className='grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-32 w-full max-w-5xl md:mt-12'>
            <BigProfileCard
              member={leaders.kalabPerikanan}
              color='bg-blue-600'
            />
            <BigProfileCard member={leaders.kalabTangkap} color='bg-cyan-600' />
          </div>
        </div>

        {/* --- GRID KOORDINATOR LENGKAP DENGAN FOTO --- */}
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
            {coordinators.map((coord, idx) => (
              <Card
                key={idx}
                className='border border-slate-200 shadow-sm hover:shadow-md transition-all group overflow-hidden bg-white'>
                <div
                  className={`h-1 w-full ${coord.type === 'tangkap' ? 'bg-cyan-500' : 'bg-blue-600'}`}
                />
                <CardContent className='p-4 flex items-center gap-4'>
                  {/* Foto Profil Koordinator */}
                  <Avatar
                    className={`size-14 ring-2 transition-transform group-hover:scale-105 ${coord.type === 'tangkap' ? 'ring-cyan-100' : 'ring-blue-100'}`}>
                    <AvatarImage src={coord.image} className='object-cover' />
                    <AvatarFallback
                      className={`${coord.type === 'tangkap' ? 'bg-cyan-50 text-cyan-700' : 'bg-blue-50 text-blue-700'} font-bold`}>
                      {coord.initials}
                    </AvatarFallback>
                  </Avatar>

                  {/* Informasi Dosen & Badge */}
                  <div className='overflow-hidden flex-1'>
                    <p
                      className='font-bold text-slate-800 text-sm truncate'
                      title={coord.lab}>
                      {coord.name}
                    </p>
                    <p
                      className='text-xs font-medium text-slate-500 truncate mt-0.5'
                      title={coord.name}>
                      {coord.lab}
                    </p>

                    {/* Badge LAB atau TEFA */}
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

function BigProfileCard({ member, color }: { member: any; color: string }) {
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
