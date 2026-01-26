import type { Formation } from '../types';

interface FormationPickerProps {
  current: Formation;
  onChange: (formation: Formation) => void;
}

const formations: Formation[] = ['4-3-3', '3-4-3', '4-4-2'];

export function FormationPicker({ current, onChange }: FormationPickerProps) {
  return (
    <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
      {formations.map(formation => (
        <button
          key={formation}
          onClick={() => onChange(formation)}
          className={`
            px-3 py-1.5 rounded-md text-sm font-medium transition-colors
            ${
              current === formation
                ? 'bg-white text-red-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }
          `}
        >
          {formation}
        </button>
      ))}
    </div>
  );
}
