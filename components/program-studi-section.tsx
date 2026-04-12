"use client"

import { Fish, Anchor, Ship, FlaskConical, Cpu, TrendingUp, ChevronLeft, ChevronRight } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { useState, useEffect, useCallback, useRef } from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

const programs = [
  {
    id: 1,
    title: "D3 Budidaya Perikanan",
    description:
      "Program ini adalah tempat bagi para praktisi yang ingin menguasai seni dan sains dalam memproduksi komoditas perikanan secara efisien.\n\n• Kompetensi Utama: Kamu akan belajar bagaimana mengelola ekosistem air yang kompleks, mulai dari kimia air hingga nutrisi pakan. Kamu akan mahir dalam teknik pembesaran berbagai komoditas unggul (udang, ikan air tawar, hingga laut) dengan standar industri.\n• Soft Skills: Membangun ketelitian tinggi dalam monitoring (attention to detail), ketahanan fisik di lapangan, serta kemampuan manajemen waktu yang sangat presisi sesuai siklus hidup biota.\n• Output:\n  - Lulusan siap mengisi posisi Supervisor Tambak, Manager Operasional Produksi, atau mandiri sebagai pengusaha budidaya sukses.\n  - Menjadi teknisi handal yang mampu mengubah keterbatasan lahan menjadi zona produksi protein yang melimpah bagi ketahanan pangan nasional.\n\n\"Dunia butuh lebih banyak 'koki ekosistem' yang mampu memberi makan ribuan orang dari satu pengelolaan kolam yang sempurna. Ayo!!! Jadi  juragan muda yang visioner\"",
    icon: Fish,
    image: "/gallery-3.jpg",
  },
  {
    id: 2,
    title: "S1. Tr Teknologi Pembenihan Ikan",
    description:
      "Segala sesuatu yang besar dimulai dari benih yang kecil namun kuat. Prodi ini berfokus pada fase paling krusial dalam siklus hidup perikanan.\n\n• Kompetensi Utama: Penguasaan teknologi reproduksi (induksi hormon), rekayasa genetika ikan, bioteknologi larva, hingga kultur pakan alami sebagai nutrisi utama benih.\n• Soft Skills: Mengasah pola pikir analitis yang tajam (analytical thinking), kesabaran luar biasa dalam proses riset, serta standar ketelitian laboratorium yang sangat ketat (zero-defect mindset).\n• Output:\n  - Menjadi Breeding Specialist, Manajer Unit Pembenihan (Hatchery) dan peneliti benih di lembaga riset ternama.\n  - Lahirnya inovator yang mampu menciptakan varietas ikan baru yang lebih kuat, lebih cepat tumbuh, dan tahan terhadap perubahan iklim ekstrem.\n\n\"Masa depan perikanan dimulai dari mikroskop kami. Jika kamu mencintai sains dan ingin merancang kehidupan yang lebih baik sejak dari fase larva, laboratorium pembenihan kami adalah rumahmu!\"",
    icon: FlaskConical,
    image: "/gallery-2.jpg",
  },
  {
    id: 3,
    title: "D3 Perikanan Tangkap",
    description:
      "Dibuat khusus untuk para pemberani yang ingin menaklukkan samudera luas dengan kecakapan profesional standar internasional.\n\n• Kompetensi Utama: Kamu akan dibekali keahlian navigasi elektronik (Radar, Sonar, GPS), hukum laut internasional, teknik pengoperasian berbagai alat tangkap selektif, hingga manajemen stabilitas kapal.\n• Soft Skills: Menempa jiwa kepemimpinan (leadership) di bawah tekanan, kemampuan komunikasi tim yang solid di tengah laut, serta keberanian dalam pengambilan keputusan cepat di situasi darurat.\n• Output:\n  - Menjadi Pengelola Pelabuhan dan ahli operasional alat tangkap yang bersertifikat global.\n  - Terciptanya lulusan yang tidak hanya jago navigasi, tetapi juga menjadi garda terdepan dalam menjaga kelestarian samudera dari praktik penangkapan yang merusak.\n\n\"Samudera memanggil para pemimpin! Jadilah nahkoda masa depan yang menaklukkan ombak dengan kecerdasan navigasi, bukan sekadar keberuntungan. Siap untuk berlayar lebih jauh?\"",
    icon: Anchor,
    image: "/gallery-4.jpg",
  },
  {
    id: 4,
    title: "S1. Tr Teknologi Akuakultur (The System Engineers)",
    description:
      "Ini adalah level selanjutnya dari budidaya, di mana biologi bertemu dengan teknik mesin dan manajemen sistem.\n\n• Kompetensi Utama: Merancang dan mengoperasikan sistem budidaya modern seperti RAS (Recirculating Aquaculture System) dan Bioflok, instalasi otomatisasi tambak, serta analisis dampak lingkungan (AMDAL).\n• Soft Skills: Kemampuan pemecahan masalah (problem solving) yang kreatif, kecakapan dalam manajerial proyek besar, serta visi keberlanjutan lingkungan yang kuat.\n• Output:\n  - Menjadi Manajer Akuakultur Industrial, Konsultan Lingkungan Perikanan, dan analis keberlanjutan di perusahaan multinasional.\n  - Menjadi pionir industri perikanan yang mampu menyeimbangkan profit bisnis yang tinggi dengan kelestarian alam melalui pendekatan High-Tech.\n\n\"Jangan cuma budidaya biasa, mari kita bangun industri yang canggih! Jadilah arsitek akuakultur modern yang mampu membuktikan bahwa industri dan alam bisa hidup berdampingan.\"",
    icon: Cpu,
    image: "/gallery-6.jpg",
  },
  {
    id: 5,
    title: "S1. Tr Teknologi Cerdas Penangkapan Ikan",
    description:
      "Program studi paling futuristik yang menggabungkan kearifan bahari dengan kekuatan teknologi digital 4.0.\n\n• Kompetensi Utama: Implementasi IoT (Internet of Things) untuk sensor bawah air, pengolahan data citra satelit untuk mendeteksi lokasi ikan, hingga penggunaan Artificial Intelligence (AI) dalam sistem perikanan.\n• Soft Skills: Kelincahan digital (digital agility), logika algoritma yang kuat, serta keberanian untuk terus berinovasi dan mendisrupsi cara-cara lama.\n• Output:\n  - Menjadi Smart Fishing Engineer, Analis Data Kelautan dan spesialis teknologi maritim di era digital.\n  - Melahirkan generasi nelayan modern yang bekerja dengan data, bukan cuma perasaan, demi meningkatkan efisiensi dan keakuratan hasil laut Indonesia.\n\n\"Bawa teknologi ke tengah laut! Ubah kodingmu menjadi jaring digital dan mari kita hack masa depan perikanan dunia dengan sensor dan data pintarmu. Let's make waves!\"",
    icon: Ship,
    image: "/gallery-1.jpg",
  },
  {
    id: 6,
    title: "S1. Tr Agribisnis Perikanan",
    description:
      "Di sini, ikan bukan sekadar hewan, melainkan komoditas global yang memiliki nilai ekonomi luar biasa jika dikelola dengan strategi bisnis yang tepat.\n\n• Kompetensi Utama: Kamu akan menguasai strategi pemasaran internasional, manajemen rantai pasok dingin (cold chain management), sertifikasi ekspor, hingga analisis keuangan bisnis.\n• Soft Skills: Kemampuan negosiasi yang tajam, komunikasi persuasif yang handal, mental pemenang (entrepreneurial mindset), serta kecerdasan finansial.\n• Output:\n  - Menjadi Manajer Ekspor-Impor, Analis Bisnis Perikanan, dan CEO Startup Perikanan yang siap mendunia.\n  - Munculnya para pengusaha muda yang mampu memutus rantai pemasaran yang tidak efisien dan membawa produk perikanan lokal Lampung menembus pasar elit internasional.\n\n\"Ikan adalah emas biru. Jika kamu memiliki jiwa bisnis dan ingin menguasai pasar dunia, mari bergabung dan jadilah arsitek ekonomi biru yang sukses. Join the hustle!\"",
    icon: TrendingUp,
    image: "/gallery-5.jpg",
  },
]

