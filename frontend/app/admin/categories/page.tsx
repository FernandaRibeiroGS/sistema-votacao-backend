'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Category, Contest } from '@/app/types/admin';
import { Button } from '@/app/components/ui/Button';
import adminApi from '@/app/lib/adminApi';
import toast, { Toaster } from 'react-hot-toast';

const emptyForm = { nome: '', tipo: 'adulta' as 'adulta' | 'infantil', ativo: true, contest_id: 0 };

export default function CategoriesPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const contestId = Number(searchParams.get('contestId'));

  const [contests, setContests] = useState<Contest[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    adminApi.get<Contest[]>('/admin/contests').then(({ data }) => setContests(data));
  }, []);

  const fetchCategories = useCallback(async () => {
    if (!contestId) return;
    setLoading(true);
    try {
      const { data } = await adminApi.get<Category[]>(`/admin/categories/contest/${contestId}`);
      setCategories(data);
    } catch {
      toast.error('Erro ao carregar categorias.');
    } finally {
      setLoading(false);
    }
  }, [contestId]);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  function openNew() {
    setEditing(null);
    setForm({ ...emptyForm, contest_id: contestId });
    setModalOpen(true);
  }

  function openEdit(cat: Category) {
    setEditing(cat);
    setForm({ nome: cat.nome, tipo: cat.tipo, ativo: cat.ativo, contest_id: cat.contest_id });
    setModalOpen(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await adminApi.put(`/admin/categories/${editing.id}`, form);
        toast.success('Categoria atualizada!');
      } else {
        const { ativo, ...createPayload } = form;
        await adminApi.post('/admin/categories', createPayload);
        toast.success('Categoria criada!');
      }
      setModalOpen(false);
      fetchCategories();
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? 'Erro ao salvar categoria.');
    } finally {
      setSaving(false);
    }
  }

  const inputClass = 'w-full bg-stone-800 border border-stone-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500 transition-colors';
  const labelClass = 'text-stone-300 text-sm font-medium mb-1 block';
  const selectedContest = contests.find((c) => c.id === contestId);

  return (
    <div className="p-8">
      <Toaster position="top-right" toastOptions={{ style: { background: '#1c1917', color: '#fff', border: '1px solid #44403c' } }} />

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Categorias</h1>
          {selectedContest && (
            <p className="text-stone-500 text-sm mt-1">{selectedContest.nome}</p>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push('/admin/contests')}>← Concursos</Button>
          {contestId > 0 && <Button onClick={openNew}>+ Nova categoria</Button>}
        </div>
      </div>

      {/* Seletor de concurso */}
      {!contestId && (
        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-6">
          <p className="text-stone-400 text-sm mb-4">Selecione um concurso para gerenciar suas categorias:</p>
          <div className="flex flex-col gap-2">
            {contests.map((c) => (
              <button
                key={c.id}
                onClick={() => router.push(`/admin/categories?contestId=${c.id}`)}
                className="text-left px-4 py-3 bg-stone-800 hover:bg-stone-700 rounded-xl text-white text-sm transition-colors"
              >
                {c.nome} — {c.cidade} {c.ano}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Lista de categorias */}
      {contestId > 0 && (
        <>
          {loading && <p className="text-stone-500 text-sm">Carregando...</p>}

          {!loading && categories.length === 0 && (
            <div className="bg-stone-900 border border-stone-800 rounded-2xl p-8 text-center">
              <p className="text-stone-500 text-sm">Nenhuma categoria cadastrada para este concurso.</p>
            </div>
          )}

          <div className="flex flex-col gap-3">
            {categories.map((cat) => (
              <div key={cat.id} className="bg-stone-900 border border-stone-800 rounded-2xl px-5 py-4 flex items-center justify-between">
                <div>
                  <span className="text-white font-medium">{cat.nome}</span>
                  <div className="flex gap-3 mt-1 text-xs text-stone-500">
                    <span className="capitalize">{cat.tipo}</span>
                    <span>{cat.candidates?.length ?? 0} candidata(s)</span>
                    <span className={cat.ativo ? 'text-emerald-400' : 'text-red-400'}>
                      {cat.ativo ? 'Ativa' : 'Inativa'}
                    </span>
                  </div>
                </div>
                <Button variant="outline" className="text-xs px-3 py-2" onClick={() => openEdit(cat)}>
                  ✏️ Editar
                </Button>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-stone-900 border border-stone-800 rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-white font-bold text-lg mb-5">
              {editing ? 'Editar Categoria' : 'Nova Categoria'}
            </h2>
            <form onSubmit={handleSave} className="flex flex-col gap-4">
              <div>
                <label className={labelClass}>Nome *</label>
                <input
                  value={form.nome}
                  onChange={(e) => setForm((p) => ({ ...p, nome: e.target.value }))}
                  className={inputClass}
                  placeholder="Ex: Rainha Adulta"
                  required
                />
              </div>

              <div>
                <label className={labelClass}>Tipo *</label>
                <select
                  value={form.tipo}
                  onChange={(e) => setForm((p) => ({ ...p, tipo: e.target.value as 'adulta' | 'infantil' }))}
                  className={inputClass}
                >
                  <option value="adulta">Adulta</option>
                  <option value="infantil">Infantil</option>
                </select>
              </div>

              {editing && (
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.ativo}
                    onChange={(e) => setForm((p) => ({ ...p, ativo: e.target.checked }))}
                    className="w-4 h-4 accent-amber-500"
                  />
                  <span className="text-stone-300 text-sm">Categoria ativa</span>
                </label>
              )}

              <div className="flex gap-3 pt-2">
                <Button type="submit" loading={saving} className="flex-1">
                  {editing ? 'Salvar' : 'Criar'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
                  Cancelar
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
