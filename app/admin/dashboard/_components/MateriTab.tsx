'use client';

import { Upload } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

// 5. UNGGAH MATERI TAB
export default function MateriTab() {
  return (
    <Card className='border-slate-200 shadow-sm border-t-4 border-t-teal-500 max-w-3xl'>
      <CardHeader>
        <CardTitle className='text-xl flex items-center gap-2'>
          <Upload className='size-5 text-teal-600' />
          Unggah Materi &amp; SOP
        </CardTitle>
        <CardDescription className='text-base text-slate-600 mt-1'>
          Fitur ini sedang dalam mode Placeholder. Segera akan dihubungkan ke Supabase Storage.
        </CardDescription>
      </CardHeader>
      <CardContent>
         <form className='space-y-6 pt-4' onSubmit={(e) => e.preventDefault()}>
            <div className='space-y-2'>
              <Label htmlFor='mt_judul' className="text-base font-semibold">Judul Materi</Label>
              <Input
                id='mt_judul'
                placeholder='Masukkan judul dokumen...'
                className="text-base h-12"
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='mt_desc' className="text-base font-semibold">Deskripsi</Label>
              <Textarea
                id='mt_desc'
                placeholder='Tambahkan deskripsi singkat tentang dokumen ini...'
                className="text-base resize-none"
                rows={3}
              />
            </div>
            <div className="space-y-2">
               <Label htmlFor="file" className="text-base font-semibold">File Dokumen (PDF, DOCX)</Label>
               <div className="border border-slate-200 p-4 rounded-xl flex items-center bg-slate-50">
                  <Input 
                    id="file" 
                    type="file" 
                    className="bg-transparent border-0 cursor-pointer text-base file:text-teal-700 file:bg-teal-100 file:border-0 file:py-2 file:px-4 file:rounded-full file:font-semibold hover:file:bg-teal-200"
                  />
                </div>
            </div>
            <div className="pt-2">
              <Button
                type='button'
                className='w-full sm:w-auto font-bold bg-teal-600 hover:bg-teal-700 text-base py-6 px-10'>
                Unggah File (Placeholder)
              </Button>
            </div>
          </form>
      </CardContent>
    </Card>
  );
}
