import { useRef, useState } from 'react';
import { useStore } from '../store/useStore';
import { parseGarminFile, type ParsedRun } from '../garmin';
import { formatDate } from '../utils';

interface Candidate extends ParsedRun {
  alreadyImported: boolean;
  selected: boolean;
}

export default function GarminImport() {
  const runs = useStore((s) => s.runs);
  const addRuns = useStore((s) => s.addRuns);

  const fileInput = useRef<HTMLInputElement>(null);
  const [candidates, setCandidates] = useState<Candidate[] | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [confirmation, setConfirmation] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleFiles(files: FileList) {
    setBusy(true);
    setConfirmation(null);

    const known = new Set(runs.map((r) => r.externalId).filter(Boolean));
    const collected: ParsedRun[] = [];
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
      if (result.runs.length === 0 && result.errors.length === 0) {
        collectedErrors.push(`${file.name} : aucune course trouvée`);
      }
    }

    collected.sort((a, b) => (a.date < b.date ? 1 : -1));

    setCandidates(
      collected.map((run) => {
        const alreadyImported = known.has(run.externalId);
        return { ...run, alreadyImported, selected: !alreadyImported };
      })
    );
    setErrors(collectedErrors);
    setBusy(false);
  }

  function toggle(externalId: string) {
    setCandidates((current) =>
      current?.map((c) => (c.externalId === externalId ? { ...c, selected: !c.selected } : c)) ?? null
    );
  }

  function confirmImport() {
    if (!candidates) return;
    const chosen = candidates.filter((c) => c.selected);
    const added = addRuns(
      chosen.map((c) => ({
        date: c.date,
        distanceKm: c.distanceKm,
        durationMin: c.durationMin,
        avgPaceMinPerKm: c.durationMin / c.distanceKm,
        avgHeartRate: c.avgHeartRate,
        notes: c.notes,
        source: 'garmin' as const,
        externalId: c.externalId,
      }))
    );
    setCandidates(null);
    setErrors([]);
    setConfirmation(
      added === 0
        ? 'Aucune nouvelle course : tout était déjà enregistré.'
        : `${added} course${added > 1 ? 's' : ''} importée${added > 1 ? 's' : ''}.`
    );
  }

  const selectedCount = candidates?.filter((c) => c.selected).length ?? 0;

  return (
    <div className="bg-slate-900 rounded-xl p-4 space-y-3">
      <div>
        <h2 className="font-semibold">Importer depuis Garmin</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Fichier .tcx ou .gpx d'une activité, ou l'export .csv de ta liste d'activités.
        </p>
      </div>

      <button
        onClick={() => fileInput.current?.click()}
        disabled={busy}
        className="w-full bg-slate-800 text-accent font-medium rounded-lg py-2.5 text-sm disabled:opacity-50"
      >
        {busy ? 'Lecture du fichier...' : 'Choisir un fichier'}
      </button>
      <input
        ref={fileInput}
        type="file"
        multiple
        accept=".tcx,.gpx,.csv"
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

      {candidates && candidates.length === 0 && (
        <p className="text-sm text-slate-500">Aucune course détectée dans ce fichier.</p>
      )}

      {candidates && candidates.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-slate-400">
            {candidates.length} course{candidates.length > 1 ? 's' : ''} détectée
            {candidates.length > 1 ? 's' : ''}. Décoche celles que tu ne veux pas.
          </p>

          <div className="max-h-64 overflow-y-auto space-y-1.5">
            {candidates.map((c) => (
              <label
                key={c.externalId}
                className={`flex items-start gap-2.5 bg-slate-800 rounded-lg px-3 py-2 ${
                  c.alreadyImported ? 'opacity-60' : ''
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
              className="flex-1 bg-accent text-white font-semibold rounded-lg py-2.5 text-sm disabled:opacity-40"
            >
              Importer {selectedCount > 0 ? selectedCount : ''}
            </button>
            <button
              onClick={() => {
                setCandidates(null);
                setErrors([]);
              }}
              className="px-4 bg-slate-800 text-slate-300 rounded-lg text-sm"
            >
              Annuler
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
