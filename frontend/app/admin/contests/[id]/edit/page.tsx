'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/app/components/ui/Button';
import adminApi from '@/app/lib/adminApi';
import { brtInputToISO, isoToBrtInput } from '@/app/lib/dateUtils';
import toast, { Toaster } from 'react-hot-toast';

export default function EditContestPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [form, setForm] = useState({
    nome: '', descricao: '', cidade: '', ano: new Date().getFullYear(),
    inicio: '', encerramento: '',
  });

  useEffect(() => {
    adminApi.get(`/admin/contests/${id}`)
      .then(({ data }) => {
        setForm({
          nome: data.nome,
          descricao: data.descricao ?? '',
          cidade: data.cidade,
          ano: data.ano,
          inicio: isoToBrtInput(data.inicio),
          encerramento: isoToBrtInput(data.encerramento),
        });
      })
      .catch(() => toast.error('Erro ao carregar concurso.'))
      .finally(() => setFetching(false));
  }, [id]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await adminApi.put(`/admin/contests/${id}`, {
        ...form,
        ano: Number(form.ano),
        inicio: brtInputToISO(form.inicio),
        encerramento: brtInputToISO(form.encerramento),
      });
      toast.success('Concurso atualizado com sucesso!');
      router.push('/admin/contests');
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? 'Erro ao atualizar concurso.');
    } finally {
      setLoading(false);
    }
  }

  const inputClass = 'w-full bg-stone-800 border border-stone-700 rounded-xl px-4 py-3 text-white placeholder:text-stone-500 focus:outline-none focus:border-amber-500 transition-colors';
  const labelClass = 'text-stone-300 text-sm font-medium mb-1 block';

  if (fetching) return <div className="p-8 text-stone-500 text-sm">Carregando...</div>;

  return (
    <div className="p-8 max-w-2xl">
      <Toaster position="top-right" toastOptions={{ style: { background: '#1c1917', color: '#fff', border: '1px solid #44403c' } }} />

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Editar Concurso</h1>
        <p className="text-stone-500 text-sm mt-1">Altere os dados do concurso</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-stone-900 border border-stone-800 rounded-2xl p-6 flex flex-col gap-5">
        <div>
          <label className={labelClass}>Nome do concurso *</label>
          <input name="nome" value={form.nome} onChange={handleChange} className={inputClass} required />
        </div>

        <div>
          <label className={labelClass}>Descrição</label>
          <textarea name="descricao" value={form.descricao} onChange={handleChange} rows={3}
            className={`${inputClass} resize-none`} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Cidade *</label>
            <input name="cidade" value={form.cidade} onChange={handleChange} className={inputClass} required />
          </div>
          <div>
            <label className={labelClass}>Ano *</label>
            <input name="ano" type="number" value={form.ano} onChange={handleChange} className={inputClass} required />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Data/hora de início *</label>
            <input name="inicio" type="datetime-local" value={form.inicio} onChange={handleChange} className={inputClass} required />
          </div>
          <div>
            <label className={labelClass}>Data/hora de encerramento *</label>
            <input name="encerramento" type="datetime-local" value={form.encerramento} onChange={handleChange} className={inputClass} required />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="submit" loading={loading} className="flex-1">
            Salvar alterações
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancelar
          </Button>
        </div>
      </form>
    </div>
  );
}
