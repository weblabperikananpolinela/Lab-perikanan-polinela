import { createClient } from '@/lib/supabase/client';

export function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function getOrCreateDeviceId() {
  if (typeof window === 'undefined') return '';
  
  let deviceId = localStorage.getItem('dolphin_device_id');
  if (!deviceId) {
    deviceId = 'device_' + Math.random().toString(36).substring(2, 15);
    localStorage.setItem('dolphin_device_id', deviceId);
  }
  
  return deviceId;
}

export async function subscribeToPushNotifications(
  identifier: string,
  role: string,
  labId?: number
) {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    throw new Error('Push notification tidak didukung oleh browser Anda.');
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    throw new Error('Izin notifikasi ditolak.');
  }

  console.log("1. Izin diberikan, mencari Service Worker...");

  // KRUSIAL: Cek registrasi dulu, jika belum ada lakukan registrasi manual
  let registration = await navigator.serviceWorker.getRegistration();

  if (!registration) {
    console.warn("Service Worker belum terdaftar! Melakukan registrasi manual...");
    // Daftarkan manual dengan scope root
    registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
  }

  // Pastikan SW benar-benar ready sebelum lanjut
  await navigator.serviceWorker.ready;
  console.log("2. Service Worker ditemukan dan ready! Mendaftar ke PushManager...");

  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!vapidPublicKey) {
    throw new Error('VAPID public key tidak ditemukan dalam konfigurasi.');
  }

  const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);

  let subscription = await registration.pushManager.getSubscription();
  let isNewSubscription = false;

  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: convertedVapidKey,
    });
    isNewSubscription = true;
  }

  const subscriptionJson = subscription.toJSON();

  if (!subscriptionJson.endpoint || !subscriptionJson.keys?.p256dh || !subscriptionJson.keys?.auth) {
    throw new Error('Data langganan tidak valid.');
  }

  console.log("3. PushManager sukses, mengirim ke Supabase...");

  const supabase = createClient();
  const { error } = await supabase.rpc('register_push_subscription', {
    p_identifier: identifier,
    p_role: role,
    p_lab_id: labId ?? null,
    p_subscription: JSON.parse(JSON.stringify(subscriptionJson)),
  });
  if (error) throw error;

  console.log("4. Sukses menyimpan ke Supabase!");

  return { success: true, isNewSubscription };
}
