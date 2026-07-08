'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/app/components/ui/Button';

interface StepCountdownProps {
  contestNome: string;
  inicio: string;
  onCountdownFinished: () => void;
}

export function StepCountdown({ contestNome, inicio, onCountdownFinished }: StepCountdownProps) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    totalSeconds: 0,
  });

  const [formattedDate, setFormattedDate] = useState('');

  useEffect(() => {
    // Format the date on the client side to avoid hydration mismatch
    try {
      const date = new Date(inicio);
      const options: Intl.DateTimeFormatOptions = {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      };
      setFormattedDate(date.toLocaleDateString('pt-BR', options));
    } catch {
      setFormattedDate('');
    }
  }, [inicio]);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = +new Date(inicio) - +new Date();
      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, totalSeconds: 0 });
        onCountdownFinished();
        return;
      }
      
      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((difference / 1000 / 60) % 60);
      const seconds = Math.floor((difference / 1000) % 60);
      
      setTimeLeft({ days, hours, minutes, seconds, totalSeconds: Math.floor(difference / 1000) });
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [inicio, onCountdownFinished]);

  const padZero = (num: number) => String(num).padStart(2, '0');

  return (
    <div className="flex flex-col items-center justify-center gap-6 py-4">
      {/* Icon and Title */}
      <div className="text-center">
        <div className="text-6xl mb-4 animate-bounce duration-1000">⏳</div>
        <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-400 to-yellow-500 tracking-tight leading-tight">
          Votação Iniciando Em Breve
        </h1>
        <p className="text-stone-400 mt-2 text-sm max-w-sm px-4">
          Prepare-se! O concurso <strong className="text-amber-500">{contestNome}</strong> está agendado e começará logo.
        </p>
      </div>

      {/* Countdown Cards */}
      <div className="grid grid-cols-4 gap-3 w-full max-w-sm px-2 mt-2">
        {[
          { label: 'Dias', value: timeLeft.days },
          { label: 'Horas', value: timeLeft.hours },
          { label: 'Mins', value: timeLeft.minutes },
          { label: 'Segs', value: timeLeft.seconds },
        ].map((item, idx) => (
          <div
            key={idx}
            className="flex flex-col items-center justify-center bg-stone-950/60 border border-stone-800 rounded-2xl p-3 shadow-inner relative overflow-hidden group transition-all duration-300 hover:border-amber-500/40 hover:scale-105"
          >
            {/* Background Glow */}
            <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            
            <span className="text-3xl font-black text-white font-mono tracking-tight transition-transform duration-200">
              {padZero(item.value)}
            </span>
            <span className="text-[10px] text-stone-500 uppercase font-semibold mt-1 tracking-wider">
              {item.label}
            </span>
          </div>
        ))}
      </div>

      {/* Release details */}
      <div className="w-full max-w-sm bg-stone-950/30 border border-stone-800 rounded-2xl p-4 text-center mt-2">
        <span className="text-xs text-stone-500 block mb-1">DATA E HORA DE INÍCIO</span>
        <span className="text-sm text-stone-300 font-semibold font-mono">
          {formattedDate || 'Carregando...'}
        </span>
      </div>

      {/* Action buttons */}
      <div className="w-full max-w-sm flex flex-col gap-2 mt-2">
        <Button
          variant="outline"
          onClick={onCountdownFinished}
          className="w-full py-3.5 border-stone-700 text-stone-300 hover:bg-stone-800 hover:text-white"
        >
          🔄 Verificar Liberação
        </Button>
      </div>
    </div>
  );
}
