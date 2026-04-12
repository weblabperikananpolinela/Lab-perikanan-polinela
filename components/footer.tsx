"use client"

import Link from "next/link"
import { MapPin, Phone, Mail, Clock, Printer } from "lucide-react"

const sopLinks = [
  { label: "Prosedur Operasional Lab", href: "#" },
  { label: "SOP Pemeliharaan Alat", href: "#" },
  { label: "SOP Peminjaman Alat", href: "#" },
  { label: "SOP Penanganan Limbah", href: "#" },
]

const quickLinks = [
  { label: "Jadwal Lab", href: "#jadwal" },
  { label: "Inventaris", href: "#inventaris" },
  { label: "Administrasi", href: "#administrasi" },
  { label: "Kontak", href: "#kontak" },
]

export function Footer() {
  return (
    <footer className="bg-slate-800 text-white">
      <div className="mx-auto max-w-6xl px-4 py-12 lg:px-8 lg:py-16">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* About */}
          <div className="sm:col-span-2 lg:col-span-1">
            <h3 className="text-lg font-bold">Lab Perikanan Polinela</h3>
            <p className="mt-4 text-sm leading-relaxed text-slate-300">
              Laboratorium Perikanan Politeknik Negeri Lampung - Pusat
              pendidikan dan penelitian di bidang perikanan dan akuakultur.
            </p>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
              Kontak
            </h4>
            <ul className="mt-4 space-y-3 text-sm text-slate-300">
              <li className="flex items-start gap-3">
                <MapPin className="mt-0.5 size-4 shrink-0 text-blue-400" />
                <span>
                  Jl. Soekarno Hatta No. 10, Rajabasa, Bandar Lampung, Lampung
                  35141
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="size-4 shrink-0 text-blue-400" />
                <span>(0721) 703-995</span>
              </li>
              <li className="flex items-center gap-3">
                <Printer className="size-4 shrink-0 text-blue-400" />
                <span>(0721) 787-309</span>
              </li>
              <li className="flex items-start gap-3">
                <Mail className="mt-0.5 size-4 shrink-0 text-blue-400" />
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-slate-400">E-mail Polinela</span>
                  <span className="break-all">humas@polinela.ac.id</span>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Mail className="mt-0.5 size-4 shrink-0 text-blue-400" />
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-slate-400">E-mail Jurusan</span>
                  <span className="break-all">jurusanperikanandankelautan@polinela.ac.id</span>
                </div>
              </li>
              <li className="flex items-center gap-3">
                <Clock className="size-4 shrink-0 text-blue-400" />
                <span>Senin - Jumat, 08:00 - 16:00 WIB</span>
              </li>
            </ul>
          </div>

          {/* SOP Links */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
              SOP & Prosedur
            </h4>
            <ul className="mt-4 space-y-2">
              {sopLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-slate-300 transition-colors hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
              Tautan Cepat
            </h4>
            <ul className="mt-4 space-y-2">
              {quickLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-slate-300 transition-colors hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 border-t border-slate-700 pt-8 text-center">
          <p className="text-sm text-slate-400">
            &copy; {new Date().getFullYear()} Laboratorium Perikanan Politeknik
            Negeri Lampung. Hak Cipta Dilindungi.
          </p>
        </div>
      </div>
    </footer>
  )
}
