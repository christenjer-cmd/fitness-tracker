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

  // --- Salle : mouvements repris du carnet de notes (2025-2026) ---
  // Vocabulaire d'origine conservé : c'est celui des séances déjà notées.

  // Pectoraux
  { id: 'converging-chest-press', name: 'Converging chest press', muscleGroups: ['pectoraux', 'triceps', 'epaules'], equipment: 'machine' },
  { id: 'diverging-chest-press', name: 'Diverging chest press', muscleGroups: ['pectoraux', 'triceps'], equipment: 'machine' },
  { id: 'chest-press', name: 'Chest press', muscleGroups: ['pectoraux', 'triceps'], equipment: 'machine' },
  { id: 'developpe-couche-smith', name: 'Développé couché Smith', muscleGroups: ['pectoraux', 'triceps', 'epaules'], equipment: 'machine' },
  { id: 'developpe-incline-smith', name: 'Développé incliné Smith', muscleGroups: ['pectoraux', 'epaules'], equipment: 'machine' },
  { id: 'developpe-incline-machine', name: 'Développé incliné machine', muscleGroups: ['pectoraux', 'epaules'], equipment: 'machine' },
  { id: 'pec-fly-machine', name: 'Pec fly machine', muscleGroups: ['pectoraux'], equipment: 'machine' },
  { id: 'ecarte-poulie-haut-bas', name: 'Écarté poulie haut-bas (high to low)', muscleGroups: ['pectoraux'], equipment: 'poulie' },
  { id: 'ecarte-poulie-bas-haut', name: 'Écarté poulie bas-haut (low to high)', muscleGroups: ['pectoraux'], equipment: 'poulie' },

  // Dos
  { id: 'lat-pulldown', name: 'Lat pulldown', muscleGroups: ['dos', 'biceps'], equipment: 'poulie' },
  { id: 'seated-row', name: 'Seated row', muscleGroups: ['dos', 'biceps'], equipment: 'machine' },
  { id: 'seated-row-unilateral', name: 'Seated row unilatéral', muscleGroups: ['dos', 'biceps'], equipment: 'machine' },
  { id: 'diverging-seated-row', name: 'Diverging seated row', muscleGroups: ['dos', 'biceps'], equipment: 'machine' },
  { id: 'low-row', name: 'Low row', muscleGroups: ['dos', 'biceps'], equipment: 'machine' },
  { id: 'rowing', name: 'Rowing', muscleGroups: ['dos', 'biceps'], equipment: 'barre' },
  { id: 'tractions-assistees', name: 'Tractions assistées (machine)', muscleGroups: ['dos', 'biceps'], equipment: 'machine' },
  { id: 'tractions-elastique', name: 'Tractions élastique', muscleGroups: ['dos', 'biceps'], equipment: 'elastique' },
  { id: 'tractions-negatives', name: 'Tractions négatives', muscleGroups: ['dos', 'biceps'], equipment: 'poids-du-corps' },
  { id: 'bas-du-dos', name: 'Bas du dos (lombaires)', muscleGroups: ['dos'], equipment: 'machine' },
  { id: 'abdos-machine', name: 'Abdos machine', muscleGroups: ['abdominaux'], equipment: 'machine' },

  // Épaules
  { id: 'shoulder-press', name: 'Shoulder press', muscleGroups: ['epaules', 'triceps'], equipment: 'machine' },
  { id: 'shoulder-press-machine', name: 'Shoulder press machine', muscleGroups: ['epaules', 'triceps'], equipment: 'machine' },
  { id: 'elevation-laterale-poulie', name: 'Élévations latérales poulie', muscleGroups: ['epaules'], equipment: 'poulie' },
  { id: 'rear-delt-poulie', name: 'Rear delt poulie', muscleGroups: ['epaules', 'dos'], equipment: 'poulie' },
  { id: 'rear-delt-machine', name: 'Rear delt machine', muscleGroups: ['epaules', 'dos'], equipment: 'machine' },

  // Biceps
  { id: 'hammer-curl-halteres', name: 'Hammer curl haltères', muscleGroups: ['biceps', 'avant-bras'], equipment: 'halteres' },
  { id: 'hammer-curl-poulie', name: 'Hammer curl poulie', muscleGroups: ['biceps', 'avant-bras'], equipment: 'poulie' },
  { id: 'hammer-curl-preacher', name: 'Hammer curl preacher', muscleGroups: ['biceps', 'avant-bras'], equipment: 'halteres' },
  { id: 'curl-poulie', name: 'Curl poulie', muscleGroups: ['biceps'], equipment: 'poulie' },
  { id: 'curl-barre-ez', name: 'Curl barre EZ', muscleGroups: ['biceps'], equipment: 'barre' },
  { id: 'curl-incline', name: 'Curl incliné', muscleGroups: ['biceps'], equipment: 'halteres' },
  { id: 'curl-assis', name: 'Curl assis', muscleGroups: ['biceps'], equipment: 'halteres' },
  { id: 'bayesian-curl-poulie', name: 'Bayesian curl poulie', muscleGroups: ['biceps'], equipment: 'poulie' },
  { id: 'bayesian-curl-unilateral', name: 'Bayesian curl unilatéral', muscleGroups: ['biceps'], equipment: 'poulie' },
  { id: 'preacher-curl-barre-ez', name: 'Preacher curl barre EZ', muscleGroups: ['biceps'], equipment: 'barre' },
  { id: 'preacher-curl-haltere', name: 'Preacher curl haltère', muscleGroups: ['biceps'], equipment: 'halteres' },

  // Triceps
  { id: 'triceps-pushdown-poulie', name: 'Triceps pushdown poulie', muscleGroups: ['triceps'], equipment: 'poulie' },
  { id: 'katana-extension', name: 'Katana extension', muscleGroups: ['triceps'], equipment: 'poulie' },
  { id: 'extension-triceps-overhead', name: 'Extension triceps overhead', muscleGroups: ['triceps'], equipment: 'halteres' },
  { id: 'extension-triceps-overhead-poulie', name: 'Extension triceps overhead poulie', muscleGroups: ['triceps'], equipment: 'poulie' },
  { id: 'extension-triceps', name: 'Extension triceps', muscleGroups: ['triceps'], equipment: 'poulie' },
  { id: 'triceps-close-grip-smith', name: 'Triceps close grip Smith', muscleGroups: ['triceps', 'pectoraux'], equipment: 'machine' },
  { id: 'kickback-triceps-poulie', name: 'Kickback triceps poulie', muscleGroups: ['triceps'], equipment: 'poulie' },
  { id: 'kickback-triceps-unilateral', name: 'Kickback triceps unilatéral', muscleGroups: ['triceps'], equipment: 'poulie' },

  // Jambes
  { id: 'hack-squat', name: 'Hack squat', muscleGroups: ['jambes', 'fessiers'], equipment: 'machine' },
  { id: 'perfect-squat', name: 'Perfect squat', muscleGroups: ['jambes', 'fessiers'], equipment: 'machine' },
  { id: 'leg-press-machine', name: 'Leg press', muscleGroups: ['jambes', 'fessiers'], equipment: 'machine' },
  { id: 'sissy-squat', name: 'Sissy squat', muscleGroups: ['jambes'], equipment: 'poids-du-corps' },
  { id: 'leg-extension-sissy-squat', name: 'Leg extension + Sissy squat', muscleGroups: ['jambes'], equipment: 'machine' },
  { id: 'calf-press', name: 'Calf press', muscleGroups: ['mollets'], equipment: 'machine' },
  { id: 'adducteur', name: 'Adducteur', muscleGroups: ['jambes'], equipment: 'machine' },
  { id: 'abducteur', name: 'Abducteur', muscleGroups: ['jambes', 'fessiers'], equipment: 'machine' },
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
