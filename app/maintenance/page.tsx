import { Wrench } from 'lucide-react';

export default function MaintenancePage() {
  return (
    <div className='min-h-screen bg-slate-900 flex flex-col items-center justify-center text-center px-4'>
      <div className='bg-white/10 p-6 rounded-full mb-8 animate-pulse'>
        <Wrench className='size-16 text-blue-400' />
      </div>
      <h1 className='text-4xl md:text-5xl font-extrabold text-white mb-4 tracking-tight'>
        Sistem Sedang Diperbarui
      </h1>
      <p className='text-blue-200 md:text-lg max-w-lg leading-relaxed'>
        Kami sedang melakukan pemeliharaan rutin dan peningkatan fitur pada
        sistem Laboratorium Perikanan Polinela. Silakan kembali beberapa saat
        lagi.
      </p>
    </div>
  );
}
