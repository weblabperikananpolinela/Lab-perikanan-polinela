'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { getOrCreateDeviceId, subscribeToPushNotifications } from '@/lib/push-utils';
import Swal from 'sweetalert2';
import { Bell } from 'lucide-react';

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

  const handleSubscribe = async () => {
    try {
      setLoading(true);
      
      // Gunakan email jika tersedia, jika tidak gunakan device ID generik
      const identifier = userEmail || getOrCreateDeviceId();

      await subscribeToPushNotifications(identifier, role, labId);

      Swal.fire({
        icon: 'success',
        title: 'Berhasil',
        text: 'Notifikasi berhasil diaktifkan!',
        confirmButtonColor: '#0f172a',
      });
    } catch (error: any) {
      console.error('Error subscribing to push notifications:', error);
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
