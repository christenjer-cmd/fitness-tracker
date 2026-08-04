import { useMemo, useState } from 'react';
import { useStore } from '../store/useStore';
import { EQUIPMENT_LABELS, MUSCLE_GROUP_LABELS } from '../data/exercises';
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

  const groups: (MuscleGroup | 'tous')[] = ['tous', ...(Object.keys(MUSCLE_GROUP_LABELS) as MuscleGroup[])];

  return (
    <div className="fixed inset-0 bg-slate-950/95 z-20 flex flex-col">
      <div className="px-4 py-3 border-b border-slate-800 flex items-center gap-2">
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher un exercice..."
          className="flex-1 bg-slate-800 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent"
        />
        <button onClick={onClose} className="text-slate-400 px-2">
          ✕
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto px-4 py-2 border-b border-slate-800">
        {groups.map((g) => (
          <button
            key={g}
            onClick={() => setFilter(g)}
            className={`whitespace-nowrap text-xs px-3 py-1.5 rounded-full ${
              filter === g ? 'bg-accent text-white' : 'bg-slate-800 text-slate-300'
            }`}
          >
            {g === 'tous' ? 'Tous' : MUSCLE_GROUP_LABELS[g]}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        {filtered.map((ex) => (
          <button
            key={ex.id}
            onClick={() => onSelect(ex.id)}
            className="w-full text-left px-4 py-3 border-b border-slate-900 active:bg-slate-800"
          >
            <div className="font-medium">{ex.name}</div>
            <div className="text-xs text-slate-400">
              {ex.muscleGroups.map((g) => MUSCLE_GROUP_LABELS[g]).join(', ')}
            </div>
          </button>
        ))}
        {filtered.length === 0 && (
          <p className="text-center text-slate-500 text-sm py-6">Aucun exercice trouvé</p>
        )}
      </div>

      <div className="p-3 border-t border-slate-800">
        {!showCustomForm ? (
          <button
            onClick={() => {
              // La recherche en cours et le filtre actif sont de bonnes valeurs de départ.
              setCustomName(query.trim());
              if (filter !== 'tous') setCustomGroup(filter);
              setShowCustomForm(true);
            }}
            className="w-full bg-slate-800 text-accent rounded-lg py-2 text-sm font-medium"
          >
            + Créer un exercice personnalisé
          </button>
        ) : (
          <div className="space-y-2">
            <input
              autoFocus
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="Nom de l'exercice"
              className="w-full bg-slate-800 rounded-lg px-3 py-2 text-sm outline-none"
            />
            <div className="flex gap-2">
              <select
                value={customGroup}
                onChange={(e) => setCustomGroup(e.target.value as MuscleGroup)}
                className="flex-1 bg-slate-800 rounded-lg px-2 py-2 text-sm min-w-0"
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
                className="flex-1 bg-slate-800 rounded-lg px-2 py-2 text-sm min-w-0"
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
                className="flex-1 bg-accent text-white rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-40"
              >
                Ajouter
              </button>
              <button
                onClick={() => setShowCustomForm(false)}
                className="px-4 bg-slate-800 text-slate-300 rounded-lg text-sm"
              >
                Annuler
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
