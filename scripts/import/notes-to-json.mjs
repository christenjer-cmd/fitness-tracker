// Convertit les notes d'entraînement prises sur le téléphone en fichier de
// synchronisation JSON, importable tel quel depuis l'écran Historique.
//
//   node scripts/import/notes-to-json.mjs
//
// Les notes sont écrites à la main : ce script ne devine rien en silence.
// Tout ce qu'il n'a pas pu structurer (mentions libres, séries entre
// parenthèses, poids manquant) est recopié dans la note de l'exercice et
// signalé dans le rapport, pour qu'aucune information ne disparaisse.

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const SOURCE = join(here, 'notes-telephone.txt');
const OUTPUT = join(here, 'seances-notees.json');
const REPORT = join(here, 'rapport-conversion.txt');

/** Première année du carnet ; l'année avance à chaque fois que le mois recule. */
const FIRST_YEAR = 2025;
/** Aucune heure n'est notée : on pose une séance d'une heure en fin de journée. */
const START_HOUR = 18;
const DURATION_MIN = 60;

const warnings = [];
function warn(where, message) {
  warnings.push(`${where} — ${message}`);
}

// ---------------------------------------------------------------------------
// Noms d'exercices
// ---------------------------------------------------------------------------

// Les notes emploient une dizaine d'orthographes pour le même mouvement
// ("Dev inc.", "Dev. Incliné", "Incline Bench"...). On les ramène à un nom
// unique, sinon la courbe de progression est coupée en morceaux.
//
// En revanche on NE fusionne PAS ce qui change la charge de sens : Smith
// contre barre libre, machine convergente contre divergente, unilatéral
// contre bilatéral, tractions strictes contre tractions assistées.
// Le premier motif qui correspond gagne : les variantes précises d'abord.
const RULES = [
  // --- Pectoraux
  [/^converging (chest|c'est) press$/, 'Converging chest press'],
  [/^diverging chest press$/, 'Diverging chest press'],
  [/^chest press$/, 'Chest press'],
  [/^(dev|dév)\.? ?(couché|couche) smith$/, 'Développé couché Smith'],
  [/^(dev|dév)\.? ?(couché|couche) haltère$/, 'Développé couché haltères'],
  [/^(dev|dév|développé)\.? ?(couché|couche)$/, 'Développé couché barre'],
  [/^(inc|incliné) smith$/, 'Développé incliné Smith'],
  [/^smith dev inc$/, 'Développé incliné Smith'],
  [/^(dev|dév)\.? ?inc\.? ?(smith)$/, 'Développé incliné Smith'],
  [/^(dev|dév)\.? ?(incliné|incline) smith$/, 'Développé incliné Smith'],
  [/^(dev|dév)\.? ?(inc|inc\.|incliné|incline)$/, 'Développé incliné barre'],
  [/^incline bench( press)?$/, 'Développé incliné barre'],
  [/^chest incliné$/, 'Développé incliné barre'],
  [/^incline chest( press)?$/, 'Développé incliné machine'],
  [/^dev machine$/, 'Développé couché machine'],
  [/^(pec|chest) fly( machine)?$/, 'Pec fly machine'],
  [/^câble fly$/, 'Poulie vis-à-vis (cable fly)'],
  [/^high to low/, 'Écarté poulie haut-bas (high to low)'],
  [/^low to high/, 'Écarté poulie bas-haut (low to high)'],
  [/^poulie (hauteur pec|chest haut)$/, 'Écarté poulie haut-bas (high to low)'],
  [/^dips$/, 'Dips'],
  [/^pompes$/, 'Pompes'],

  // --- Dos
  [/^tractions? (aide|assistées?)$/, 'Tractions assistées (machine)'],
  [/^aide tractions?$/, 'Tractions assistées (machine)'],
  [/^tractions? ?\(?(é|e)lastique/, 'Tractions élastique'],
  [/^tractions? négatifs?$/, 'Tractions négatives'],
  [/^tractions?/, 'Tractions'],
  [/^lat ?pulldown/, 'Lat pulldown'],
  [/^seated row unilatéral/, 'Seated row unilatéral'],
  [/^diverging seated row/, 'Diverging seated row'],
  [/^seated row/, 'Seated row'],
  [/^(low row|tirage horizontal)/, 'Low row'],
  [/^(row|rowing|barbell row)$/, 'Rowing'],
  [/^(bas du dos|lower back)$/, 'Bas du dos (lombaires)'],
  [/^abdominal$/, 'Abdos machine'],

  // --- Épaules
  [/^shoulder press(e)? machine$/, 'Shoulder press machine'],
  [/^shoulder press(e)?$/, 'Shoulder press'],
  [/^(lateral raise|lat raise|elevation latérale|élévation latérale)( câble| poulie| cable)( uni)?$/, 'Élévations latérales poulie'],
  [/^(lateral raise|lat raise|elevation latérale|élévation latérale)/, 'Élévations latérales'],
  [/^rear delt (machine|fly)$/, 'Rear delt machine'],
  [/^rear delt (poulie|câble|cable)/, 'Rear delt poulie'],
  [/^rear delt$/, '@REAR_DELT_AMBIGU'],
  [/^extension arrière épaule$/, 'Rear delt poulie'],

  // --- Biceps
  [/^bayesian curl unilatérale?$/, 'Bayesian curl unilatéral'],
  [/^(bayesian|baiesan)/, 'Bayesian curl poulie'],
  [/^hammer curl preacher$/, 'Hammer curl preacher'],
  [/^hammer( curl)? (poulie|rope|câble|cable|autre poulie)/, 'Hammer curl poulie'],
  [/^hammer curl/, 'Hammer curl haltères'],
  [/^preacher (curl ez|barre ez)$/, 'Preacher curl barre EZ'],
  [/^preacher curl haltère$/, 'Preacher curl haltère'],
  // Toute mention d'une barre EZ l'emporte : "curl barre ez" ne doit pas être
  // happé par la règle poulie à cause du mot "barre".
  [/^(?=.*\bez\b)(?=.*curl).*$/, 'Curl barre EZ'],
  [/^(curl|biceps curl|poulie curl|câble curl|cable curl)( biceps)?( poulie| bar| barre| à la poulie)/, 'Curl poulie'],
  [/^(poulie curl|câble curl|cable curl)/, 'Curl poulie'],
  [/^biceps curl$/, 'Curl barre EZ'],
  [/^(incline|incliné) curl$/, 'Curl incliné'],
  [/^(curl|biceps|seated)( incliné| incline| inc| incliner| assis)/, 'Curl incliné'],
  [/^(curl|biceps)( arrière| assis arrière)/, 'Curl incliné'],
  [/^seated (curl behind|biceps)$/, 'Curl assis'],
  [/^curl assis$/, 'Curl assis'],

  // --- Triceps
  [/^(skull crusher|barre au front)/, 'Barre au front (skull crusher)'],
  [/^(katana|triceps katana)/, 'Katana extension'],
  [/^(close (grip|trip) (smith )?triceps|triceps close (grip )?smith|smith triceps close|triceps smith( close| machine)?|close grip smith)$/, 'Triceps close grip Smith'],
  [/^(kickback triceps unilatérale?|triceps kickback unilatéral|unilatérale? triceps kickback|triceps unilatérale?|triceps pushdown câble uni)/, 'Kickback triceps unilatéral'],
  [/^kickback triceps poulie$/, 'Kickback triceps poulie'],
  [/^(overhead|triceps overhead)/, '@OVERHEAD'],
  [/^triceps extension y$/, 'Triceps pushdown poulie'],
  [/^triceps extension$/, 'Extension triceps'],
  [/^(triceps (pushdown|pulldown|poulie pushdown|presse|barre y|rope easy poulie)|presse triceps corde|barre y triceps)/, 'Triceps pushdown poulie'],

  // --- Jambes
  [/^leg extension \+ sissy squat$/, 'Leg extension + Sissy squat'],
  [/^leg extension$/, 'Leg extension'],
  [/^sissy squat$/, 'Sissy squat'],
  [/^leg curl$/, 'Leg curl (ischio-jambiers)'],
  [/^leg press/, 'Leg press'],
  [/^hack squat$/, 'Hack squat'],
  [/^perfect squat$/, 'Perfect squat'],
  [/^squat$/, 'Squat barre'],
  [/^(calf|standing calf|mollets)/, 'Calf press'],
  [/^adducteur$/, 'Adducteur'],
  [/^abducteur$/, 'Abducteur'],

  // Notés une seule fois, à une charge qui ne recoupe aucun autre mouvement :
  // les laisser seuls vaut mieux que de les rattacher au hasard.
  [/^câble fly$/, 'Poulie vis-à-vis (cable fly)'],
  [/^exercice non noté$/, 'Exercice non noté'],
];

/** Mentions qui décrivent l'exécution, pas le mouvement : elles filent en note. */
const QUALIFIERS =
  /\s*\(?\b(2 sec descente|avec pause|autre poulie|poulie dure|poulie facile|plus facile|facile|différentes poulie|nouvelle forme niv \d+|1min repos|propres?|large|close|close grip|wide grip|bear grip|bear|barre grise|poignées|grip|rope|corde|barre y|y|barre|câble|cable|machine|uni|unilatérale?|exercises|2fdp|\+ mini|16)\b\)?/gi;

/** Mouvements où l'absence de charge est normale, pas un oubli. */
const BODYWEIGHT = new Set([
  'Tractions',
  'Tractions négatives',
  'Tractions élastique',
  'Dips',
  'Pompes',
  'Sissy squat',
]);

function normalise(name) {
  return name
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[.,]$/, '')
    .trim();
}

/** Ne garde que les mentions absentes du nom retenu. */
function clean(qualifiers, name) {
  const same = (t) => normalise(t).replace(/câble|cable/g, 'poulie');
  const target = same(name);
  return qualifiers.filter((q) => q && !target.includes(same(q)));
}

function canonicalName(raw, weights, where) {
  // On isole d'abord les mentions d'exécution, qui ne changent pas le mouvement.
  const qualifiers = [];
  let base = raw.replace(/\((.*?)\)/g, (m, inner) => {
    qualifiers.push(inner);
    return ' ';
  });
  base = base.replace(/\d+([.,]\d+)?\s*kg/gi, (m) => {
    qualifiers.push(m.trim());
    return ' ';
  });

  const stripped = base.replace(QUALIFIERS, (m) => {
    qualifiers.push(m.trim());
    return ' ';
  });

  const keys = [normalise(base), normalise(stripped)].filter(Boolean);
  const match = keys
    .flatMap((key) => RULES.filter(([pattern]) => pattern.test(key)).slice(0, 1))
    .at(0);

  if (match) {
    const target = match[1];

    // "Rear delt" seul désigne tantôt la poulie (16-20 kg) tantôt la machine
    // (45-52 kg) : seule la charge permet de trancher.
    if (target === '@REAR_DELT_AMBIGU') {
      const heaviest = Math.max(0, ...weights);
      const resolved = heaviest >= 30 ? 'Rear delt machine' : 'Rear delt poulie';
      warn(where, `"${raw.trim()}" sans précision : classé en ${resolved} d'après la charge (${heaviest} kg)`);
      return { name: resolved, qualifiers: clean(qualifiers, resolved) };
    }
    // Idem pour l'overhead : haltère au début du carnet, poulie ensuite.
    if (target === '@OVERHEAD') {
      const cable = /rope|corde|câble|cable|poulie|barre/i.test(base);
      const name = cable ? 'Extension triceps overhead poulie' : 'Extension triceps overhead';
      return { name, qualifiers: clean(qualifiers, name) };
    }
    return { name: target, qualifiers: clean(qualifiers, target) };
  }

  warn(where, `nom d'exercice non reconnu, gardé tel quel : "${raw.trim()}"`);
  return { name: raw.trim().replace(/\s+/g, ' '), qualifiers: [] };
}

// ---------------------------------------------------------------------------
// Séries
// ---------------------------------------------------------------------------

const UNIT = /^(kg|kgo|kgs|lg|kf|k)$/i;
const REPS = /^\d+(?:[.,]\d+)?(?:-\d+(?:[.,]\d+)?)*-?$/;
const WEIGHT_WITH_UNIT = /^(\d+(?:[.,]\d+)?)(kg|kgo|kgs|lg|kf|k)$/i;
const NUMBER = /^\d+(?:[.,]\d+)?$/;

function num(token) {
  return Number(String(token).replace(',', '.'));
}

/**
 * Découpe une ligne de séries en groupes { reps[], poids }. La convention du
 * carnet est constante : les répétitions d'abord, la charge juste après.
 */
function parseSetLine(line, where) {
  const aside = [];
  let lossy = false;

  // Les parenthèses notent des reps assistées, un drop set ou un commentaire :
  // impossible à structurer sans inventer, on les garde en note.
  let text = line.replace(/\(([^)]*)\)/g, (m, inner) => {
    aside.push(inner.trim());
    lossy = true;
    return ' ';
  });

  if (/\?/.test(text)) {
    aside.push('série non notée');
    lossy = true;
    text = text.replace(/\?-?/g, ' ');
  }

  text = text
    .replace(/(\d)\s*1\/2/g, '$1.5') // "2 1/2" et "71/2" = deux reps et demie
    .replace(/\s*\+\s*/g, ' + ')
    .replace(/,/g, ' ')
    .replace(/(\d)\s*(kg|kgo|kgs|lg|kf)\b/gi, '$1$2')
    .replace(/\s+/g, ' ')
    .trim();

  const tokens = text.split(' ').filter(Boolean);
  const groups = [];
  let pending = null;

  const flush = () => {
    if (pending) groups.push(pending);
    pending = null;
  };

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (token === '+' || token === '-') continue;

    const withUnit = token.match(WEIGHT_WITH_UNIT);
    if (withUnit) {
      if (pending && pending.weight === null) pending.weight = num(withUnit[1]);
      else if (pending) {
        // Deuxième charge sur le même groupe : haltères dépareillés, drop set…
        aside.push(token);
        lossy = true;
      }
      continue;
    }

    if (NUMBER.test(token) && UNIT.test(tokens[i + 1] ?? '')) {
      if (pending && pending.weight === null) pending.weight = num(token);
      else {
        aside.push(`${token} ${tokens[i + 1]}`);
        lossy = true;
      }
      i++;
      continue;
    }

    if (REPS.test(token)) {
      const parts = token.split('-').filter((p) => p !== '');
      if (token.endsWith('-')) {
        aside.push('dernière série non notée');
        lossy = true;
      }
      if (parts.length > 1 || !pending || pending.weight !== null) {
        flush();
        pending = { reps: parts.map(num), weight: null };
      } else {
        // Un nombre isolé derrière un groupe sans charge : c'est la charge,
        // l'unité a simplement été oubliée.
        pending.weight = num(token);
        lossy = true;
        aside.push(`charge "${token}" lue sans unité`);
      }
      continue;
    }

    aside.push(token);
    lossy = true;
  }
  flush();

  return { groups, aside, lossy };
}

