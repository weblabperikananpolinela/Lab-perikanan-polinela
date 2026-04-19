'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { getOrCreateDeviceId, subscribeToPushNotifications } from '@/lib/push-utils';
import Swal from 'sweetalert2';
import { Bell, BellRing } from 'lucide-react';

interface NotifButtonProps {
  userEmail?: string;
  role?: string;
  labId?: number;
}

export default function NotifButton({ 
  userEmail, 
  role = 'pemohon', 
  labId 
}: NotifButtonProps) {
  const [loading, setLoading] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);

  // Cek status langganan saat komponen mount
  useEffect(() => {
    const checkSubscription = async () => {
      try {
        if ('serviceWorker' in navigator && 'PushManager' in window) {
          const registration = await navigator.serviceWorker.ready;
          const existingSubscription = await registration.pushManager.getSubscription();
          if (existingSubscription) {
            setIsSubscribed(true);
          }
        }
      } catch (error) {
        console.error("Gagal mengecek status langganan:", error);
      }
    };
    checkSubscription();
  }, []);

  const handleSubscribe = async () => {
    try {
      setLoading(true);
      
      // Gunakan email jika tersedia, jika tidak gunakan device ID generik
      const identifier = userEmail || getOrCreateDeviceId();
      console.log('NotifButton: Memulai subscribe dengan identifier:', identifier, 'role:', role, 'labId:', labId);

      await subscribeToPushNotifications(identifier, role, labId);

      setIsSubscribed(true);

      Swal.fire({
        icon: 'success',
        title: 'Berhasil',
        text: 'Notifikasi berhasil diaktifkan!',
        confirmButtonColor: '#0f172a',
      });
    } catch (error: any) {
      console.error('Error Detail:', error);
      Swal.fire({
        icon: 'error',
        title: 'Gagal',
        text: error.message || 'Gagal mengaktifkan notifikasi. Pastikan browser Anda mendukung notifikasi dan izin telah diberikan.',
        confirmButtonColor: '#0f172a',
      });
    } finally {
      setLoading(false);
    }
  };

  if (isSubscribed) {
    return (
      <Button 
        disabled 
        variant="outline" 
        className="gap-2 border-emerald-300 bg-emerald-50 text-emerald-700 cursor-default"
      >
        <BellRing className="w-4 h-4 fill-emerald-500" />
        Notifikasi Aktif
      </Button>
    );
  }

  return (
    <Button 
      onClick={handleSubscribe} 
      disabled={loading} 
      variant="outline" 
      className="gap-2"
    >
      <Bell className="w-4 h-4" />
      {loading ? 'Memproses...' : 'Aktifkan Notifikasi'}
    </Button>
  );
}
