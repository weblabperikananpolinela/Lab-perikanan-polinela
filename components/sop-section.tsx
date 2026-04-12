"use client"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ChevronDown, FileText, Anchor } from "lucide-react"

const sopItems = [
  { label: "SOP dan Prosedur Lab. Perikanan", href: "#sop-lab-perikanan" },
  { label: "SOP dan Prosedur Lab. Perikanan Tangkap", href: "#sop-lab-perikanan-tangkap" },
]

export function SopSection() {
  return (
    <section id="sop" className="bg-white py-12 md:py-16">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-5xl overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-8 shadow-lg md:px-12 md:py-10">
          <div className="flex flex-col items-center gap-6 text-center md:flex-row md:justify-between md:text-left">
            {/* Left Content */}
            <div className="flex max-w-2xl flex-col items-center gap-4 md:flex-row md:items-start">
              <div className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-white/20 md:size-16">
                <FileText className="size-7 text-white md:size-8" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white md:text-2xl text-balance">
                  Pelajari SOP Sebelum Menggunakan Fasilitas Laboratorium
                </h3>
                <p className="mt-2 text-sm text-blue-100 md:text-base text-pretty">
                  Pastikan Anda memahami prosedur operasional standar untuk keamanan dan efisiensi kegiatan di laboratorium
                </p>
              </div>
            </div>

            {/* Desktop: Dropdown Menu */}
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <Button
                  size="lg"
                  className="hidden shrink-0 gap-2 bg-white text-blue-600 hover:bg-blue-50 font-semibold transition-all md:flex"
                >
                  Lihat Dokumen SOP
                  <ChevronDown className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" sideOffset={16} className="w-[400px] p-4 flex flex-col gap-2">
                <DropdownMenuItem asChild className="p-3 cursor-pointer rounded-md transition-all focus:bg-slate-50 hover:bg-slate-50">
                  <a href="#sop-lab-perikanan" className="flex items-start gap-4">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                      <FileText className="size-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900">SOP Lab. Perikanan</h4>
                      <p className="text-sm text-slate-500 mt-1">Baca pedoman dan prosedur penggunaan fasilitas.</p>
                    </div>
                  </a>
                </DropdownMenuItem>   
                <DropdownMenuItem asChild className="p-3 cursor-pointer rounded-md transition-all focus:bg-slate-50 hover:bg-slate-50">
                  <a href="#sop-lab-perikanan-tangkap" className="flex items-start gap-4">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                      <Anchor className="size-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900">SOP Lab. Perikanan Tangkap</h4>
                      <p className="text-sm text-slate-500 mt-1">Baca pedoman dan tata tertib khusus perikanan tangkap.</p>
                    </div>
                  </a>
                </DropdownMenuItem>   
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Mobile: Stacked Buttons */}
          <div className="mt-6 flex flex-col gap-3 md:hidden">
            {sopItems.map((item) => (
              <Button
                key={item.label}
                variant="outline"
                size="lg"
                asChild
                className="w-full border-white bg-white text-blue-600 font-medium hover:bg-blue-50 hover:text-blue-700"
              >
                <a href={item.href}>{item.label}</a>
              </Button>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
