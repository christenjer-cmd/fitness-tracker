import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Exercise, RunSession, SetEntry, WorkoutExercise, WorkoutSession } from '../types';
import { EXERCISES } from '../data/exercises';

function uid() {
  return crypto.randomUUID();
}

interface StoreState {
  customExercises: Exercise[];
  workouts: WorkoutSession[];
  runs: RunSession[];

  // Exercises
  addCustomExercise: (ex: Omit<Exercise, 'id' | 'isCustom'>) => Exercise;
  allExercises: () => Exercise[];

  // Workouts
  startWorkout: () => WorkoutSession;
  getActiveWorkout: () => WorkoutSession | undefined;
  finishWorkout: (workoutId: string) => void;
  deleteWorkout: (workoutId: string) => void;
  addExerciseToWorkout: (workoutId: string, exerciseId: string) => void;
  removeExerciseFromWorkout: (workoutId: string, workoutExerciseId: string) => void;
  addSet: (workoutId: string, workoutExerciseId: string, prev?: Partial<SetEntry>) => void;
  updateSet: (workoutId: string, workoutExerciseId: string, setId: string, patch: Partial<SetEntry>) => void;
  removeSet: (workoutId: string, workoutExerciseId: string, setId: string) => void;

  // Historique / réutilisation
  lastPerformance: (exerciseId: string) => { date: string; sets: SetEntry[] } | undefined;
  repeatWorkout: (workoutId: string) => WorkoutSession;

  // Runs
  addRun: (run: Omit<RunSession, 'id'>) => void;
  addRuns: (runs: Omit<RunSession, 'id'>[]) => number;
  deleteRun: (runId: string) => void;
}

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      customExercises: [],
      workouts: [],
      runs: [],

      addCustomExercise: (ex) => {
        const newEx: Exercise = { ...ex, id: uid(), isCustom: true };
        set((state) => ({ customExercises: [...state.customExercises, newEx] }));
        return newEx;
      },
      allExercises: () => [...EXERCISES, ...get().customExercises],

      startWorkout: () => {
        const existing = get().workouts.find((w) => !w.finishedAt);
        if (existing) return existing;
        const w: WorkoutSession = {
          id: uid(),
          date: new Date().toISOString().slice(0, 10),
          startedAt: new Date().toISOString(),
          exercises: [],
        };
        set((state) => ({ workouts: [w, ...state.workouts] }));
        return w;
      },
      getActiveWorkout: () => get().workouts.find((w) => !w.finishedAt),
      finishWorkout: (workoutId) => {
        set((state) => ({
          workouts: state.workouts.map((w) =>
            w.id === workoutId ? { ...w, finishedAt: new Date().toISOString() } : w
          ),
        }));
      },
      deleteWorkout: (workoutId) => {
        set((state) => ({ workouts: state.workouts.filter((w) => w.id !== workoutId) }));
      },
      addExerciseToWorkout: (workoutId, exerciseId) => {
        set((state) => ({
          workouts: state.workouts.map((w) => {
            if (w.id !== workoutId) return w;
            const we: WorkoutExercise = { id: uid(), exerciseId, sets: [] };
            return { ...w, exercises: [...w.exercises, we] };
          }),
        }));
      },
      removeExerciseFromWorkout: (workoutId, workoutExerciseId) => {
        set((state) => ({
          workouts: state.workouts.map((w) =>
            w.id !== workoutId
              ? w
              : { ...w, exercises: w.exercises.filter((e) => e.id !== workoutExerciseId) }
          ),
        }));
      },
      addSet: (workoutId, workoutExerciseId, prev) => {
        set((state) => ({
          workouts: state.workouts.map((w) => {
            if (w.id !== workoutId) return w;
            return {
              ...w,
              exercises: w.exercises.map((e) => {
                if (e.id !== workoutExerciseId) return e;
                const last = e.sets[e.sets.length - 1];
                // Si aucune série encore, reprendre la série correspondante de la dernière séance
                const prevSession = last ? undefined : get().lastPerformance(e.exerciseId);
                const template = last ?? prevSession?.sets[e.sets.length];
                const newSet: SetEntry = {
                  id: uid(),
                  reps: prev?.reps ?? template?.reps ?? 10,
                  weightKg: prev?.weightKg ?? template?.weightKg ?? 0,
                  completed: false,
                };
                return { ...e, sets: [...e.sets, newSet] };
              }),
            };
          }),
        }));
      },
      updateSet: (workoutId, workoutExerciseId, setId, patch) => {
        set((state) => ({
          workouts: state.workouts.map((w) => {
            if (w.id !== workoutId) return w;
            return {
              ...w,
              exercises: w.exercises.map((e) => {
                if (e.id !== workoutExerciseId) return e;
                return {
                  ...e,
                  sets: e.sets.map((s) => (s.id === setId ? { ...s, ...patch } : s)),
                };
              }),
            };
          }),
        }));
      },
      removeSet: (workoutId, workoutExerciseId, setId) => {
        set((state) => ({
          workouts: state.workouts.map((w) => {
            if (w.id !== workoutId) return w;
            return {
              ...w,
              exercises: w.exercises.map((e) =>
                e.id !== workoutExerciseId ? e : { ...e, sets: e.sets.filter((s) => s.id !== setId) }
              ),
            };
          }),
        }));
      },

      lastPerformance: (exerciseId) => {
        const finished = get()
          .workouts.filter((w) => w.finishedAt)
          .sort((a, b) => (a.startedAt < b.startedAt ? 1 : -1));
        for (const w of finished) {
          const we = w.exercises.find((e) => e.exerciseId === exerciseId && e.sets.length > 0);
          if (we) return { date: w.date, sets: we.sets };
        }
        return undefined;
      },
      repeatWorkout: (workoutId) => {
        const source = get().workouts.find((w) => w.id === workoutId);
        const active = get().workouts.find((w) => !w.finishedAt);
        if (active) return active;
        const w: WorkoutSession = {
          id: uid(),
          date: new Date().toISOString().slice(0, 10),
          startedAt: new Date().toISOString(),
          exercises: (source?.exercises ?? []).map((e) => ({
            id: uid(),
            exerciseId: e.exerciseId,
            sets: e.sets.map((s) => ({ ...s, id: uid(), completed: false })),
          })),
        };
        set((state) => ({ workouts: [w, ...state.workouts] }));
        return w;
      },

      addRun: (run) => {
        const r: RunSession = { ...run, id: uid() };
        set((state) => ({ runs: [r, ...state.runs] }));
      },
      addRuns: (incoming) => {
        const known = new Set(get().runs.map((r) => r.externalId).filter(Boolean));
        const fresh = incoming.filter((r) => !r.externalId || !known.has(r.externalId));
        if (fresh.length === 0) return 0;
        const created: RunSession[] = fresh.map((r) => ({ ...r, id: uid() }));
        set((state) => ({
          runs: [...created, ...state.runs].sort((a, b) => (a.date < b.date ? 1 : -1)),
        }));
        return created.length;
      },
      deleteRun: (runId) => {
        set((state) => ({ runs: state.runs.filter((r) => r.id !== runId) }));
      },
    }),
    { name: 'fitness-tracker-storage' }
  )
);
