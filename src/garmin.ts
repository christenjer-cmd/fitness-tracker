// Import des courses depuis Garmin Connect.
// Formats acceptés : .tcx et .gpx (export d'une activité), .csv (export de la liste d'activités).

import type { ImportedWorkout, RunSport } from './types';

export interface ParsedRun {
  externalId: string;
  date: string;
  sport: RunSport;
  distanceKm: number;
  durationMin: number;
  avgHeartRate?: number;
  notes?: string;
}

export interface ParseResult {
  runs: ParsedRun[];
  /** Séances de musculation, présentes uniquement dans les fichiers de synchronisation. */
  workouts: ImportedWorkout[];
  errors: string[];
}

/* ---------- helpers XML ---------- */

function xmlDoc(text: string): Document {
  const doc = new DOMParser().parseFromString(text, 'application/xml');
  if (doc.getElementsByTagName('parsererror').length > 0) {
    throw new Error('XML illisible');
  }
  return doc;
}

function descendantsNamed(root: Document | Element, name: string): Element[] {
  return Array.from(root.getElementsByTagName('*')).filter((e) => e.localName === name);
}

function childrenNamed(el: Element, name: string): Element[] {
  return Array.from(el.children).filter((c) => c.localName === name);
}

function childText(el: Element, name: string): string | undefined {
  const found = childrenNamed(el, name)[0];
  return found?.textContent?.trim() || undefined;
}

/* ---------- helpers valeurs ---------- */

