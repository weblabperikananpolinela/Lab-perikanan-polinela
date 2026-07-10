import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // GANTI VALUE INI:
  // true = Web mode maintenance (semua orang dialihkan ke halaman maintenance)
  // false = Web berjalan normal
  const isMaintenanceMode = false;

  // Jika mode maintenance aktif, DAN user tidak sedang berada di halaman /maintenance
  if (isMaintenanceMode && request.nextUrl.pathname !== '/maintenance') {
    // Arahkan mereka secara paksa ke halaman maintenance
    return NextResponse.redirect(new URL('/maintenance', request.url));
  }

  // Jika maintenance OFF, biarkan user lewat
  return NextResponse.next();
}

// Konfigurasi ini memastikan file gambar/logo tidak ikut terblokir
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.png|.*\\.jpg).*)',
  ],
};
