/**
 * Récupère les dernières activités de Garmin Connect et écrit un fichier JSON
 * à importer dans l'app (onglet Course, bloc « Importer depuis Garmin »).
 *
 * Les identifiants ne quittent jamais cette machine : ils sont lus dans des
 * variables d'environnement ou dans garmin.local.json, fichier ignoré par git.
 * Après la première connexion, un jeton est mis en cache pour éviter de se
 * reconnecter à chaque exécution.
 *
 * Usage :
 *   node scripts/garmin-sync.mjs
 *   node scripts/garmin-sync.mjs --limit 50 --out mes-activites.json
 */

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { GarminConnect } from 'garmin-connect';

const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const TOKEN_DIR = path.join(projectRoot, '.garmin-tokens');
const CREDENTIALS_FILE = path.join(projectRoot, 'garmin.local.json');

/* ---------- arguments ---------- */

function parseArgs(argv) {
  const args = { limit: 30, out: path.join(projectRoot, 'garmin-export.json'), days: 0, publish: false };
  for (let i = 0; i < argv.length; i++) {
    const next = () => argv[++i];
    if (argv[i] === '--limit') args.limit = Number(next());
    else if (argv[i] === '--out') args.out = path.resolve(process.cwd(), next());
    else if (argv[i] === '--days') args.days = Number(next());
    else if (argv[i] === '--publish') args.publish = true;
    else if (argv[i] === '--help') args.help = true;
  }
  // En mode publication, le fichier va dans public/ pour être servi par le site.
  if (args.publish && !argv.includes('--out')) {
    args.out = path.join(projectRoot, 'public', 'garmin-data.json');
  }
  return args;
}

/* ---------- identifiants ---------- */

function readCredentials() {
  const fromEnv = {
    username: process.env.GARMIN_EMAIL,
    password: process.env.GARMIN_PASSWORD,
  };
  if (fromEnv.username && fromEnv.password) return fromEnv;

  if (fs.existsSync(CREDENTIALS_FILE)) {
    const raw = JSON.parse(fs.readFileSync(CREDENTIALS_FILE, 'utf8'));
    // Le fichier est livré avec des valeurs d'exemple : mieux vaut le dire
    // clairement que de laisser Garmin répondre « identifiants invalides ».
    const stillPlaceholder =
      /exemple\.com$/i.test(raw.email ?? '') || /^ton-mot-de-passe$/i.test(raw.password ?? '');
    if (stillPlaceholder) {
      console.error(
        [
          `Le fichier ${path.basename(CREDENTIALS_FILE)} contient encore les valeurs d'exemple.`,
          '',
          'Ouvre-le et remplace :',
          '  "email"    par ton adresse de connexion Garmin Connect',
          '  "password" par ton mot de passe Garmin Connect',
        ].join('\n')
      );
      process.exit(1);
    }
    if (raw.email && raw.password) return { username: raw.email, password: raw.password };
  }

  console.error(
    [
      'Identifiants Garmin introuvables.',
      '',
      'Crée un fichier garmin.local.json à la racine du projet, avec ce contenu :',
      '',
      '  {',
      '    "email": "ton.adresse@exemple.com",',
      '    "password": "ton-mot-de-passe"',
      '  }',
      '',
      'Ce fichier est ignoré par git, il ne partira jamais sur GitHub.',
    ].join('\n')
  );
  process.exit(1);
}

/* ---------- classement des activités ---------- */

// Tout ce qui se mesure en distance ou en durée, hors musculation.
const RUN_TYPES = /^(running|trail_running|treadmill_running|track_running|virtual_run|indoor_running|walking|hiking|casual_walking|speed_walking|indoor_walking|elliptical|stair_climbing|indoor_cardio|cycling|indoor_cycling|virtual_ride)$/;
// Le cardio se compte à part : allure et ressenti n'ont rien à voir avec la course.
const CARDIO_TYPES = /^(walking|hiking|casual_walking|speed_walking|indoor_walking|elliptical|stair_climbing|indoor_cardio|cycling|indoor_cycling|virtual_ride)$/;
const STRENGTH_TYPES = /^(strength_training|indoor_cardio|fitness_equipment|pilates|yoga)$/;

