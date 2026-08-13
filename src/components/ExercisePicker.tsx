import { useMemo, useState } from 'react';
import { useStore } from '../store/useStore';
import { EQUIPMENT_LABELS, MUSCLE_GROUP_LABELS } from '../data/exercises';
import { CloseIcon, PlusIcon, SearchIcon } from './icons';
import type { Equipment, MuscleGroup } from '../types';

interface Props {
  onSelect: (exerciseId: string) => void;
  onClose: () => void;
}

export default function ExercisePicker({ onSelect, onClose }: Props) {
  const allExercises = useStore((s) => s.allExercises);
  const addCustomExercise = useStore((s) => s.addCustomExercise);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<MuscleGroup | 'tous'>('tous');
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customGroup, setCustomGroup] = useState<MuscleGroup>('pectoraux');
  const [customEquipment, setCustomEquipment] = useState<Equipment>('barre');

  const exercises = allExercises();

  const filtered = useMemo(() => {
    return exercises.filter((e) => {
      const matchesQuery = e.name.toLowerCase().includes(query.toLowerCase());
      const matchesFilter = filter === 'tous' || e.muscleGroups.includes(filter);
      return matchesQuery && matchesFilter;
    });
  }, [exercises, query, filter]);

  const groups: (MuscleGroup | 'tous')[] = [
    'tous',
    ...(Object.keys(MUSCLE_GROUP_LABELS) as MuscleGroup[]),
  ];

  return (
    <div className="fixed inset-0 bg-ink/95 backdrop-blur-md z-40 flex flex-col animate-fade-in">
      <div className="w-full max-w-md mx-auto flex flex-col h-full">
        <div className="px-4 pt-4 pb-3 flex items-center gap-2">
          <div className="relative flex-1">
            <SearchIcon className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher un exercice..."
              className="field w-full pl-9 pr-3 py-2.5 text-sm"
            />
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-surface-raised border border-line grid place-items-center text-slate-400 active:scale-90 transition shrink-0"
            aria-label="Fermer"
          >
            <CloseIcon className="w-4 h-4" />
          </button>
        </div>

        <div className="flex gap-1.5 overflow-x-auto no-scrollbar px-4 pb-3">
          {groups.map((g) => (
            <button
              key={g}
              onClick={() => setFilter(g)}
              className={filter === g ? 'chip-on' : 'chip-off'}
            >
              {g === 'tous' ? 'Tous' : MUSCLE_GROUP_LABELS[g]}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-4 space-y-1.5 pb-2">
          {filtered.map((ex) => (
            <button
              key={ex.id}
              onClick={() => onSelect(ex.id)}
              className="card w-full text-left px-4 py-3 active:scale-[0.99] active:border-accent/40 transition"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-semibold text-sm truncate">{ex.name}</div>
                  <div className="text-xs text-slate-500 truncate mt-0.5">
                    {ex.muscleGroups.map((g) => MUSCLE_GROUP_LABELS[g]).join(' · ')}
                  </div>
                </div>
                <span className="text-[10px] text-slate-500 bg-surface-sunken px-2 py-1 rounded-lg shrink-0">
                  {EQUIPMENT_LABELS[ex.equipment]}
                </span>
              </div>
            </button>
          ))}
          {filtered.length === 0 && (
            <p className="text-center text-slate-500 text-sm py-10">Aucun exercice trouvé</p>
          )}
        </div>

        <div className="p-4 border-t border-line bg-ink/80 pb-[max(1rem,env(safe-area-inset-bottom))]">
          {!showCustomForm ? (
            <button
              onClick={() => {
                // La recherche en cours et le filtre actif sont de bonnes valeurs de départ.
                setCustomName(query.trim());
                if (filter !== 'tous') setCustomGroup(filter);
                setShowCustomForm(true);
              }}
              className="btn-accent-soft w-full py-3 flex items-center justify-center gap-2 text-sm"
            >
              <PlusIcon className="w-4 h-4" />
              Créer un exercice
            </button>
          ) : (
            <div className="space-y-2 animate-fade-up">
              <input
                autoFocus
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="Nom de l'exercice"
                className="field w-full px-3 py-2.5 text-sm"
              />
              <div className="flex gap-2">
                <select
                  value={customGroup}
                  onChange={(e) => setCustomGroup(e.target.value as MuscleGroup)}
                  className="field flex-1 px-3 py-2.5 text-sm min-w-0"
                >
                  {(Object.keys(MUSCLE_GROUP_LABELS) as MuscleGroup[]).map((g) => (
                    <option key={g} value={g}>
                      {MUSCLE_GROUP_LABELS[g]}
                    </option>
                  ))}
                </select>
                <select
                  value={customEquipment}
                  onChange={(e) => setCustomEquipment(e.target.value as Equipment)}
                  className="field flex-1 px-3 py-2.5 text-sm min-w-0"
                >
                  {(Object.keys(EQUIPMENT_LABELS) as Equipment[]).map((eq) => (
                    <option key={eq} value={eq}>
                      {EQUIPMENT_LABELS[eq]}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    if (!customName.trim()) return;
                    const ex = addCustomExercise({
                      name: customName.trim(),
                      muscleGroups: [customGroup],
                      equipment: customEquipment,
                    });
                    onSelect(ex.id);
                  }}
                  disabled={!customName.trim()}
                  className="btn-primary flex-1 py-2.5 text-sm"
                >
                  Ajouter
                </button>
                <button
                  onClick={() => setShowCustomForm(false)}
                  className="btn-soft px-5 py-2.5 text-sm"
                >
                  Annuler
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
