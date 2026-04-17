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
  Download,
} from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
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
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

export default function MateriDosenPage() {
  const [session, setSession] = useState<any>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  // States Khusus Dosen / Pengunjung
  const [pinInput, setPinInput] = useState('');
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [unlockedCategories, setUnlockedCategories] = useState<any[]>([]);

  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [qrModalFile, setQrModalFile] = useState<any>(null);
  const supabase = createClient();

  const downloadQR = () => {
    const canvas = document.getElementById('qr-code-canvas') as HTMLCanvasElement;
    if (!canvas) return;
    const pngUrl = canvas.toDataURL('image/png').replace('image/png', 'image/octet-stream');
    const downloadLink = document.createElement('a');
    downloadLink.href = pngUrl;
    downloadLink.download = `${qrModalFile?.title || 'materi'}-QR.png`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  useEffect(() => {
    const initData = async () => {
      setIsLoadingAuth(true);
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user?.email) {
        setIsLoadingAuth(false);
        return;
      }
      setSession(session);
      await fetchUnlockedCategories(session.user.email);
      setIsLoadingAuth(false);
    };
    initData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchUnlockedCategories = async (email: string) => {
    const { data, error } = await supabase
      .from('akses_dosen_materi')
      .select(
        `
        id,
        kategori_materi (
          id,
          nama_kategori,
          created_by,
          materi_dosen (*)
        )
      `,
      )
      .eq('dosen_email', email)
      .order('unlocked_at', { ascending: false });

    if (!error && data) {
      const formatted = data
        .map((d: any) => {
          const kat = Array.isArray(d.kategori_materi)
            ? d.kategori_materi[0]
            : d.kategori_materi;
          return {
            akses_id: d.id,
            ...kat,
          };
        })
        .filter((item) => item && item.id);

      setUnlockedCategories(formatted);
    }
  };

  const handleUnlockPIN = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pinInput.trim() || !session?.user?.email) return;

    if (pinInput.trim().length !== 6) {
      Swal.fire({
        text: 'PIN harus berjumlah 6 digit.',
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
      // 1. Cari kategori berdasarkan PIN
      const { data: categoryData, error: pinError } = await supabase
        .from('kategori_materi')
        .select('*')
        .eq('pin_akses', pinInput.trim())
        .single();

      if (pinError || !categoryData) {
        throw new Error('PIN Salah / Tidak Ditemukan.');
      }

      // 2. Insert Hak Akses
      const { error: insertError } = await supabase
        .from('akses_dosen_materi')
        .insert({
          dosen_email: session.user.email,
          kategori_id: categoryData.id,
        });

      if (insertError) {
        if (insertError.code === '23505') {
          throw new Error('Mata kuliah ini sudah pernah Anda buka sebelumnya.');
        } else {
          throw new Error('Terjadi kesalahan saat membuka akses.');
        }
      }

      // 3. (PENTING!) Await fetch agar UI dijamin punya data terbaru
      await fetchUnlockedCategories(session.user.email);

      Swal.fire({
        text: `Akses Mata Kuliah ${categoryData.nama_kategori} Terbuka!`,
        icon: 'success',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 4000,
        timerProgressBar: true,
      });

      setPinInput(''); // Reset Form
    } catch (error: any) {
      Swal.fire({
        text: error.message,
        icon: error.message.includes('sudah pernah') ? 'info' : 'error',
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

  if (isLoadingAuth) {
    return (
      <div className='min-h-screen pt-32 flex justify-center items-start'>
        <Loader2 className='size-8 text-blue-600 animate-spin' />
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-slate-50 pt-24 pb-20 px-4 md:px-8'>
      <div className='mx-auto max-w-6xl'>
        {/* Header Global */}
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
                Akses Materi Pribadi
              </h1>
              <p className='text-slate-500'>
                Gunakan PIN 6-Digit dari Pengajar/Kepala Lab untuk membuka file pembelajaran.
              </p>
            </div>
          </div>
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-12 gap-8'>
            <div className='lg:col-span-4'>
              <Card className='border-slate-200 shadow-xl shadow-slate-200/40 sticky top-28 bg-white'>
                <CardHeader className='border-b border-slate-100 bg-slate-50/50 pb-5'>
                  <CardTitle className='flex items-center gap-2 text-xl font-extrabold text-slate-800'>
                    <KeyRound className='size-5 text-blue-600' /> Klaim Akses
                    PIN
                  </CardTitle>
                  <CardDescription>
                    Masukkan 6 Digit PIN yang diberikan oleh Admin/Kepala Lab.
                  </CardDescription>
                </CardHeader>
                <CardContent className='pt-6'>
                  <form onSubmit={handleUnlockPIN} className='space-y-4'>
                    <div className='space-y-2'>
                      <Input
                        placeholder='Contoh: 123456'
                        value={pinInput}
                        onChange={(e) =>
                          setPinInput(
                            e.target.value.replace(/\D/g, '').substring(0, 6),
                          )
                        }
                        required
                        className='text-center text-2xl font-mono font-bold tracking-[0.5em] h-14 bg-slate-50 focus:bg-white'
                        maxLength={6}
                      />
                    </div>
                    <Button
                      type='submit'
                      disabled={isUnlocking || pinInput.length !== 6}
                      className='w-full bg-slate-900 hover:bg-slate-800 text-white font-bold h-12 shadow-md hover:shadow-lg transition-all'>
                      {isUnlocking ? (
                        <Loader2 className='mr-2 size-5 animate-spin' />
                      ) : (
                        'Buka Kunci Akses'
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            <div className='lg:col-span-8'>
              <Card className='border-slate-200 shadow-xl shadow-slate-200/40 bg-white min-h-[500px]'>
                <CardHeader className='border-b border-slate-100 bg-slate-50/50 rounded-t-xl'>
                  <CardTitle className='text-lg font-bold text-slate-800'>
                    Mata Kuliah Terbuka ({unlockedCategories.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className='p-6'>
                  {unlockedCategories.length === 0 ? (
                    <div className='text-center py-16 text-slate-500'>
                      <LockKeyhole className='size-12 mx-auto text-slate-200 mb-3' />
                      <p className='font-bold text-slate-700'>
                        Belum Ada Akses
                      </p>
                      <p className='text-sm mt-1 max-w-sm mx-auto'>
                        Klaim akses pertama Anda dengan memasukkan PIN di panel
                        sebelah kiri.
                      </p>
                    </div>
                  ) : (
                    <Accordion
                      type='single'
                      collapsible
                      className='w-full space-y-4'>
                      {unlockedCategories.map((cat) => (
                        <AccordionItem
                          value={cat.id?.toString() || cat.akses_id.toString()}
                          key={cat.akses_id}
                          className='border border-slate-200 rounded-xl px-4 bg-white data-[state=open]:border-blue-500 data-[state=open]:ring-1 data-[state=open]:ring-blue-500 transition-all'>
                          <AccordionTrigger className='hover:no-underline py-4'>
                            <div className='flex flex-col text-left'>
                              <span className='font-bold text-slate-800 text-lg'>
                                {cat.nama_kategori}
                              </span>
                              <span className='text-xs font-normal text-slate-500'>
                                Dibuat oleh: {cat.created_by?.split('@')[0]}
                              </span>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className='pt-2 pb-6 border-t border-slate-100 mt-2'>
                            {!cat.materi_dosen ||
                            cat.materi_dosen.length === 0 ? (
                              <p className='text-sm text-center text-slate-400 p-4 bg-slate-50 rounded-lg'>
                                Materi belum ditambahkan oleh Admin.
                              </p>
                            ) : (
                              <div className='grid gap-3 pt-2'>
                                {cat.materi_dosen.map((file: any) => (
                                  <div
                                    key={file.id}
                                    className='group flex items-center justify-between p-3 border border-slate-100 bg-slate-50 hover:bg-blue-50/50 hover:border-blue-100 rounded-lg transition-colors'>
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
                                    <div className='flex gap-2 flex-shrink-0'>
                                      <Button
                                        size='sm'
                                        variant='outline'
                                        className='h-8 w-8 p-0 text-slate-600 hover:text-blue-700 hover:bg-white'
                                        onClick={() => setQrModalFile(file)}
                                        title='Tampilkan QR Code'>
                                        <QrCode className='size-4' />
                                      </Button>
                                      <Button
                                        size='sm'
                                        variant='outline'
                                        className='h-8 w-8 md:w-auto p-0 md:px-3 text-slate-600 hover:text-blue-700 hover:bg-white'
                                        onClick={() =>
                                          copyToClipboard(
                                            file.file_url,
                                            file.id,
                                          )
                                        }>
                                        {copiedId === file.id ? (
                                          <CheckCircle2 className='size-4' />
                                        ) : (
                                          <LinkIcon className='size-4 md:mr-1.5' />
                                        )}
                                        <span className='hidden md:inline'>
                                          {copiedId === file.id
                                            ? 'Tersalin'
                                            : 'Salin'}
                                        </span>
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

        {/* --- MODAL QR CODE --- */}
        <Dialog open={!!qrModalFile} onOpenChange={(open) => !open && setQrModalFile(null)}>
          <DialogContent className='max-w-[100vw] w-[100vw] h-[100vh] sm:max-w-xl sm:h-auto p-0 bg-white/95 backdrop-blur-md border-0 sm:border sm:rounded-2xl overflow-y-auto sm:overflow-hidden hidden-scrollbar'>
            <div className='p-8 w-full h-full flex flex-col items-center justify-center min-h-[400px]'>
              <div className='text-center mb-8 mt-12 sm:mt-0'>
                <h3 className='text-2xl sm:text-3xl font-black text-slate-800 mb-2'>
                  Scan untuk Mengunduh
                </h3>
                <p className='text-slate-500 font-medium line-clamp-2 max-w-sm mx-auto'>
                  Arahkan kamera ke QR Code ini untuk membuka <strong className="text-slate-700">{qrModalFile?.title}</strong> di perangkat Anda.
                </p>
              </div>

              {qrModalFile && (
                <div className='p-6 bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 flex justify-center w-full max-w-[300px]'>
                  <QRCodeCanvas
                    id="qr-code-canvas"
                    value={qrModalFile.file_url}
                    size={300}
                    level={"H"}
                    includeMargin={true}
                    className="w-full h-auto object-contain aspect-square rounded-xl"
                  />
                </div>
              )}

              <div className='flex gap-4 mt-10 w-full max-w-sm'>
                <Button 
                   variant='outline' 
                   className='flex-1 h-14 rounded-2xl font-bold bg-white hover:bg-slate-50 text-slate-700'
                   onClick={() => setQrModalFile(null)}
                >
                  Tutup
                </Button>
                <Button 
                   className='flex-1 h-14 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold gap-2 shadow-lg shadow-slate-900/20'
                   onClick={downloadQR}
                >
                  <Download className='size-5' />
                  Unduh QR
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
