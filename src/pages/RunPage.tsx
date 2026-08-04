import { useState } from 'react';
import { useStore } from '../store/useStore';
import GarminImport from '../components/GarminImport';
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
    return `${min}:${sec.toString().padStart(2, '0')} /km`;
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

  return (
    <div className="space-y-4">
      <div className="bg-slate-900 rounded-xl p-4 space-y-3">
        <h2 className="font-semibold">Nouvelle course</h2>
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="text-xs text-slate-400">Distance (km)</label>
            <input
              type="number"
              inputMode="decimal"
              value={distance}
              onChange={(e) => setDistance(e.target.value)}
              className="w-full bg-slate-800 rounded-lg px-3 py-2 mt-1"
            />
          </div>
          <div className="flex-1">
            <label className="text-xs text-slate-400">Durée (min)</label>
            <input
              type="number"
              inputMode="decimal"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="w-full bg-slate-800 rounded-lg px-3 py-2 mt-1"
            />
          </div>
        </div>
        <div>
          <label className="text-xs text-slate-400">FC moyenne (optionnel)</label>
          <input
            type="number"
            inputMode="numeric"
            value={heartRate}
            onChange={(e) => setHeartRate(e.target.value)}
            className="w-full bg-slate-800 rounded-lg px-3 py-2 mt-1"
          />
        </div>
        <div>
          <label className="text-xs text-slate-400">Notes (optionnel)</label>
          <input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full bg-slate-800 rounded-lg px-3 py-2 mt-1"
          />
        </div>
        {pace && <p className="text-sm text-accent">Allure : {pace}</p>}
        <button
          onClick={submit}
          className="w-full bg-accent text-white font-semibold rounded-lg py-2.5"
        >
          Enregistrer la course
        </button>
      </div>

      <GarminImport />

      <div className="space-y-2">
        <h3 className="text-sm text-slate-400 font-medium">Historique des courses</h3>
        {runs.length === 0 && <p className="text-slate-500 text-sm">Aucune course enregistrée.</p>}
        {runs.map((r) => (
          <div key={r.id} className="bg-slate-900 rounded-xl p-3 flex items-center justify-between">
            <div>
              <p className="font-medium">
                {r.distanceKm} km · {Math.round(r.durationMin)} min
              </p>
              <p className="text-xs text-slate-400">
                {formatDate(r.date)}
                {r.avgHeartRate ? ` · ${r.avgHeartRate} bpm` : ''}
                {r.source === 'garmin' ? ' · Garmin' : ''}
              </p>
              {r.notes && <p className="text-xs text-slate-500 mt-1">{r.notes}</p>}
            </div>
            <button
              onClick={() => {
                if (window.confirm('Supprimer cette course ?')) deleteRun(r.id);
              }}
              className="text-slate-500 text-xs"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
