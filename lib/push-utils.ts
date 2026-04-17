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

  const registration = await navigator.serviceWorker.ready;

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
  const endpoint = subscriptionJson.endpoint;
  const p256dh = subscriptionJson.keys?.p256dh;
  const auth = subscriptionJson.keys?.auth;

  if (!endpoint || !p256dh || !auth) {
    throw new Error('Data langganan tidak valid.');
  }

  const supabase = createClient();

  // Memeriksa apakah endpoint ini sudah ada di database
  const { data: existing } = await supabase
    .from('push_subscriptions')
    .select('id')
    .eq('endpoint', endpoint)
    .single();

  if (existing) {
    // Update jika sudah ada
    const { error } = await supabase
      .from('push_subscriptions')
      .update({
        identifier,
        role,
        lab_id: labId,
        p256dh,
        auth,
      })
      .eq('id', existing.id);

    if (error) throw error;
  } else {
    // Insert jika belum ada
    const { error } = await supabase
      .from('push_subscriptions')
      .insert({
        identifier,
        role,
        lab_id: labId,
        endpoint,
        p256dh,
        auth,
      });

    if (error) throw error;
  }

  return { success: true, isNewSubscription };
}
