import { useMemo, useRef, useState } from 'react';
import { useStore } from '../store/useStore';
import { formatDate, formatDuration } from '../utils';

export default function HistoryPage() {
  const workouts = useStore((s) => s.workouts.filter((w) => w.finishedAt));
  const runs = useStore((s) => s.runs);
  const customExercises = useStore((s) => s.customExercises);
  const deleteWorkout = useStore((s) => s.deleteWorkout);
  const repeatWorkout = useStore((s) => s.repeatWorkout);
  const allExercises = useStore((s) => s.allExercises);
  const exercisesById = Object.fromEntries(allExercises().map((e) => [e.id, e]));

  const [tab, setTab] = useState<'seances' | 'progression'>('seances');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [selectedExercise, setSelectedExercise] = useState<string>('');
  const fileInput = useRef<HTMLInputElement>(null);

  // Exercices réellement pratiqués, pour la vue progression
  const practicedExerciseIds = useMemo(() => {
    const ids = new Set<string>();
    workouts.forEach((w) => w.exercises.forEach((e) => e.sets.length > 0 && ids.add(e.exerciseId)));
    return [...ids];
  }, [workouts]);

  const progression = useMemo(() => {
    if (!selectedExercise) return [];
    return workouts
      .map((w) => {
        const we = w.exercises.find((e) => e.exerciseId === selectedExercise);
        if (!we || we.sets.length === 0) return null;
        const best = Math.max(...we.sets.map((s) => s.weightKg));
        const volume = we.sets.reduce((acc, s) => acc + s.weightKg * s.reps, 0);
        return { date: w.date, best, volume, sets: we.sets };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null)
      .sort((a, b) => (a.date < b.date ? -1 : 1));
  }, [workouts, selectedExercise]);

  function exportData() {
    const data = {
      exportedAt: new Date().toISOString(),
      workouts: useStore.getState().workouts,
      runs: useStore.getState().runs,
      customExercises,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fitness-tracker-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function importData(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result));
        if (!Array.isArray(data.workouts)) throw new Error('format invalide');
        if (!window.confirm('Remplacer toutes les données actuelles par cette sauvegarde ?')) return;
        useStore.setState({
          workouts: data.workouts,
          runs: data.runs ?? [],
          customExercises: data.customExercises ?? [],
        });
      } catch {
        alert('Fichier de sauvegarde invalide.');
      }
    };
    reader.readAsText(file);
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button
          onClick={() => setTab('seances')}
          className={`flex-1 py-2 rounded-lg text-sm font-medium ${
            tab === 'seances' ? 'bg-accent text-white' : 'bg-slate-900 text-slate-400'
          }`}
        >
          Séances
        </button>
        <button
          onClick={() => setTab('progression')}
          className={`flex-1 py-2 rounded-lg text-sm font-medium ${
            tab === 'progression' ? 'bg-accent text-white' : 'bg-slate-900 text-slate-400'
          }`}
        >
          Progression
        </button>
      </div>

      {tab === 'seances' && (
        <>
          {workouts.length === 0 && (
            <p className="text-slate-500 text-sm mt-6 text-center">
              Aucune séance terminée pour l'instant.
            </p>
          )}
          {workouts.map((w) => {
            const totalSets = w.exercises.reduce((acc, e) => acc + e.sets.length, 0);
            const isOpen = expanded === w.id;
            return (
              <div key={w.id} className="bg-slate-900 rounded-xl overflow-hidden">
                <button
                  onClick={() => setExpanded(isOpen ? null : w.id)}
                  className="w-full text-left px-4 py-3 flex items-center justify-between"
                >
                  <div>
                    <p className="font-medium">{formatDate(w.date)}</p>
                    <p className="text-xs text-slate-400">
                      {w.exercises.length} exercices · {totalSets} séries ·{' '}
                      {formatDuration(w.startedAt, w.finishedAt)}
                    </p>
                  </div>
                  <span className="text-slate-500">{isOpen ? '▲' : '▼'}</span>
                </button>

                {isOpen && (
                  <div className="px-4 pb-3 space-y-2">
                    {w.exercises.map((we) => (
                      <div key={we.id} className="text-sm">
                        <p className="font-medium">
                          {exercisesById[we.exerciseId]?.name ?? 'Exercice'}
                        </p>
                        <p className="text-slate-400 text-xs">
                          {we.sets.map((s) => `${s.weightKg}kg×${s.reps}`).join(' · ') ||
                            'Aucune série'}
                        </p>
                      </div>
                    ))}
                    <div className="flex gap-3 mt-2">
                      <button
                        onClick={() => repeatWorkout(w.id)}
                        className="text-accent text-xs font-medium"
                      >
                        Refaire cette séance
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm('Supprimer définitivement cette séance ?'))
                            deleteWorkout(w.id);
                        }}
                        className="text-red-400 text-xs"
                      >
                        Supprimer
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </>
      )}

      {tab === 'progression' && (
        <div className="space-y-3">
          <select
            value={selectedExercise}
            onChange={(e) => setSelectedExercise(e.target.value)}
            className="w-full bg-slate-900 rounded-lg px-3 py-2.5 text-sm"
          >
            <option value="">Choisir un exercice...</option>
            {practicedExerciseIds.map((id) => (
              <option key={id} value={id}>
                {exercisesById[id]?.name ?? id}
              </option>
            ))}
          </select>

          {selectedExercise && progression.length === 0 && (
            <p className="text-slate-500 text-sm text-center">Aucune donnée pour cet exercice.</p>
          )}

          {progression.length > 0 && (
            <>
              <div className="bg-slate-900 rounded-xl p-3">
                <p className="text-xs text-slate-400 mb-2">Poids max par séance (kg)</p>
                <div className="flex items-end gap-1 h-24">
                  {progression.slice(-12).map((p, i) => {
                    const max = Math.max(...progression.map((x) => x.best), 1);
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1">
                        <span className="text-[10px] text-slate-400">{p.best}</span>
                        <div
                          className="w-full bg-accent rounded-t"
                          style={{ height: `${(p.best / max) * 100}%`, minHeight: 2 }}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-1.5">
                {[...progression].reverse().map((p, i) => (
                  <div key={i} className="bg-slate-900 rounded-lg px-3 py-2 text-sm">
                    <div className="flex justify-between">
                      <span className="font-medium">{formatDate(p.date)}</span>
                      <span className="text-slate-400 text-xs">
                        max {p.best} kg · volume {Math.round(p.volume)} kg
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      {p.sets.map((s) => `${s.weightKg}kg×${s.reps}`).join(' · ')}
                    </p>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      <div className="border-t border-slate-800 pt-4 space-y-2">
        <p className="text-xs text-slate-500">Sauvegarde des données</p>
        <div className="flex gap-2">
          <button
            onClick={exportData}
            className="flex-1 bg-slate-900 text-slate-300 text-sm rounded-lg py-2"
          >
            Exporter (JSON)
          </button>
          <button
            onClick={() => fileInput.current?.click()}
            className="flex-1 bg-slate-900 text-slate-300 text-sm rounded-lg py-2"
          >
            Importer
          </button>
          <input
            ref={fileInput}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) importData(f);
              e.target.value = '';
            }}
          />
        </div>
        <p className="text-xs text-slate-600">
          {runs.length} courses · {workouts.length} séances enregistrées
        </p>
      </div>
    </div>
  );
}
