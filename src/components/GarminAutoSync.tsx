import { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import { parseGarminFile } from '../garmin';
import { CloseIcon, UploadIcon } from './icons';

/**
 * Récupère au démarrage le fichier déposé sur le dépôt par le script de
 * synchronisation, et ajoute les activités encore inconnues.
 *
 * L'opération est sans risque de doublon : l'ajout se fait par identifiant
 * d'origine, donc relire le même fichier vingt fois ne change rien.
 */
export default function GarminAutoSync() {
  const addRuns = useStore((s) => s.addRuns);
  const addWorkouts = useStore((s) => s.addWorkouts);
  const [summary, setSummary] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function sync() {
      try {
        // BASE_URL vaut '/' en local et '/fitness-tracker/' en ligne.
        const url = `${import.meta.env.BASE_URL}garmin-data.json`;
        const response = await fetch(url, { cache: 'no-store' });
        if (!response.ok) return; // Pas encore de fichier publié : rien à faire.

        const result = parseGarminFile('garmin-data.json', await response.text());
        if (cancelled) return;

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
        const addedWorkouts = addWorkouts(result.workouts);

        if (addedRuns + addedWorkouts === 0) return;

        const parts: string[] = [];
        if (addedWorkouts > 0) parts.push(`${addedWorkouts} séance${addedWorkouts > 1 ? 's' : ''}`);
        if (addedRuns > 0) parts.push(`${addedRuns} activité${addedRuns > 1 ? 's' : ''}`);
        setSummary(`${parts.join(' et ')} récupérée${addedRuns + addedWorkouts > 1 ? 's' : ''}`);
      } catch {
        // Hors ligne ou fichier illisible : on reste silencieux, l'app fonctionne
        // parfaitement sans, et la prochaine ouverture retentera.
      }
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
        <span className="font-semibold text-accent">Garmin</span>
        <span className="text-slate-300"> · {summary}</span>
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
