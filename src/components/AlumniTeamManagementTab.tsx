"use client";

import React, { useState, useRef, useMemo, useCallback } from 'react';
import {
  fetchAlumniTeam, createAlumniTeamMember, updateAlumniTeamMember, deleteAlumniTeamMember,
  fetchStudentCoordinators, createStudentCoordinator, updateStudentCoordinator, deleteStudentCoordinator,
  uploadImageToDrive, getDirectImageUrl,
  AlumniTeamMember, StudentCoordinatorItem, fetchWithAuth,
} from '@/services/apiService';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Plus, Pencil, Trash2, X, Save, Upload, Award, Users, AlertCircle, CheckCircle2, IdCard, Building2, BookOpen, ChevronDown
} from 'lucide-react';

// ─── Academic Info ────────────────────────────────────────────────────────────
interface AcademicRow { id: number; school: string; department: string; programme: string; }

const fetchAcademicInfo = async (): Promise<AcademicRow[]> => {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://alumni.sparvixainnovations.com/backend/api';
  const res = await fetchWithAuth(`${API_URL}/academic/index.php`);
  const data = await res.json();
  return data.success ? data.data : [];
};

// ─── Shared dropdown style ────────────────────────────────────────────────────
const selectCls = 'w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring appearance-none pr-8';

function SelectField({ id, label, value, onChange, options, placeholder, disabled }: {
  id: string; label: string; value: string;
  onChange: (v: string) => void; options: string[];
  placeholder?: string; disabled?: boolean;
}) {
  return (
    <div>
      <Label htmlFor={id} className="text-xs font-semibold text-gray-600 mb-1 block">{label}</Label>
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={e => onChange(e.target.value)}
          disabled={disabled}
          className={`${selectCls} ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          <option value="">{placeholder ?? `Select ${label}`}</option>
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
        <ChevronDown className="absolute right-2 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
      </div>
    </div>
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────
type SubTab = 'team' | 'coordinators';

interface Toast { type: 'success' | 'error'; message: string }

// ─── Avatar helper ────────────────────────────────────────────────────────────
function AvatarPreview({ url, name, size = 64 }: { url: string; name: string; size?: number }) {
  const [errored, setErrored] = useState(false);
  const resolved = getDirectImageUrl(url);
  const initials = name.split(' ').slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('');

  if (!resolved || errored) {
    return (
      <div
        style={{ width: size, height: size }}
        className="rounded-full flex items-center justify-center text-white font-bold text-lg bg-gradient-to-br from-red-500 to-rose-700 flex-shrink-0"
      >
        {initials || '?'}
      </div>
    );
  }
  return (
    <img
      src={resolved}
      alt={name}
      style={{ width: size, height: size }}
      className="rounded-full object-cover flex-shrink-0 ring-2 ring-white shadow"
      onError={() => setErrored(true)}
    />
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────
function EmptyState({ label, onAdd }: { label: string; onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
        <Users className="w-7 h-7 text-gray-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-700 mb-1">No {label} yet</h3>
      <p className="text-sm text-gray-400 mb-6">Add the first {label.toLowerCase()} to get started.</p>
      <Button onClick={onAdd} className="bg-gradient-to-r from-red-500 to-rose-600 text-white hover:from-red-600 hover:to-rose-700">
        <Plus className="w-4 h-4 mr-2" /> Add {label}
      </Button>
    </div>
  );
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function ToastMsg({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  React.useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-lg text-white text-sm font-medium transition-all ${toast.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'}`}>
      {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
      {toast.message}
      <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100"><X className="w-4 h-4" /></button>
    </div>
  );
}

// ─── Delete Confirm ───────────────────────────────────────────────────────────
function ConfirmDialog({ message, onConfirm, onCancel }: { message: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
            <Trash2 className="w-5 h-5 text-red-600" />
          </div>
          <h3 className="text-base font-semibold text-gray-900">Confirm Delete</h3>
        </div>
        <p className="text-sm text-gray-600 mb-6">{message}</p>
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onCancel}>Cancel</Button>
          <Button className="flex-1 bg-red-600 hover:bg-red-700 text-white" onClick={onConfirm}>Delete</Button>
        </div>
      </div>
    </div>
  );
}

