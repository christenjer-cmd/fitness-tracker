import { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import { parseGarminFile } from '../garmin';
import { CloseIcon, UploadIcon } from './icons';

/** Déposé par le script de synchronisation, réécrit à chaque envoi. */
const GARMIN = { file: 'garmin-data.json', label: 'Garmin' };
/** Les séances reprises du carnet du téléphone : figées une fois pour toutes. */
const CARNET = { file: 'carnet-notes.json', label: 'Carnet' };

/** Le carnet ne bouge plus : une fois repris, inutile de le retélécharger. */
function carnetDejaRepris(): boolean {
  return useStore.getState().workouts.some((w) => w.externalId?.startsWith('notes:'));
}

/**
 * Récupère au démarrage les fichiers déposés sur le dépôt, et ajoute les
 * activités encore inconnues.
 *
 * L'opération est sans risque de doublon : l'ajout se fait par identifiant
 * d'origine, donc relire le même fichier vingt fois ne change rien.
 */
export default function GarminAutoSync() {
  const addRuns = useStore((s) => s.addRuns);
  const addWorkouts = useStore((s) => s.addWorkouts);
  const [summary, setSummary] = useState<{ sources: string; text: string } | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load(file: string) {
      try {
        // BASE_URL vaut '/' en local et '/fitness-tracker/' en ligne.
        const url = `${import.meta.env.BASE_URL}${file}`;
        const response = await fetch(url, { cache: 'no-store' });
        // Pas encore de fichier publié : rien à faire.
        if (!response.ok) return { runs: 0, workouts: 0 };

        const result = parseGarminFile(file, await response.text());
        if (cancelled) return { runs: 0, workouts: 0 };

        const addedRuns = addRuns(
          result.runs.map((r) => ({
            date: r.date,
            distanceKm: r.distanceKm,
            durationMin: r.durationMin,
            avgPaceMinPerKm: r.distanceKm > 0 ? r.durationMin / r.distanceKm : undefined,
            avgHeartRate: r.avgHeartRate,
            notes: r.notes,
            sport: r.sport,
            source: 'garmin' as const,
            externalId: r.externalId,
          }))
        );
        return { runs: addedRuns, workouts: addWorkouts(result.workouts) };
      } catch {
        // Hors ligne ou fichier illisible : on reste silencieux, l'app fonctionne
        // parfaitement sans, et la prochaine ouverture retentera.
        return { runs: 0, workouts: 0 };
      }
    }

    async function sync() {
      const sources = carnetDejaRepris() ? [GARMIN] : [GARMIN, CARNET];
      const contributors: string[] = [];
      let runs = 0;
      let workouts = 0;

      for (const { file, label } of sources) {
        const added = await load(file);
        if (cancelled) return;
        runs += added.runs;
        workouts += added.workouts;
        if (added.runs + added.workouts > 0) contributors.push(label);
      }

      if (runs + workouts === 0) return;

      const parts: string[] = [];
      if (workouts > 0) parts.push(`${workouts} séance${workouts > 1 ? 's' : ''}`);
      if (runs > 0) parts.push(`${runs} activité${runs > 1 ? 's' : ''}`);
      setSummary({
        sources: contributors.join(' et '),
        text: `${parts.join(' et ')} récupérée${runs + workouts > 1 ? 's' : ''}`,
      });
    }

    sync();
    return () => {
      cancelled = true;
    };
  }, [addRuns, addWorkouts]);

  if (!summary) return null;

  return (
    <div className="mb-4 card-glow px-3.5 py-2.5 flex items-center gap-2.5 animate-fade-up">
      <span className="w-8 h-8 rounded-xl bg-accent/10 border border-accent/20 grid place-items-center shrink-0">
        <UploadIcon className="w-4 h-4 text-accent" />
      </span>
      <span className="text-sm min-w-0 flex-1">
        <span className="font-semibold text-accent">{summary.sources}</span>
        <span className="text-slate-300"> · {summary.text}</span>
      </span>
      <button
        onClick={() => setSummary(null)}
        className="text-slate-500 p-1 shrink-0"
        aria-label="Fermer"
      >
        <CloseIcon className="w-4 h-4" />
      </button>
    </div>
  );
}
