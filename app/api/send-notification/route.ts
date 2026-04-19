import { NextResponse } from 'next/server';
import webpush from 'web-push';
import { createClient } from '@/lib/supabase/server';

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT || 'mailto:admin@example.com',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export async function POST(request: Request) {
  try {
    const { identifier, targetRole, targetLabId, title, message, url } = await request.json();

    if (!title || !message) {
      return NextResponse.json(
        { error: 'Title and message are required' },
        { status: 400 }
      );
    }

    // Harus ada salah satu: identifier ATAU (targetRole + targetLabId)
    if (!identifier && !(targetRole && targetLabId)) {
      return NextResponse.json(
        { error: 'Either identifier or (targetRole + targetLabId) is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    let subscriptions: any[] = [];

    if (targetRole && targetLabId) {
      // Mode broadcast: kirim ke semua subscriber dengan role & lab_id tertentu
      const { data, error } = await supabase
        .from('push_subscriptions')
        .select('*')
        .eq('role', targetRole)
        .eq('lab_id', targetLabId);

      if (error) throw error;
      subscriptions = data || [];
    } else if (identifier) {
      // Mode direct: kirim ke subscriber dengan identifier tertentu
      const { data, error } = await supabase
        .from('push_subscriptions')
        .select('*')
        .eq('identifier', identifier);

      if (error) throw error;
      subscriptions = data || [];
    }

    if (subscriptions.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No subscriptions found for the given criteria',
      });
    }

    const payload = JSON.stringify({
      title,
      body: message,
      url: url || '/',
    });

    const notifications = subscriptions.map(async (sub) => {
      try {
        // Ekstrak data dari kolom JSONB `subscription`
        const subData = typeof sub.subscription === 'string'
          ? JSON.parse(sub.subscription)
          : sub.subscription;

        const pushSubscription = {
          endpoint: subData.endpoint,
          keys: {
            p256dh: subData.keys.p256dh,
            auth: subData.keys.auth,
          },
        };
        await webpush.sendNotification(pushSubscription, payload);
      } catch (error: any) {
        // If the subscription is no longer valid or gone, remove it from the database
        if (error.statusCode === 404 || error.statusCode === 410) {
          await supabase.from('push_subscriptions').delete().eq('id', sub.id);
        } else {
          console.error('Error sending push notification:', error);
        }
      }
    });

    await Promise.all(notifications);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error in send-notification:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
