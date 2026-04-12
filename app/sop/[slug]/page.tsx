"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Download, ChevronLeft, ChevronRight } from "lucide-react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

// Dictionary: slug -> { title, pdfPath }
const sopData: Record<string, { title: string; pdfPath: string }> = {
  "pemeliharaan-alat": {
    title: "SOP Pemeliharaan dan Perbaikan Alat-Alat Laboratorium Perikanan",
    pdfPath:
      "/SOP Pemeliharaan dan Perbaikan Alat-Alat Laboratorium Perikanan.pdf",
  },
  "peminjaman-bahan": {
    title: "SOP Peminjaman Alat dan Penggunaan Bahan untuk Penelitian",
    pdfPath:
      "/SOP Peminjaman Alat dan Penggunaan Bahan untuk Penelitian.pdf",
  },
  "penanganan-limbah": {
    title: "SOP Penanganan Limbah Laboratorium Perikanan",
    pdfPath: "/SOP Penanganan Limbah Laboratorium Perikanan .pdf",
  },
  "operasional-lab": {
    title: "Standar Operasional Prosedur Laboratorium",
    pdfPath: "/STANDAR OPERASIONAL PROSEDUR OK.pdf",
  },
};

export default function SopViewerPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const sop = sopData[slug];

  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [containerWidth, setContainerWidth] = useState<number>(800);

  useEffect(() => {
    function handleResize() {
      if (window.innerWidth < 768) {
        setContainerWidth(Math.floor(window.innerWidth * 0.9));
      } else {
        setContainerWidth(800);
      }
    }

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Slug tidak ditemukan
  if (!sop) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="text-center">
          <h1 className="mb-3 text-5xl font-bold text-foreground">404</h1>
          <p className="mb-6 text-lg text-muted-foreground">
            SOP tidak ditemukan.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    );
  }

  const pdfUrl = encodeURI(sop.pdfPath);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
          {/* Tombol Kembali */}
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Kembali ke Beranda</span>
            <span className="sm:hidden">Kembali</span>
          </Link>

          {/* Judul SOP — hidden di mobile agar tidak terlalu penuh */}
          <h1 className="mx-4 hidden truncate text-base font-semibold text-foreground md:block">
            {sop.title}
          </h1>

          {/* Tombol Unduh PDF */}
          <a
            href={pdfUrl}
            download
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Unduh PDF</span>
            <span className="sm:hidden">Unduh</span>
          </a>
        </div>

        {/* Judul SOP — tampil di mobile sebagai baris kedua */}
        <div className="border-t border-border px-4 py-2 md:hidden">
          <p className="truncate text-center text-sm font-semibold text-foreground">
            {sop.title}
          </p>
        </div>
      </header>

      {/* PDF Viewer */}
      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
        <div className="flex justify-center">
          <Document
            file={pdfUrl}
            onLoadSuccess={({ numPages }) => setNumPages(numPages)}
            loading={
              <div className="flex min-h-[60vh] items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                  <p className="text-sm text-muted-foreground">
                    Memuat dokumen PDF...
                  </p>
                </div>
              </div>
            }
            error={
              <div className="flex min-h-[60vh] items-center justify-center">
                <p className="text-sm font-medium text-destructive">
                  Gagal memuat dokumen PDF.
                </p>
              </div>
            }
          >
            <Page
              pageNumber={pageNumber}
              width={containerWidth}
              renderTextLayer={false}
              renderAnnotationLayer={false}
              className="rounded-md border border-border shadow-lg"
            />
          </Document>
        </div>

        {/* Navigasi Halaman */}
        {numPages > 0 && (
          <div className="mt-6 flex items-center justify-center gap-4">
            <button
              onClick={() => setPageNumber((prev) => Math.max(prev - 1, 1))}
              disabled={pageNumber === 1}
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border text-foreground transition-colors hover:bg-accent disabled:pointer-events-none disabled:opacity-40"
              aria-label="Halaman sebelumnya"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            <span className="min-w-[140px] text-center text-sm font-medium text-foreground">
              Halaman {pageNumber} dari {numPages}
            </span>

            <button
              onClick={() =>
                setPageNumber((prev) => Math.min(prev + 1, numPages))
              }
              disabled={pageNumber === numPages}
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border text-foreground transition-colors hover:bg-accent disabled:pointer-events-none disabled:opacity-40"
              aria-label="Halaman berikutnya"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
