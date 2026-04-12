"use client"

import Image from "next/image"
import { useState } from "react"
import { cn } from "@/lib/utils"

const galleryImages = [
  {
    id: 1,
    src: "/gallery-1.jpg",
    alt: "Kegiatan praktikum budidaya ikan",
    span: "col-span-2 row-span-2",
  },
  {
    id: 2,
    src: "/gallery-2.jpg",
    alt: "Penelitian kualitas air",
    span: "col-span-1 row-span-1",
  },
  {
    id: 3,
    src: "/gallery-3.jpg",
    alt: "Pembenihan ikan",
    span: "col-span-1 row-span-1",
  },
  {
    id: 4,
    src: "/gallery-4.jpg",
    alt: "Kunjungan industri",
    span: "col-span-1 row-span-2",
  },
  {
    id: 5,
    src: "/gallery-5.jpg",
    alt: "Workshop perikanan",
    span: "col-span-1 row-span-1",
  },
  {
    id: 6,
    src: "/gallery-6.jpg",
    alt: "Panen hasil budidaya",
    span: "col-span-2 row-span-1",
  },
]

export function DokumentasiSection() {
  const [loadedImages, setLoadedImages] = useState<Record<number, boolean>>({})

  return (
    <section className="bg-slate-50 py-20 lg:py-28">
      <div className="mx-auto max-w-6xl px-4 lg:px-8">
        <h2 className="text-center text-3xl font-bold text-slate-800 sm:text-4xl">
          Dokumentasi Kegiatan
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-center text-slate-600">
          Berbagai kegiatan laboratorium, penelitian, dan praktikum yang telah
          dilaksanakan
        </p>

        <div className="mt-12 grid auto-rows-[180px] grid-cols-2 gap-4 sm:auto-rows-[200px] md:grid-cols-4">
          {galleryImages.map((image) => (
            <div
              key={image.id}
              className={cn(
                "group relative overflow-hidden rounded-xl bg-slate-200",
                image.span
              )}
            >
              <Image
                src={image.src}
                alt={image.alt}
                fill
                className={cn(
                  "object-cover transition-all duration-500 group-hover:scale-110",
                  loadedImages[image.id] ? "opacity-100" : "opacity-0"
                )}
                onLoad={() =>
                  setLoadedImages((prev) => ({ ...prev, [image.id]: true }))
                }
              />
              {/* Fallback/Loading state */}
              <div
                className={cn(
                  "absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-100 to-blue-200 transition-opacity duration-300",
                  loadedImages[image.id] ? "opacity-0" : "opacity-100"
                )}
              >
                <span className="text-sm text-blue-600">{image.alt}</span>
              </div>
              {/* Hover overlay - visual only, no text */}
              <div className="absolute inset-0 bg-slate-900/30 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
