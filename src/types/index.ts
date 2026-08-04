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
}

export interface RunSession {
  id: string;
  date: string;
  distanceKm: number;
  durationMin: number;
  avgPaceMinPerKm?: number;
  avgHeartRate?: number;
  notes?: string;
  source: 'manuel' | 'garmin';
  /** Identifiant de l'activité d'origine, pour ne pas réimporter deux fois le même fichier. */
  externalId?: string;
}
