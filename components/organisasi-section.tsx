import { Card, CardContent } from '@/components/ui/card';
import { Target, Rocket, CheckCircle2, Users } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export function OrganisasiSection() {
  return (
    <section className='bg-gradient-to-b from-white to-slate-50 py-20 lg:py-28 relative overflow-hidden'>
      {/* Background Ornaments */}
      <div className='absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none'>
        <div className='absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-blue-50/50 blur-3xl' />
        <div className='absolute top-[60%] -right-[10%] w-[40%] h-[40%] rounded-full bg-cyan-50/50 blur-3xl' />
      </div>

      <div className='mx-auto max-w-7xl px-4 lg:px-8 relative z-10'>
        {/* ==================== VISI & MISI SECTION ==================== */}
        <div className='text-center mb-12'>
          <h2 className='text-3xl font-extrabold text-slate-900 sm:text-4xl tracking-tight'>
            Visi & Misi
          </h2>
          <div className='mt-3 w-24 h-1.5 bg-blue-600 mx-auto rounded-full' />
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-12 gap-8'>
          {/* Card Visi (Makan 5 Kolom) */}
          <Card className='lg:col-span-5 border-0 shadow-xl shadow-blue-900/5 bg-white/80 backdrop-blur-sm hover:-translate-y-1 transition-transform duration-300'>
            <CardContent className='p-8 md:p-10 flex flex-col items-center text-center h-full justify-center'>
              <div className='size-16 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mb-6 shadow-inner'>
                <Target className='size-8' />
              </div>
              <h3 className='text-2xl font-bold text-slate-800 mb-4'>Visi</h3>
              <p className='text-slate-600 text-lg leading-relaxed italic font-medium'>
                "Visi merupakan arah strategis yang menjadi dasar dalam
                penyusunan rencana pengembangan Jurusan Perikanan dan Kelautan
                Politeknik Negeri Lampung (Polinela). Visi jurusan selaras degan
                visi institusi yaitu menjadi Perguruan Tinggi Vokasi unggul dan
                berdampak dalam Mendorong Transformasi Teknologi Terapan Modern
                Menuju Indonesia Emas 2045. Visi tidak hanya mencerminkan
                cita-cita jangka panjang, tetapi juga menjadi pedoman bagi
                seluruh sivitas akademika dalam mewujudkan institusi yang
                adaptif terhadap perubahan zaman, relevan dengan kebutuhan
                industri, serta berkontribusi nyata bagi pembangunan
                berkelanjutan. Dengan mempertimbangkan dinamika global,
                perkembangan ilmu pengetahuan dan teknologi, serta tuntutan
                dunia kerja, Jurusan Perikanan dan Kelautan menetapkan visi
                jangka panjang sebagai berikut: “Jurusan Vokasi Unggul dan
                Berdampak dalam Mendorong Transformasi Teknologi Terapan Modern
                di Bidang Perikanan dan Kelautan Menuju Indonesia Emas 2045."
              </p>
            </CardContent>
          </Card>

          {/* Card Misi (Makan 7 Kolom) */}
          <Card className='lg:col-span-7 border-0 shadow-xl shadow-blue-900/5 bg-white/80 backdrop-blur-sm hover:-translate-y-1 transition-transform duration-300'>
            <CardContent className='p-8 md:p-10 flex flex-col h-full'>
              <div className='flex items-center gap-4 mb-6 border-b border-slate-100 pb-4'>
                <div className='size-14 rounded-2xl bg-cyan-100 text-cyan-600 flex items-center justify-center shadow-inner shrink-0'>
                  <Rocket className='size-7' />
                </div>
                <h3 className='text-2xl font-bold text-slate-800'>Misi</h3>
              </div>
              <ul className='space-y-4 text-slate-600 text-base mt-2'>
                Misi merupakan penjabaran operasional dari visi yang telah
                ditetapkan, sekaligus menjadi arah tindakan nyata dalam
                penyelenggaraan pendidikan tinggi vokasi di Politeknik Negeri
                Lampung (Polinela). Jika visi menggambarkan cita-cita jangka
                panjang yang ingin dicapai pada tahun 2029, maka misi berfungsi
                sebagai pedoman praktis dalam mengarahkan kebijakan, program,
                dan aktivitas kelembagaan. Melalui misi inilah visi diwujudkan
                secara terukur dan sistematis, sehingga setiap langkah
                pengembangan Jurusan Perikanan dan Kelautan memiliki pijakan
                yang jelas, konsisten, dan berorientasi pada hasil. Untuk
                mewujudkan visi tersebut, Jurusan Perikanan dan Kelautan
                menetapkan lima misi utama, yaitu:
                <li className='flex items-start gap-3'>
                  <CheckCircle2 className='size-6 text-cyan-500 shrink-0 mt-0.5' />
                  <span className='leading-relaxed'>
                    Menyelenggarakan pendidikan vokasi di bidang perikanan dan
                    kelautan berbasis teknologi, teaching factory, dan smart
                    farming untuk menghasilkan lulusan yang berakhlak mulia,
                    profesional, adaptif, mandiri, serta mampu bersaing di
                    tingkat nasional maupun global.
                  </span>
                </li>
                <li className='flex items-start gap-3'>
                  <CheckCircle2 className='size-6 text-cyan-500 shrink-0 mt-0.5' />
                  <span className='leading-relaxed'>
                    Melaksanakan riset terapan, inovasi, dan pengabdian kepada
                    masyarakat di bidang perikanan dan kelautan yang relevan
                    dengan kebutuhan industri, mendukung ketahanan pangan, serta
                    berdampak pada pembangunan berkelanjutan.
                  </span>
                </li>
                <li className='flex items-start gap-3'>
                  <CheckCircle2 className='size-6 text-cyan-500 shrink-0 mt-0.5' />
                  <span className='leading-relaxed'>
                    Mewujudkan tata kelola jurusan perikanan dan kelautan yang
                    transparan, efisien, dan akuntabel melalui penguatan sistem
                    penjaminan mutu, digitalisasi layanan, serta budaya kerja
                    yang profesional dan kolaboratif.
                  </span>
                </li>
                <li className='flex items-start gap-3'>
                  <CheckCircle2 className='size-6 text-cyan-500 shrink-0 mt-0.5' />
                  <span className='leading-relaxed'>
                    Meningkatkan kapasitas dosen, tenaga kependidikan,
                    mahasiswa, serta infrastruktur laboratorium dan teaching
                    factory perikanan dan kelautan yang modern, inovatif, dan
                    adaptif terhadap perkembangan ilmu pengetahuan, teknologi,
                    serta dinamika global.
                  </span>
                </li>
                <li className='flex items-start gap-3'>
                  <CheckCircle2 className='size-6 text-cyan-500 shrink-0 mt-0.5' />
                  <span className='leading-relaxed'>
                    Membangun jejaring dan kolaborasi strategis dengan dunia
                    usaha, dunia industri, lembaga penelitian, dan mitra
                    nasional maupun internasional untuk memperkuat daya saing
                    dan kontribusi pendidikan vokasi perikanan dan kelautan.
                  </span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* ==================== CTA STRUKTUR ORGANISASI ==================== */}
        <div className='mt-16 flex flex-col items-center justify-center text-center animate-in fade-in slide-in-from-bottom-4 duration-700'>
          <p className='text-slate-500 mb-5 font-medium text-lg max-w-xl'>
            Ingin mengetahui lebih lanjut tentang Laboratorium Perikanan
            Polinela?
          </p>
          <Button
            asChild
            size='lg'
            className='bg-blue-600 hover:bg-blue-700 text-white rounded-full px-8 py-6 text-base font-bold shadow-lg shadow-blue-600/30 transition-all hover:scale-105'>
            <Link href='/organisasi'>
              <Users className='size-5 mr-2' />
              Lihat Struktur Organisasi
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
