import { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import ExercisePicker from '../components/ExercisePicker';
import RestTimer from '../components/RestTimer';
import { CheckIcon, CloseIcon, DumbbellIcon, PlusIcon } from '../components/icons';
import { LiftIllustration } from '../components/illustrations';
import { formatDate, formatDuration } from '../utils';

export default function WorkoutPage() {
  const activeWorkout = useStore((s) => s.getActiveWorkout());
  const workouts = useStore((s) => s.workouts);
  const startWorkout = useStore((s) => s.startWorkout);
  const repeatWorkout = useStore((s) => s.repeatWorkout);
  const finishWorkout = useStore((s) => s.finishWorkout);
  const addExerciseToWorkout = useStore((s) => s.addExerciseToWorkout);
  const removeExerciseFromWorkout = useStore((s) => s.removeExerciseFromWorkout);
  const addSet = useStore((s) => s.addSet);
  const updateSet = useStore((s) => s.updateSet);
  const removeSet = useStore((s) => s.removeSet);
  const setExerciseNotes = useStore((s) => s.setExerciseNotes);
  const lastPerformance = useStore((s) => s.lastPerformance);
  const allExercises = useStore((s) => s.allExercises);
  const showRpe = useStore((s) => s.showRpe);
  const toggleRpe = useStore((s) => s.toggleRpe);
  const soundEnabled = useStore((s) => s.soundEnabled);
  const toggleSound = useStore((s) => s.toggleSound);
  const exercisesById = Object.fromEntries(allExercises().map((e) => [e.id, e]));

  const [pickerOpen, setPickerOpen] = useState(false);
  const [rest, setRest] = useState<{ at: number; exerciseId: string } | null>(null);

  // Re-render chaque minute pour la durée de séance
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 30000);
    return () => clearInterval(id);
  }, []);

  if (!activeWorkout) {
    const lastFinished = workouts.filter((w) => w.finishedAt).slice(0, 3);
    return (
      <div className="animate-fade-in">
        <div className="card-glow p-6 flex flex-col items-center text-center">
          <LiftIllustration className="w-full max-w-[15rem] h-auto" />
          <h2 className="text-xl font-bold tracking-tight mt-1">Prêt à soulever ?</h2>
          <p className="text-sm text-slate-500 mt-1 mb-6">Aucune séance en cours.</p>
          <button onClick={() => startWorkout()} className="btn-primary w-full py-3.5">
            Démarrer une séance
          </button>
        </div>

        {lastFinished.length > 0 && (
          <div className="mt-7">
            <p className="label-micro mb-2.5">Reprendre une séance</p>
            <div className="space-y-2">
              {lastFinished.map((w) => (
                <button
                  key={w.id}
                  onClick={() => repeatWorkout(w.id)}
                  className="card w-full px-4 py-3 text-left active:scale-[0.99] transition flex items-center gap-3"
                >
                  <span className="w-9 h-9 rounded-xl bg-surface-raised grid place-items-center shrink-0">
                    <DumbbellIcon className="w-[18px] h-[18px] text-slate-400" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold">{formatDate(w.date)}</span>
                    <span className="block text-xs text-slate-500 truncate">
                      {w.exercises
                        .map((e) => exercisesById[e.exerciseId]?.name)
                        .filter(Boolean)
                        .join(' · ') || 'Séance vide'}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  const totalSets = activeWorkout.exercises.reduce((acc, e) => acc + e.sets.length, 0);
  const doneSets = activeWorkout.exercises.reduce(
    (acc, e) => acc + e.sets.filter((s) => s.completed).length,
    0
  );
  const volume = activeWorkout.exercises.reduce(
    (acc, e) => acc + e.sets.reduce((v, s) => v + (s.completed ? s.weightKg * s.reps : 0), 0),
    0
  );

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="card-glow p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse-ring" />
              <span className="label-micro text-accent">Séance en cours</span>
            </div>
            <p className="text-lg font-bold mt-1 truncate">{formatDate(activeWorkout.date)}</p>
          </div>
          <button
            onClick={() => {
              if (window.confirm('Terminer la séance ?')) finishWorkout(activeWorkout.id);
            }}
            className="btn-primary text-sm px-4 py-2 shrink-0"
          >
            Terminer
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2 mt-4">
          {[
            { label: 'Durée', value: formatDuration(activeWorkout.startedAt) },
            { label: 'Séries', value: `${doneSets}/${totalSets}` },
            { label: 'Volume', value: `${Math.round(volume)} kg` },
          ].map((stat) => (
            <div key={stat.label} className="bg-black/25 border border-white/[0.06] rounded-xl px-3 py-2.5">
              <p className="label-micro">{stat.label}</p>
              <p className="text-base font-bold tabular-nums mt-0.5 text-gradient">{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="flex gap-2 mt-3">
          <button onClick={toggleRpe} className={showRpe ? 'chip-on' : 'chip-off'}>
            RPE
          </button>
          <button onClick={toggleSound} className={soundEnabled ? 'chip-on' : 'chip-off'}>
            {soundEnabled ? 'Son actif' : 'Son coupé'}
          </button>
        </div>
      </div>

      {activeWorkout.exercises.map((we) => {
        const ex = exercisesById[we.exerciseId];
        const prev = lastPerformance(we.exerciseId);
        return (
          <div key={we.id} className="card p-4 animate-fade-up">
            <div className="flex items-start justify-between gap-2 mb-1">
              <h3 className="font-bold leading-tight">{ex?.name ?? 'Exercice'}</h3>
              <button
                onClick={() => removeExerciseFromWorkout(activeWorkout.id, we.id)}
                className="text-slate-600 active:text-slate-400 p-1 -m-1 shrink-0"
                aria-label="Retirer l'exercice"
              >
                <CloseIcon className="w-4 h-4" />
              </button>
            </div>

            {prev && (
              <p className="text-xs text-slate-500 mb-3">
                <span className="text-slate-600">Dernière fois · </span>
                {prev.sets.map((s) => `${s.weightKg}×${s.reps}`).join(' · ')}
              </p>
            )}

            <div className="space-y-2">
              {we.sets.map((s, i) => (
                <div key={s.id} className="flex items-center gap-2">
                  <span className="text-xs text-slate-600 w-3 tabular-nums shrink-0">{i + 1}</span>
                  <button
                    onClick={() => {
                      const nowCompleted = !s.completed;
                      updateSet(activeWorkout.id, we.id, s.id, { completed: nowCompleted });
                      if (nowCompleted) setRest({ at: Date.now(), exerciseId: we.exerciseId });
                    }}
                    className={`w-9 h-9 rounded-xl grid place-items-center shrink-0 transition active:scale-90 ${
                      s.completed
                        ? 'bg-accent text-accent-ink shadow-glow'
                        : 'bg-surface-sunken border border-line text-slate-700'
                    }`}
                    aria-label={s.completed ? 'Série validée' : 'Valider la série'}
                  >
                    <CheckIcon className="w-4 h-4" />
                  </button>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={s.weightKg}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) =>
                      updateSet(activeWorkout.id, we.id, s.id, { weightKg: Number(e.target.value) })
                    }
                    className="field px-2 py-2 text-sm w-16 text-center font-semibold"
                  />
                  <span className="text-[10px] text-slate-600">KG</span>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={s.reps}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) =>
                      updateSet(activeWorkout.id, we.id, s.id, { reps: Number(e.target.value) })
                    }
                    className="field px-2 py-2 text-sm w-14 text-center font-semibold"
                  />
                  <span className="text-[10px] text-slate-600">{showRpe ? '' : 'REPS'}</span>
                  {showRpe && (
                    <>
                      <input
                        type="number"
                        inputMode="numeric"
                        min={1}
                        max={10}
                        step={0.5}
                        placeholder="-"
                        value={s.rpe ?? ''}
                        onFocus={(e) => e.target.select()}
                        onChange={(e) =>
                          updateSet(activeWorkout.id, we.id, s.id, {
                            rpe: e.target.value === '' ? undefined : Number(e.target.value),
                          })
                        }
                        className="field px-1 py-2 text-sm w-11 text-center font-semibold"
                      />
                      <span className="text-[10px] text-slate-600">RPE</span>
                    </>
                  )}
                  <button
                    onClick={() => removeSet(activeWorkout.id, we.id, s.id)}
                    className="text-slate-700 active:text-slate-500 ml-auto p-1 shrink-0"
                    aria-label="Supprimer la série"
                  >
                    <CloseIcon className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={() => addSet(activeWorkout.id, we.id)}
              className="mt-3 w-full text-accent text-sm font-semibold border border-dashed border-accent/25 rounded-xl py-2 active:bg-accent/5 transition flex items-center justify-center gap-1.5"
            >
              <PlusIcon className="w-4 h-4" />
              Série
            </button>

            <input
              value={we.notes ?? ''}
              onChange={(e) => setExerciseNotes(activeWorkout.id, we.id, e.target.value)}
              placeholder="Note (sensation, réglage machine...)"
              className="mt-3 w-full bg-transparent text-xs text-slate-300 placeholder:text-slate-700 border-b border-line focus:border-accent/50 outline-none py-1.5 transition"
            />
          </div>
        );
      })}

      <button
        onClick={() => setPickerOpen(true)}
        className="btn-accent-soft w-full py-3.5 flex items-center justify-center gap-2"
      >
        <PlusIcon className="w-5 h-5" />
        Ajouter un exercice
      </button>

      {pickerOpen && (
        <ExercisePicker
          onClose={() => setPickerOpen(false)}
          onSelect={(exerciseId) => {
            addExerciseToWorkout(activeWorkout.id, exerciseId);
            setPickerOpen(false);
          }}
        />
      )}

      {rest !== null && (
        <RestTimer
          exerciseId={rest.exerciseId}
          startedAt={rest.at}
          onDismiss={() => setRest(null)}
        />
      )}
    </div>
  );
}
