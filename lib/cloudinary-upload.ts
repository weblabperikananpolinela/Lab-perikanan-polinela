const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const DEFAULT_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

export type MediaFolder = 'dolphin_hero' | 'dolphin_dokumentasi' | 'dolphin_organisasi';

const FOLDER_PRESET: Record<MediaFolder, string | undefined> = {
  dolphin_hero: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET_HERO,
  dolphin_dokumentasi:
    process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET_DOKUMENTASI,
  dolphin_organisasi:
    process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET_ORGANISASI,
};

export const IMAGE_ACCEPT = 'image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp';
export const IMAGE_MAX_BYTES = 5 * 1024 * 1024;

export function isAllowedImage(file: File): string | null {
  if (file.size > IMAGE_MAX_BYTES) return 'Ukuran file maksimal 5 MB.';
  const ok = /image\/(jpeg|png|webp)/i.test(file.type) || /\.(jpe?g|png|webp)$/i.test(file.name);
  if (!ok) return 'Format yang diizinkan: JPG, PNG, atau WebP.';
  return null;
}

export async function uploadImageToCloudinary(
  file: File,
  folder: MediaFolder,
): Promise<{ url: string; fileType: string }> {
  const preset = FOLDER_PRESET[folder] || DEFAULT_PRESET;
  if (!CLOUD_NAME || !preset) {
    throw new Error('Konfigurasi Cloudinary tidak ditemukan pada server.');
  }
  const typeError = isAllowedImage(file);
  if (typeError) throw new Error(typeError);

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', preset);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    { method: 'POST', body: formData },
  );
  const cloudData = await res.json();
  if (!res.ok) {
    throw new Error(cloudData.error?.message || 'Gagal unggah ke Cloudinary');
  }
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
  return { url: cloudData.secure_url as string, fileType: ext };
}

export function isOwnCloudinaryUrl(url: string): boolean {
  if (!url) return false;
  if (url.startsWith('/')) return true;
  const name = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  if (!name) return url.startsWith('https://res.cloudinary.com/');
  return url.includes(`res.cloudinary.com/${name}/`);
}

export async function deleteCloudinaryFile(fileUrl: string, fileType: string) {
  if (!fileUrl.startsWith('http')) return;
  await fetch('/api/delete-cloudinary', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fileUrl, fileType }),
  });
}
