import Link from "next/link";
import { ArrowLeft, FileX2 } from "lucide-react";

export default function SopNotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="mx-auto max-w-md text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
          <FileX2 className="h-10 w-10 text-destructive" />
        </div>
        <h1 className="mb-2 text-4xl font-bold text-foreground">404</h1>
        <h2 className="mb-4 text-lg font-semibold text-foreground">
          Dokumen SOP Tidak Ditemukan
        </h2>
        <p className="mb-8 text-muted-foreground">
          Maaf, dokumen SOP yang Anda cari tidak tersedia. Silakan kembali ke
          beranda untuk melihat daftar SOP yang tersedia.
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