// ---------------------------------------------------------------------------
// Lecture du carnet
// ---------------------------------------------------------------------------

const raw = readFileSync(SOURCE, 'utf8');
const lines = raw.split('\n');

const blocks = [];
let current = null;
let year = FIRST_YEAR;
let previousMonth = null;

for (let n = 0; n < lines.length; n++) {
  const line = lines[n].trim();
  if (!line) continue;

  const header = line.match(/^(\d{1,2})\.(\d{1,2})\s*(.*)$/);
  if (header) {
    const day = Number(header[1]);
    const month = Number(header[2]);
    if (previousMonth !== null && month < previousMonth) year++;
    previousMonth = month;
    current = {
      date: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
      title: header[3].trim(),
      line: n + 1,
      entries: [],
    };
    blocks.push(current);
    continue;
  }

  if (!current) {
    warn(`ligne ${n + 1}`, `texte avant la première date, ignoré : "${line}"`);
    continue;
  }

  // Une ligne qui commence par une lettre nomme un exercice ; sinon ce sont
  // des séries qui se rattachent à l'exercice courant.
  if (/^[A-Za-zÀ-ÿ]/.test(line)) {
    current.entries.push({ name: line, lines: [], line: n + 1 });
  } else {
    if (current.entries.length === 0) {
      warn(`ligne ${n + 1} (${current.date})`, `séries sans nom d'exercice : "${line}"`);
      current.entries.push({ name: 'Exercice non noté', lines: [], line: n + 1 });
    }
    current.entries.at(-1).lines.push(line);
  }
}