// Accepte "10.5", "10,5", "1 234,5", "1,234.5"
function parseNumber(raw: string | undefined): number | undefined {
  if (!raw) return undefined;
  let s = raw.replace(/[\s ']/g, '');
  const lastComma = s.lastIndexOf(',');
  const lastDot = s.lastIndexOf('.');
  if (lastComma >= 0 && lastDot >= 0) {
    // Le séparateur décimal est le dernier des deux, l'autre sépare les milliers.
    const decimal = lastComma > lastDot ? ',' : '.';
    const thousands = decimal === ',' ? '.' : ',';
    s = s.split(thousands).join('').replace(decimal, '.');
  } else if (lastComma >= 0) {
    s = s.replace(',', '.');
  }
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : undefined;
}

// "00:52:31", "52:31", "1:03:12.5" -> minutes
function parseClock(raw: string | undefined): number | undefined {
  if (!raw) return undefined;
  const parts = raw.trim().split(':');
  if (parts.length < 2 || parts.length > 3) return parseNumber(raw);
  const nums = parts.map((p) => parseNumber(p));
  if (nums.some((n) => n === undefined)) return undefined;
  const [a, b, c] = nums as number[];
  const seconds = parts.length === 3 ? a * 3600 + b * 60 + c : a * 60 + b;
  return seconds / 60;
}

// Garmin exporte la date en "2024-01-15 08:23:11" ou "15/01/2024 08:23".
function parseDateCell(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  const s = raw.trim();
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  const slashed = s.match(/^(\d{1,2})[/.](\d{1,2})[/.](\d{4})/);
  if (slashed) {
    const first = Number(slashed[1]);
    const second = Number(slashed[2]);
    // Garmin suit la langue du compte : jj/mm en Europe, mm/jj aux États-Unis.
    // Un nombre supérieur à 12 tranche ; sinon on retient le format européen.
    const [day, month] = second > 12 && first <= 12 ? [second, first] : [first, second];
    if (month < 1 || month > 12 || day < 1 || day > 31) return undefined;
    return `${slashed[3]}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
  }
  const parsed = new Date(s);
  if (!Number.isNaN(parsed.getTime())) return toLocalDate(parsed);
  return undefined;
}

// Un timestamp Garmin est en UTC, mais la date qui compte est celle vécue localement.
function toLocalDate(d: Date): string {
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// Certains exports donnent la distance en mètres. Aucune course à pied ne fait 5000 km.
function normaliseDistanceKm(value: number): number {
  return value > 300 ? value / 1000 : value;
}

function round(n: number, decimals: number): number {
  const f = 10 ** decimals;
  return Math.round(n * f) / f;
}

/* ---------- TCX ---------- */

function parseTcx(text: string): ParsedRun[] {
  const doc = xmlDoc(text);
  const runs: ParsedRun[] = [];

  for (const activity of descendantsNamed(doc, 'Activity')) {
    const id = childText(activity, 'Id');
    const laps = childrenNamed(activity, 'Lap');
    if (laps.length === 0) continue;

    let seconds = 0;
    let meters = 0;
    let hrWeighted = 0;
    let hrSeconds = 0;

    for (const lap of laps) {
      const lapSeconds = parseNumber(childText(lap, 'TotalTimeSeconds')) ?? 0;
      seconds += lapSeconds;
      meters += parseNumber(childText(lap, 'DistanceMeters')) ?? 0;
      const hrEl = childrenNamed(lap, 'AverageHeartRateBpm')[0];
      const hr = hrEl ? parseNumber(childText(hrEl, 'Value')) : undefined;
      if (hr && lapSeconds > 0) {
        hrWeighted += hr * lapSeconds;
        hrSeconds += lapSeconds;
      }
    }

    if (seconds <= 0 || meters <= 0) continue;

    const startedAt = id ? new Date(id) : undefined;
    const sport = activity.getAttribute('Sport') ?? undefined;

    runs.push({
      externalId: `tcx:${id ?? `${meters}-${seconds}`}`,
      date: startedAt && !Number.isNaN(startedAt.getTime()) ? toLocalDate(startedAt) : toLocalDate(new Date()),
      sport: inferSport(sport),
      distanceKm: round(meters / 1000, 2),
      durationMin: round(seconds / 60, 1),
      avgHeartRate: hrSeconds > 0 ? Math.round(hrWeighted / hrSeconds) : undefined,
      notes: sport && sport.toLowerCase() !== 'running' ? sport : undefined,
    });
  }

  return runs;
}

/* ---------- GPX ---------- */

// Le GPX ne stocke ni distance ni durée : on les reconstruit depuis les points de trace.
function haversineKm(a: [number, number], b: [number, number]): number {
  const R = 6371;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b[0] - a[0]);
  const dLon = toRad(b[1] - a[1]);
  const lat1 = toRad(a[0]);
  const lat2 = toRad(b[0]);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

function parseGpx(text: string): ParsedRun[] {
  const doc = xmlDoc(text);
  const runs: ParsedRun[] = [];

  for (const trk of descendantsNamed(doc, 'trk')) {
    const points = descendantsNamed(trk, 'trkpt');
    if (points.length < 2) continue;

    let km = 0;
    let previous: [number, number] | undefined;
    let firstTime: Date | undefined;
    let lastTime: Date | undefined;
    let hrSum = 0;
    let hrCount = 0;

    for (const pt of points) {
      const lat = parseNumber(pt.getAttribute('lat') ?? undefined);
      const lon = parseNumber(pt.getAttribute('lon') ?? undefined);
      if (lat !== undefined && lon !== undefined) {
        if (previous) km += haversineKm(previous, [lat, lon]);
        previous = [lat, lon];
      }

      const timeText = childText(pt, 'time');
      if (timeText) {
        const t = new Date(timeText);
        if (!Number.isNaN(t.getTime())) {
          if (!firstTime) firstTime = t;
          lastTime = t;
        }
      }

      const hr = parseNumber(descendantsNamed(pt, 'hr')[0]?.textContent ?? undefined);
      if (hr) {
        hrSum += hr;
        hrCount += 1;
      }
    }

    if (!firstTime || !lastTime || km <= 0) continue;
    const minutes = (lastTime.getTime() - firstTime.getTime()) / 60000;
    if (minutes <= 0) continue;

    const name = childText(trk, 'name');

    runs.push({
      externalId: `gpx:${firstTime.toISOString()}`,
      date: toLocalDate(firstTime),
      sport: inferSport(name),
      distanceKm: round(km, 2),
      durationMin: round(minutes, 1),
      avgHeartRate: hrCount > 0 ? Math.round(hrSum / hrCount) : undefined,
      notes: name,
    });
  }

  return runs;
}

/* ---------- CSV ---------- */

function detectDelimiter(firstLine: string): string {
  const semicolons = (firstLine.match(/;/g) ?? []).length;
  const commas = (firstLine.match(/,/g) ?? []).length;
  return semicolons > commas ? ';' : ',';
}

function parseCsvRows(text: string, delimiter: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === delimiter) {
      row.push(field);
      field = '';
    } else if (c === '\n') {
      row.push(field);
      field = '';
      rows.push(row);
      row = [];
    } else if (c !== '\r') {
      field += c;
    }
  }
  if (field !== '' || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows.filter((r) => r.some((cell) => cell.trim() !== ''));
}

// Les en-têtes changent selon la langue du compte Garmin.
const CSV_HEADERS = {
  date: ['date', 'date de début', 'start time', 'début'],
  distance: ['distance'],
  duration: ['temps', 'durée', 'time', 'duration', 'elapsed time', 'temps écoulé'],
  heartRate: ['fc moyenne', 'fréquence cardiaque moyenne', 'avg hr', 'average heart rate'],
  type: ["type d'activité", 'activity type', 'type'],
  title: ['titre', 'title'],
};

function normaliseHeader(h: string): string {
  return h
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

function findColumn(headers: string[], candidates: string[]): number {
  const normalised = headers.map(normaliseHeader);
  const wanted = candidates.map(normaliseHeader);
  // Correspondance exacte d'abord, sinon préfixe (Garmin ajoute parfois l'unité).
  for (const w of wanted) {
    const exact = normalised.indexOf(w);
    if (exact >= 0) return exact;
  }
  for (const w of wanted) {
    const partial = normalised.findIndex((h) => h.startsWith(w));
    if (partial >= 0) return partial;
  }
  return -1;
}

function parseCsv(text: string): ParseResult {
  const firstLine = text.slice(0, text.indexOf('\n') === -1 ? text.length : text.indexOf('\n'));
  const rows = parseCsvRows(text, detectDelimiter(firstLine));
  if (rows.length < 2) return { runs: [], workouts: [], errors: ['CSV vide ou sans ligne de données'] };

  const headers = rows[0];
  const cols = {
    date: findColumn(headers, CSV_HEADERS.date),
    distance: findColumn(headers, CSV_HEADERS.distance),
    duration: findColumn(headers, CSV_HEADERS.duration),
    heartRate: findColumn(headers, CSV_HEADERS.heartRate),
    type: findColumn(headers, CSV_HEADERS.type),
    title: findColumn(headers, CSV_HEADERS.title),
  };

  const missing: string[] = [];
  if (cols.date < 0) missing.push('date');
  if (cols.distance < 0) missing.push('distance');
  if (cols.duration < 0) missing.push('durée');
  if (missing.length > 0) {
    return {
      runs: [],
      workouts: [],
      errors: [`colonnes introuvables dans le CSV : ${missing.join(', ')}`],
    };
  }

  const runs: ParsedRun[] = [];
  const errors: string[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const cell = (index: number) => (index >= 0 ? row[index] : undefined);

    const type = cell(cols.type)?.trim();
    // On ne garde que ce qui ressemble à de la course à pied.
    if (type && !/course|running|run|trail|marche|walking|treadmill|tapis/i.test(type)) continue;

    const date = parseDateCell(cell(cols.date));
    const distance = parseNumber(cell(cols.distance));
    const duration = parseClock(cell(cols.duration));

    if (!date || !distance || !duration) {
      errors.push(`ligne ${i + 1} ignorée (date, distance ou durée illisible)`);
      continue;
    }

    const title = cell(cols.title)?.trim();
    runs.push({
      externalId: `csv:${date}:${distance}:${duration}`,
      date,
      sport: inferSport(type, title),
      distanceKm: round(normaliseDistanceKm(distance), 2),
      durationMin: round(duration, 1),
      avgHeartRate: parseNumber(cell(cols.heartRate)) || undefined,
      notes: title && title !== '' ? title : undefined,
    });
  }

  return { runs, workouts: [], errors };
}

/* ---------- fichier de synchronisation produit par scripts/garmin-sync.mjs ---------- */

// Garmin ne distingue pas toujours explicitement : le libellé de l'activité
// reste le signal le plus fiable pour séparer la course du reste.
const CARDIO_HINTS = /marche|walk|hike|rando|nordic|tapis|treadmill|escalier|stair|ellipt|velo|vélo|bike|cycl/;

function inferSport(...hints: (string | undefined)[]): RunSport {
  const text = hints.filter(Boolean).join(' ').toLowerCase();
  // « treadmill running » reste de la course : la mention de course prime.
  if (/course|running|run|jogging|trail/.test(text) && !/marche|walk/.test(text)) return 'course';
  return CARDIO_HINTS.test(text) ? 'cardio' : 'course';
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function parseSyncJson(content: string): ParseResult {
  const data = JSON.parse(content) as Record<string, unknown>;
  const errors: string[] = [];

  const rawRuns = Array.isArray(data.runs) ? data.runs : [];
  const rawWorkouts = Array.isArray(data.workouts) ? data.workouts : [];
  if (rawRuns.length === 0 && rawWorkouts.length === 0) {
    return { runs: [], workouts: [], errors: ['fichier de synchronisation vide'] };
  }

  const runs: ParsedRun[] = [];
  rawRuns.forEach((entry, i) => {
    const r = entry as Record<string, unknown>;
    if (typeof r.date !== 'string' || !isFiniteNumber(r.distanceKm) || !isFiniteNumber(r.durationMin)) {
      errors.push(`course ${i + 1} ignorée (champs manquants)`);
      return;
    }
    runs.push({
      externalId: typeof r.externalId === 'string' ? r.externalId : `sync:${r.date}:${r.distanceKm}`,
      date: r.date,
      sport:
        r.sport === 'cardio' || r.sport === 'course'
          ? r.sport
          : inferSport(typeof r.notes === 'string' ? r.notes : undefined),
      distanceKm: r.distanceKm,
      durationMin: r.durationMin,
      avgHeartRate: isFiniteNumber(r.avgHeartRate) ? r.avgHeartRate : undefined,
      notes: typeof r.notes === 'string' ? r.notes : undefined,
    });
  });

  const workouts: ImportedWorkout[] = [];
  rawWorkouts.forEach((entry, i) => {
    const w = entry as Record<string, unknown>;
    const exercises = Array.isArray(w.exercises) ? w.exercises : [];
    if (typeof w.date !== 'string' || typeof w.externalId !== 'string' || exercises.length === 0) {
      errors.push(`séance ${i + 1} ignorée (champs manquants)`);
      return;
    }
    workouts.push({
      externalId: w.externalId,
      date: w.date,
      startedAt: typeof w.startedAt === 'string' ? w.startedAt : `${w.date}T12:00:00.000Z`,
      finishedAt: typeof w.finishedAt === 'string' ? w.finishedAt : `${w.date}T13:00:00.000Z`,
      notes: typeof w.notes === 'string' ? w.notes : undefined,
      exercises: exercises.map((raw) => {
        const e = raw as Record<string, unknown>;
        const sets = Array.isArray(e.sets) ? e.sets : [];
        return {
          name: typeof e.name === 'string' && e.name.trim() ? e.name : 'Exercice Garmin',
          notes: typeof e.notes === 'string' && e.notes.trim() ? e.notes : undefined,
          sets: sets.map((rawSet) => {
            const s = rawSet as Record<string, unknown>;
            return {
              reps: isFiniteNumber(s.reps) ? s.reps : 0,
              weightKg: isFiniteNumber(s.weightKg) ? s.weightKg : 0,
            };
          }),
        };
      }),
    });
  });

  return { runs, workouts, errors };
}

/* ---------- point d'entrée ---------- */

export function parseGarminFile(fileName: string, content: string): ParseResult {
  const extension = fileName.toLowerCase().split('.').pop();
  try {
    if (extension === 'json') return parseSyncJson(content);
    if (extension === 'csv') return parseCsv(content);
    if (extension === 'tcx') return { runs: parseTcx(content), workouts: [], errors: [] };
    if (extension === 'gpx') return { runs: parseGpx(content), workouts: [], errors: [] };
    return {
      runs: [],
      workouts: [],
      errors: [`${fileName} : format non reconnu (attendu .tcx, .gpx, .csv ou .json)`],
    };
  } catch (e) {
    const message = e instanceof Error ? e.message : 'erreur inconnue';
    return { runs: [], workouts: [], errors: [`${fileName} : ${message}`] };
  }
}
