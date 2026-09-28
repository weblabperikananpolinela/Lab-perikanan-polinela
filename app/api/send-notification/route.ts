import { NextResponse } from 'next/server';
import webpush from 'web-push';
import { createServiceClient, hasServiceRoleKey } from '@/lib/supabase/service';

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT || 'mailto:admin@example.com',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!,
);

const TITLE_MAX = 80;
const MESSAGE_MAX = 200;
const IDENTIFIER_MAX = 254;
const ALLOWED_ROLES = new Set(['admin']);
const ALLOWED_URL_PREFIXES = ['/', '/admin/', '/administrasi/'];

function isSafeUrl(url: unknown): url is string {
  if (typeof url !== 'string' || url.length > 200) return false;
  if (!url.startsWith('/')) return false;
  if (url.startsWith('//') || url.includes('\\') || url.includes('://')) {
    return false;
  }
  return ALLOWED_URL_PREFIXES.some(
    (prefix) => url === prefix.slice(0, -1) || url.startsWith(prefix) || url === '/',
  );
}

function clip(value: unknown, max: number): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > max) return null;
  return trimmed;
}

export async function POST(request: Request) {
  try {
    if (!hasServiceRoleKey()) {
      return NextResponse.json(
        { error: 'Push service is not configured on the server.' },
        { status: 503 },
      );
    }

    const body = await request.json();
    const title = clip(body.title, TITLE_MAX);
    const message = clip(body.message, MESSAGE_MAX);
    const identifier = clip(body.identifier, IDENTIFIER_MAX);
    const targetRole =
      typeof body.targetRole === 'string' ? body.targetRole.trim() : null;
    const targetLabId = Number(body.targetLabId);
    const url = isSafeUrl(body.url) ? body.url : '/';

    if (!title || !message) {
      return NextResponse.json(
        { error: 'Title and message are required' },
        { status: 400 },
      );
    }

    const hasBroadcast =
      Boolean(targetRole) && Number.isInteger(targetLabId) && targetLabId >= 1 && targetLabId <= 18;
    const hasDirect = Boolean(identifier);

    if (!hasDirect && !hasBroadcast) {
      return NextResponse.json(
        { error: 'Either identifier or (targetRole + targetLabId) is required' },
        { status: 400 },
      );
    }

    if (hasBroadcast && targetRole && !ALLOWED_ROLES.has(targetRole)) {
      return NextResponse.json({ error: 'Invalid target role' }, { status: 400 });
    }

    const service = createServiceClient();
    const { data, error } = await service.rpc('get_push_targets', {
      p_identifier: hasDirect ? identifier : null,
      p_role: hasBroadcast ? targetRole : null,
      p_lab_id: hasBroadcast ? targetLabId : null,
    });

    if (error) throw error;
    const subscriptions = data || [];

    if (subscriptions.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No subscriptions found for the given criteria',
      });
    }

    const payload = JSON.stringify({ title, body: message, url });

    await Promise.all(
      subscriptions.map(async (sub: { id: number; subscription: any }) => {
        try {
          const subData =
            typeof sub.subscription === 'string'
              ? JSON.parse(sub.subscription)
              : sub.subscription;
          if (!subData?.endpoint || !subData?.keys?.p256dh || !subData?.keys?.auth) {
            return;
          }
          await webpush.sendNotification(
            {
              endpoint: subData.endpoint,
              keys: {
                p256dh: subData.keys.p256dh,
                auth: subData.keys.auth,
              },
            },
            payload,
          );
        } catch (err: any) {
          if (err.statusCode === 404 || err.statusCode === 410) {
            await service.rpc('delete_push_subscription', { p_id: sub.id });
          } else {
            console.error('Error sending push notification:', err);
          }
        }
      }),
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error in send-notification:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 },
    );
  }
}