// Garmin nomme les exercices en majuscules techniques : on rend ça lisible.
const EXERCISE_LABELS = {
  BENCH_PRESS: 'Développé couché barre',
  BARBELL_BENCH_PRESS: 'Développé couché barre',
  DUMBBELL_BENCH_PRESS: 'Développé couché haltères',
  INCLINE_BENCH_PRESS: 'Développé incliné barre',
  SQUAT: 'Squat barre',
  BARBELL_BACK_SQUAT: 'Squat barre',
  FRONT_SQUAT: 'Squat avant',
  DEADLIFT: 'Soulevé de terre',
  BARBELL_DEADLIFT: 'Soulevé de terre',
  ROMANIAN_DEADLIFT: 'Soulevé de terre roumain',
  SHOULDER_PRESS: 'Développé militaire',
  OVERHEAD_PRESS: 'Développé militaire',
  LATERAL_RAISE: 'Élévations latérales',
  ROW: 'Rowing barre',
  BARBELL_ROW: 'Rowing barre',
  PULL_UP: 'Tractions',
  CHIN_UP: 'Tractions supination',
  LAT_PULLDOWN: 'Tirage vertical',
  PUSH_UP: 'Pompes',
  TRICEPS_EXTENSION: 'Extension triceps',
  CURL: 'Curl biceps',
  BICEPS_CURL: 'Curl biceps',
  HAMMER_CURL: 'Curl marteau',
  LUNGE: 'Fentes',
  LEG_PRESS: 'Presse à cuisses',
  LEG_CURL: 'Leg curl',
  LEG_EXTENSION: 'Leg extension',
  CALF_RAISE: 'Mollets debout',
  PLANK: 'Gainage',
  CRUNCH: 'Crunch',
  HIP_THRUST: 'Hip thrust',
  DIP: 'Dips',
};

function prettifyExercise(raw) {
  if (!raw) return 'Exercice Garmin';
  if (EXERCISE_LABELS[raw]) return EXERCISE_LABELS[raw];
  const words = raw.toLowerCase().split('_').join(' ');
  return words.charAt(0).toUpperCase() + words.slice(1);
}

function localDate(iso) {
  // startTimeLocal arrive au format "2026-08-13 07:12:05", déjà en heure locale.
  return String(iso).slice(0, 10);
}

function round(value, decimals) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

/* ---------- transformation ---------- */

export function toRun(activity) {
  const distanceKm = (activity.distance ?? 0) / 1000;
  const durationMin = (activity.duration ?? 0) / 60;
  const typeKey = activity.activityType?.typeKey ?? '';
  const sport = CARDIO_TYPES.test(typeKey) ? 'cardio' : 'course';
  // Un escalier ou un vélo d'appartement ne produit pas toujours de distance :
  // en cardio, la durée suffit. Une course sans distance reste inexploitable.
  if (durationMin <= 0) return null;
  if (sport === 'course' && distanceKm <= 0) return null;
  return {
    externalId: `garmin:${activity.activityId}`,
    date: localDate(activity.startTimeLocal),
    sport,
    distanceKm: round(distanceKm, 2),
    durationMin: round(durationMin, 1),
    avgHeartRate: activity.averageHR ? Math.round(activity.averageHR) : undefined,
    notes: activity.activityName || undefined,
  };
}

