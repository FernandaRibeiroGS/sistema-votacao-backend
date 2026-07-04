'use client';

import { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import toast from 'react-hot-toast';
import { StepCpf } from '@/app/components/vote/StepCpf';
import { StepVoting } from '@/app/components/vote/StepVoting';
import { StepConfirm } from '@/app/components/vote/StepConfirm';
import { StepSuccess } from '@/app/components/vote/StepSuccess';
import { Candidate, VoteOptions, VoteStep } from '@/app/types';
import api from '@/app/lib/api';

export default function Home() {
  const [step, setStep] = useState<VoteStep>('cpf');
  const [token, setToken] = useState('');
  const [options, setOptions] = useState<VoteOptions | null>(null);
  const [selectedChild, setSelectedChild] = useState<Candidate | null>(null);
  const [selectedAdult, setSelectedAdult] = useState<Candidate | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleCpfSuccess(jwt: string) {
    setToken(jwt);
    try {
      const { data } = await api.get<VoteOptions>('/votes/options');
      setOptions(data);
      setStep('voting');
    } catch {
      toast.error('Erro ao carregar candidatas. Tente novamente.');
    }
  }

  async function handleSubmitVote() {
    if (!selectedChild || !selectedAdult) return;
    setSubmitting(true);
    try {
      await api.post(
        '/votes/submit',
        { candidateChildId: selectedChild.id, candidateAdultId: selectedAdult.id },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setStep('success');
    } catch (err: any) {
      const msg = err.response?.data?.message ?? 'Erro ao registrar voto. Tente novamente.';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-stone-900 flex items-start justify-center py-8 px-4">
      <Toaster position="top-center" toastOptions={{ style: { background: '#1c1917', color: '#fff', border: '1px solid #44403c' } }} />

      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 rounded-full px-4 py-1.5 mb-3">
            <span className="text-amber-400 text-xs font-bold uppercase tracking-wider">🏆 Festa do Peão</span>
          </div>
          <div className="flex justify-center gap-2 mt-2">
            {(['cpf', 'voting', 'confirm', 'success'] as VoteStep[]).map((s, i) => (
              <div
                key={s}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  step === s ? 'w-8 bg-amber-500' : i < (['cpf', 'voting', 'confirm', 'success'] as VoteStep[]).indexOf(step) ? 'w-4 bg-amber-700' : 'w-4 bg-stone-700'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Card */}
        <div className="bg-stone-900 border border-stone-700 rounded-3xl p-6 shadow-2xl">
          {step === 'cpf' && <StepCpf onSuccess={handleCpfSuccess} />}

          {step === 'voting' && options && (
            <StepVoting
              options={options}
              selectedChild={selectedChild}
              selectedAdult={selectedAdult}
              onSelectChild={setSelectedChild}
              onSelectAdult={setSelectedAdult}
              onConfirm={() => setStep('confirm')}
            />
          )}

          {step === 'confirm' && selectedChild && selectedAdult && (
            <StepConfirm
              selectedChild={selectedChild}
              selectedAdult={selectedAdult}
              onConfirm={handleSubmitVote}
              onBack={() => setStep('voting')}
              loading={submitting}
            />
          )}

          {step === 'success' && (
            <StepSuccess
              selectedChild={selectedChild}
              selectedAdult={selectedAdult}
              onReset={() => {
                setStep('cpf');
                setToken('');
                setSelectedChild(null);
                setSelectedAdult(null);
              }}
            />
          )}
        </div>
      </div>
    </main>
  );
}
