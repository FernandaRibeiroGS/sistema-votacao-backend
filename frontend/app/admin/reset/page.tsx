'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/app/components/ui/Button';
import adminApi from '@/app/lib/adminApi';

interface ResetResponse {
  email: string;
  senha: string;
  message?: string;
}

type PageState = 'idle' | 'loading' | 'success' | 'error';

export default function ResetPasswordPage() {
  const [state, setState] = useState<PageState>('idle');
  const [credentials, setCredentials] = useState<ResetResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [copied, setCopied] = useState<'email' | 'senha' | null>(null);

  async function handleReset() {
    setState('loading');
    setErrorMessage('');
    try {
      const { data } = await adminApi.post<ResetResponse>('/admin/auth/reset-password');
      setCredentials(data);
      setState('success');
    } catch (err: any) {
      setErrorMessage(
        err.response?.data?.message ?? 'Não foi possível redefinir a senha. Tente novamente.',
      );
      setState('error');
    }
  }

  async function copyToClipboard(value: string, field: 'email' | 'senha') {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(field);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      // clipboard not available — silently ignore
    }
  }

  return (
    <div className="min-h-screen bg-stone-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🔑</div>
          <h1 className="text-2xl font-bold text-white">Redefinir Credenciais</h1>
          <p className="text-stone-500 text-sm mt-1">Painel Administrativo — Festa do Peão</p>
        </div>

        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-6 flex flex-col gap-5">
          {/* Idle / Error state */}
          {(state === 'idle' || state === 'error') && (
            <>
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
                <p className="text-amber-400 text-sm font-semibold mb-1">⚠️ Atenção</p>
                <p className="text-stone-300 text-sm leading-relaxed">
                  Ao clicar no botão abaixo, o sistema irá gerar um novo e-mail e uma nova senha
                  aleatória para o administrador. As credenciais anteriores serão invalidadas
                  imediatamente.
                </p>
              </div>

              {state === 'error' && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                  <p className="text-red-400 text-sm">❌ {errorMessage}</p>
                </div>
              )}

              <Button
                onClick={handleReset}
                loading={state === 'loading'}
                className="w-full py-3"
              >
                Redefinir Senha do Administrador
              </Button>
            </>
          )}

          {/* Loading state */}
          {state === 'loading' && (
            <div className="flex flex-col items-center gap-3 py-4">
              <svg className="animate-spin h-8 w-8 text-amber-500" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              <p className="text-stone-400 text-sm">Redefinindo credenciais...</p>
            </div>
          )}

          {/* Success state */}
          {state === 'success' && credentials && (
            <>
              <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
                <p className="text-green-400 text-sm font-semibold mb-1">✅ Credenciais redefinidas com sucesso!</p>
                <p className="text-stone-300 text-sm leading-relaxed">
                  Anote as novas credenciais abaixo antes de sair desta página. Elas não serão
                  exibidas novamente.
                </p>
              </div>

              {/* Email */}
              <div>
                <label className="text-stone-400 text-xs uppercase tracking-wider mb-2 block">
                  Novo E-mail
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-stone-800 border border-stone-700 rounded-xl px-4 py-3 text-white font-mono text-sm break-all">
                    {credentials.email}
                  </div>
                  <button
                    onClick={() => copyToClipboard(credentials.email, 'email')}
                    title="Copiar e-mail"
                    className="shrink-0 bg-stone-700 hover:bg-stone-600 text-stone-300 hover:text-white rounded-xl px-3 py-3 text-sm transition-colors"
                  >
                    {copied === 'email' ? '✓' : '📋'}
                  </button>
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="text-stone-400 text-xs uppercase tracking-wider mb-2 block">
                  Nova Senha
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-stone-800 border border-stone-700 rounded-xl px-4 py-3 text-white font-mono text-sm break-all">
                    {credentials.senha}
                  </div>
                  <button
                    onClick={() => copyToClipboard(credentials.senha, 'senha')}
                    title="Copiar senha"
                    className="shrink-0 bg-stone-700 hover:bg-stone-600 text-stone-300 hover:text-white rounded-xl px-3 py-3 text-sm transition-colors"
                  >
                    {copied === 'senha' ? '✓' : '📋'}
                  </button>
                </div>
              </div>

              <Button
                onClick={handleReset}
                variant="outline"
                className="w-full py-3"
              >
                Redefinir Novamente
              </Button>
            </>
          )}

          {/* Back to login */}
          <div className="text-center pt-1">
            <Link
              href="/admin/login"
              className="text-stone-500 hover:text-amber-400 text-sm transition-colors"
            >
              ← Voltar para o login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
