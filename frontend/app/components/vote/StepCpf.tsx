'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/app/components/ui/Button';
import api from '@/app/lib/api';
import toast from 'react-hot-toast';

interface StepCpfProps {
  onSuccess: (token: string) => void;
}

export function StepCpf({ onSuccess }: StepCpfProps) {
  const [cpf, setCpf] = useState('');
  const [nomeCompleto, setNomeCompleto] = useState('');
  const [dataNascimento, setDataNascimento] = useState('');
  const [captchaAnswer, setCaptchaAnswer] = useState('');
  const [captchaKey, setCaptchaKey] = useState('');
  const [challenge, setChallenge] = useState('Carregando...');
  const [loading, setLoading] = useState(false);

  // Carrega o captcha matemático inicial
  useEffect(() => {
    loadCaptcha();
  }, []);

  async function loadCaptcha() {
    try {
      const { data } = await api.get<{ challenge: string; captchaKey: string }>('/votes/captcha');
      setChallenge(data.challenge);
      setCaptchaKey(data.captchaKey);
    } catch {
      setChallenge('Erro ao carregar captcha');
      toast.error('Erro ao gerar desafio. Clique em recarregar.');
    }
  }

  function formatCpf(value: string) {
    return value
      .replace(/\D/g, '')
      .slice(0, 11)
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  }

  function formatBirthDate(value: string) {
    return value
      .replace(/\D/g, '')
      .slice(0, 8)
      .replace(/(\d{2})(\d)/, '$1/$2')
      .replace(/(\d{2})(\d)/, '$1/$2');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const cleanCpf = cpf.replace(/\D/g, '');

    if (cleanCpf.length !== 11) {
      toast.error('Digite um CPF válido com 11 dígitos.');
      return;
    }
    const words = nomeCompleto.trim().split(/\s+/).filter(w => w.length > 0);
    if (words.length < 2) {
      toast.error('Digite seu nome completo (nome e sobrenome).');
      return;
    }
    if (dataNascimento.trim().length !== 10) {
      toast.error('Por favor, informe uma data de nascimento válida (DD/MM/AAAA).');
      return;
    }
    if (!captchaAnswer.trim()) {
      toast.error('Por favor, responda ao desafio matemático.');
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post('/votes/session', {
        cpf: cleanCpf,
        nomeCompleto: nomeCompleto.trim(),
        dataNascimento: dataNascimento.trim(),
        captchaAnswer: captchaAnswer.trim(),
        captchaKey,
      });
      onSuccess(data.token);
    } catch (err: any) {
      const msg = err.response?.data?.message ?? 'Erro ao validar dados. Tente novamente.';
      toast.error(msg);
      // Se for erro de captcha, vamos limpar a resposta e recarregar
      if (msg.toLowerCase().includes('captcha')) {
        setCaptchaAnswer('');
        loadCaptcha();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="text-center">
        <div className="text-6xl mb-3 font-semibold">🤠</div>
        <h1 className="text-2xl font-bold text-white">Votação Online</h1>
        <p className="text-stone-400 mt-1 text-sm">Digite seus dados para participar</p>
      </div>

      <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
        {/* CPF */}
        <div>
          <label className="text-stone-300 text-sm font-medium mb-1 block">
            CPF <span className="text-amber-500 font-bold">*</span>
          </label>
          <input
            type="text"
            inputMode="numeric"
            placeholder="000.000.000-00"
            value={cpf}
            onChange={(e) => setCpf(formatCpf(e.target.value))}
            required
            className="w-full bg-stone-800 border border-stone-600 rounded-xl px-4 py-3 text-white text-lg tracking-widest placeholder:text-stone-500 focus:outline-none focus:border-amber-500 transition-colors"
          />
        </div>

        {/* Nome Completo */}
        <div>
          <label className="text-stone-300 text-sm font-medium mb-1 block">
            Nome Completo <span className="text-amber-500 font-bold">*</span>
          </label>
          <input
            type="text"
            placeholder="Nome Completo (igual ao documento)"
            value={nomeCompleto}
            onChange={(e) => setNomeCompleto(e.target.value)}
            required
            className="w-full bg-stone-800 border border-stone-600 rounded-xl px-4 py-3 text-white text-base placeholder:text-stone-500 focus:outline-none focus:border-amber-500 transition-colors"
          />
        </div>

        {/* Data de Nascimento */}
        <div>
          <label className="text-stone-300 text-sm font-medium mb-1 block">
            Data de Nascimento <span className="text-amber-500 font-bold">*</span>
          </label>
          <input
            type="text"
            placeholder="DD/MM/AAAA"
            value={dataNascimento}
            onChange={(e) => setDataNascimento(formatBirthDate(e.target.value))}
            required
            className="w-full bg-stone-800 border border-stone-600 rounded-xl px-4 py-3 text-white text-base placeholder:text-stone-500 focus:outline-none focus:border-amber-500 transition-colors"
          />
        </div>

        {/* Captcha Matemático */}
        <div className="bg-stone-950 border border-stone-800 rounded-2xl p-4 flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <span className="text-[11px] text-stone-500 uppercase font-semibold tracking-wider">
              Verificação Humana
            </span>
            <button
              type="button"
              onClick={loadCaptcha}
              className="text-amber-500 hover:text-amber-400 text-xs flex items-center gap-1 transition-colors"
              title="Gerar nova conta"
            >
              🔄 Recarregar
            </button>
          </div>

          <div className="flex items-center justify-between gap-4">
            <div className="text-white text-sm font-bold bg-stone-900 border border-stone-800 px-4 py-3 rounded-xl flex-1 text-center font-mono">
              {challenge}
            </div>
            <input
              type="text"
              inputMode="numeric"
              placeholder="Resposta"
              value={captchaAnswer}
              onChange={(e) => setCaptchaAnswer(e.target.value)}
              className="bg-stone-800 border border-stone-600 rounded-xl px-4 py-3 text-white font-bold w-28 text-center text-lg placeholder:text-stone-500 focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>
        </div>

        <p className="text-stone-500 text-xs text-center leading-relaxed">
          Seus dados são protegidos conforme a LGPD. O CPF é criptografado e validado em conformidade com as regras eleitorais.
        </p>

        <Button type="submit" loading={loading} className="w-full py-4 text-base">
          Entrar e Votar
        </Button>
      </form>
    </div>
  );
}