export function toWorkout(activity, exerciseSets) {
  // Les séries de repos ne nous intéressent pas.
  const active = (exerciseSets ?? []).filter((s) => s.setType === 'ACTIVE');
  if (active.length === 0) return null;

  // Regroupe les séries consécutives portant sur le même exercice.
  const exercises = [];
  for (const set of active) {
    const raw = set.exercises?.[0]?.name || set.exercises?.[0]?.category;
    const name = prettifyExercise(raw);
    const reps = set.repetitionCount ?? 0;
    // Garmin stocke la charge en grammes.
    const weightKg = set.weight ? round(set.weight / 1000, 1) : 0;

    const last = exercises[exercises.length - 1];
    if (last && last.name === name) last.sets.push({ reps, weightKg });
    else exercises.push({ name, sets: [{ reps, weightKg }] });
  }

  const startedAt = new Date(String(activity.startTimeLocal).replace(' ', 'T'));
  const finishedAt = new Date(startedAt.getTime() + (activity.duration ?? 0) * 1000);

  return {
    externalId: `garmin:${activity.activityId}`,
    date: localDate(activity.startTimeLocal),
    startedAt: startedAt.toISOString(),
    finishedAt: finishedAt.toISOString(),
    notes: activity.activityName || undefined,
    exercises,
  };
}

/* ---------- erreurs lisibles ---------- */

// Garmin répond parfois par une page HTML complète. Brute, elle noie la console
// sous des milliers de caractères et masque l'information utile.
function cleanErrorMessage(error) {
  const raw = String(error?.message ?? error ?? 'erreur inconnue');
  const withoutHtml = raw
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const status = raw.match(/\((\d{3})\)/)?.[1];
  const short = withoutHtml.length > 180 ? `${withoutHtml.slice(0, 180)}...` : withoutHtml;
  if (status === '401' || status === '403') return `refus d'authentification (${status})`;
  if (status === '429') return 'trop de requêtes, Garmin demande de patienter (429)';
  if (status) return `Garmin a répondu ${status} : ${short}`;
  return short;
}

/* ---------- publication vers GitHub ---------- */

// Dépose le fichier sur le dépôt : GitHub reconstruit le site, et l'app va
// ensuite lire les données toute seule à son ouverture.
export function publishToGitHub(filePath) {
  const git = (...gitArgs) =>
    execFileSync('git', gitArgs, { cwd: projectRoot, encoding: 'utf8', stdio: 'pipe' });

  const relative = path.relative(projectRoot, filePath).split(path.sep).join('/');

  const pending = git('status', '--porcelain', '--', relative).trim();
  if (!pending) {
    console.log('Aucun changement à publier, les données en ligne sont déjà à jour.');
    return;
  }

  console.log('Publication sur GitHub...');
  git('add', '--', relative);
  git('commit', '-m', `Données Garmin du ${new Date().toISOString().slice(0, 10)}`);
  git('push', 'origin', 'HEAD');
  console.log('Publié. Le site se reconstruit, compte une à deux minutes.');
  console.log("Ouvre ensuite l'app sur ton téléphone, les activités arriveront seules.");
}

