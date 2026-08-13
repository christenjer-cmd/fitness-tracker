import { useEffect, useRef, useState } from 'react';
import { useStore } from '../store/useStore';
import { CloseIcon, TimerIcon } from './icons';

interface Props {
  /** Exercice qui a déclenché le repos : la durée choisie est retenue pour lui. */
  exerciseId: string;
  startedAt: number;
  onDismiss: () => void;
}

const PRESETS = [60, 90, 120, 180];
const DEFAULT_REST = 90;

// Un bip synthétisé évite d'embarquer un fichier audio dans la PWA.
function playBeep() {
  try {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;
    const ctx = new Ctor();
    const gain = ctx.createGain();
    gain.connect(ctx.destination);
    // Deux bips courts, montants.
    [0, 0.22].forEach((offset, i) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = i === 0 ? 880 : 1175;
      osc.connect(gain);
      const start = ctx.currentTime + offset;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.3, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.18);
      osc.start(start);
      osc.stop(start + 0.2);
    });
    setTimeout(() => ctx.close(), 800);
  } catch {
    // Le navigateur refuse l'audio sans geste utilisateur : la vibration prend le relais.
  }
}

export default function RestTimer({ exerciseId, startedAt, onDismiss }: Props) {
  const savedSeconds = useStore((s) => s.restSecondsByExercise[exerciseId]);
  const setRestSeconds = useStore((s) => s.setRestSeconds);
  const soundEnabled = useStore((s) => s.soundEnabled);

  const target = savedSeconds ?? DEFAULT_REST;
  const [now, setNow] = useState(Date.now());
  const alerted = useRef(false);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(id);
  }, []);

  const elapsed = Math.floor((now - startedAt) / 1000);
  const remaining = target - elapsed;
  const done = remaining <= 0;

  // Une seule alerte par période de repos, même si l'on rallonge puis raccourcit la cible.
  useEffect(() => {
    if (!done || alerted.current) return;
    alerted.current = true;
    if (soundEnabled) playBeep();
    navigator.vibrate?.([200, 100, 200]);
  }, [done, soundEnabled]);

  useEffect(() => {
    alerted.current = false;
  }, [startedAt]);

  function fmt(s: number) {
    const m = Math.floor(Math.abs(s) / 60);
    const sec = Math.abs(s) % 60;
    return `${s < 0 ? '+' : ''}${m}:${sec.toString().padStart(2, '0')}`;
  }

  const progress = Math.min(100, Math.max(0, (elapsed / target) * 100));

  // Anneau de progression : plus lisible d'un coup d'œil qu'une barre fine.
  const radius = 15;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="fixed bottom-[4.6rem] left-0 right-0 z-30 px-4 pb-[env(safe-area-inset-bottom)]">
      <div
        className={`max-w-md mx-auto rounded-2xl border backdrop-blur-xl shadow-card animate-scale-in ${
          done ? 'bg-accent/90 border-accent text-accent-ink' : 'bg-surface-raised/95 border-line'
        }`}
      >
        <div className="px-3 py-2.5 flex items-center gap-3">
          <span className="relative w-10 h-10 shrink-0 grid place-items-center">
            <svg className="absolute inset-0 -rotate-90" viewBox="0 0 36 36">
              <circle
                cx="18"
                cy="18"
                r={radius}
                fill="none"
                strokeWidth="3"
                className={done ? 'stroke-accent-ink/25' : 'stroke-white/10'}
              />
              <circle
                cx="18"
                cy="18"
                r={radius}
                fill="none"
                strokeWidth="3"
                strokeLinecap="round"
                className={done ? 'stroke-accent-ink' : 'stroke-accent'}
                strokeDasharray={circumference}
                strokeDashoffset={circumference * (1 - progress / 100)}
                style={{ transition: 'stroke-dashoffset 0.5s linear' }}
              />
            </svg>
            <TimerIcon className={`w-4 h-4 ${done ? 'text-accent-ink' : 'text-accent'}`} />
          </span>

          <span className="min-w-0">
            <span className="block text-lg font-bold tabular-nums leading-none">
              {done ? fmt(-Math.abs(remaining)) : fmt(remaining)}
            </span>
            <span className={`block text-[10px] mt-0.5 ${done ? 'opacity-70' : 'text-slate-500'}`}>
              {done ? 'Repos terminé' : 'Repos en cours'}
            </span>
          </span>

          <div className="flex gap-1 ml-auto">
            {PRESETS.map((p) => (
              <button
                key={p}
                onClick={() => setRestSeconds(exerciseId, p)}
                className={`text-[11px] px-2 py-1 rounded-lg transition active:scale-90 ${
                  target === p
                    ? done
                      ? 'bg-accent-ink/20 font-bold'
                      : 'bg-accent/20 text-accent font-bold'
                    : 'text-slate-500'
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          <button
            onClick={onDismiss}
            className={`p-1.5 shrink-0 rounded-lg ${done ? 'opacity-70' : 'text-slate-500'}`}
            aria-label="Fermer"
          >
            <CloseIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
