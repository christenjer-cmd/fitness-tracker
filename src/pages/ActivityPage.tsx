import { useMemo, useState } from 'react';
import { useStore } from '../store/useStore';
import { CardioIcon, RunIcon, TrashIcon } from '../components/icons';
import { RunIllustration } from '../components/illustrations';
import { formatDate } from '../utils';
import type { RunSport } from '../types';

interface Props {
  sport: RunSport;
}

// Un seul écran sert les deux onglets : seuls les libellés et les règles de
// saisie changent. En cardio la distance est facultative, un tapis incliné ou
// une séance d'escaliers n'en produit pas toujours.
const COPY = {
  course: {
    title: 'Nouvelle course',
    submit: 'Enregistrer la course',
    history: 'Historique des courses',
    empty: 'Aucune course enregistrée.',
    Icon: RunIcon,
  },
  cardio: {
    title: 'Nouvelle activité',
    submit: 'Enregistrer',
    history: 'Historique cardio',
    empty: 'Aucune activité enregistrée.',
    Icon: CardioIcon,
  },
} as const;

function formatPace(minPerKm: number): string {
  const min = Math.floor(minPerKm);
  const sec = Math.round((minPerKm - min) * 60);
  return `${min}:${sec.toString().padStart(2, '0')}`;
}

export default function ActivityPage({ sport }: Props) {
  const allRuns = useStore((s) => s.runs);
  const addRun = useStore((s) => s.addRun);
  const deleteRun = useStore((s) => s.deleteRun);

  // Le filtrage reste hors du sélecteur : un nouveau tableau à chaque rendu
  // ferait boucler useSyncExternalStore.
  const runs = useMemo(() => allRuns.filter((r) => r.sport === sport), [allRuns, sport]);

  const [distance, setDistance] = useState('');
  const [duration, setDuration] = useState('');
  const [heartRate, setHeartRate] = useState('');
  const [notes, setNotes] = useState('');

  const copy = COPY[sport];
  const Icon = copy.Icon;

  const d = parseFloat(distance);
  const t = parseFloat(duration);
  const pace = d > 0 && t > 0 ? formatPace(t / d) : null;
  // La durée suffit en cardio ; une course sans distance n'a pas de sens.
  const canSubmit = sport === 'cardio' ? t > 0 : d > 0 && t > 0;

  function submit() {
    if (!canSubmit) return;
    addRun({
      date: new Date().toISOString().slice(0, 10),
      distanceKm: d > 0 ? d : 0,
      durationMin: t,
      avgPaceMinPerKm: d > 0 ? t / d : undefined,
      avgHeartRate: heartRate ? Number(heartRate) : undefined,
      notes: notes || undefined,
      source: 'manuel',
      sport,
    });
    setDistance('');
    setDuration('');
    setHeartRate('');
    setNotes('');
  }

  const totalKm = runs.reduce((acc, r) => acc + r.distanceKm, 0);
  const totalMin = runs.reduce((acc, r) => acc + r.durationMin, 0);
  const totalHours = Math.floor(totalMin / 60);

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="card p-4 space-y-3">
        <div className="flex items-center gap-2.5">
          <span className="w-9 h-9 rounded-xl bg-accent/10 border border-accent/20 grid place-items-center shrink-0">
            <Icon className="w-[18px] h-[18px] text-accent" />
          </span>
          <h2 className="font-bold">{copy.title}</h2>
        </div>

        <div className="flex gap-2">
          <div className="flex-1">
            <label className="label-micro">
              Distance{sport === 'cardio' ? ' (option.)' : ' (km)'}
            </label>
            <input
              type="number"
              inputMode="decimal"
              value={distance}
              onChange={(e) => setDistance(e.target.value)}
              placeholder="0"
              className="field w-full px-3 py-2.5 mt-1 font-semibold"
            />
          </div>
          <div className="flex-1">
            <label className="label-micro">Durée (min)</label>
            <input
              type="number"
              inputMode="decimal"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="0"
              className="field w-full px-3 py-2.5 mt-1 font-semibold"
            />
          </div>
        </div>

        <div className="flex gap-2">
          <div className="flex-1">
            <label className="label-micro">FC moyenne</label>
            <input
              type="number"
              inputMode="numeric"
              value={heartRate}
              onChange={(e) => setHeartRate(e.target.value)}
              placeholder="optionnel"
              className="field w-full px-3 py-2.5 mt-1 text-sm"
            />
          </div>
          <div className="flex-1">
            <label className="label-micro">Allure</label>
            <div className="bg-black/30 border border-white/[0.08] rounded-xl px-3 py-2.5 mt-1 text-sm">
              {pace ? (
                <span className="font-bold text-accent tabular-nums">{pace} /km</span>
              ) : (
                <span className="text-slate-600">—</span>
              )}
            </div>
          </div>
        </div>

        <div>
          <label className="label-micro">Notes</label>
          <input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={sport === 'cardio' ? 'tapis, marche inclinée, escaliers...' : 'optionnel'}
            className="field w-full px-3 py-2.5 mt-1 text-sm"
          />
        </div>

        <button onClick={submit} disabled={!canSubmit} className="btn-primary w-full py-3">
          {copy.submit}
        </button>
      </div>

      <div>
        <div className="flex items-baseline justify-between mb-2.5">
          <p className="label-micro">{copy.history}</p>
          {runs.length > 0 && (
            <p className="text-xs text-slate-500 tabular-nums">
              {runs.length}
              {totalKm > 0 ? ` · ${totalKm.toFixed(1)} km` : ''} ·{' '}
              {totalHours > 0
                ? `${totalHours}h${Math.round(totalMin % 60)
                    .toString()
                    .padStart(2, '0')}`
                : `${Math.round(totalMin)} min`}
            </p>
          )}
        </div>

        {runs.length === 0 && (
          <div className="card p-6 flex flex-col items-center text-center">
            <RunIllustration className="w-full max-w-[13rem] h-auto" />
            <p className="text-slate-500 text-sm mt-1">{copy.empty}</p>
          </div>
        )}

        <div className="space-y-2">
          {runs.map((r) => (
            <div key={r.id} className="card p-3.5 flex items-center gap-3">
              <span className="w-10 h-10 rounded-xl bg-black/30 grid place-items-center shrink-0">
                <Icon className="w-5 h-5 text-slate-500" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-bold tabular-nums">
                  {r.distanceKm > 0 ? `${r.distanceKm} km` : `${Math.round(r.durationMin)} min`}
                  {r.distanceKm > 0 && (
                    <span className="text-slate-500 font-normal">
                      {' '}
                      · {Math.round(r.durationMin)} min
                    </span>
                  )}
                </p>
                <p className="text-xs text-slate-500 mt-0.5 truncate">
                  {formatDate(r.date)}
                  {r.avgHeartRate ? ` · ${r.avgHeartRate} bpm` : ''}
                  {r.avgPaceMinPerKm ? ` · ${formatPace(r.avgPaceMinPerKm)}/km` : ''}
                </p>
                {r.notes && <p className="text-xs text-slate-600 mt-0.5 truncate">{r.notes}</p>}
              </div>
              {r.source === 'garmin' && (
                <span className="text-[9px] uppercase tracking-wider text-accent bg-accent/10 border border-accent/20 px-1.5 py-0.5 rounded shrink-0">
                  Garmin
                </span>
              )}
              <button
                onClick={() => {
                  if (window.confirm('Supprimer cette activité ?')) deleteRun(r.id);
                }}
                className="text-slate-700 active:text-red-400 p-1 shrink-0"
                aria-label="Supprimer"
              >
                <TrashIcon className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
