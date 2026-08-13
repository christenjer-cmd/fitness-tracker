import { useState } from 'react';
import { useStore } from '../store/useStore';
import GarminImport from '../components/GarminImport';
import { RunIcon, TrashIcon } from '../components/icons';
import { RunIllustration } from '../components/illustrations';
import { formatDate } from '../utils';

export default function RunPage() {
  const runs = useStore((s) => s.runs);
  const addRun = useStore((s) => s.addRun);
  const deleteRun = useStore((s) => s.deleteRun);

  const [distance, setDistance] = useState('');
  const [duration, setDuration] = useState('');
  const [heartRate, setHeartRate] = useState('');
  const [notes, setNotes] = useState('');

  const pace = (() => {
    const d = parseFloat(distance);
    const t = parseFloat(duration);
    if (!d || !t) return null;
    const paceMin = t / d;
    const min = Math.floor(paceMin);
    const sec = Math.round((paceMin - min) * 60);
    return `${min}:${sec.toString().padStart(2, '0')}`;
  })();

  function submit() {
    const d = parseFloat(distance);
    const t = parseFloat(duration);
    if (!d || !t) return;
    addRun({
      date: new Date().toISOString().slice(0, 10),
      distanceKm: d,
      durationMin: t,
      avgPaceMinPerKm: t / d,
      avgHeartRate: heartRate ? Number(heartRate) : undefined,
      notes: notes || undefined,
      source: 'manuel',
    });
    setDistance('');
    setDuration('');
    setHeartRate('');
    setNotes('');
  }

  const totalKm = runs.reduce((acc, r) => acc + r.distanceKm, 0);

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="card p-4 space-y-3">
        <div className="flex items-center gap-2.5">
          <span className="w-9 h-9 rounded-xl bg-accent/10 border border-accent/20 grid place-items-center shrink-0">
            <RunIcon className="w-[18px] h-[18px] text-accent" />
          </span>
          <h2 className="font-bold">Nouvelle course</h2>
        </div>

        <div className="flex gap-2">
          <div className="flex-1">
            <label className="label-micro">Distance (km)</label>
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
            <div className="bg-surface-sunken border border-line rounded-xl px-3 py-2.5 mt-1 text-sm">
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
            placeholder="optionnel"
            className="field w-full px-3 py-2.5 mt-1 text-sm"
          />
        </div>

        <button onClick={submit} disabled={!pace} className="btn-primary w-full py-3">
          Enregistrer la course
        </button>
      </div>

      <GarminImport />

      <div>
        <div className="flex items-baseline justify-between mb-2.5">
          <p className="label-micro">Historique des courses</p>
          {runs.length > 0 && (
            <p className="text-xs text-slate-500 tabular-nums">
              {runs.length} · {totalKm.toFixed(1)} km
            </p>
          )}
        </div>

        {runs.length === 0 && (
          <div className="card p-6 flex flex-col items-center text-center">
            <RunIllustration className="w-full max-w-[13rem] h-auto" />
            <p className="text-slate-500 text-sm mt-1">Aucune course enregistrée.</p>
          </div>
        )}

        <div className="space-y-2">
          {runs.map((r) => (
            <div key={r.id} className="card p-3.5 flex items-center gap-3">
              <span className="w-10 h-10 rounded-xl bg-surface-sunken grid place-items-center shrink-0">
                <RunIcon className="w-5 h-5 text-slate-500" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-bold tabular-nums">
                  {r.distanceKm} km
                  <span className="text-slate-500 font-normal"> · {Math.round(r.durationMin)} min</span>
                </p>
                <p className="text-xs text-slate-500 mt-0.5 truncate">
                  {formatDate(r.date)}
                  {r.avgHeartRate ? ` · ${r.avgHeartRate} bpm` : ''}
                  {r.avgPaceMinPerKm
                    ? ` · ${Math.floor(r.avgPaceMinPerKm)}:${Math.round(
                        (r.avgPaceMinPerKm % 1) * 60
                      )
                        .toString()
                        .padStart(2, '0')}/km`
                    : ''}
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
                  if (window.confirm('Supprimer cette course ?')) deleteRun(r.id);
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
