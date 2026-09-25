import withPWAInit from '@ducanh2912/next-pwa';

const withPWA = withPWAInit({
  dest: 'public',
  // JURUS JITU 1: Matikan total cache navigasi agar halaman dinamis tidak disimpan di browser
  cacheOnFrontEndNav: false,
  aggressiveFrontEndNavCaching: false,
  reloadOnOnline: true,
  swcMinify: true,
  disable: process.env.NODE_ENV === 'development',
  customWorkerDir: 'worker',
  // Precache hanya shell PWA dan aset kecil. Foto, banner, jadwal, logo,
  // serta dokumen diambil on-demand agar tidak memenuhi Cache Storage.
  publicExcludes: [
    '!noprecache/**/*',
    '!dokumen/**/*',
    '!banner/**/*',
    '!dokumentasi/**/*',
    '!foto-organisasi/**/*',
    '!jadwal/**/*',
    '!gallery-*.jpg',
    '!gallery-*.webp',
    '!hero-lab-*.jpg',
    '!hero-lab-*.webp',
    '!logo_dolphin.webp',
    '!icon-dark-32x32.png',
    '!icon-light-32x32.png',
    '!placeholder.jpg',
    '!placeholder.svg',
    '!placeholder-logo.svg',
    '!admin/**/*',
    '!api/**/*',
    '!auth/**/*',
  ],
  workboxOptions: {
    disableDevLogs: true,
    // Hindari file besar ikut precache apabila aset baru ditambahkan nanti.
    maximumFileSizeToCacheInBytes: 2 * 1024 * 1024,
    runtimeCaching: [
      {
        urlPattern: /\/(_next\/image\?.+|images?\/).+$/i,
        handler: 'StaleWhileRevalidate',
        options: {
          cacheName: 'dolphin-next-image-v2',
          expiration: { maxEntries: 16, maxAgeSeconds: 3 * 24 * 60 * 60 },
        },
      },
      {
        urlPattern: /\.(?:jpg|jpeg|gif|png|svg|ico|webp)$/i,
        handler: 'StaleWhileRevalidate',
        options: {
          cacheName: 'dolphin-static-image-v2',
          expiration: { maxEntries: 24, maxAgeSeconds: 3 * 24 * 60 * 60 },
        },
      },
      {
        urlPattern: /\/_next\/static.+\.js$/i,
        handler: 'CacheFirst',
        options: {
          cacheName: 'dolphin-next-static-js-v2',
          expiration: { maxEntries: 64, maxAgeSeconds: 7 * 24 * 60 * 60 },
        },
      },
      {
        urlPattern: /\.(?:js)$/i,
        handler: 'StaleWhileRevalidate',
        options: {
          cacheName: 'dolphin-static-js-v2',
          expiration: { maxEntries: 48, maxAgeSeconds: 7 * 24 * 60 * 60 },
        },
      },
      {
        urlPattern: /\.(?:css|less)$/i,
        handler: 'StaleWhileRevalidate',
        options: {
          cacheName: 'dolphin-static-style-v2',
          expiration: { maxEntries: 32, maxAgeSeconds: 7 * 24 * 60 * 60 },
        },
      },
      {
        urlPattern: /\.(?:eot|otf|ttc|ttf|woff|woff2|font.css)$/i,
        handler: 'StaleWhileRevalidate',
        options: {
          cacheName: 'dolphin-static-font-v2',
          expiration: { maxEntries: 4, maxAgeSeconds: 7 * 24 * 60 * 60 },
        },
      },
      // Halaman dinamis, RSC, prefetch, dan API tidak boleh disimpan offline.
      {
        urlPattern: ({ request, url, sameOrigin }) =>
          sameOrigin &&
          request.headers.get('RSC') === '1' &&
          request.headers.get('Next-Router-Prefetch') === '1' &&
          !url.pathname.startsWith('/api/'),
        handler: 'NetworkOnly',
      },
      {
        urlPattern: ({ request, url, sameOrigin }) =>
          sameOrigin &&
          request.headers.get('RSC') === '1' &&
          !url.pathname.startsWith('/api/'),
        handler: 'NetworkOnly',
      },
      {
        urlPattern: ({ url, sameOrigin }) =>
          sameOrigin && !url.pathname.startsWith('/api/'),
        handler: 'NetworkOnly',
      },
      {
        urlPattern: ({ url, sameOrigin }) =>
          sameOrigin && url.pathname.startsWith('/api/'),
        handler: 'NetworkOnly',
        method: 'GET',
      },
      {
        urlPattern: ({ sameOrigin }) => !sameOrigin,
        handler: 'NetworkOnly',
      },
    ],
  },
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // TETAP AKTIFAKAN OUTPUT STANDALONE UNTUK DEPLOY DI PLESK CAMPUS
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

export default withPWA(nextConfig);
