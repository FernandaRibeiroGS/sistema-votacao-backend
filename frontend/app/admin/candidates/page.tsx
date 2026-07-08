'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { AdminCandidate, Category, Contest } from '@/app/types/admin';
import { Button } from '@/app/components/ui/Button';
import adminApi from '@/app/lib/adminApi';
import toast, { Toaster } from 'react-hot-toast';
import { Pencil, Trash2, Plus, X } from 'lucide-react';

const inputClass = 'w-full bg-stone-800 border border-stone-700 rounded-xl px-4 py-2.5 text-white placeholder:text-stone-500 focus:outline-none focus:border-amber-500 transition-colors text-sm';
const labelClass = 'text-stone-300 text-xs font-medium mb-1 block';

interface FormState {
  nome: string;
  descricao: string;
  numero: string;
  category_id: string;
  foto: File | null;
}

const emptyForm: FormState = { nome: '', descricao: '', numero: '', category_id: '', foto: null };

export default function CandidatesPage() {
  const searchParams = useSearchParams();
  const contestId = searchParams.get('contestId');

  const [contests, setContests] = useState<Contest[]>([]);
  const [selectedContest, setSelectedContest] = useState<string>(contestId ?? '');
  const [categories, setCategories] = useState<Category[]>([]);
  const [candidates, setCandidates] = useState<AdminCandidate[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<AdminCandidate | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    adminApi.get<Contest[]>('/admin/contests').then(({ data }) => setContests(data));
  }, []);

  const fetchData = useCallback(async () => {
    if (!selectedContest) return;
    setLoading(true);
    try {
      const { data: cats } = await adminApi.get<Category[]>(`/admin/categories/contest/${selectedContest}`);
      setCategories(cats);
      const all = await Promise.all(cats.map((c) => adminApi.get<AdminCandidate[]>(`/admin/candidates/category/${c.id}`)));
      setCandidates(all.flatMap((r) => r.data));
    } catch {
      toast.error('Erro ao carregar dados.');
    } finally {
      setLoading(false);
    }
  }, [selectedContest]);

  useEffect(() => { fetchData(); }, [fetchData]);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setShowForm(true);
  }

  function openEdit(c: AdminCandidate) {
    setEditing(c);
    setForm({ nome: c.nome, descricao: c.descricao ?? '', numero: c.numero?.toString() ?? '', category_id: c.category_id.toString(), foto: null });
    setShowForm(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('nome', form.nome);
      fd.append('category_id', form.category_id);
      if (form.descricao) fd.append('descricao', form.descricao);
      if (form.numero) fd.append('numero', form.numero);
      if (form.foto) fd.append('foto', form.foto);

      if (editing) {
        await adminApi.put(`/admin/candidates/${editing.id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Candidata atualizada!');
      } else {
        await adminApi.post('/admin/candidates', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Candidata criada!');
      }
      setShowForm(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? 'Erro ao salvar.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Excluir esta candidata?')) return;
    try {
      await adminApi.delete(`/admin/candidates/${id}`);
      toast.success('Candidata excluída.');
      fetchData();
    } catch {
      toast.error('Erro ao excluir.');
    }
  }

  return (
    <div className="p-8">
      <Toaster position="top-right" toastOptions={{ style: { background: '#1c1917', color: '#fff', border: '1px solid #44403c' } }} />

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Candidatas</h1>
        {selectedContest && <Button onClick={openCreate}><Plus className="w-4 h-4" /> Nova candidata</Button>}
      </div>

      <div className="mb-6">
        <label className="text-stone-300 text-sm font-medium mb-1 block">Selecione o concurso</label>
        <select
          value={selectedContest}
          onChange={(e) => setSelectedContest(e.target.value)}
          className="bg-stone-800 border border-stone-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500 transition-colors"
        >
          <option value="">— Escolha um concurso —</option>
          {contests.map((c) => <option key={c.id} value={c.id}>{c.nome} ({c.ano})</option>)}
        </select>
      </div>

      {loading && <p className="text-stone-500 text-sm">Carregando...</p>}

      {categories.map((cat) => {
        const catCandidates = candidates.filter((c) => c.category_id === cat.id);
        return (
          <div key={cat.id} className="mb-6">
            <h2 className="text-amber-400 font-bold text-sm uppercase tracking-wider mb-3">
              {cat.tipo === 'infantil' ? '👧' : '👸'} {cat.nome}
            </h2>
            {catCandidates.length === 0 && (
              <p className="text-stone-600 text-sm mb-2">Nenhuma candidata nesta categoria.</p>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {catCandidates.map((c) => (
                <div key={c.id} className="bg-stone-900 border border-stone-800 rounded-xl overflow-hidden">
                  <div className="relative h-32 bg-stone-800">
                    {c.foto ? (
                      <img
                        src={c.foto.startsWith('http') ? c.foto : `${process.env.NEXT_PUBLIC_API_URL}${c.foto}`}
                        alt={c.nome}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-3xl">👑</div>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="text-white text-sm font-bold truncate">{c.nome}</p>
                    {c.numero && <p className="text-stone-500 text-xs">Nº {c.numero}</p>}
                    <div className="flex gap-1 mt-2">
                      <button onClick={() => openEdit(c)} className="flex-1 flex items-center justify-center gap-1 text-xs text-stone-400 hover:text-amber-400 bg-stone-800 rounded-lg py-1.5 transition-colors">
                        <Pencil className="w-3 h-3" /> Editar
                      </button>
                      <button onClick={() => handleDelete(c.id)} className="flex-1 flex items-center justify-center gap-1 text-xs text-stone-400 hover:text-red-400 bg-stone-800 rounded-lg py-1.5 transition-colors">
                        <Trash2 className="w-3 h-3" /> Excluir
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {showForm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-stone-900 border border-stone-800 rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-white font-bold">{editing ? 'Editar candidata' : 'Nova candidata'}</h2>
              <button onClick={() => setShowForm(false)} className="text-stone-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="flex flex-col gap-4">
              <div>
                <label className={labelClass}>Categoria *</label>
                <select value={form.category_id} onChange={(e) => setForm((p) => ({ ...p, category_id: e.target.value }))}
                  className={inputClass} required>
                  <option value="">— Selecione —</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.nome} ({c.tipo})</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>Nome *</label>
                <input value={form.nome} onChange={(e) => setForm((p) => ({ ...p, nome: e.target.value }))}
                  placeholder="Nome completo" className={inputClass} required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Número</label>
                  <input type="number" value={form.numero} onChange={(e) => setForm((p) => ({ ...p, numero: e.target.value }))}
                    placeholder="Ex: 1" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Foto</label>
                  <input type="file" accept="image/*" onChange={(e) => setForm((p) => ({ ...p, foto: e.target.files?.[0] ?? null }))}
                    className="w-full text-xs text-stone-400 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-stone-700 file:text-stone-300 hover:file:bg-stone-600" />
                </div>
              </div>
              <div>
                <label className={labelClass}>Descrição</label>
                <textarea value={form.descricao} onChange={(e) => setForm((p) => ({ ...p, descricao: e.target.value }))}
                  placeholder="Descrição opcional..." rows={2} className={`${inputClass} resize-none`} />
              </div>
              <div className="flex gap-3 pt-1">
                <Button type="submit" loading={saving} className="flex-1">Salvar</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
