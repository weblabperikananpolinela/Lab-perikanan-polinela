'use client';

import { useCallback, useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import { Plus, Pencil, Trash2, Users } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface AdminRow {
  id: number;
  email: string;
  nama_dosen: string | null;
  role: string | null;
  lab_id: number | null;
}

interface LabRow {
  id: number;
  nama_lab: string;
  jenis: string | null;
}

const emptyAdminForm = {
  id: null as number | null,
  originalEmail: '',
  email: '',
  nama_dosen: '',
  labIds: [] as number[],
};

export default function KelolaUserTab({ supabase }: { supabase: any }) {
  const [admins, setAdmins] = useState<AdminRow[]>([]);
  const [labs, setLabs] = useState<LabRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [adminForm, setAdminForm] = useState(emptyAdminForm);
  const [isAdminDialogOpen, setIsAdminDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Aggregasi per email: 1 email ↔ multi lab (baris rangkap per lab_id).
  const adminsGrouped = useCallback((): {
    email: string;
    nama_dosen: string | null;
    rows: AdminRow[];
  }[] => {
    const map = new Map<
      string,
      { email: string; nama_dosen: string | null; rows: AdminRow[] }
    >();
    for (const row of admins) {
      const g = map.get(row.email);
      if (g) g.rows.push(row);
      else
        map.set(row.email, {
          email: row.email,
          nama_dosen: row.nama_dosen,
          rows: [row],
        });
    }
    return [...map.values()].sort((a, b) => a.email.localeCompare(b.email));
  }, [admins]);

  const labName = (labId: number | null) =>
    labs.find((l) => l.id === labId)?.nama_lab || (labId ? `Lab ${labId}` : '-');

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [adminRes, labRes] = await Promise.all([
      supabase
        .from('whitelist_admin')
        .select('id, email, nama_dosen, role, lab_id')
        .order('email', { ascending: true }),
      supabase.from('laboratorium').select('id, nama_lab, jenis').order('id'),
    ]);
    setAdmins(
      ((adminRes.data || []) as AdminRow[]).filter(
        (a) => a.role !== 'system_admin',
      ),
    );
    setLabs((labRes.data || []) as LabRow[]);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const openAddAdmin = () => {
    setAdminForm(emptyAdminForm);
    setIsAdminDialogOpen(true);
  };

  const openEditAdmin = (g: {
    email: string;
    nama_dosen: string | null;
    rows: AdminRow[];
  }) => {
    setAdminForm({
      id: g.rows[0].id,
      originalEmail: g.email,
      email: g.email,
      nama_dosen: g.nama_dosen || '',
      labIds: g.rows.map((r) => r.lab_id).filter((x) => x !== null) as number[],
    });
    setIsAdminDialogOpen(true);
  };

  const toggleLab = (labId: number) => {
    setAdminForm((p) => {
      const has = p.labIds.includes(labId);
      return {
        ...p,
        labIds: has ? p.labIds.filter((x) => x !== labId) : [...p.labIds, labId],
      };
    });
  };

  const submitAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminForm.email.trim()) {
      Swal.fire('Oops', 'Email wajib diisi.', 'warning');
      return;
    }
    if (adminForm.labIds.length === 0) {
      Swal.fire('Oops', 'Pilih minimal 1 lab.', 'warning');
      return;
    }
    setIsSaving(true);
    const email = adminForm.email.trim().toLowerCase();
    const originalEmail = adminForm.originalEmail.trim().toLowerCase() || email;
    const nama = adminForm.nama_dosen.trim() || null;

    let error: any = null;

    if (adminForm.id) {
      // Update: hanya hapus role='admin' (lindungi system_admin)
      const { error: delErr } = await supabase
        .from('whitelist_admin')
        .delete()
        .eq('email', originalEmail)
        .eq('role', 'admin');
      if (delErr) error = delErr;
      if (!error) {
        const rows = adminForm.labIds.map((labId) => ({
          email,
          nama_dosen: nama,
          role: 'admin',
          lab_id: labId,
        }));
        const { error: insErr } = await supabase
          .from('whitelist_admin')
          .insert(rows);
        error = insErr;
      }
    } else {
      const rows = adminForm.labIds.map((labId) => ({
        email,
        nama_dosen: nama,
        role: 'admin',
        lab_id: labId,
      }));
      const { error: insErr } = await supabase
        .from('whitelist_admin')
        .insert(rows);
      error = insErr;
    }

    setIsSaving(false);

    if (error) {
      Swal.fire('Gagal', error.message, 'error');
      return;
    }
    setIsAdminDialogOpen(false);
    Swal.fire({
      icon: 'success',
      title: adminForm.id ? 'Admin diperbarui' : 'Admin ditambahkan',
      text: `${email} → ${adminForm.labIds.length} lab`,
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 3000,
    });
    fetchAll();
  };

  const deleteAdmin = async (g: { email: string; rows: AdminRow[] }) => {
    const result = await Swal.fire({
      title: 'Hapus admin ini?',
      text: `${g.email} (${g.rows.length} lab)`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'Ya, Hapus',
      cancelButtonText: 'Batal',
    });
    if (!result.isConfirmed) return;
    const { error } = await supabase
      .from('whitelist_admin')
      .delete()
      .eq('email', g.email)
      .eq('role', 'admin');
    if (error) {
      Swal.fire('Gagal', error.message, 'error');
      return;
    }
    fetchAll();
  };

  if (loading) {
    return (
      <Card className='shadow-sm'>
        <CardContent className='p-6'>
          <div className='h-5 w-40 bg-slate-100 rounded animate-pulse mb-4' />
          <div className='h-24 w-full bg-slate-100 rounded animate-pulse' />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Admin Lab */}
      <Card className='shadow-sm'>
        <CardHeader>
          <div className='flex flex-wrap items-center justify-between gap-3'>
            <div>
              <CardTitle className='flex items-center gap-2 text-lg text-slate-800'>
                <Users className='size-5 text-blue-600' /> Admin Lab
              </CardTitle>
              <CardDescription>
                1 email boleh pegang lab mana saja. 1 lab boleh pegang 2+ email.
              </CardDescription>
            </div>
            <Button
              onClick={openAddAdmin}
              className='bg-blue-600 hover:bg-blue-700 font-bold'>
              <Plus className='size-4 mr-2' /> Tambah Admin
            </Button>
          </div>
        </CardHeader>
        <CardContent className='p-0'>
          <div className='overflow-x-auto'>
            <Table>
              <TableHeader className='bg-slate-50'>
                <TableRow>
                  <TableHead className='px-5'>Email</TableHead>
                  <TableHead>Nama</TableHead>
                  <TableHead>Lab (multi)</TableHead>
                  <TableHead className='text-right px-5'>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {adminsGrouped().map((g) => (
                  <TableRow key={g.email}>
                    <TableCell className='px-5 font-medium text-slate-800'>
                      {g.email}
                    </TableCell>
                    <TableCell className='text-slate-600'>
                      {g.nama_dosen || '-'}
                    </TableCell>
                    <TableCell>
                      <div className='flex flex-wrap gap-1.5'>
                        {g.rows.map((r) => (
                          <Badge
                            key={r.id}
                            variant='outline'
                            className='bg-blue-50 text-blue-700 text-xs'>
                            {labName(r.lab_id)}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className='text-right px-5'>
                      <Button
                        variant='ghost'
                        size='icon'
                        onClick={() => openEditAdmin(g)}
                        aria-label='Edit admin'>
                        <Pencil className='size-4 text-slate-500' />
                      </Button>
                      <Button
                        variant='ghost'
                        size='icon'
                        onClick={() => deleteAdmin(g)}
                        aria-label='Hapus admin'>
                        <Trash2 className='size-4 text-red-500' />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {adminsGrouped().length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className='text-center py-8 text-slate-500'>
                      Belum ada admin lab.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Dialog Admin */}
      <Dialog open={isAdminDialogOpen} onOpenChange={setIsAdminDialogOpen}>
        <DialogContent className='sm:max-w-lg'>
          <DialogHeader>
            <DialogTitle>
              {adminForm.id ? 'Edit Admin' : 'Tambah Admin'}
            </DialogTitle>
            <DialogDescription>
              Seleksi lab dengan klik: lab yang dipilih tampil di-highlight.
              Klik ulang untuk lepaskan. Satu email boleh pegang banyak lab.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submitAdmin} className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='admin-email'>Email</Label>
              <Input
                id='admin-email'
                type='email'
                required
                value={adminForm.email}
                onChange={(e) =>
                  setAdminForm((p) => ({ ...p, email: e.target.value }))
                }
                placeholder='nama@polinela.ac.id'
                className='h-11'
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='admin-nama'>Nama</Label>
              <Input
                id='admin-nama'
                value={adminForm.nama_dosen}
                onChange={(e) =>
                  setAdminForm((p) => ({ ...p, nama_dosen: e.target.value }))
                }
                placeholder='Nama pengelola'
                className='h-11'
              />
            </div>

            <div className='space-y-2'>
              <Label>
                Lab (klik untuk memilih: {adminForm.labIds.length} dipilih)
              </Label>
              <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-64 overflow-y-auto'>
                {labs.map((lab) => {
                  const active = adminForm.labIds.includes(lab.id);
                  return (
                    <button
                      key={lab.id}
                      type='button'
                      onClick={() => toggleLab(lab.id)}
                      aria-pressed={active}
                      className={`${
                        active
                          ? 'bg-blue-600 text-white border-blue-600 ring-2 ring-blue-600'
                          : 'bg-white text-slate-700 border-slate-200 hover:border-blue-300 hover:bg-blue-50'
                      } text-left px-3 py-2.5 rounded-lg border transition-all text-sm font-medium focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none`}>
                      {active ? '✓ ' : ''}
                      {lab.nama_lab}
                    </button>
                  );
                })}
              </div>
            </div>

            <DialogFooter>
              <Button
                type='button'
                variant='outline'
                onClick={() => setIsAdminDialogOpen(false)}>
                Batal
              </Button>
              <Button
                type='submit'
                disabled={isSaving}
                className='bg-blue-600 hover:bg-blue-700 font-bold'>
                {isSaving ? 'Menyimpan...' : 'Simpan'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