// ---------------------------------------------------------------------------
// Construction du fichier de synchronisation
// ---------------------------------------------------------------------------

const workouts = [];
let setCount = 0;
let tonnage = 0;
const nameUsage = new Map();

for (const block of blocks) {
  const where = `${block.date}`;
  const exercises = [];

  for (const entry of block.entries) {
    if (entry.lines.length === 0) {
      warn(where, `"${entry.name.trim()}" noté sans aucune série, exercice ignoré`);
      continue;
    }

    const parsed = entry.lines.map((l) => parseSetLine(l, where));
    const weights = parsed.flatMap((p) => p.groups.map((g) => g.weight ?? 0));
    const { name, qualifiers } = canonicalName(entry.name, weights, where);

    const sets = [];
    const noteParts = [...qualifiers];
    for (let i = 0; i < parsed.length; i++) {
      const { groups, aside, lossy } = parsed[i];
      for (const group of groups) {
        if (group.weight === null) {
          group.weight = 0;
          if (!BODYWEIGHT.has(name)) noteParts.push('charge non notée');
        }
        for (const reps of group.reps) {
          // Au-delà de 30, le nombre lu n'est pas un nombre de répétitions :
          // la ligne est brouillée. On la laisse en note plutôt que d'inventer.
          if (reps > 30) {
            warn(where, `"${entry.name.trim()}" : « ${reps} » n'est pas un nombre de répétitions, série écartée (ligne « ${entry.lines[i].trim()} »)`);
            noteParts.push(`noté : « ${entry.lines[i].trim()} »`);
            continue;
          }
          if (!Number.isInteger(reps)) noteParts.push(`une série de ${reps} reps`);
          sets.push({ reps: Math.floor(reps), weightKg: group.weight });
        }
      }
      if (lossy) {
        // Rien ne se perd : la ligne d'origine part dans la note de l'exercice.
        noteParts.push(`noté : « ${entry.lines[i].trim()} »`);
      }
      if (aside.length > 0 && !lossy) noteParts.push(aside.join(' '));
    }

    if (sets.length === 0) {
      warn(where, `"${entry.name.trim()}" : aucune série exploitable dans « ${entry.lines.join(' / ')} »`);
      continue;
    }

    nameUsage.set(name, (nameUsage.get(name) ?? 0) + 1);
    setCount += sets.length;
    tonnage += sets.reduce((acc, s) => acc + s.reps * s.weightKg, 0);

    const note = [...new Set(noteParts)].join(' · ');
    exercises.push({ name, sets, ...(note ? { notes: note } : {}) });
  }

  if (exercises.length === 0) {
    warn(where, 'séance sans exercice exploitable, ignorée');
    continue;
  }

  const started = `${block.date}T${String(START_HOUR).padStart(2, '0')}:00:00.000Z`;
  const finished = new Date(new Date(started).getTime() + DURATION_MIN * 60000).toISOString();

  workouts.push({
    externalId: `notes:${block.date}`,
    date: block.date,
    startedAt: started,
    finishedAt: finished,
    ...(block.title ? { notes: block.title } : {}),
    exercises,
  });
}

// Un même jour noté deux fois écraserait l'identifiant de dédoublonnage.
const seen = new Set();
for (const w of workouts) {
  if (seen.has(w.externalId)) warn(w.date, 'deux séances notées le même jour : identifiants en conflit');
  seen.add(w.externalId);
}

writeFileSync(OUTPUT, JSON.stringify({ workouts }, null, 2) + '\n');

const report = [
  `Séances converties : ${workouts.length} / ${blocks.length}`,
  `Séries : ${setCount}`,
  `Tonnage total : ${Math.round(tonnage).toLocaleString('fr-FR')} kg`,
  `Période : ${workouts[0]?.date} → ${workouts.at(-1)?.date}`,
  `Exercices distincts : ${nameUsage.size}`,
  '',
  '--- Exercices ---',
  ...[...nameUsage.entries()].sort((a, b) => b[1] - a[1]).map(([n, c]) => `${String(c).padStart(4)} × ${n}`),
  '',
  `--- Points à vérifier (${warnings.length}) ---`,
  ...warnings,
].join('\n');

writeFileSync(REPORT, report + '\n');
console.log(report.split('\n--- Exercices ---')[0]);
console.log(`Rapport : ${REPORT}`);
