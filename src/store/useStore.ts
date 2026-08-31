import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Exercise,
  ImportedWorkout,
  RunSession,
  SetEntry,
  WorkoutExercise,
  WorkoutSession,
} from '../types';
import { EXERCISES } from '../data/exercises';

/** Libellés Garmin qui relèvent du cardio plutôt que de la course. */
const CARDIO_LABEL = /marche|walk|hike|rando|tapis|treadmill|escalier|stair|ellipt/i;

function uid() {
  return crypto.randomUUID();
}

/** Rapproche « Développé couché barre » et « developpe couche barre ». */
function normaliseName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, ' ');
}

interface StoreState {
  customExercises: Exercise[];
  workouts: WorkoutSession[];
  runs: RunSession[];

  // Préférences
  /** Temps de repos retenu par exercice, en secondes. */
  restSecondsByExercise: Record<string, number>;
  showRpe: boolean;
  soundEnabled: boolean;
  setRestSeconds: (exerciseId: string, seconds: number) => void;
  toggleRpe: () => void;
  toggleSound: () => void;

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
  setExerciseNotes: (workoutId: string, workoutExerciseId: string, notes: string) => void;
  updateSet: (workoutId: string, workoutExerciseId: string, setId: string, patch: Partial<SetEntry>) => void;
  removeSet: (workoutId: string, workoutExerciseId: string, setId: string) => void;

  /** Importe des séances Garmin, en ignorant celles déjà connues. Renvoie le nombre ajouté. */
  addWorkouts: (workouts: ImportedWorkout[]) => number;

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

      restSecondsByExercise: {},
      showRpe: false,
      soundEnabled: true,
      setRestSeconds: (exerciseId, seconds) => {
        set((state) => ({
          restSecondsByExercise: { ...state.restSecondsByExercise, [exerciseId]: seconds },
        }));
      },
      toggleRpe: () => set((state) => ({ showRpe: !state.showRpe })),
      toggleSound: () => set((state) => ({ soundEnabled: !state.soundEnabled })),

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

      setExerciseNotes: (workoutId, workoutExerciseId, notes) => {
        set((state) => ({
          workouts: state.workouts.map((w) => {
            if (w.id !== workoutId) return w;
            return {
              ...w,
              exercises: w.exercises.map((e) =>
                e.id !== workoutExerciseId ? e : { ...e, notes: notes || undefined }
              ),
            };
          }),
        }));
      },

      addWorkouts: (incoming) => {
        const existing = get().workouts;
        const known = new Set(existing.map((w) => w.externalId).filter(Boolean));
        const fresh = incoming.filter((w) => !known.has(w.externalId));
        if (fresh.length === 0) return 0;

        // Garmin et le carnet du téléphone décrivent parfois la même séance.
        // Garmin en livre un bloc anonyme, toutes séries confondues, quand le
        // carnet nomme les exercices et sépare les séries : le carnet l'emporte
        // et hérite des horaires réels, seuls que Garmin connaisse vraiment.
        const fromNotes = (id?: string) => Boolean(id?.startsWith('notes:'));
        const clashOf = (w: ImportedWorkout) =>
          existing.find((e) => e.date === w.date && fromNotes(e.externalId) !== fromNotes(w.externalId));

        const superseded = new Set<string>();
        const retained = fresh.filter((w) => {
          const clash = clashOf(w);
          if (!clash) return true;
          // La séance déjà en place vient du carnet : Garmin ne la double pas.
          if (!fromNotes(w.externalId)) return false;
          superseded.add(clash.id);
          return true;
        });
        if (retained.length === 0) return 0;

        // Les exercices absents du catalogue sont créés au passage, une seule
        // fois même s'ils reviennent dans plusieurs séances importées.
        const createdExercises: Exercise[] = [];
        const byName = new Map<string, string>();
        for (const ex of get().allExercises()) byName.set(normaliseName(ex.name), ex.id);

        const resolveExerciseId = (name: string): string => {
          const key = normaliseName(name);
          const existing = byName.get(key);
          if (existing) return existing;
          const created: Exercise = {
            id: uid(),
            name: name.trim(),
            muscleGroups: ['corps-entier'],
            equipment: 'autre',
            isCustom: true,
          };
          createdExercises.push(created);
          byName.set(key, created.id);
          return created.id;
        };

        const sessions: WorkoutSession[] = retained.map((w) => ({
          id: uid(),
          date: w.date,
          startedAt: clashOf(w)?.startedAt ?? w.startedAt,
          finishedAt: clashOf(w)?.finishedAt ?? w.finishedAt,
          notes: w.notes,
          externalId: w.externalId,
          exercises: w.exercises.map((e) => ({
            id: uid(),
            exerciseId: resolveExerciseId(e.name),
            notes: e.notes,
            sets: e.sets.map((s) => ({
              id: uid(),
              reps: s.reps,
              weightKg: s.weightKg,
              completed: true,
            })),
          })),
        }));

        set((state) => ({
          customExercises: [...state.customExercises, ...createdExercises],
          workouts: [...sessions, ...state.workouts.filter((w) => !superseded.has(w.id))].sort(
            (a, b) => (a.startedAt < b.startedAt ? 1 : -1)
          ),
        }));
        return sessions.length;
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
    {
      name: 'fitness-tracker-storage',
      version: 1,
      // Les activités enregistrées avant la séparation n'ont pas de champ sport.
      // Le libellé venu de Garmin permet de le deviner.
      migrate: (persisted, fromVersion) => {
        const state = persisted as { runs?: RunSession[] };
        if (fromVersion < 1 && Array.isArray(state?.runs)) {
          state.runs = state.runs.map((r) =>
            r.sport
              ? r
              : { ...r, sport: CARDIO_LABEL.test(r.notes ?? '') ? 'cardio' : 'course' }
          );
        }
        return state;
      },
    }
  )
);
