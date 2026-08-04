import type { Equipment, Exercise, MuscleGroup } from '../types';

export const EXERCISES: Exercise[] = [
  // Pectoraux
  { id: 'developpe-couche-barre', name: 'Développé couché barre', muscleGroups: ['pectoraux', 'triceps', 'epaules'], equipment: 'barre' },
  { id: 'developpe-couche-halteres', name: 'Développé couché haltères', muscleGroups: ['pectoraux', 'triceps', 'epaules'], equipment: 'halteres' },
  { id: 'developpe-incline-barre', name: 'Développé incliné barre', muscleGroups: ['pectoraux', 'epaules'], equipment: 'barre' },
  { id: 'developpe-incline-halteres', name: 'Développé incliné haltères', muscleGroups: ['pectoraux', 'epaules'], equipment: 'halteres' },
  { id: 'developpe-decline', name: 'Développé décliné', muscleGroups: ['pectoraux', 'triceps'], equipment: 'barre' },
  { id: 'ecarte-halteres', name: 'Écarté couché haltères', muscleGroups: ['pectoraux'], equipment: 'halteres' },
  { id: 'pec-deck', name: 'Pec deck / écarté machine', muscleGroups: ['pectoraux'], equipment: 'machine' },
  { id: 'dips', name: 'Dips', muscleGroups: ['pectoraux', 'triceps'], equipment: 'poids-du-corps' },
  { id: 'pompes', name: 'Pompes', muscleGroups: ['pectoraux', 'triceps', 'epaules'], equipment: 'poids-du-corps' },
  { id: 'poulie-vis-a-vis', name: 'Poulie vis-à-vis (cable fly)', muscleGroups: ['pectoraux'], equipment: 'poulie' },
  { id: 'developpe-couche-machine', name: 'Développé couché machine', muscleGroups: ['pectoraux', 'triceps'], equipment: 'machine' },

  // Dos
  { id: 'traction', name: 'Tractions', muscleGroups: ['dos', 'biceps'], equipment: 'poids-du-corps' },
  { id: 'tirage-vertical', name: 'Tirage vertical (poulie haute)', muscleGroups: ['dos', 'biceps'], equipment: 'poulie' },
  { id: 'tirage-horizontal', name: 'Tirage horizontal (rowing poulie basse)', muscleGroups: ['dos', 'biceps'], equipment: 'poulie' },
  { id: 'rowing-barre', name: 'Rowing barre', muscleGroups: ['dos', 'biceps'], equipment: 'barre' },
  { id: 'rowing-halteres', name: 'Rowing un bras haltère', muscleGroups: ['dos', 'biceps'], equipment: 'halteres' },
  { id: 'souleve-de-terre', name: 'Soulevé de terre', muscleGroups: ['dos', 'jambes', 'fessiers'], equipment: 'barre' },
  { id: 'souleve-de-terre-roumain', name: 'Soulevé de terre roumain', muscleGroups: ['dos', 'fessiers', 'jambes'], equipment: 'barre' },
  { id: 'tirage-machine', name: 'Tirage machine (lat pulldown machine)', muscleGroups: ['dos', 'biceps'], equipment: 'machine' },
  { id: 'good-morning', name: 'Good morning', muscleGroups: ['dos', 'fessiers'], equipment: 'barre' },
  { id: 'face-pull', name: 'Face pull', muscleGroups: ['dos', 'epaules'], equipment: 'poulie' },
  { id: 'hyperextension', name: 'Hyperextensions (banc lombaire)', muscleGroups: ['dos', 'fessiers'], equipment: 'poids-du-corps' },

  // Épaules
  { id: 'developpe-militaire-barre', name: 'Développé militaire barre', muscleGroups: ['epaules', 'triceps'], equipment: 'barre' },
  { id: 'developpe-militaire-halteres', name: 'Développé épaules haltères', muscleGroups: ['epaules', 'triceps'], equipment: 'halteres' },
  { id: 'elevation-laterale', name: 'Élévations latérales', muscleGroups: ['epaules'], equipment: 'halteres' },
  { id: 'elevation-frontale', name: 'Élévations frontales', muscleGroups: ['epaules'], equipment: 'halteres' },
  { id: 'oiseau', name: 'Oiseau (élévation arrière)', muscleGroups: ['epaules', 'dos'], equipment: 'halteres' },
  { id: 'rowing-menton', name: 'Rowing menton (upright row)', muscleGroups: ['epaules', 'dos'], equipment: 'barre' },
  { id: 'shrug', name: 'Shrugs (trapèzes)', muscleGroups: ['epaules', 'dos'], equipment: 'barre' },
  { id: 'developpe-epaules-machine', name: 'Développé épaules machine', muscleGroups: ['epaules', 'triceps'], equipment: 'machine' },

  // Biceps
  { id: 'curl-biceps-barre', name: 'Curl biceps barre', muscleGroups: ['biceps'], equipment: 'barre' },
  { id: 'curl-biceps-halteres', name: 'Curl biceps haltères', muscleGroups: ['biceps'], equipment: 'halteres' },
  { id: 'curl-marteau', name: 'Curl marteau', muscleGroups: ['biceps', 'avant-bras'], equipment: 'halteres' },
  { id: 'curl-pupitre', name: 'Curl pupitre (banc Scott)', muscleGroups: ['biceps'], equipment: 'barre' },
  { id: 'curl-poulie', name: 'Curl à la poulie', muscleGroups: ['biceps'], equipment: 'poulie' },

  // Triceps
  { id: 'extension-triceps-poulie', name: 'Extension triceps à la poulie', muscleGroups: ['triceps'], equipment: 'poulie' },
  { id: 'extension-triceps-halteres', name: 'Extension triceps haltère (au-dessus de la tête)', muscleGroups: ['triceps'], equipment: 'halteres' },
  { id: 'barre-au-front', name: 'Barre au front (skull crusher)', muscleGroups: ['triceps'], equipment: 'barre' },
  { id: 'kick-back', name: 'Kick-back triceps', muscleGroups: ['triceps'], equipment: 'halteres' },
  { id: 'dips-triceps', name: 'Dips entre deux bancs', muscleGroups: ['triceps'], equipment: 'poids-du-corps' },

  // Jambes
  { id: 'squat', name: 'Squat barre', muscleGroups: ['jambes', 'fessiers'], equipment: 'barre' },
  { id: 'squat-gobelet', name: 'Squat gobelet (goblet squat)', muscleGroups: ['jambes', 'fessiers'], equipment: 'kettlebell' },
  { id: 'presse-a-cuisses', name: 'Presse à cuisses', muscleGroups: ['jambes', 'fessiers'], equipment: 'machine' },
  { id: 'fente', name: 'Fentes', muscleGroups: ['jambes', 'fessiers'], equipment: 'halteres' },
  { id: 'fente-bulgare', name: 'Fentes bulgares', muscleGroups: ['jambes', 'fessiers'], equipment: 'halteres' },
  { id: 'leg-extension', name: 'Leg extension', muscleGroups: ['jambes'], equipment: 'machine' },
  { id: 'leg-curl', name: 'Leg curl (ischio-jambiers)', muscleGroups: ['jambes'], equipment: 'machine' },
  { id: 'souleve-de-terre-jambes-tendues', name: 'Soulevé de terre jambes tendues', muscleGroups: ['jambes', 'fessiers', 'dos'], equipment: 'barre' },
  { id: 'hip-thrust', name: 'Hip thrust', muscleGroups: ['fessiers'], equipment: 'barre' },
  { id: 'squat-bulgare', name: 'Squat bulgare', muscleGroups: ['jambes', 'fessiers'], equipment: 'halteres' },
  { id: 'front-squat', name: 'Front squat', muscleGroups: ['jambes', 'fessiers'], equipment: 'barre' },

  // Mollets
  { id: 'mollets-debout', name: 'Mollets debout (calf raise)', muscleGroups: ['mollets'], equipment: 'machine' },
  { id: 'mollets-assis', name: 'Mollets assis', muscleGroups: ['mollets'], equipment: 'machine' },

  // Abdominaux
  { id: 'crunch', name: 'Crunch', muscleGroups: ['abdominaux'], equipment: 'poids-du-corps' },
  { id: 'planche', name: 'Planche (gainage)', muscleGroups: ['abdominaux'], equipment: 'poids-du-corps' },
  { id: 'releve-jambes', name: 'Relevé de jambes suspendu', muscleGroups: ['abdominaux'], equipment: 'poids-du-corps' },
  { id: 'crunch-poulie', name: 'Crunch à la poulie', muscleGroups: ['abdominaux'], equipment: 'poulie' },
  { id: 'russian-twist', name: 'Russian twist', muscleGroups: ['abdominaux'], equipment: 'poids-du-corps' },
  { id: 'roue-abdominale', name: 'Roue abdominale (ab wheel)', muscleGroups: ['abdominaux'], equipment: 'autre' },

  // Corps entier / cardio salle
  { id: 'burpees', name: 'Burpees', muscleGroups: ['corps-entier', 'cardio'], equipment: 'poids-du-corps' },
  { id: 'kettlebell-swing', name: 'Kettlebell swing', muscleGroups: ['corps-entier', 'fessiers'], equipment: 'kettlebell' },
  { id: 'rameur', name: 'Rameur', muscleGroups: ['cardio', 'dos', 'jambes'], equipment: 'machine' },
  { id: 'velo', name: 'Vélo (salle)', muscleGroups: ['cardio', 'jambes'], equipment: 'machine' },
  { id: 'tapis-course', name: 'Tapis de course', muscleGroups: ['cardio', 'jambes'], equipment: 'machine' },
  { id: 'corde-a-sauter', name: 'Corde à sauter', muscleGroups: ['cardio', 'mollets'], equipment: 'autre' },
];

export const EQUIPMENT_LABELS: Record<Equipment, string> = {
  barre: 'Barre',
  halteres: 'Haltères',
  machine: 'Machine',
  poulie: 'Poulie',
  'poids-du-corps': 'Poids du corps',
  kettlebell: 'Kettlebell',
  elastique: 'Élastique',
  autre: 'Autre',
};

export const MUSCLE_GROUP_LABELS: Record<MuscleGroup, string> = {
  pectoraux: 'Pectoraux',
  dos: 'Dos',
  epaules: 'Épaules',
  biceps: 'Biceps',
  triceps: 'Triceps',
  jambes: 'Jambes',
  fessiers: 'Fessiers',
  abdominaux: 'Abdominaux',
  mollets: 'Mollets',
  'avant-bras': 'Avant-bras',
  cardio: 'Cardio',
  'corps-entier': 'Corps entier',
};
