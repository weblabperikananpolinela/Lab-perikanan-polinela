import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const { type, to, data } = await request.json();

    // 1. Email Notifikasi untuk ADMIN
    if (type === 'ADMIN_NOTIFICATION') {
      await resend.emails.send({
        from: 'DOLPHIN Polinela <onboarding@resend.dev>',
        to: [to], // Email admin/dosen pengelola lab
        subject: `🔔 Pengajuan Baru: ${data.judul_kegiatan}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
            <div style="background-color: #0f172a; padding: 20px; text-align: center;">
              <h2 style="color: #ffffff; margin: 0;">Pengajuan Baru Masuk</h2>
            </div>
            <div style="padding: 24px; color: #334155;">
              <p>Halo Admin Lab, ada pengajuan baru yang membutuhkan validasi Anda:</p>
              <div style="background-color: #f8fafc; padding: 16px; border-radius: 8px; margin: 20px 0;">
                <p><strong>Kegiatan:</strong> ${data.judul_kegiatan}</p>
                <p><strong>Pengaju:</strong> ${data.nama_pengaju}</p>
                <p><strong>Tanggal:</strong> ${data.tanggal}</p>
              </div>
              <a href="${process.env.NEXT_PUBLIC_BASE_URL}/admin/dashboard?lab_id=${data.lab_id}" 
                 style="display: block; background-color: #2563eb; color: white; padding: 12px; text-align: center; border-radius: 8px; text-decoration: none; font-weight: bold;">
                 Buka Tab Pengajuan
              </a>
            </div>
          </div>
        `,
      });
    }

    // 2. Email Konfirmasi untuk MAHASISWA (Pengaju)
    if (type === 'USER_CONFIRMATION') {
      await resend.emails.send({
        from: 'DOLPHIN Polinela <onboarding@resend.dev>',
        to: [to],
        subject: `📩 Pengajuan Terkirim: ${data.judul_kegiatan}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
            <div style="background-color: #2563eb; padding: 20px; text-align: center;">
              <h2 style="color: #ffffff; margin: 0;">Terima Kasih!</h2>
            </div>
            <div style="padding: 24px; color: #334155;">
              <p>Halo <strong>${data.nama_pengaju}</strong>,</p>
              <p>Pengajuan Anda untuk kegiatan <strong>"${data.judul_kegiatan}"</strong> telah kami terima dan sedang dalam proses antrean validasi oleh admin laboratorium.</p>
              <p style="background-color: #f0f9ff; padding: 12px; border-left: 4px solid #0ea5e9; color: #0369a1;">
                Mohon periksa website secara berkala untuk melihat status terbaru. Update selanjutnya juga akan kami informasikan melalui email ini.
              </p>
              <div style="margin-top: 20px; font-size: 12px; color: #94a3b8;">
                Sistem Informasi Laboratorium Perikanan Polinela (DOLPHIN).
              </div>
            </div>
          </div>
        `,
      });
    }

    // 3. Email Notifikasi Perubahan Status (Untuk MAHASISWA)
    if (type === 'STATUS_UPDATE') {
      const isApproved = data.status_baru === 'Disetujui';
      const colorScheme = isApproved ? '#10b981' : '#ef4444'; // Emerald for success, Red for rejected
      const headerText = isApproved ? 'Pengajuan Disetujui' : 'Pengajuan Ditolak';
      
      await resend.emails.send({
        from: 'DOLPHIN Polinela <onboarding@resend.dev>',
        to: [to],
        subject: `Update Status Pengajuan: ${data.judul_kegiatan}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
            <div style="background-color: ${colorScheme}; padding: 20px; text-align: center;">
              <h2 style="color: #ffffff; margin: 0;">${headerText}</h2>
            </div>
            <div style="padding: 24px; color: #334155;">
              <p>Halo,</p>
              <p>Kami ingin menginformasikan bahwa status pengajuan peminjaman lab untuk kegiatan <strong>"${data.judul_kegiatan}"</strong> telah diubah oleh Admin Laboratorium menjadi:</p>
              
              <div style="background-color: #f8fafc; padding: 16px; border-left: 4px solid ${colorScheme}; margin: 20px 0; font-size: 18px; font-weight: bold; color: ${colorScheme}; text-align: center;">
                ${data.status_baru.toUpperCase()}
              </div>
              
              <p>Terima kasih telah menggunakan layanan Sistem Informasi Laboratorium Perikanan Polinela (DOLPHIN).</p>
              <div style="margin-top: 30px; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; pt-4">
                Pesan ini dikirim secara otomatis. Mohon tidak membalas ke alamat email ini.
              </div>
            </div>
          </div>
        `,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Gagal mengirim email' },
      { status: 500 },
    );
  }
}
