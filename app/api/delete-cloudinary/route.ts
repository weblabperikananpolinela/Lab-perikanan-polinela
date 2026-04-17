import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

// Konfigurasi Cloudinary SDK
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Fungsi utilitas untuk membedah URL dan mengambil public_id Cloudinary
 * Mengubah: https://res.cloudinary.com/demo/image/upload/v1612.../folder/file.jpg
 * Menjadi: folder/file
 */
function extractPublicId(url: string) {
  const parts = url.split('/upload/');
  if (parts.length < 2) return null;

  const pathParts = parts[1].split('/');
  
  // Hapus parameter versi seperti "v1620312345" jika ada
  let startIndex = 0;
  if (/^v\d+$/.test(pathParts[0])) {
    startIndex = 1;
  }

  let publicIdWithExt = pathParts.slice(startIndex).join('/');
  
  // Hilangkan ekstensi (.pdf, .jpg, dll)
  const lastDotIndex = publicIdWithExt.lastIndexOf('.');
  if (lastDotIndex !== -1) {
    publicIdWithExt = publicIdWithExt.substring(0, lastDotIndex);
  }

  return publicIdWithExt;
}

export async function POST(req: Request) {
  try {
    const { fileUrl, fileType } = await req.json();

    if (!fileUrl) {
      return NextResponse.json(
        { success: false, error: 'URL File tidak boleh kosong' },
        { status: 400 }
      );
    }

    const publicId = extractPublicId(fileUrl);
    
    if (!publicId) {
      return NextResponse.json(
        { success: false, error: 'Format URL Cloudinary tidak valid' },
        { status: 400 }
      );
    }

    // Tentukan resource_type
    // File dokumen seperti PDF biasanya tersimpan sebagai 'raw' (kecuali diupload dengan 'auto' image ke page render, namun 'raw' / 'image' harus tepat)
    // Cloudinary secara default menyimpan gambar sbg 'image', video sbg 'video', dokumen sbg 'raw' atau 'image' (jika bisa di-preview)
    // Di aplikasi KelolaJadwal kita menggunakan /auto/upload, jadi kita akan mencoba menghapus berdasarkan fileType
    const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(
      fileType?.toLowerCase() || ''
    );
    const resourceType = isImage ? 'image' : 'raw';

    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });

    // Jika not found, coba resource type kebalikan just in case Cloudinary menyimpannya berbeda dari dugaan kita
    if (result.result === 'not found') {
      const fallbackResourceType = resourceType === 'raw' ? 'image' : 'raw';
      await cloudinary.uploader.destroy(publicId, {
        resource_type: fallbackResourceType,
      });
    }

    return NextResponse.json({ success: true, message: 'File berhasil dihapus dari Cloudinary' });
    
  } catch (error: any) {
    console.error('Cloudinary Deletion Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Terjadi kesalahan sistem' },
      { status: 500 }
    );
  }
}
