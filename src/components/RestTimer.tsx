import { useEffect, useState } from 'react';

interface Props {
  startedAt: number;
  onDismiss: () => void;
}

const PRESETS = [60, 90, 120, 180];

export default function RestTimer({ startedAt, onDismiss }: Props) {
  const [target, setTarget] = useState(90);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(id);
  }, []);

  const elapsed = Math.floor((now - startedAt) / 1000);
  const remaining = target - elapsed;
  const done = remaining <= 0;

  useEffect(() => {
    if (done && 'vibrate' in navigator) {
      navigator.vibrate?.(200);
    }
  }, [done]);

  function fmt(s: number) {
    const m = Math.floor(Math.abs(s) / 60);
    const sec = Math.abs(s) % 60;
    return `${s < 0 ? '+' : ''}${m}:${sec.toString().padStart(2, '0')}`;
  }

  return (
    <div className="fixed bottom-16 left-0 right-0 z-10 px-3 pb-2">
      <div
        className={`max-w-md mx-auto rounded-xl px-4 py-2.5 flex items-center gap-3 shadow-lg ${
          done ? 'bg-accent' : 'bg-slate-800'
        }`}
      >
        <span className="text-lg font-bold tabular-nums w-16">
          {done ? fmt(-Math.abs(remaining)) : fmt(remaining)}
        </span>
        <span className="text-xs opacity-80">{done ? 'Repos terminé !' : 'Repos'}</span>
        <div className="flex gap-1 ml-auto">
          {PRESETS.map((p) => (
            <button
              key={p}
              onClick={() => setTarget(p)}
              className={`text-xs px-2 py-1 rounded ${
                target === p ? 'bg-white/20 font-semibold' : 'opacity-60'
              }`}
            >
              {p}s
            </button>
          ))}
        </div>
        <button onClick={onDismiss} className="opacity-70 px-1">
          ✕
        </button>
      </div>
    </div>
  );
}
