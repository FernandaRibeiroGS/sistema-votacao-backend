'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/app/components/ui/Button';
import adminApi from '@/app/lib/adminApi';
import toast, { Toaster } from 'react-hot-toast';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await adminApi.post('/admin/auth/login', { email, senha });
      localStorage.setItem('admin_token', data.token);
      localStorage.setItem('admin_user', JSON.stringify(data.admin));
      router.push('/admin/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? 'Credenciais inválidas.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-stone-950 flex items-center justify-center px-4">
      <Toaster position="top-center" toastOptions={{ style: { background: '#1c1917', color: '#fff', border: '1px solid #44403c' } }} />

      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🤠</div>
          <h1 className="text-2xl font-bold text-white">Painel Administrativo</h1>
          <p className="text-stone-500 text-sm mt-1">Festa do Peão — Sistema de Votação</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-stone-900 border border-stone-800 rounded-2xl p-6 flex flex-col gap-4">
          <div>
            <label className="text-stone-300 text-sm font-medium mb-1 block">E-mail</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@votacao.com"
              className="w-full bg-stone-800 border border-stone-700 rounded-xl px-4 py-3 text-white placeholder:text-stone-500 focus:outline-none focus:border-amber-500 transition-colors"
              required
            />
          </div>

          <div>
            <label className="text-stone-300 text-sm font-medium mb-1 block">Senha</label>
            <input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-stone-800 border border-stone-700 rounded-xl px-4 py-3 text-white placeholder:text-stone-500 focus:outline-none focus:border-amber-500 transition-colors"
              required
            />
          </div>

          <Button type="submit" loading={loading} className="w-full py-3 mt-2">
            Entrar
          </Button>
        </form>
      </div>
    </div>
  );
}