/* ---------- programme principal ---------- */

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log(
      [
        'node scripts/garmin-sync.mjs [options]',
        '',
        '  --publish       dépose les données sur GitHub, pour que l\'app les récupère seule',
        '  --limit <n>     nombre d\'activités à examiner (30 par défaut)',
        '  --days <n>      ne garder que les n derniers jours',
        '  --out <fichier> chemin du fichier de sortie',
      ].join('\n')
    );
    return;
  }

  const credentials = readCredentials();
  const gc = new GarminConnect(credentials);

  // Un jeton en cache évite de refaire une connexion complète à chaque fois.
  let usedCachedToken = false;
  if (fs.existsSync(TOKEN_DIR)) {
    try {
      gc.loadTokenByFile(TOKEN_DIR);
      usedCachedToken = true;
      console.log('Jeton de session réutilisé.');
    } catch {
      console.log('Jeton en cache inutilisable, reconnexion.');
    }
  }

  if (!usedCachedToken) {
    console.log('Connexion à Garmin Connect...');
    await gc.login();
    fs.mkdirSync(TOKEN_DIR, { recursive: true });
    gc.exportTokenToFile(TOKEN_DIR);
    console.log('Connecté, jeton mis en cache.');
  }

  console.log(`Récupération des ${args.limit} dernières activités...`);
  let activities;
  try {
    activities = await gc.getActivities(0, args.limit);
  } catch (error) {
    // Un jeton périmé se manifeste par un refus côté Garmin. Plutôt que
    // d'échouer, on jette le cache et on refait une connexion complète.
    if (!usedCachedToken) throw error;
    console.log(`Jeton refusé (${cleanErrorMessage(error)}), nouvelle connexion...`);
    fs.rmSync(TOKEN_DIR, { recursive: true, force: true });
    await gc.login();
    fs.mkdirSync(TOKEN_DIR, { recursive: true });
    gc.exportTokenToFile(TOKEN_DIR);
    activities = await gc.getActivities(0, args.limit);
  }

  if (args.days > 0) {
    const floor = Date.now() - args.days * 86400000;
    activities = activities.filter((a) => new Date(String(a.startTimeLocal).replace(' ', 'T')).getTime() >= floor);
  }

  const runs = [];
  const workouts = [];
  const ignored = [];

  for (const activity of activities) {
    const typeKey = activity.activityType?.typeKey ?? '';

    if (RUN_TYPES.test(typeKey)) {
      const run = toRun(activity);
      if (run) runs.push(run);
      else ignored.push(`${activity.activityId} (${typeKey}, distance ou durée nulle)`);
      continue;
    }

    if (STRENGTH_TYPES.test(typeKey)) {
      let sets = [];
      try {
        const detail = await gc.get(
          `https://connect.garmin.com/activity-service/activity/${activity.activityId}/exerciseSets`
        );
        sets = detail?.exerciseSets ?? [];
      } catch (e) {
        ignored.push(`${activity.activityId} (${typeKey}, séries illisibles : ${cleanErrorMessage(e)})`);
        continue;
      }
      const workout = toWorkout(activity, sets);
      if (workout) workouts.push(workout);
      else ignored.push(`${activity.activityId} (${typeKey}, aucune série enregistrée)`);
      continue;
    }

    ignored.push(`${activity.activityId} (${typeKey || 'type inconnu'}, non pris en charge)`);
  }

  const payload = {
    source: 'garmin-sync',
    generatedAt: new Date().toISOString(),
    runs,
    workouts,
  };

  fs.mkdirSync(path.dirname(args.out), { recursive: true });
  fs.writeFileSync(args.out, JSON.stringify(payload, null, 2), 'utf8');

  console.log('');
  console.log(`${runs.length} course(s) et ${workouts.length} séance(s) de musculation.`);
  if (ignored.length > 0) {
    console.log(`${ignored.length} activité(s) ignorée(s) :`);
    ignored.slice(0, 10).forEach((line) => console.log(`  - ${line}`));
    if (ignored.length > 10) console.log(`  ... et ${ignored.length - 10} autres`);
  }
  console.log('');
  console.log(`Fichier écrit : ${args.out}`);

  if (args.publish) {
    publishToGitHub(args.out);
  } else {
    console.log("Importe-le dans l'app, onglet Course, bloc « Importer depuis Garmin ».");
    console.log('Ou relance avec --publish pour que l\'app les reçoive toute seule.');
  }
}

// N'exécute la synchronisation que si le fichier est lancé directement,
// pour pouvoir importer les fonctions de transformation dans les tests.
const executedDirectly =
  process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (executedDirectly) main().catch((error) => {
  console.error('');
  console.error('Échec :', cleanErrorMessage(error));
  console.error('');
  console.error('Pistes : mot de passe incorrect, double authentification activée sur le');
  console.error('compte, ou Garmin a modifié sa procédure de connexion. Supprime le dossier');
  console.error('.garmin-tokens et relance pour forcer une nouvelle connexion.');
  process.exit(1);
});
