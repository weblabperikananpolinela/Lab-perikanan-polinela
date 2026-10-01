import { SITE_ORIGIN, SITE_NAME } from '@/lib/site-seo';

/**
 * JSON-LD Organization + WebSite untuk DOLPHIN / Lab Perikanan Polinela.
 *
 * Server component murni (tanpa state) supaya ikut ter-render di HTML awal —
 * crawler yang tidak menjalankan JavaScript tetap melihat entitas ini.
 * Tidak ada SearchAction: situs tidak punya pencarian publik.
 */
export function JsonLd() {
  const orgId = `${SITE_ORIGIN}/#org`;
  const siteId = `${SITE_ORIGIN}/#website`;

  const data = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': orgId,
        name: 'Lab Perikanan Polinela',
        alternateName: [
          'DOLPHIN',
          'Laboratorium Jurusan Perikanan dan Kelautan Polinela',
        ],
        url: `${SITE_ORIGIN}/`,
        logo: `${SITE_ORIGIN}/logo_dolphin.webp`,
        parentOrganization: {
          '@type': 'CollegeOrUniversity',
          name: 'Politeknik Negeri Lampung',
          url: 'https://polinela.ac.id',
        },
        address: {
          '@type': 'PostalAddress',
          streetAddress: 'Jl. Soekarno Hatta No. 10, Rajabasa',
          addressLocality: 'Bandar Lampung',
          addressRegion: 'Lampung',
          postalCode: '35144',
          addressCountry: 'ID',
        },
        email: 'jurusanperikanandankelautan@polinela.ac.id',
        sameAs: ['https://polinela.ac.id', 'https://jpk.polinela.ac.id'],
      },
      {
        '@type': 'WebSite',
        '@id': siteId,
        url: `${SITE_ORIGIN}/`,
        name: SITE_NAME,
        inLanguage: 'id-ID',
        publisher: { '@id': orgId },
      },
    ],
  };

  return (
    <script
      type='application/ld+json'
      // Data dibangun dari konstanta lokal (bukan input pengguna).
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
