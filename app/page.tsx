import { Navbar } from '@/components/navbar';
import { HeroSection } from '@/components/hero-section';
import { OrganisasiSection } from '@/components/organisasi-section';
import { SopSection } from '@/components/sop-section';
import { DokumentasiSection } from '@/components/dokumentasi-section';
import { ProgramStudiSection } from '@/components/program-studi-section';
import { LokasiSection } from '@/components/lokasi-section';
import { Footer } from '@/components/footer';

export default function HomePage() {
  return (
    <main className='min-h-screen'>
      <Navbar />
      <HeroSection />
      <OrganisasiSection />
      <SopSection />
      <DokumentasiSection />
      <ProgramStudiSection />
      <LokasiSection />
      <Footer />
    </main>
  );
}
