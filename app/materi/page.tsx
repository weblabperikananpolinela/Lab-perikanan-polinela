'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Swal from 'sweetalert2';
import { createClient } from '@/lib/supabase/client';
import {
  ArrowLeft,
  FileText,
  Link as LinkIcon,
  CheckCircle2,
  Loader2,
  ExternalLink,
  LockKeyhole,
  KeyRound,
  QrCode,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { QRCodeCanvas } from 'qrcode.react';

const STORAGE_KEY = 'dolphin_materi_unlocked';

type MateriFile = {
  id: number;
  title: string;
  file_url: string;
  file_type: string | null;
};

type Kategori = {
  id: number;
  nama_kategori: string;
  created_by: string | null;
  materi_dosen: MateriFile[];
};

function readStoredIds(): number[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((n: unknown) => Number.isInteger(n))
      : [];
  } catch {
    return [];
  }
}

function writeStoredIds(ids: number[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
}

function asKategori(raw: unknown): Kategori | null {
  if (!raw) return null;
  const value: unknown =
    typeof raw === 'string'
      ? (() => {
          try {
            return JSON.parse(raw);
          } catch {
            return null;
          }
        })()
      : raw;
  if (!value || typeof value !== 'object') return null;
  const o = value as { id?: unknown };
  return typeof o.id === 'number' ? (o as Kategori) : null;
}

export default function PublicMateriPage() {
  const [pinInput, setPinInput] = useState('');
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [unlocked, setUnlocked] = useState<Kategori[]>([]);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [qrFile, setQrFile] = useState<MateriFile | null>(null);
  const supabase = createClient();

  const loadUnlocked = async (ids: number[]) => {
    if (ids.length === 0) {
      setUnlocked([]);
      return;
    }
    // Load berurutan via RPC per ID (anon tidak boleh SELECT kategori
    // langsung — kolom pin_akses harus tersembunyi).
    const results: Kategori[] = [];
    for (const id of ids) {
      const stored = readStoredIds().find((s) => s === id);
      if (stored === undefined) continue;
      // PIN tidak disimpan; reload tidak mungkin tanpa PIN.
      // Ambil dari cache memori saja (unlocked state dipertahankan).
    }
    setUnlocked(results);
  };

  useEffect(() => {
    // localStorage hanya menyimpan ID; data dimuat ulang saat PIN dibuka.
    // Kategori tidak dimuat ulang otomatis: user membuka ulang dengan PIN.
    setUnlocked([]);
    setIsLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const handleUnlockPIN = async (e: React.FormEvent) => {
    e.preventDefault();
    const pin = pinInput.trim();
    if (pin.length !== 6) {
      Swal.fire({
        text: 'PIN harus 6 digit.',
        icon: 'warning',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
      });
      return;
    }
    setIsUnlocking(true);
    try {
      // PIN diverifikasi server-side via RPC (SECURITY DEFINER). Anon
      // tidak pernah melihat kolom pin_akses — hanya dapat JSON hasil.
      const { data, error } = await supabase.rpc('materi_public_by_pin', {
        pin_input: pin,
      });
      const category = asKategori(data);
      if (error || !category) {
        throw new Error('PIN salah atau tidak ditemukan.');
      }
      if (unlocked.some((c) => c.id === category.id)) {
        Swal.fire({
          text: `Mata kuliah "${category.nama_kategori}" sudah terbuka.`,
          icon: 'info',
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 3000,
        });
        setPinInput('');
        return;
      }
      const next = [category, ...unlocked];
      setUnlocked(next);
      writeStoredIds(next.map((c) => c.id));
      setPinInput('');
      Swal.fire({
        text: `Akses "${category.nama_kategori}" terbuka.`,
        icon: 'success',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3500,
      });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Gagal membuka akses.';
      Swal.fire({
        text: message,
        icon: 'error',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
      });
    } finally {
      setIsUnlocking(false);
    }
  };

  const copyToClipboard = (url: string, id: number) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (isLoading) {
    return (
      <div className='min-h-screen pt-32 flex justify-center items-start bg-slate-50'>
        <Loader2 className='size-8 text-blue-600 animate-spin' />
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-slate-50 pt-24 pb-20 px-4 md:px-8'>
      <div className='mx-auto max-w-6xl'>
        <div className='mb-8'>
          <Link
            href='/'
            className='inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-6 font-medium transition-colors'>
            <ArrowLeft size={18} /> Kembali ke Beranda
          </Link>
          <div className='flex items-center gap-4'>
            <div className='p-3 bg-blue-600 text-white rounded-xl shadow-md'>
              <LockKeyhole size={28} />
            </div>
            <div>
              <h1 className='text-2xl md:text-3xl font-extrabold text-slate-900'>
                Materi Kuliah
              </h1>
              <p className='text-slate-500'>
                Masukkan PIN 6 digit dari pengajar untuk membuka file
                pembelajaran. Tanpa login.
              </p>
            </div>
          </div>
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-12 gap-8'>
          <div className='lg:col-span-4'>
            <Card className='border-slate-200 shadow-xl shadow-slate-200/40 sticky top-28 bg-white'>
              <CardHeader className='border-b border-slate-100 bg-slate-50/50 pb-5'>
                <CardTitle className='flex items-center gap-2 text-xl font-extrabold text-slate-800'>
                  <KeyRound className='size-5 text-blue-600' /> Buka dengan PIN
                </CardTitle>
                <CardDescription>
                  PIN dibagikan pengajar atau kepala lab.
                </CardDescription>
              </CardHeader>
              <CardContent className='pt-6'>
                <form onSubmit={handleUnlockPIN} className='space-y-4'>
                  <Input
                    placeholder='123456'
                    value={pinInput}
                    onChange={(e) =>
                      setPinInput(
                        e.target.value.replace(/\D/g, '').substring(0, 6),
                      )
                    }
                    required
                    className='text-center text-2xl font-mono font-bold tracking-[0.5em] h-14 bg-slate-50 focus:bg-white'
                    maxLength={6}
                    inputMode='numeric'
                    aria-label='PIN akses materi 6 digit'
                  />
                  <Button
                    type='submit'
                    disabled={isUnlocking || pinInput.length !== 6}
                    className='w-full bg-slate-900 hover:bg-slate-800 text-white font-bold h-12'>
                    {isUnlocking ? (
                      <Loader2 className='mr-2 size-5 animate-spin' />
                    ) : (
                      'Buka Kunci'
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          <div className='lg:col-span-8'>
            <Card className='border-slate-200 shadow-xl shadow-slate-200/40 bg-white min-h-[420px]'>
              <CardHeader className='border-b border-slate-100 bg-slate-50/50 rounded-t-xl'>
                <CardTitle className='text-lg font-bold text-slate-800'>
                  Mata kuliah terbuka ({unlocked.length})
                </CardTitle>
              </CardHeader>
              <CardContent className='p-6'>
                {unlocked.length === 0 ? (
                  <div className='text-center py-16 text-slate-500'>
                    <LockKeyhole className='size-12 mx-auto text-slate-200 mb-3' />
                    <p className='font-bold text-slate-700'>Belum ada akses</p>
                    <p className='text-sm mt-1 max-w-sm mx-auto'>
                      Masukkan PIN di panel kiri untuk membuka materi.
                    </p>
                  </div>
                ) : (
                  <Accordion
                    type='single'
                    collapsible
                    className='w-full space-y-4'>
                    {unlocked.map((cat) => (
                      <AccordionItem
                        value={String(cat.id)}
                        key={cat.id}
                        className='border border-slate-200 rounded-xl px-4 bg-white data-[state=open]:border-blue-500 data-[state=open]:ring-1 data-[state=open]:ring-blue-500'>
                        <AccordionTrigger className='hover:no-underline py-4'>
                          <div className='flex flex-col text-left'>
                            <span className='font-bold text-slate-800 text-lg'>
                              {cat.nama_kategori}
                            </span>
                            {cat.created_by && (
                              <span className='text-xs font-normal text-slate-500'>
                                Dibuat oleh {cat.created_by}
                              </span>
                            )}
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className='pt-2 pb-6 border-t border-slate-100 mt-2'>
                          {!cat.materi_dosen || cat.materi_dosen.length === 0 ? (
                            <p className='text-sm text-center text-slate-400 p-4 bg-slate-50 rounded-lg'>
                              Materi belum ditambahkan.
                            </p>
                          ) : (
                            <div className='grid gap-3 pt-2'>
                              {cat.materi_dosen.map((file) => (
                                <div
                                  key={file.id}
                                  className='flex items-center justify-between p-3 border border-slate-100 bg-slate-50 hover:bg-blue-50/50 hover:border-blue-100 rounded-lg gap-3'>
                                  <div className='flex items-center gap-3 min-w-0'>
                                    <div className='p-2 bg-white rounded shadow-sm border border-slate-200'>
                                      <FileText className='size-4 text-blue-600' />
                                    </div>
                                    <div className='min-w-0'>
                                      <p className='font-semibold text-slate-800 truncate text-sm'>
                                        {file.title}
                                      </p>
                                      <p className='text-[10px] text-slate-500 font-bold'>
                                        {file.file_type}
                                      </p>
                                    </div>
                                  </div>
                                  <div className='flex gap-2 shrink-0'>
                                    <Button
                                      size='sm'
                                      variant='outline'
                                      className='h-8 w-8 p-0'
                                      onClick={() => setQrFile(file)}
                                      title='QR Code'>
                                      <QrCode className='size-4' />
                                    </Button>
                                    <Button
                                      size='sm'
                                      variant='outline'
                                      className='h-8 w-8 p-0'
                                      onClick={() =>
                                        copyToClipboard(file.file_url, file.id)
                                      }
                                      title='Salin tautan'>
                                      {copiedId === file.id ? (
                                        <CheckCircle2 className='size-4' />
                                      ) : (
                                        <LinkIcon className='size-4' />
                                      )}
                                    </Button>
                                    <Button
                                      size='sm'
                                      asChild
                                      className='h-8 px-3 bg-blue-100 text-blue-700 hover:bg-blue-200'>
                                      <a
                                        href={file.file_url}
                                        target='_blank'
                                        rel='noreferrer'>
                                        Buka{' '}
                                        <ExternalLink className='size-3 ml-1.5' />
                                      </a>
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {qrFile && (
        <div
          className='fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4'
          onClick={() => setQrFile(null)}
          role='presentation'>
          <Card
            className='w-full max-w-xs p-6'
            onClick={(e) => e.stopPropagation()}>
            <CardHeader className='p-0 pb-4'>
              <CardTitle className='text-base line-clamp-2'>
                {qrFile.title}
              </CardTitle>
            </CardHeader>
            <CardContent className='p-0 flex flex-col items-center gap-4'>
              <QRCodeCanvas
                id='qr-code-canvas'
                value={qrFile.file_url}
                size={200}
              />
              <Button
                className='w-full'
                onClick={() => {
                  const canvas = document.getElementById(
                    'qr-code-canvas',
                  ) as HTMLCanvasElement | null;
                  if (!canvas) return;
                  const url = canvas
                    .toDataURL('image/png')
                    .replace('image/png', 'image/octet-stream');
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `${qrFile.title || 'materi'}-QR.png`;
                  a.click();
                }}>
                Unduh QR
              </Button>
              <Button
                variant='ghost'
                className='w-full'
                onClick={() => setQrFile(null)}>
                Tutup
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
