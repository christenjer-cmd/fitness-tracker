import { useRef, useState } from 'react';
import { useStore } from '../store/useStore';
import { parseGarminFile, type ParsedRun } from '../garmin';
import { UploadIcon } from './icons';
import { formatDate } from '../utils';
import type { ImportedWorkout } from '../types';

interface Candidate extends ParsedRun {
  alreadyImported: boolean;
  selected: boolean;
}

interface WorkoutCandidate extends ImportedWorkout {
  alreadyImported: boolean;
  selected: boolean;
}

export default function GarminImport() {
  const runs = useStore((s) => s.runs);
  const addRuns = useStore((s) => s.addRuns);
  const workouts = useStore((s) => s.workouts);
  const addWorkouts = useStore((s) => s.addWorkouts);

  const fileInput = useRef<HTMLInputElement>(null);
  const [candidates, setCandidates] = useState<Candidate[] | null>(null);
  const [workoutCandidates, setWorkoutCandidates] = useState<WorkoutCandidate[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [confirmation, setConfirmation] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleFiles(files: FileList) {
    setBusy(true);
    setConfirmation(null);

    const knownRuns = new Set(runs.map((r) => r.externalId).filter(Boolean));
    const knownWorkouts = new Set(workouts.map((w) => w.externalId).filter(Boolean));
    const collected: ParsedRun[] = [];
    const collectedWorkouts: ImportedWorkout[] = [];
    const collectedErrors: string[] = [];
    const seen = new Set<string>();

    for (const file of Array.from(files)) {
      const content = await file.text();
      const result = parseGarminFile(file.name, content);
      collectedErrors.push(...result.errors);
      for (const run of result.runs) {
        // Un même fichier peut être déposé deux fois dans la sélection.
        if (seen.has(run.externalId)) continue;
        seen.add(run.externalId);
        collected.push(run);
      }
      for (const workout of result.workouts) {
        if (seen.has(workout.externalId)) continue;
        seen.add(workout.externalId);
        collectedWorkouts.push(workout);
      }
      if (result.runs.length === 0 && result.workouts.length === 0 && result.errors.length === 0) {
        collectedErrors.push(`${file.name} : aucune activité trouvée`);
      }
    }

    collected.sort((a, b) => (a.date < b.date ? 1 : -1));
    collectedWorkouts.sort((a, b) => (a.date < b.date ? 1 : -1));

    setCandidates(
      collected.map((run) => {
        const alreadyImported = knownRuns.has(run.externalId);
        return { ...run, alreadyImported, selected: !alreadyImported };
      })
    );
    setWorkoutCandidates(
      collectedWorkouts.map((w) => {
        const alreadyImported = knownWorkouts.has(w.externalId);
        return { ...w, alreadyImported, selected: !alreadyImported };
      })
    );
    setErrors(collectedErrors);
    setBusy(false);
  }

  function toggle(externalId: string) {
    setCandidates((current) =>
      current?.map((c) => (c.externalId === externalId ? { ...c, selected: !c.selected } : c)) ?? null
    );
    setWorkoutCandidates((current) =>
      current.map((c) => (c.externalId === externalId ? { ...c, selected: !c.selected } : c))
    );
  }

  function confirmImport() {
    if (!candidates) return;

    const chosenRuns = candidates.filter((c) => c.selected);
    const addedRuns = addRuns(
      chosenRuns.map((c) => ({
        date: c.date,
        distanceKm: c.distanceKm,
        durationMin: c.durationMin,
        avgPaceMinPerKm: c.distanceKm > 0 ? c.durationMin / c.distanceKm : undefined,
        avgHeartRate: c.avgHeartRate,
        notes: c.notes,
        sport: c.sport,
        source: 'garmin' as const,
        externalId: c.externalId,
      }))
    );

    const chosenWorkouts = workoutCandidates.filter((c) => c.selected);
    const addedWorkouts = addWorkouts(
      chosenWorkouts.map(({ alreadyImported: _a, selected: _s, ...w }) => w)
    );

    setCandidates(null);
    setWorkoutCandidates([]);
    setErrors([]);

    const parts: string[] = [];
    if (addedRuns > 0) parts.push(`${addedRuns} course${addedRuns > 1 ? 's' : ''}`);
    if (addedWorkouts > 0) parts.push(`${addedWorkouts} séance${addedWorkouts > 1 ? 's' : ''}`);
    setConfirmation(
      parts.length === 0
        ? 'Rien de nouveau : tout était déjà enregistré.'
        : `${parts.join(' et ')} importée${addedRuns + addedWorkouts > 1 ? 's' : ''}.`
    );
  }

  const selectedCount =
    (candidates?.filter((c) => c.selected).length ?? 0) +
    workoutCandidates.filter((c) => c.selected).length;
  const totalCandidates = (candidates?.length ?? 0) + workoutCandidates.length;

  return (
    <div className="card p-4 space-y-3">
      <div className="flex items-center gap-2.5">
        <span className="w-9 h-9 rounded-xl bg-black/25 border border-white/[0.06] grid place-items-center shrink-0">
          <UploadIcon className="w-[18px] h-[18px] text-slate-400" />
        </span>
        <div className="min-w-0">
          <h2 className="font-bold leading-tight">Importer depuis Garmin</h2>
          <p className="text-xs text-slate-500 mt-0.5">.tcx, .gpx, .csv ou fichier de synchro</p>
        </div>
      </div>

      <button
        onClick={() => fileInput.current?.click()}
        disabled={busy}
        className="btn-soft w-full py-2.5 text-sm"
      >
        {busy ? 'Lecture du fichier...' : 'Choisir un fichier'}
      </button>
      <input
        ref={fileInput}
        type="file"
        multiple
        accept=".tcx,.gpx,.csv,.json"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) handleFiles(e.target.files);
          e.target.value = '';
        }}
      />

      {confirmation && <p className="text-sm text-accent">{confirmation}</p>}

      {errors.length > 0 && (
        <ul className="text-xs text-amber-400 space-y-0.5">
          {errors.map((err, i) => (
            <li key={i}>{err}</li>
          ))}
        </ul>
      )}

      {candidates && totalCandidates === 0 && (
        <p className="text-sm text-slate-500">Aucune activité détectée dans ce fichier.</p>
      )}

      {candidates && totalCandidates > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-slate-400">
            {totalCandidates} activité{totalCandidates > 1 ? 's' : ''} détectée
            {totalCandidates > 1 ? 's' : ''}. Décoche celles que tu ne veux pas.
          </p>

          <div className="max-h-64 overflow-y-auto space-y-1.5">
            {workoutCandidates.map((c) => (
              <label
                key={c.externalId}
                className={`flex items-start gap-2.5 bg-black/25 border border-white/[0.06] rounded-xl px-3 py-2.5 ${
                  c.alreadyImported ? 'opacity-50' : ''
                }`}
              >
                <input
                  type="checkbox"
                  checked={c.selected}
                  onChange={() => toggle(c.externalId)}
                  className="mt-1 accent-green-600"
                />
                <span className="flex-1 min-w-0">
                  <span className="block text-sm font-medium">
                    Musculation · {c.exercises.length} exercice
                    {c.exercises.length > 1 ? 's' : ''}
                  </span>
                  <span className="block text-xs text-slate-400">
                    {formatDate(c.date)}
                    {c.alreadyImported ? ' · déjà importée' : ''}
                  </span>
                  <span className="block text-xs text-slate-500 truncate">
                    {c.exercises.map((e) => e.name).join(' · ')}
                  </span>
                </span>
              </label>
            ))}

            {candidates.map((c) => (
              <label
                key={c.externalId}
                className={`flex items-start gap-2.5 bg-black/25 border border-white/[0.06] rounded-xl px-3 py-2.5 ${
                  c.alreadyImported ? 'opacity-50' : ''
                }`}
              >
                <input
                  type="checkbox"
                  checked={c.selected}
                  onChange={() => toggle(c.externalId)}
                  className="mt-1 accent-green-600"
                />
                <span className="flex-1 min-w-0">
                  <span className="block text-sm font-medium">
                    {c.distanceKm} km · {Math.round(c.durationMin)} min
                  </span>
                  <span className="block text-xs text-slate-400">
                    {formatDate(c.date)}
                    {c.avgHeartRate ? ` · ${c.avgHeartRate} bpm` : ''}
                    {c.alreadyImported ? ' · déjà importée' : ''}
                  </span>
                  {c.notes && <span className="block text-xs text-slate-500 truncate">{c.notes}</span>}
                </span>
              </label>
            ))}
          </div>

          <div className="flex gap-2">
            <button
              onClick={confirmImport}
              disabled={selectedCount === 0}
              className="btn-primary flex-1 py-2.5 text-sm"
            >
              Importer {selectedCount > 0 ? selectedCount : ''}
            </button>
            <button
              onClick={() => {
                setCandidates(null);
                setErrors([]);
              }}
              className="btn-soft px-5 py-2.5 text-sm"
            >
              Annuler
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