// ─── Team Member Form ─────────────────────────────────────────────────────────
interface TeamFormProps {
  initial?: AlumniTeamMember;
  onSave: (data: AlumniTeamMember, photoFile?: File) => Promise<void>;
  onClose: () => void;
  saving: boolean;
}

function TeamMemberForm({ initial, onSave, onClose, saving }: TeamFormProps) {
  const emptyForm: AlumniTeamMember = { photoUrl: '', name: '', school: '', branch: '', designation: '', writeup: '', sortOrder: 0 };
  const [form, setForm] = useState<AlumniTeamMember>(initial ?? emptyForm);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>(initial?.photoUrl ? getDirectImageUrl(initial.photoUrl) : '');
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: academic = [] } = useQuery<AcademicRow[]>({
    queryKey: ['academicInfo'],
    queryFn: fetchAcademicInfo,
    staleTime: 1000 * 60 * 10,
  });

  const schools = useMemo(() => [...new Set(academic.map(r => r.school))].sort(), [academic]);
  const departments = useMemo(() =>
    form.school ? [...new Set(academic.filter(r => r.school === form.school).map(r => r.department))].sort() : [],
    [academic, form.school]
  );

  const handleSchoolChange = (school: string) => setForm(f => ({ ...f, school, branch: '' }));
  const handleBranchChange = (branch: string) => setForm(f => ({ ...f, branch }));

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    const url = URL.createObjectURL(file);
    setPhotoPreview(url);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { setError('Name is required.'); return; }
    setError('');
    await onSave(form, photoFile ?? undefined);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-white rounded-t-3xl px-6 pt-6 pb-3 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">{initial ? 'Edit' : 'Add'} Team Member</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors" aria-label="Close">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {/* Photo upload */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              {photoPreview ? (
                <img src={photoPreview} alt="Preview" className="w-24 h-24 rounded-full object-cover ring-4 ring-gray-100 shadow" />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center ring-4 ring-gray-100">
                  <Upload className="w-7 h-7 text-gray-400" />
                </div>
              )}
            </div>
            <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
              <Upload className="w-3.5 h-3.5 mr-1.5" />
              {photoPreview ? 'Change Photo' : 'Upload Photo'}
            </Button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
          </div>

          {/* Fields */}
          <div>
            <Label htmlFor="tm-name" className="text-xs font-semibold text-gray-600 mb-1 block">Name *</Label>
            <Input id="tm-name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Full name" required />
          </div>

          <SelectField
            id="tm-school" label="School"
            value={form.school}
            onChange={handleSchoolChange}
            options={schools}
            placeholder="Select School"
          />
          <SelectField
            id="tm-branch" label="Department / Branch"
            value={form.branch}
            onChange={handleBranchChange}
            options={departments}
            placeholder={form.school ? 'Select Department' : 'Select School first'}
            disabled={!form.school}
          />

          <div>
            <Label htmlFor="tm-designation" className="text-xs font-semibold text-gray-600 mb-1 block">Designation</Label>
            <Input id="tm-designation" value={form.designation} onChange={e => setForm(f => ({ ...f, designation: e.target.value }))} placeholder="e.g. President" />
          </div>
          <div>
            <Label htmlFor="tm-writeup" className="text-xs font-semibold text-gray-600 mb-1 block">Write-up / Description</Label>
            <Textarea
              id="tm-writeup"
              value={form.writeup}
              onChange={e => setForm(f => ({ ...f, writeup: e.target.value }))}
              placeholder="Brief profile or description…"
              rows={4}
              className="resize-none"
            />
          </div>
          <div>
            <Label htmlFor="tm-sort" className="text-xs font-semibold text-gray-600 mb-1 block">Sort Order</Label>
            <Input id="tm-sort" type="number" value={form.sortOrder ?? 0} onChange={e => setForm(f => ({ ...f, sortOrder: parseInt(e.target.value) || 0 }))} min={0} />
          </div>

          {error && <p className="text-xs text-red-600 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" />{error}</p>}

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose} disabled={saving}>Cancel</Button>
            <Button type="submit" disabled={saving} className="flex-1 bg-gradient-to-r from-red-500 to-rose-600 text-white hover:from-red-600 hover:to-rose-700">
              {saving ? <span className="flex items-center gap-2"><span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />Saving…</span> : <><Save className="w-3.5 h-3.5 mr-1.5" />Save</>}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Student Coordinator Form ─────────────────────────────────────────────────
