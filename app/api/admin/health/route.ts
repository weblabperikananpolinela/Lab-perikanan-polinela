import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient, hasServiceRoleKey } from '@/lib/supabase/service';

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

const SYSTEM_ADMIN_EMAIL = 'dolphinperikanan@polinela.ac.id';
const TABLES = ['peminjaman', 'materi_dosen', 'dokumentasi_foto', 'inventaris', 'laboratorium'] as const;

/**
 * Operational health for the system admin overview panel (v5.3.0).
 * Requires a signed-in system admin; secrets (Cloudinary api_secret,
 * Supabase service key) never leave the server.
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

    const startedAt = Date.now();
    const counts: Record<string, number | null> = {};

    if (hasServiceRoleKey()) {
      const service = createServiceClient();
      const results = await Promise.all(
        TABLES.map((table) =>
          service
            .from(table)
            .select('*', { count: 'exact', head: true })
            .then(({ count }) => [table, count ?? null] as const),
        ),
      );
      for (const [table, count] of results) counts[table] = count;
    }

    const latencyMs = Date.now() - startedAt;

    let storage: {
      usedBytes: number;
      resources: number;
      creditsUsed: number;
      creditsLimit: number;
      usedPercent: number;
      plan: string;
    } | null = null;
    try {
      const usage = await cloudinary.api.usage();
      storage = {
        usedBytes: usage.storage?.usage ?? 0,
        resources: usage.resources ?? 0,
        creditsUsed: Number(usage.credits?.usage ?? 0),
        creditsLimit: Number(usage.credits?.limit ?? 0),
        usedPercent: Number(usage.credits?.used_percent ?? 0),
        plan: usage.plan ?? 'unknown',
      };
    } catch (err) {
      console.error('Cloudinary usage lookup failed:', err);
    }

    const { count: waiting } = await supabase
      .from('peminjaman')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'Menunggu validasi');

    const { count: adminCount } = await supabase
      .from('whitelist_admin')
      .select('*', { count: 'exact', head: true });

    const { data: maintenance } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'maintenance_mode')
      .maybeSingle();

    return NextResponse.json({
      ok: true,
      db: { latencyMs, counts },
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
