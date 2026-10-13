import { NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * Tandai SEMUA baris sesi terbuka milik user sebagai berakhir (`logout`).
 *
 * Dipanggil navbar SEBELUM `supabase.auth.signOut()` (sesudah signOut tidak
 * ada JWT lagi untuk lolos RLS owner-policy). Best-effort: selalu 200 agar
 * client tetap lanjut logout walau penandaan gagal — baris yatim akan
 * kedaluwarsa sendiri via idle-expiry.
 */
export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ ok: true });
    await supabase
      .from('user_sessions')
      .update({ ended_at: new Date().toISOString(), end_reason: 'logout' })
      .eq('user_id', user.id)
      .is('ended_at', null);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true });
  }
}
