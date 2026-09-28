import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { createClient } from '@/lib/supabase/server';

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

const SYSTEM_ADMIN_EMAIL = 'dolphinperikanan@polinela.ac.id';

/**
 * Health summary for the system admin overview panel (v5.3.0).
 *
 * Deliberately high level: the panel shows "Sehat / Bermasalah" rather than
 * technical metrics. Requires a signed-in system admin; secrets never leave
 * the server.
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user || user.email !== SYSTEM_ADMIN_EMAIL) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Round-trip latency of a trivial query — the DB health signal.
    const dbStarted = Date.now();
    const { error: dbError } = await supabase
      .from('laboratorium')
      .select('id', { count: 'exact', head: true });
    const latencyMs = Date.now() - dbStarted;
    const dbHealthy = !dbError && latencyMs < 3000;

    let storage: { healthy: boolean; usedPercent: number } | null = null;
    try {
      const usage = await cloudinary.api.usage();
      const usedPercent = Number(usage.credits?.used_percent ?? 0);
      storage = {
        healthy: usedPercent < 80,
        usedPercent,
      };
    } catch (err) {
      console.error('Cloudinary usage lookup failed:', err);
      storage = null;
    }

    const { count: waiting } = await supabase
      .from('peminjaman')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'Menunggu validasi');

    const { count: adminCount } = await supabase
      .from('whitelist_admin')
      .select('email', { count: 'exact', head: true });

    const { data: maintenance } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'maintenance_mode')
      .maybeSingle();

    return NextResponse.json({
      ok: dbHealthy,
      db: { healthy: dbHealthy, latencyMs },
      storage,
      pengajuanMenunggu: waiting ?? 0,
      adminCount: adminCount ?? 0,
      maintenanceMode: maintenance?.value === true,
      generatedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Health endpoint error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