interface CoordFormProps {
  initial?: StudentCoordinatorItem;
  onSave: (data: StudentCoordinatorItem, photoFile?: File) => Promise<void>;
  onClose: () => void;
  saving: boolean;
}

function CoordForm({ initial, onSave, onClose, saving }: CoordFormProps) {
  const emptyForm: StudentCoordinatorItem = { photoUrl: '', name: '', school: '', branch: '', registrationNo: '', sortOrder: 0 };
  const [form, setForm] = useState<StudentCoordinatorItem>(initial ?? emptyForm);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>(initial?.photoUrl ? getDirectImageUrl(initial.photoUrl) : '');
  const [error, setError] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Load academic info for dropdowns
  const { data: academic = [] } = useQuery<AcademicRow[]>({
    queryKey: ['academicInfo'],
    queryFn: fetchAcademicInfo,
    staleTime: 1000 * 60 * 10,
  });

  // Cascading: unique schools
  const schools = useMemo(() => [...new Set(academic.map(r => r.school))].sort(), [academic]);

  // Cascading: departments filtered by selected school
  const departments = useMemo(() =>
    form.school
      ? [...new Set(academic.filter(r => r.school === form.school).map(r => r.department))].sort()
      : [],
    [academic, form.school]
  );

  const handleSchoolChange = (school: string) =>
    setForm(f => ({ ...f, school, branch: '' }));

  const handleBranchChange = (branch: string) =>
    setForm(f => ({ ...f, branch }));

  // Auto-fill from student DB by registration number
  const handleRegLookup = async () => {
    if (!form.registrationNo.trim()) return;
    setLookupLoading(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://alumni.sparvixainnovations.com/backend/api';
      const res = await fetchWithAuth(`${API_URL}/students/index.php?showAll=true`);
      const data = await res.json();
      if (data.success && data.data) {
        const student = data.data.find((s: any) =>
          String(s.registration_no).toLowerCase() === form.registrationNo.trim().toLowerCase()
        );
        if (student) {
          setForm(f => ({
            ...f,
            name: student.name || f.name,
            school: student.school || f.school,
            branch: student.department || f.branch,
          }));
          if (student.photo_url) {
            const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'https://alumni.sparvixainnovations.com/backend/api').replace('/api', '');
            const resolved = student.photo_url.startsWith('/Uploads/')
              ? `${API_BASE}${student.photo_url}`
              : student.photo_url;
            setPhotoPreview(resolved);
            setForm(f => ({ ...f, photoUrl: student.photo_url }));
          }
          setError('');
        } else {
          setError('Student not found with that registration number.');
        }
      }
    } catch {
      setError('Failed to look up student.');
    } finally {
      setLookupLoading(false);
    }
  };

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { setError('Name is required.'); return; }
    setError('');
    await onSave(form, photoFile ?? undefined);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-white rounded-t-3xl px-6 pt-6 pb-3 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">{initial ? 'Edit' : 'Add'} Student Coordinator</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors" aria-label="Close">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">

          {/* ── Registration No. with auto-fill ── */}
          <div>
            <Label htmlFor="sc-regno" className="text-xs font-semibold text-gray-600 mb-1 block">
              Registration No.
              <span className="ml-1 text-gray-400 font-normal">(enter & click Fetch to auto-fill)</span>
            </Label>
            <div className="flex gap-2">
              <Input
                id="sc-regno"
                value={form.registrationNo}
                onChange={e => setForm(f => ({ ...f, registrationNo: e.target.value }))}
                placeholder="e.g. 202101BTECH01000"
                className="flex-1"
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleRegLookup(); } }}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleRegLookup}
                disabled={lookupLoading || !form.registrationNo.trim()}
                className="px-3 whitespace-nowrap text-blue-600 border-blue-200 hover:bg-blue-50"
              >
                {lookupLoading
                  ? <span className="flex items-center gap-1"><span className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />Fetching…</span>
                  : <span className="flex items-center gap-1"><IdCard className="w-3.5 h-3.5" />Fetch</span>
                }
              </Button>
            </div>
          </div>

          {/* ── Photo ── */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              {photoPreview ? (
                <img src={photoPreview} alt="Preview" className="w-24 h-24 rounded-full object-cover ring-4 ring-gray-100 shadow" />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center ring-4 ring-gray-100">
                  <Upload className="w-7 h-7 text-gray-400" />
                </div>
              )}
            </div>
            <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
              <Upload className="w-3.5 h-3.5 mr-1.5" />
              {photoPreview ? 'Change Photo' : 'Upload Photo'}
            </Button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
          </div>

          {/* ── Name ── */}
          <div>
            <Label htmlFor="sc-name" className="text-xs font-semibold text-gray-600 mb-1 block">Name *</Label>
            <Input id="sc-name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Full name" required />
          </div>

          {/* ── School dropdown ── */}
          <SelectField
            id="sc-school"
            label="School"
            value={form.school}
            onChange={handleSchoolChange}
            options={schools}
            placeholder="Select School"
          />

          {/* ── Department / Branch dropdown (cascades from School) ── */}
          <SelectField
            id="sc-branch"
            label="Department / Branch"
            value={form.branch}
            onChange={handleBranchChange}
            options={departments}
            placeholder={form.school ? 'Select Department' : 'Select School first'}
            disabled={!form.school}
          />

          {/* ── Sort order ── */}
          <div>
            <Label htmlFor="sc-sort" className="text-xs font-semibold text-gray-600 mb-1 block">Sort Order</Label>
            <Input id="sc-sort" type="number" value={form.sortOrder ?? 0} onChange={e => setForm(f => ({ ...f, sortOrder: parseInt(e.target.value) || 0 }))} min={0} />
          </div>

          {error && <p className="text-xs text-red-600 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" />{error}</p>}

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose} disabled={saving}>Cancel</Button>
            <Button type="submit" disabled={saving} className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700">
              {saving ? <span className="flex items-center gap-2"><span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />Saving…</span> : <><Save className="w-3.5 h-3.5 mr-1.5" />Save</>}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main Management Tab ──────────────────────────────────────────────────────
