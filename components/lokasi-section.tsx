import Link from "next/link"
import { Clock, MapPin, Phone, Mail, MessageCircle, Printer } from "lucide-react"
import { Button } from "@/components/ui/button"

export function LokasiSection() {
  return (
    <section className="bg-white py-16 md:py-24 ">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <h2 className="mb-4 text-3xl font-bold text-slate-800 md:text-4xl text-balance">
            Lokasi & Jam Operasional
          </h2>
          <p className="text-lg text-muted-foreground text-pretty">
            Kunjungi laboratorium kami atau hubungi untuk informasi lebih lanjut
          </p>
        </div>

        {/* Content Grid */}
        <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-2 md:gap-12">
          {/* Left Column - Info */}
          <div className="flex flex-col gap-6">
            {/* Operating Hours */}
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-6">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-lg bg-blue-600/10">
                  <Clock className="size-5 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-800">
                  Jam Operasional
                </h3>
              </div>
              <div className="flex flex-col gap-3 text-slate-600">
                <div className="flex items-center justify-between">
                  <span>Senin - Jumat</span>
                  <span className="font-medium text-slate-800">08:00 - 16:00 WIB</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Sabtu</span>
                  <span className="font-medium text-slate-800">08:00 - 12:00 WIB</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Minggu & Hari Libur</span>
                  <span className="font-medium text-red-600">Tutup</span>
                </div>
              </div>
            </div>

            {/* Address */}
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-6">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-lg bg-blue-600/10">
                  <MapPin className="size-5 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-800">
                  Alamat
                </h3>
              </div>
              <p className="leading-relaxed text-slate-600">
                Laboratorium Perikanan<br />
                Politeknik Negeri Lampung<br />
                Jl. Soekarno Hatta No.10<br />
                Rajabasa, Bandar Lampung 35144
              </p>
            </div>

            {/* Contact Buttons */}
            <div className="flex flex-col gap-3">
              <Button
                variant="outline"
                className="h-auto w-full justify-start gap-3 border-slate-200 bg-slate-50 px-4 py-4 text-slate-800 hover:bg-slate-100 hover:text-blue-600"
                asChild
              >
                <Link href="tel:+620721703995">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-blue-600/10">
                    <Phone className="size-4 text-blue-600" />
                  </div>
                  <div className="min-w-0 text-left">
                    <p className="text-xs text-slate-500">Telepon</p>
                    <p className="font-medium text-sm sm:text-base whitespace-normal break-words">(0721) 703-995</p>
                  </div>
                </Link>
              </Button>

              <Button
                variant="outline"
                className="h-auto w-full justify-start gap-3 border-slate-200 bg-slate-50 px-4 py-4 text-slate-800 hover:bg-slate-100 hover:text-blue-600"
                asChild
              >
                <Link href="tel:+620721787309">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-blue-600/10">
                    <Printer className="size-4 text-blue-600" />
                  </div>
                  <div className="min-w-0 text-left">
                    <p className="text-xs text-slate-500">Fax</p>
                    <p className="font-medium text-sm sm:text-base whitespace-normal break-words">(0721) 787-309</p>
                  </div>
                </Link>
              </Button>

              <Button
                variant="outline"
                className="h-auto w-full justify-start gap-3 border-slate-200 bg-slate-50 px-4 py-4 text-slate-800 hover:bg-slate-100 hover:text-blue-600"
                asChild
              >
                <Link href="mailto:humas@polinela.ac.id">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-blue-600/10">
                    <Mail className="size-4 text-blue-600" />
                  </div>
                  <div className="min-w-0 text-left">
                    <p className="text-xs text-slate-500">E-mail Polinela</p>
                    <p className="font-medium text-sm sm:text-base whitespace-normal break-all sm:break-words">humas@polinela.ac.id</p>
                  </div>
                </Link>
              </Button>

              <Button
                variant="outline"
                className="h-auto w-full justify-start gap-3 border-slate-200 bg-slate-50 px-4 py-4 text-slate-800 hover:bg-slate-100 hover:text-blue-600"
                asChild
              >
                <Link href="mailto:jurusanperikanandankelautan@polinela.ac.id">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-blue-600/10">
                    <Mail className="size-4 text-blue-600" />
                  </div>
                  <div className="min-w-0 text-left flex-1 break-words">
                    <p className="text-xs text-slate-500">E-mail Jurusan Perikanan dan Kelautan</p>
                    <p className="font-medium text-[13px] sm:text-base whitespace-normal break-all sm:break-words">jurusanperikanandankelautan@polinela.ac.id</p>
                  </div>
                </Link>
              </Button>
            </div>
          </div>

          {/* Right Column - Map Placeholder */}
          <div className="flex items-stretch">
            <div className="relative flex w-full min-h-[320px] items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
              {/* Map Pattern Background */}
              <div className="absolute inset-0 opacity-30">
                <svg className="h-full w-full" viewBox="0 0 400 400">
                  <defs>
                    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#94a3b8" strokeWidth="0.5" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#grid)" />
                  {/* Stylized roads */}
                  <path d="M 0 200 Q 100 180 200 200 T 400 200" fill="none" stroke="#cbd5e1" strokeWidth="8" />
                  <path d="M 200 0 Q 180 100 200 200 T 200 400" fill="none" stroke="#cbd5e1" strokeWidth="8" />
                  <path d="M 50 50 Q 150 100 200 200" fill="none" stroke="#e2e8f0" strokeWidth="4" />
                  <path d="M 350 350 Q 250 300 200 200" fill="none" stroke="#e2e8f0" strokeWidth="4" />
                </svg>
              </div>

              {/* Center Pin */}
              <div className="relative z-10 flex flex-col items-center">
                <div className="mb-2 flex size-16 items-center justify-center rounded-full bg-blue-600 shadow-lg">
                  <MapPin className="size-8 text-white" />
                </div>
                <div className="rounded-lg bg-white px-4 py-2 shadow-md">
                  <p className="text-sm font-semibold text-slate-800">Lab Perikanan Polinela</p>
                </div>
              </div>

              {/* View on Maps Link */}
              <a
                href="https://maps.google.com/?q=Politeknik+Negeri+Lampung"
                target="_blank"
                rel="noopener noreferrer"
                className="absolute bottom-4 right-4 flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-blue-600 shadow-md transition-all hover:bg-blue-50 hover:shadow-lg"
              >
                <MapPin className="size-4" />
                Buka di Google Maps
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
