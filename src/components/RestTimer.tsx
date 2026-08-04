import { useEffect, useRef, useState } from 'react';
import { useStore } from '../store/useStore';

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

  return (
    <div className="fixed bottom-16 left-0 right-0 z-10 px-3 pb-2">
      <div
        className={`max-w-md mx-auto rounded-xl overflow-hidden shadow-lg ${
          done ? 'bg-accent' : 'bg-slate-800'
        }`}
      >
        {!done && (
          <div className="h-0.5 bg-slate-700">
            <div className="h-full bg-accent transition-all" style={{ width: `${progress}%` }} />
          </div>
        )}
        <div className="px-4 py-2.5 flex items-center gap-3">
          <span className="text-lg font-bold tabular-nums w-14 shrink-0">
            {done ? fmt(-Math.abs(remaining)) : fmt(remaining)}
          </span>
          <span className="text-xs opacity-80 shrink-0">{done ? 'Repos terminé !' : 'Repos'}</span>
          <div className="flex gap-1 ml-auto">
            {PRESETS.map((p) => (
              <button
                key={p}
                onClick={() => setRestSeconds(exerciseId, p)}
                className={`text-xs px-2 py-1 rounded ${
                  target === p ? 'bg-white/20 font-semibold' : 'opacity-60'
                }`}
              >
                {p}s
              </button>
            ))}
          </div>
          <button onClick={onDismiss} className="opacity-70 px-1 shrink-0" aria-label="Fermer">
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}
