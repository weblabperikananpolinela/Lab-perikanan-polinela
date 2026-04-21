import { Navbar } from '@/components/navbar';
import { HeroSection } from '@/components/hero-section';
import { OrganisasiSection } from '@/components/organisasi-section';
import { SopSection } from '@/components/sop-section';
import { DokumentasiSection } from '@/components/dokumentasi-section';
import { ProgramStudiSection } from '@/components/program-studi-section';
import { LokasiSection } from '@/components/lokasi-section';
import { Footer } from '@/components/footer';
import InstallPWA from '@/components/installPWA';

export default function HomePage() {
  return (
    <main className='min-h-screen'>
      {/* <Navbar /> */}
      <InstallPWA />
      <HeroSection />
      <OrganisasiSection />
      <SopSection />
      <DokumentasiSection />
      <ProgramStudiSection />
      <LokasiSection />
      {/* <Footer /> */}
    </main>
  );
}
