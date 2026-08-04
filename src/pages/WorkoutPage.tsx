import { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import ExercisePicker from '../components/ExercisePicker';
import RestTimer from '../components/RestTimer';
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
      <div className="flex flex-col items-center mt-16 gap-6">
        <p className="text-slate-400 text-center">Pas de séance en cours.</p>
        <button
          onClick={() => startWorkout()}
          className="bg-accent hover:bg-accent-dark text-white rounded-xl px-6 py-3 font-semibold"
        >
          Démarrer une séance vide
        </button>

        {lastFinished.length > 0 && (
          <div className="w-full space-y-2">
            <p className="text-sm text-slate-400 text-center">ou refaire une séance récente :</p>
            {lastFinished.map((w) => (
              <button
                key={w.id}
                onClick={() => repeatWorkout(w.id)}
                className="w-full bg-slate-900 rounded-xl px-4 py-3 text-left active:bg-slate-800"
              >
                <p className="font-medium">{formatDate(w.date)}</p>
                <p className="text-xs text-slate-400 truncate">
                  {w.exercises
                    .map((e) => exercisesById[e.exerciseId]?.name)
                    .filter(Boolean)
                    .join(' · ') || 'Séance vide'}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">{formatDate(activeWorkout.date)}</p>
          <p className="text-xs text-slate-400">
            En cours · {formatDuration(activeWorkout.startedAt)}
          </p>
        </div>
        <button
          onClick={() => {
            if (window.confirm('Terminer la séance ?')) finishWorkout(activeWorkout.id);
          }}
          className="bg-accent text-white text-sm font-semibold px-3 py-1.5 rounded-lg"
        >
          Terminer
        </button>
      </div>

      <div className="flex gap-2">
        <button
          onClick={toggleRpe}
          className={`text-xs px-3 py-1 rounded-full ${
            showRpe ? 'bg-accent text-white' : 'bg-slate-800 text-slate-400'
          }`}
        >
          RPE {showRpe ? 'affiché' : 'masqué'}
        </button>
        <button
          onClick={toggleSound}
          className={`text-xs px-3 py-1 rounded-full ${
            soundEnabled ? 'bg-accent text-white' : 'bg-slate-800 text-slate-400'
          }`}
        >
          {soundEnabled ? '🔔 Son actif' : '🔕 Son coupé'}
        </button>
      </div>

      {activeWorkout.exercises.map((we) => {
        const ex = exercisesById[we.exerciseId];
        const prev = lastPerformance(we.exerciseId);
        return (
          <div key={we.id} className="bg-slate-900 rounded-xl p-3">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-semibold">{ex?.name ?? 'Exercice'}</h3>
              <button
                onClick={() => removeExerciseFromWorkout(activeWorkout.id, we.id)}
                className="text-slate-500 text-xs"
              >
                Retirer
              </button>
            </div>

            {prev && (
              <p className="text-xs text-slate-500 mb-2">
                Dernière fois ({formatDate(prev.date)}) :{' '}
                {prev.sets.map((s) => `${s.weightKg}kg×${s.reps}`).join(' · ')}
              </p>
            )}

            <div className="space-y-1.5">
              {we.sets.map((s, i) => (
                <div key={s.id} className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 w-5">{i + 1}</span>
                  <button
                    onClick={() => {
                      const nowCompleted = !s.completed;
                      updateSet(activeWorkout.id, we.id, s.id, { completed: nowCompleted });
                      if (nowCompleted) setRest({ at: Date.now(), exerciseId: we.exerciseId });
                    }}
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0 ${
                      s.completed ? 'bg-accent text-white' : 'bg-slate-800 text-slate-500'
                    }`}
                  >
                    {s.completed ? '✓' : ''}
                  </button>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={s.weightKg}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) =>
                      updateSet(activeWorkout.id, we.id, s.id, { weightKg: Number(e.target.value) })
                    }
                    className="bg-slate-800 rounded-lg px-2 py-1.5 text-sm w-16 text-center"
                  />
                  <span className="text-xs text-slate-500">kg ×</span>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={s.reps}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) =>
                      updateSet(activeWorkout.id, we.id, s.id, { reps: Number(e.target.value) })
                    }
                    className="bg-slate-800 rounded-lg px-2 py-1.5 text-sm w-14 text-center"
                  />
                  <span className="text-xs text-slate-500">{showRpe ? '' : 'reps'}</span>
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
                        className="bg-slate-800 rounded-lg px-1 py-1.5 text-sm w-11 text-center"
                      />
                      <span className="text-xs text-slate-500">RPE</span>
                    </>
                  )}
                  <button
                    onClick={() => removeSet(activeWorkout.id, we.id, s.id)}
                    className="text-slate-500 text-xs ml-auto px-1"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={() => addSet(activeWorkout.id, we.id)}
              className="mt-2 w-full text-accent text-sm font-medium border border-dashed border-slate-700 rounded-lg py-1.5"
            >
              + Ajouter une série
            </button>

            <input
              value={we.notes ?? ''}
              onChange={(e) => setExerciseNotes(activeWorkout.id, we.id, e.target.value)}
              placeholder="Note (sensation, réglage machine...)"
              className="mt-2 w-full bg-transparent text-xs text-slate-300 placeholder:text-slate-600 border-b border-slate-800 focus:border-accent outline-none py-1"
            />
          </div>
        );
      })}

      <button
        onClick={() => setPickerOpen(true)}
        className="w-full bg-slate-800 text-accent font-semibold rounded-xl py-3"
      >
        + Ajouter un exercice
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
