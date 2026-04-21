'use client';

import { useState, useEffect } from 'react';
import { Download, X, Smartphone, Share } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // 1. Deteksi apakah user menggunakan iOS (iPhone/iPad/iPod)
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    // 2. Mengecek apakah aplikasi sedang dibuka dari Browser atau sudah jadi Aplikasi (Standalone)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone;

    // Jika sudah diinstal (standalone), pastikan banner mati dan jangan lanjut.
    if (isStandalone) {
      setShowBanner(false);
      return;
    }

    // 3. Logika untuk Android / PC (Merespons beforeinstallprompt)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowBanner(true); // Munculkan banner untuk Android/PC
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // 4. Logika Khusus untuk iOS (Karena iOS tidak punya beforeinstallprompt)
    if (isIosDevice && !isStandalone) {
      // Kasih jeda sedikit agar tidak mengagetkan saat web baru dibuka
      setTimeout(() => {
        setShowBanner(true);
      }, 2000);
    }

    // 5. Matikan banner jika instalasi sukses
    window.addEventListener('appinstalled', () => {
      setShowBanner(false);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener(
        'beforeinstallprompt',
        handleBeforeInstallPrompt,
      );
    };
  }, []);

  const handleInstallClick = async () => {
    // Tombol ini hanya jalan untuk Android/PC
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowBanner(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className='fixed bottom-6 left-6 right-6 md:left-auto md:right-6 md:w-80 bg-white border border-blue-100 shadow-2xl rounded-2xl p-5 z-[9999] animate-in slide-in-from-bottom-10 fade-in duration-500'>
      <button
        onClick={handleDismiss}
        className='absolute top-3 right-3 p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors'>
        <X className='size-4' />
      </button>

      <div className='flex items-start gap-4'>
        <div className='bg-blue-50 p-3 rounded-full text-blue-600 shrink-0'>
          <Smartphone className='size-6' />
        </div>
        <div className='pr-4'>
          <h3 className='font-bold text-slate-800 text-sm italic'>
            Install DOLPHIN
          </h3>

          {/* TAMPILAN KHUSUS iOS */}
          {isIOS ? (
            <>
              <p className='text-[11px] text-slate-500 mt-1 mb-3 leading-relaxed'>
                Pasang DOLPHIN di iPhone Anda. Tekan tombol{' '}
                <strong>Share</strong>{' '}
                <Share className='inline size-3 mb-1 text-blue-500' /> di menu
                bawah Safari, lalu pilih <strong>"Add to Home Screen"</strong>.
              </p>
              <Button
                variant='outline'
                onClick={handleDismiss}
                className='w-full text-xs h-8 border-blue-200 text-blue-600'>
                Saya Mengerti
              </Button>
            </>
          ) : (
            /* TAMPILAN UNTUK ANDROID / PC */
            <>
              <p className='text-[11px] text-slate-500 mt-1 mb-4 leading-relaxed'>
                Gunakan versi aplikasi untuk akses lebih stabil, hemat kuota,
                dan notifikasi langsung ke perangkat Anda.
              </p>
              <Button
                onClick={handleInstallClick}
                className='w-full bg-blue-600 hover:bg-blue-700 text-white text-xs h-9 font-bold shadow-md'>
                <Download className='size-3 mr-2' /> Install Sekarang
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