interface AlumniTeamManagementTabProps {
  userRole: 'admin' | 'alumni-manager';
}

const AlumniTeamManagementTab: React.FC<AlumniTeamManagementTabProps> = ({ userRole }) => {
  const qc = useQueryClient();
  const [subTab, setSubTab] = useState<SubTab>('team');
  const [toast, setToast] = useState<Toast | null>(null);
  const [saving, setSaving] = useState(false);

  // Team
  const [showTeamForm, setShowTeamForm] = useState(false);
  const [editingMember, setEditingMember] = useState<AlumniTeamMember | undefined>(undefined);
  const [deletingMember, setDeletingMember] = useState<AlumniTeamMember | null>(null);

  // Coordinators
  const [showCoordForm, setShowCoordForm] = useState(false);
  const [editingCoord, setEditingCoord] = useState<StudentCoordinatorItem | undefined>(undefined);
  const [deletingCoord, setDeletingCoord] = useState<StudentCoordinatorItem | null>(null);

  const notify = useCallback((type: 'success' | 'error', message: string) => setToast({ type, message }), []);

  const { data: teamMembers = [], isLoading: teamLoading } = useQuery({
    queryKey: ['alumniTeam'],
    queryFn: fetchAlumniTeam,
    staleTime: 1000 * 60 * 2,
  });

  const { data: coordinators = [], isLoading: coordLoading } = useQuery({
    queryKey: ['studentCoordinators'],
    queryFn: fetchStudentCoordinators,
    staleTime: 1000 * 60 * 2,
  });

  // ── Team CRUD ──────────────────────────────────────────────────────────────
  const handleSaveTeamMember = async (data: AlumniTeamMember, photoFile?: File) => {
    setSaving(true);
    try {
      let photoUrl = data.photoUrl;
      if (photoFile) {
        photoUrl = await uploadImageToDrive(photoFile, 'alumni_team');
      }
      const payload = { ...data, photoUrl };

      if (editingMember?.id) {
        const res = await updateAlumniTeamMember(editingMember.id, payload);
        if (res.success) { notify('success', 'Team member updated'); }
        else { notify('error', res.message); }
      } else {
        const res = await createAlumniTeamMember(payload);
        if (res.success) { notify('success', 'Team member added'); }
        else { notify('error', res.message); }
      }
      qc.invalidateQueries({ queryKey: ['alumniTeam'] });
      setShowTeamForm(false);
      setEditingMember(undefined);
    } catch {
      notify('error', 'Operation failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMember = async () => {
    if (!deletingMember?.id) return;
    setSaving(true);
    try {
      const res = await deleteAlumniTeamMember(deletingMember.id);
      if (res.success) { notify('success', 'Team member deleted'); qc.invalidateQueries({ queryKey: ['alumniTeam'] }); }
      else { notify('error', res.message); }
    } catch {
      notify('error', 'Delete failed');
    } finally {
      setSaving(false);
      setDeletingMember(null);
    }
  };

  // ── Coordinator CRUD ───────────────────────────────────────────────────────
  const handleSaveCoord = async (data: StudentCoordinatorItem, photoFile?: File) => {
    setSaving(true);
    try {
      let photoUrl = data.photoUrl;
      if (photoFile) {
        photoUrl = await uploadImageToDrive(photoFile, 'student_coordinator');
      }
      const payload = { ...data, photoUrl };

      if (editingCoord?.id) {
        const res = await updateStudentCoordinator(editingCoord.id, payload);
        if (res.success) { notify('success', 'Coordinator updated'); }
        else { notify('error', res.message); }
      } else {
        const res = await createStudentCoordinator(payload);
        if (res.success) { notify('success', 'Coordinator added'); }
        else { notify('error', res.message); }
      }
      qc.invalidateQueries({ queryKey: ['studentCoordinators'] });
      setShowCoordForm(false);
      setEditingCoord(undefined);
    } catch {
      notify('error', 'Operation failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCoord = async () => {
    if (!deletingCoord?.id) return;
    setSaving(true);
    try {
      const res = await deleteStudentCoordinator(deletingCoord.id);
      if (res.success) { notify('success', 'Coordinator deleted'); qc.invalidateQueries({ queryKey: ['studentCoordinators'] }); }
      else { notify('error', res.message); }
    } catch {
      notify('error', 'Delete failed');
    } finally {
      setSaving(false);
      setDeletingCoord(null);
    }
  };

  // ── Row renderers ──────────────────────────────────────────────────────────
  const renderTeamRow = (m: AlumniTeamMember) => (
    <tr key={m.id} className="border-b border-gray-100 hover:bg-red-50/30 transition-colors">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <AvatarPreview url={m.photoUrl} name={m.name} size={40} />
          <span className="font-medium text-gray-900 text-sm">{m.name}</span>
        </div>
      </td>
      <td className="px-4 py-3 text-sm text-gray-600">{m.designation || '—'}</td>
      <td className="px-4 py-3 text-sm text-gray-500 hidden sm:table-cell">
        <div className="flex items-center gap-1"><Building2 className="w-3.5 h-3.5" />{m.school || '—'}</div>
      </td>
      <td className="px-4 py-3 text-sm text-gray-500 hidden md:table-cell">
        <div className="flex items-center gap-1"><BookOpen className="w-3.5 h-3.5" />{m.branch || '—'}</div>
      </td>
      <td className="px-4 py-3 text-center text-sm text-gray-400 hidden lg:table-cell">{m.sortOrder ?? 0}</td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1 justify-end">
          <button
            onClick={() => { setEditingMember(m); setShowTeamForm(true); }}
            className="w-8 h-8 rounded-lg bg-blue-50 hover:bg-blue-100 flex items-center justify-center text-blue-600 transition-colors"
            title="Edit"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setDeletingMember(m)}
            className="w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center text-red-600 transition-colors"
            title="Delete"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </td>
    </tr>
  );

  const renderCoordRow = (c: StudentCoordinatorItem) => (
    <tr key={c.id} className="border-b border-gray-100 hover:bg-blue-50/30 transition-colors">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <AvatarPreview url={c.photoUrl} name={c.name} size={40} />
          <span className="font-medium text-gray-900 text-sm">{c.name}</span>
        </div>
      </td>
      <td className="px-4 py-3 text-sm text-gray-600">
        <div className="flex items-center gap-1"><IdCard className="w-3.5 h-3.5" />{c.registrationNo || '—'}</div>
      </td>
      <td className="px-4 py-3 text-sm text-gray-500 hidden sm:table-cell">
        <div className="flex items-center gap-1"><Building2 className="w-3.5 h-3.5" />{c.school || '—'}</div>
      </td>
      <td className="px-4 py-3 text-sm text-gray-500 hidden md:table-cell">
        <div className="flex items-center gap-1"><BookOpen className="w-3.5 h-3.5" />{c.branch || '—'}</div>
      </td>
      <td className="px-4 py-3 text-center text-sm text-gray-400 hidden lg:table-cell">{c.sortOrder ?? 0}</td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1 justify-end">
          <button
            onClick={() => { setEditingCoord(c); setShowCoordForm(true); }}
            className="w-8 h-8 rounded-lg bg-blue-50 hover:bg-blue-100 flex items-center justify-center text-blue-600 transition-colors"
            title="Edit"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setDeletingCoord(c)}
            className="w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center text-red-600 transition-colors"
            title="Delete"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </td>
    </tr>
  );

  const isLoading = subTab === 'team' ? teamLoading : coordLoading;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Alumni Team Management</h2>
          <p className="text-sm text-gray-500 mt-0.5">Add, edit, and remove team members and student coordinators.</p>
        </div>
        <Button
          onClick={() => {
            if (subTab === 'team') {
              setEditingMember(undefined);
              setShowTeamForm(true);
            } else {
              setEditingCoord(undefined);
              setShowCoordForm(true);
            }
          }}
          className="bg-gradient-to-r from-red-500 to-rose-600 text-white hover:from-red-600 hover:to-rose-700 shadow-md"
          id="add-alumni-team-btn"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add {subTab === 'team' ? 'Team Member' : 'Coordinator'}
        </Button>
      </div>

      {/* Sub-tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-0" aria-label="Sub-navigation">
          <button
            id="management-team-tab"
            onClick={() => setSubTab('team')}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-colors ${
              subTab === 'team'
                ? 'border-red-500 text-red-600'
                : 'border-transparent text-gray-500 hover:text-red-500'
            }`}
          >
            <Award className="w-4 h-4" />
            Team
            <span className={`text-xs rounded-full px-2 py-0.5 ${subTab === 'team' ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500'}`}>
              {teamMembers.length}
            </span>
          </button>
          <button
            id="management-coordinators-tab"
            onClick={() => setSubTab('coordinators')}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-colors ${
              subTab === 'coordinators'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-blue-500'
            }`}
          >
            <Users className="w-4 h-4" />
            Student Coordinators
            <span className={`text-xs rounded-full px-2 py-0.5 ${subTab === 'coordinators' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
              {coordinators.length}
            </span>
          </button>
        </nav>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-red-200 border-t-red-500 rounded-full animate-spin" />
        </div>
      ) : subTab === 'team' ? (
        teamMembers.length === 0 ? (
          <EmptyState label="Team Member" onAdd={() => { setEditingMember(undefined); setShowTeamForm(true); }} />
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Member</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Designation</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">School</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Branch</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center hidden lg:table-cell">Order</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>{teamMembers.map(renderTeamRow)}</tbody>
              </table>
            </div>
          </div>
        )
      ) : (
        coordinators.length === 0 ? (
          <EmptyState label="Student Coordinator" onAdd={() => { setEditingCoord(undefined); setShowCoordForm(true); }} />
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Coordinator</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Reg. No.</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">School</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Branch</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center hidden lg:table-cell">Order</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>{coordinators.map(renderCoordRow)}</tbody>
              </table>
            </div>
          </div>
        )
      )}

      {/* Modals */}
      {showTeamForm && (
        <TeamMemberForm
          initial={editingMember}
          onSave={handleSaveTeamMember}
          onClose={() => { setShowTeamForm(false); setEditingMember(undefined); }}
          saving={saving}
        />
      )}

      {showCoordForm && (
        <CoordForm
          initial={editingCoord}
          onSave={handleSaveCoord}
          onClose={() => { setShowCoordForm(false); setEditingCoord(undefined); }}
          saving={saving}
        />
      )}

      {deletingMember && (
        <ConfirmDialog
          message={`Are you sure you want to delete "${deletingMember.name}"? This cannot be undone.`}
          onConfirm={handleDeleteMember}
          onCancel={() => setDeletingMember(null)}
        />
      )}

      {deletingCoord && (
        <ConfirmDialog
          message={`Are you sure you want to delete "${deletingCoord.name}"? This cannot be undone.`}
          onConfirm={handleDeleteCoord}
          onCancel={() => setDeletingCoord(null)}
        />
      )}

      {toast && <ToastMsg toast={toast} onClose={() => setToast(null)} />}
    </div>
  );
};

export default AlumniTeamManagementTab;
