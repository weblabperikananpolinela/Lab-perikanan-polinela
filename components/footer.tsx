"use client"

import Link from "next/link"
import Image from "next/image"
import { 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  Printer, 
  ChevronRight, 
  Instagram, 
  Youtube, 
  Globe 
} from "lucide-react"

export function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800 relative overflow-hidden">
      {/* Efek Latar Belakang Dekoratif (Opsional, memberi kesan modern) */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-800"></div>
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl pointer-events-none"></div>

      <div className="mx-auto max-w-7xl px-4 pt-16 pb-8 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-4">
          
          {/* Kolom 1: Brand & About */}
          <div className="space-y-6">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="bg-white/10 p-2 rounded-xl backdrop-blur-sm group-hover:bg-white/20 transition-colors">
                <Image 
                  src="/logo_dolphin.png" 
                  alt="Logo Dolphin" 
                  width={48} 
                  height={48} 
                  className="object-contain" 
                  // drop-shadow-md brightness-0 invert 
                />
              </div>
              <div>
                <span className="block text-xl font-extrabold text-white tracking-wider">DOLPHIN</span>
                <span className="block text-[10px] text-blue-400 font-semibold tracking-widest uppercase">Jurusan Perikanan dan Kelautan</span>
              </div>
            </Link>
            <p className="text-sm leading-relaxed text-slate-400 text-justify">
              Digital Operational Laboratory for Harmonized Integrated Navigation. Pusat inovasi, pendidikan, dan penelitian terdepan di bidang perikanan Politeknik Negeri Lampung.
            </p>
            <div className="flex gap-4 pt-2">
              <a href="#" className="p-2.5 bg-slate-800 rounded-lg text-slate-400 hover:text-white hover:bg-pink-600 hover:shadow-lg hover:shadow-pink-600/20 transition-all duration-300">
                <Instagram size={18} />
              </a>
              <a href="#" className="p-2.5 bg-slate-800 rounded-lg text-slate-400 hover:text-white hover:bg-red-600 hover:shadow-lg hover:shadow-red-600/20 transition-all duration-300">
                <Youtube size={18} />
              </a>
              <a href="https://polinela.ac.id" target="_blank" rel="noopener noreferrer" className="p-2.5 bg-slate-800 rounded-lg text-slate-400 hover:text-white hover:bg-blue-600 hover:shadow-lg hover:shadow-blue-600/20 transition-all duration-300">
                <Globe size={18} />
              </a>
            </div>
          </div>

          {/* Kolom 2: Eksplorasi (Navigasi Utama) */}
          <div>
            <h4 className="text-base font-bold text-white mb-6 flex items-center gap-2">
              Eksplorasi
              <div className="h-1 w-8 bg-blue-500 rounded-full"></div>
            </h4>
            <ul className="space-y-3">
              {[
                { label: "Beranda Utama", href: "/" },
                { label: "Struktur Organisasi", href: "/organisasi" },
                { label: "Inventaris Peralatan", href: "/inventaris" },
                { label: "Jadwal Laboratorium", href: "/jadwal" },
              ].map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="group flex items-center text-sm font-medium text-slate-400 transition-all duration-300 hover:text-blue-400 hover:translate-x-1.5"
                  >
                    <ChevronRight className="size-4 opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all duration-300 text-blue-500 mr-1" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Kolom 3: Layanan & SOP */}
          <div>
            <h4 className="text-base font-bold text-white mb-6 flex items-center gap-2">
              Layanan & SOP
              <div className="h-1 w-8 bg-blue-500 rounded-full"></div>
            </h4>
            <ul className="space-y-3">
              {[
                { label: "Formulir Pengajuan", href: "/administrasi/pengajuan" },
                { label: "Cek Status & Riwayat", href: "/administrasi/status" },
                { label: "SOP Lab. Perikanan", href: "/dokumen/sop-perikanan" },
                { label: "SOP Lab. Tangkap", href: "/dokumen/sop-tangkap" },
              ].map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="group flex items-center text-sm font-medium text-slate-400 transition-all duration-300 hover:text-blue-400 hover:translate-x-1.5"
                  >
                    <ChevronRight className="size-4 opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all duration-300 text-blue-500 mr-1" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Kolom 4: Hubungi Kami (Kontak) */}
          <div>
            <h4 className="text-base font-bold text-white mb-6 flex items-center gap-2">
              Hubungi Kami
              <div className="h-1 w-8 bg-blue-500 rounded-full"></div>
            </h4>
            <ul className="space-y-4 text-sm text-slate-400 font-medium">
              <li className="flex items-start gap-3 group">
                <div className="p-2 bg-slate-800 rounded-lg group-hover:bg-blue-600 transition-colors shrink-0">
                  <MapPin className="size-4 text-blue-400 group-hover:text-white transition-colors" />
                </div>
                <span className="mt-1 leading-relaxed">
                  Jl. Soekarno Hatta No. 10, Rajabasa, Bandar Lampung 35141
                </span>
              </li>
              <li className="flex items-center gap-3 group">
                <div className="p-2 bg-slate-800 rounded-lg group-hover:bg-blue-600 transition-colors shrink-0">
                  <Phone className="size-4 text-blue-400 group-hover:text-white transition-colors" />
                </div>
                <span>(0721) 703-995 / 787-309</span>
              </li>
              <li className="flex items-start gap-3 group">
                <div className="p-2 bg-slate-800 rounded-lg group-hover:bg-blue-600 transition-colors shrink-0">
                  <Mail className="size-4 text-blue-400 group-hover:text-white transition-colors" />
                </div>
                <div className="flex flex-col gap-1 mt-0.5">
                  <a href="mailto:humas@polinela.ac.id" className="hover:text-blue-400 transition-colors">humas@polinela.ac.id</a>
                  <a href="mailto:jurusanperikanandankelautan@polinela.ac.id" className="hover:text-blue-400 transition-colors line-clamp-1" title="jurusanperikanandankelautan@polinela.ac.id">
                    jurusanperikanandankelautan@polinela...
                  </a>
                </div>
              </li>
              <li className="flex items-center gap-3 group">
                <div className="p-2 bg-slate-800 rounded-lg group-hover:bg-blue-600 transition-colors shrink-0">
                  <Clock className="size-4 text-blue-400 group-hover:text-white transition-colors" />
                </div>
                <span>Senin - Jumat, 08:00 - 16:00 WIB</span>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar (Hak Cipta) */}
        <div className="mt-16 pt-8 border-t border-slate-800/60 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-slate-500 font-medium">
            &copy; {new Date().getFullYear()} <span className="text-slate-300">Laboratorium Perikanan Polinela</span>. Hak Cipta Dilindungi.
          </p>
          {/* <div className="text-sm text-slate-500 font-medium flex items-center gap-1.5">
            Dikembangkan dengan 💙 oleh <span className="text-slate-300 hover:text-blue-400 cursor-pointer transition-colors">Afnan</span>
          </div> */}
        </div>
      </div>
    </footer>
  )
}