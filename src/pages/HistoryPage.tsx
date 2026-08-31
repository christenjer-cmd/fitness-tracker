import { useMemo, useRef, useState } from 'react';
import GarminImport from '../components/GarminImport';
import { useStore } from '../store/useStore';
import { ChevronIcon, DumbbellIcon, TrashIcon } from '../components/icons';
import { ProgressIllustration } from '../components/illustrations';
import { formatDate, formatDuration } from '../utils';

export default function HistoryPage() {
  // Le filtrage doit rester hors du sélecteur : un nouveau tableau à chaque rendu
  // ferait boucler useSyncExternalStore.
  const allWorkouts = useStore((s) => s.workouts);
  const workouts = useMemo(() => allWorkouts.filter((w) => w.finishedAt), [allWorkouts]);
  const runs = useStore((s) => s.runs);
  const customExercises = useStore((s) => s.customExercises);
  const deleteWorkout = useStore((s) => s.deleteWorkout);
  const repeatWorkout = useStore((s) => s.repeatWorkout);
  const allExercises = useStore((s) => s.allExercises);
  const exercisesById = Object.fromEntries(allExercises().map((e) => [e.id, e]));

  const [tab, setTab] = useState<'seances' | 'progression'>('seances');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [selectedExercise, setSelectedExercise] = useState<string>('');
  const [metric, setMetric] = useState<'best' | 'volume'>('best');
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
        // Formule d'Epley : permet de comparer une série lourde et une série longue.
        const oneRm = Math.max(...we.sets.map((s) => s.weightKg * (1 + s.reps / 30)));
        return { date: w.date, best, volume, oneRm, sets: we.sets };
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
    <div className="space-y-4 animate-fade-in">
      <div className="flex gap-1.5 p-1 bg-surface-sunken border border-line rounded-2xl">
        {(['seances', 'progression'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 rounded-xl text-sm font-semibold transition ${
              tab === t ? 'bg-surface-raised text-accent shadow-card' : 'text-slate-500'
            }`}
          >
            {t === 'seances' ? 'Séances' : 'Progression'}
          </button>
        ))}
      </div>

      {tab === 'seances' && (
        <div className="space-y-2">
          {workouts.length === 0 && (
            <div className="card p-6 flex flex-col items-center text-center">
              <ProgressIllustration className="w-full max-w-[13rem] h-auto" />
              <p className="text-slate-500 text-sm mt-1">Aucune séance terminée pour l'instant.</p>
            </div>
          )}
          {workouts.map((w) => {
            const totalSets = w.exercises.reduce((acc, e) => acc + e.sets.length, 0);
            const isOpen = expanded === w.id;
            return (
              <div key={w.id} className="card overflow-hidden">
                <button
                  onClick={() => setExpanded(isOpen ? null : w.id)}
                  className="w-full text-left px-4 py-3.5 flex items-center gap-3"
                >
                  <span className="w-10 h-10 rounded-xl bg-surface-sunken grid place-items-center shrink-0">
                    <DumbbellIcon className="w-5 h-5 text-slate-500" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-bold text-sm">{formatDate(w.date)}</span>
                    <span className="block text-xs text-slate-500 mt-0.5 tabular-nums">
                      {w.exercises.length} exercice{w.exercises.length > 1 ? 's' : ''} ·{' '}
                      {totalSets} série{totalSets > 1 ? 's' : ''} ·{' '}
                      {formatDuration(w.startedAt, w.finishedAt)}
                    </span>
                  </span>
                  <ChevronIcon
                    className={`w-4 h-4 text-slate-600 shrink-0 transition-transform ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="px-4 pb-4 space-y-2.5 animate-fade-up">
                    <div className="h-px bg-line" />
                    {w.exercises.map((we) => (
                      <div key={we.id}>
                        <p className="font-semibold text-sm">
                          {exercisesById[we.exerciseId]?.name ?? 'Exercice'}
                        </p>
                        <p className="text-slate-500 text-xs mt-0.5 tabular-nums">
                          {we.sets.map((s) => `${s.weightKg}×${s.reps}`).join(' · ') ||
                            'Aucune série'}
                        </p>
                        {we.notes && (
                          <p className="text-xs text-slate-600 mt-0.5 italic">{we.notes}</p>
                        )}
                      </div>
                    ))}
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => repeatWorkout(w.id)}
                        className="btn-accent-soft flex-1 py-2 text-xs"
                      >
                        Refaire cette séance
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm('Supprimer définitivement cette séance ?'))
                            deleteWorkout(w.id);
                        }}
                        className="btn px-3 py-2 text-slate-600 active:text-red-400"
                        aria-label="Supprimer la séance"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {tab === 'progression' && (
        <div className="space-y-3">
          <select
            value={selectedExercise}
            onChange={(e) => setSelectedExercise(e.target.value)}
            className="field w-full px-3 py-3 text-sm font-medium"
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
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'Record', value: Math.max(...progression.map((p) => p.best)), unit: 'kg', accent: true },
                  {
                    label: '1RM estimé',
                    value: Math.round(Math.max(...progression.map((p) => p.oneRm))),
                    unit: 'kg',
                    accent: true,
                  },
                  { label: 'Séances', value: progression.length, unit: '', accent: false },
                ].map((stat) => (
                  <div key={stat.label} className="card p-3">
                    <p className="label-micro">{stat.label}</p>
                    <p
                      className={`text-xl font-bold leading-tight tabular-nums mt-1 ${
                        stat.accent ? 'text-accent' : ''
                      }`}
                    >
                      {stat.value}
                      {stat.unit && (
                        <span className="text-xs font-medium text-slate-500"> {stat.unit}</span>
                      )}
                    </p>
                  </div>
                ))}
              </div>

              <div className="card p-4">
                <div className="flex items-center justify-between mb-4">
                  <p className="label-micro">
                    {metric === 'best' ? 'Poids max / séance' : 'Volume / séance'}
                  </p>
                  <div className="flex gap-1 p-0.5 bg-surface-sunken rounded-lg">
                    {(['best', 'volume'] as const).map((m) => (
                      <button
                        key={m}
                        onClick={() => setMetric(m)}
                        className={`text-[10px] px-2.5 py-1 rounded-md transition ${
                          metric === m
                            ? 'bg-accent text-accent-ink font-bold'
                            : 'text-slate-500'
                        }`}
                      >
                        {m === 'best' ? 'Poids' : 'Volume'}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex items-end gap-1.5 h-28">
                  {progression.slice(-12).map((p, i, shown) => {
                    const values = shown.map((x) => x[metric]);
                    const max = Math.max(...values, 1);
                    const min = Math.min(...values);
                    const value = p[metric];
                    // Les charges varient peu d'une séance à l'autre : partir de zéro
                    // écraserait l'écart. On cadre sur la plage réelle, les valeurs
                    // chiffrées restant affichées au-dessus de chaque barre.
                    const ratio = max > min ? (value - min) / (max - min) : 1;
                    const height = 30 + 70 * ratio;
                    const isLast = i === shown.length - 1;
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1.5 min-w-0 h-full justify-end">
                        <span
                          className={`text-[9px] tabular-nums truncate ${
                            isLast ? 'text-accent font-bold' : 'text-slate-600'
                          }`}
                        >
                          {Math.round(value)}
                        </span>
                        <div
                          className={`w-full rounded-md transition-all ${
                            isLast
                              ? 'bg-gradient-to-t from-accent-dark to-accent-light shadow-glow'
                              : 'bg-gradient-to-t from-accent/30 to-accent/50'
                          }`}
                          style={{ height: `${height}%`, minHeight: 3 }}
                          title={`${formatDate(p.date)} : ${Math.round(value)}`}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                {[...progression].reverse().map((p, i) => (
                  <div key={i} className="card px-4 py-3">
                    <div className="flex justify-between items-baseline gap-2">
                      <span className="font-semibold text-sm">{formatDate(p.date)}</span>
                      <span className="text-slate-500 text-xs tabular-nums shrink-0">
                        max <span className="text-accent font-semibold">{p.best}</span> kg · vol{' '}
                        {Math.round(p.volume)} kg
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1 tabular-nums">
                      {p.sets.map((s) => `${s.weightKg}×${s.reps}`).join(' · ')}
                    </p>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      <GarminImport />

      <div className="pt-2 space-y-2.5">
        <div className="h-px bg-line" />
        <p className="label-micro">Sauvegarde des données</p>
        <div className="flex gap-2">
          <button onClick={exportData} className="btn-soft flex-1 text-sm py-2.5">
            Exporter (JSON)
          </button>
          <button
            onClick={() => fileInput.current?.click()}
            className="btn-soft flex-1 text-sm py-2.5"
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
