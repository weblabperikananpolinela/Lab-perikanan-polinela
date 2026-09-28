import { createPublicClient } from '@/lib/supabase/public';
import { Navbar } from '@/components/navbar';
import { HeroSection } from '@/components/hero-section';
import { OrganisasiSection } from '@/components/organisasi-section';
import { SopSection } from '@/components/sop-section';
import { DokumentasiSection } from '@/components/dokumentasi-section';
import { ProgramStudiSection } from '@/components/program-studi-section';
import { LokasiSection } from '@/components/lokasi-section';
import { Footer } from '@/components/footer';
import InstallPWA from '@/components/installPWA';
import { FALLBACK_HERO, parseHeroBanners } from '@/lib/site-media';

export const revalidate = 300;

async function getHeroBanners() {
  try {
    const supabase = createPublicClient();
    const { data } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'hero_banners')
      .maybeSingle();
    const banners = parseHeroBanners(data?.value);
    return banners.length > 0 ? banners : FALLBACK_HERO;
  } catch {
    return FALLBACK_HERO;
  }
}

export default async function HomePage() {
  const banners = await getHeroBanners();
  return (
    <main className='min-h-screen'>
      {/* <Navbar /> */}
      <InstallPWA />
      <HeroSection banners={banners} />
      <OrganisasiSection />
      <SopSection />
      <DokumentasiSection />
      <ProgramStudiSection />
      <LokasiSection />
      {/* <Footer /> */}
    </main>
  );
}
