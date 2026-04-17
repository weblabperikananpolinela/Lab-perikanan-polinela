'use client';

import { useState, useEffect } from 'react';
import { Landmark, User, CreditCard, Loader2, Save } from 'lucide-react';
import Swal from 'sweetalert2';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function SettingRekening({ adminProfile, supabase }: { adminProfile: any, supabase: any }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    nama_bank: '',
    nomor_rekening: '',
    atas_nama: ''
  });
  
  const [existingId, setExistingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchRekening = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('rekening_admin')
        .select('*')
        .eq('lab_id', adminProfile.lab_id)
        .maybeSingle();

      if (data && !error) {
        setExistingId(data.id);
        setFormData({
          nama_bank: data.nama_bank || '',
          nomor_rekening: data.nomor_rekening || '',
          atas_nama: data.atas_nama || ''
        });
      }
      setLoading(false);
    };

    fetchRekening();
  }, [adminProfile.lab_id, supabase]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      if (existingId) {
        const { error } = await supabase
          .from('rekening_admin')
          .update({
             nama_bank: formData.nama_bank,
             nomor_rekening: formData.nomor_rekening,
             atas_nama: formData.atas_nama
          })
          .eq('id', existingId);
          
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('rekening_admin')
          .insert({
             lab_id: adminProfile.lab_id,
             nama_bank: formData.nama_bank,
             nomor_rekening: formData.nomor_rekening,
             atas_nama: formData.atas_nama
          })
          .select()
          .maybeSingle();
          
        if (error) throw error;
        if (data) setExistingId(data.id);
      }
      
      Swal.fire({
        icon: 'success',
        title: 'Berhasil!',
        text: 'Pengaturan rekening berhasil disimpan.',
        confirmButtonColor: '#10b981'
      });
    } catch (error: any) {
      Swal.fire({
        icon: 'error',
        title: 'Gagal Menyimpan',
        text: error.message || 'Terjadi kesalahan saat menyimpan pengaturan.',
        confirmButtonColor: '#ef4444'
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
     return <div className="animate-pulse text-slate-500 font-medium">Memuat pengaturan rekening...</div>;
  }

  return (
    <Card className="border-slate-200 border-t-4 border-t-indigo-500 shadow-sm mt-6">
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2 text-indigo-900">
           <Landmark className="size-5" /> Pengaturan Rekening
        </CardTitle>
        <CardDescription className="text-base text-slate-600">
           Atur rekening bank untuk menerima pembayaran lab dari kategori pengguna Umum/Eksternal.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSave} className="space-y-5 max-w-2xl">
          <div className="space-y-2">
            <Label htmlFor="nama_bank" className="text-base font-semibold flex items-center gap-2 text-slate-700">
              Nama Bank <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Landmark className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-slate-400" />
              <Input
                id="nama_bank"
                required
                placeholder="Contoh: Bank Mandiri"
                className="pl-10 h-11 text-base bg-slate-50"
                value={formData.nama_bank}
                onChange={(e) => setFormData({ ...formData, nama_bank: e.target.value })}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="nomor_rekening" className="text-base font-semibold flex items-center gap-2 text-slate-700">
              Nomor Rekening <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-slate-400" />
              <Input
                id="nomor_rekening"
                required
                placeholder="Contoh: 1234567890"
                className="pl-10 h-11 text-base bg-slate-50"
                value={formData.nomor_rekening}
                onChange={(e) => setFormData({ ...formData, nomor_rekening: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="atas_nama" className="text-base font-semibold flex items-center gap-2 text-slate-700">
              Atas Nama (Pemilik Rekening) <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-slate-400" />
              <Input
                id="atas_nama"
                required
                placeholder="Contoh: Bendahara Lab / Instansi"
                className="pl-10 h-11 text-base bg-slate-50"
                value={formData.atas_nama}
                onChange={(e) => setFormData({ ...formData, atas_nama: e.target.value })}
              />
            </div>
          </div>

          <div className="pt-4">
            <Button
              type="submit"
              disabled={saving}
              className="bg-indigo-600 hover:bg-indigo-700 font-bold text-base py-6 shadow-md md:w-auto w-full px-8"
            >
              {saving ? (
                <span className="flex items-center">
                  <Loader2 className="size-5 mr-2 animate-spin" /> Menyimpan...
                </span>
              ) : (
                <span className="flex items-center">
                  <Save className="size-5 mr-2" /> Simpan Pengaturan Rekening
                </span>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