const AUTO_ROTATE_INTERVAL = 8000

export function ProgramStudiSection() {
  const [activeIndex, setActiveIndex] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const startTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
    }
    timerRef.current = setInterval(() => {
      setIsTransitioning(true)
      setTimeout(() => {
        setActiveIndex((prev) => (prev + 1) % programs.length)
        setIsTransitioning(false)
      }, 300)
    }, AUTO_ROTATE_INTERVAL)
  }, [])

  const handleSelectProgram = useCallback(
    (index: number) => {
      if (index === activeIndex) return
      setIsTransitioning(true)
      setTimeout(() => {
        setActiveIndex(index)
        setIsTransitioning(false)
      }, 300)
      startTimer()
    },
    [startTimer, activeIndex]
  )

  const handlePrev = useCallback(() => {
    const newIndex = activeIndex === 0 ? programs.length - 1 : activeIndex - 1
    handleSelectProgram(newIndex)
  }, [activeIndex, handleSelectProgram])

  const handleNext = useCallback(() => {
    const newIndex = (activeIndex + 1) % programs.length
    handleSelectProgram(newIndex)
  }, [activeIndex, handleSelectProgram])

  useEffect(() => {
    startTimer()
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [startTimer])

  const activeProgram = programs[activeIndex]
  const otherPrograms = programs.filter((_, i) => i !== activeIndex)
  const ActiveIcon = activeProgram.icon

  return (
    <section className="bg-secondary py-20 lg:py-28">
      <div className="mx-auto max-w-6xl px-4 lg:px-8">
        <h2 className="text-center text-3xl font-bold text-slate-800 sm:text-4xl">
          Program Studi Terkait
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-center text-slate-600">
          Program studi yang didukung oleh fasilitas laboratorium perikanan
        </p>

        {/* Mobile Swiper Layout */}
        <div className="relative mt-12 lg:hidden">
          <Button
            variant="outline"
            size="icon"
            onClick={handlePrev}
            className="absolute -left-2 top-1/2 z-10 size-10 -translate-y-1/2 rounded-full border-slate-300 bg-white/90 shadow-md backdrop-blur-sm hover:bg-white sm:-left-4"
          >
            <ChevronLeft className="size-5 text-slate-700" />
          </Button>

          <div className="overflow-hidden px-4">
            <Card
              className={cn(
                "overflow-hidden border-slate-200 shadow-lg transition-opacity duration-300",
                isTransitioning ? "opacity-0" : "opacity-100"
              )}
            >
              <div className="relative h-56 w-full sm:h-64">
                <Image
                  src={activeProgram.image}
                  alt={activeProgram.title}
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-blue-600">
                      <ActiveIcon className="size-5 text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-white sm:text-xl">
                      {activeProgram.title}
                    </h3>
                  </div>
                </div>
              </div>
              <CardContent className="p-4 sm:p-5">
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-600">
                  {activeProgram.description}
                </p>
              </CardContent>
            </Card>
          </div>

          <Button
            variant="outline"
            size="icon"
            onClick={handleNext}
            className="absolute -right-2 top-1/2 z-10 size-10 -translate-y-1/2 rounded-full border-slate-300 bg-white/90 shadow-md backdrop-blur-sm hover:bg-white sm:-right-4"
          >
            <ChevronRight className="size-5 text-slate-700" />
          </Button>

          {/* Dot indicators for mobile */}
          <div className="mt-4 flex justify-center gap-2">
            {programs.map((_, index) => (
              <button
                key={index}
                onClick={() => handleSelectProgram(index)}
                className={cn(
                  "size-2 rounded-full transition-all duration-300",
                  index === activeIndex
                    ? "w-6 bg-blue-600"
                    : "bg-slate-300 hover:bg-slate-400"
                )}
                aria-label={`Go to program ${index + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Desktop Grid Layout - 1 Large + 5 Small */}
        <div className="mt-12 hidden gap-6 lg:grid lg:grid-cols-12">
          {/* Large Active Card - Left Column */}
          <Card
            className={cn(
              "overflow-hidden border-slate-200 shadow-lg transition-opacity duration-300 lg:col-span-7",
              isTransitioning ? "opacity-0" : "opacity-100"
            )}
          >
            <div className="relative h-80 w-full">
              <Image
                src={activeProgram.image}
                alt={activeProgram.title}
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4">
                <div className="flex items-center gap-3">
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-blue-600">
                    <ActiveIcon className="size-6 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white">
                    {activeProgram.title}
                  </h3>
                </div>
              </div>
            </div>
            <CardContent className="p-6">
              <p className="whitespace-pre-wrap text-base leading-relaxed text-slate-600">
                {activeProgram.description}
              </p>
            </CardContent>
          </Card>

          {/* Right Column - 5 Small Cards */}
          <div className="flex flex-col gap-3 lg:col-span-5">
            {otherPrograms.map((program) => {
              const originalIndex = programs.findIndex((p) => p.id === program.id)
              const Icon = program.icon

              return (
                <Card
                  key={program.id}
                  onClick={() => handleSelectProgram(originalIndex)}
                  className="group cursor-pointer overflow-hidden border-slate-200 transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md"
                >
                  <div className="flex items-center gap-4 p-3">
                    <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-md">
                      <Image
                        src={program.image}
                        alt={program.title}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-center gap-2">
                        <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-blue-600/10">
                          <Icon className="size-4 text-blue-600" />
                        </div>
                        <h4 className="truncate text-sm font-semibold text-slate-800 transition-colors group-hover:text-blue-600">
                          {program.title}
                        </h4>
                      </div>
                      <p className="line-clamp-1 text-xs text-slate-500">
                        {program.description}
                      </p>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
