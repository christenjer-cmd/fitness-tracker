export type MuscleGroup =
  | 'pectoraux'
  | 'dos'
  | 'epaules'
  | 'biceps'
  | 'triceps'
  | 'jambes'
  | 'fessiers'
  | 'abdominaux'
  | 'mollets'
  | 'avant-bras'
  | 'cardio'
  | 'corps-entier';

export type Equipment =
  | 'barre'
  | 'halteres'
  | 'machine'
  | 'poulie'
  | 'poids-du-corps'
  | 'kettlebell'
  | 'elastique'
  | 'autre';

export interface Exercise {
  id: string;
  name: string;
  muscleGroups: MuscleGroup[];
  equipment: Equipment;
  isCustom?: boolean;
}

export interface SetEntry {
  id: string;
  reps: number;
  weightKg: number;
  rpe?: number;
  completed: boolean;
}

export interface WorkoutExercise {
  id: string;
  exerciseId: string;
  sets: SetEntry[];
  notes?: string;
}

export interface WorkoutSession {
  id: string;
  date: string; // ISO date
  startedAt: string;
  finishedAt?: string;
  exercises: WorkoutExercise[];
  notes?: string;
  /** Identifiant de l'activité Garmin d'origine, pour éviter les doublons. */
  externalId?: string;
}

/** Séance de musculation venant d'un fichier de synchronisation Garmin. */
export interface ImportedWorkout {
  externalId: string;
  date: string;
  startedAt: string;
  finishedAt: string;
  notes?: string;
  exercises: { name: string; sets: { reps: number; weightKg: number }[] }[];
}

/** 'cardio' regroupe marche, marche inclinée, tapis, escaliers, elliptique. */
export type RunSport = 'course' | 'cardio';

export interface RunSession {
  id: string;
  date: string;
  distanceKm: number;
  durationMin: number;
  avgPaceMinPerKm?: number;
  avgHeartRate?: number;
  notes?: string;
  source: 'manuel' | 'garmin';
  /** Sépare la course du reste : les allures ne se comparent pas. */
  sport: RunSport;
  /** Identifiant de l'activité d'origine, pour ne pas réimporter deux fois le même fichier. */
  externalId?: string;
}
