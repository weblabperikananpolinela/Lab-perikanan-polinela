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
  // JURUS JITU 2: Blacklist folder admin, api, dan auth agar BENAR-BENAR bersih dari cache
  publicExcludes: [
    '!noprecache/**/*',
    '!dokumen/**/*',
    '!admin/**/*',
    '!api/**/*',
    '!auth/**/*',
  ],
  workboxOptions: {
    disableDevLogs: true,
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
