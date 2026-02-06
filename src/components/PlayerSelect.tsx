import { useState } from 'react';
import type { Player, Formation, Availability } from '../types';

interface PlayerSelectProps {
  players: Player[];
  onStart: (presentPlayerIds: string[], formation: Formation, opponentName: string | null, availability: Record<string, Availability>) => void;
  onCancel: () => void;
}

const availabilityOptions: { value: Availability; label: string }[] = [
  { value: '25', label: '¼' },
  { value: '45', label: '½' },
  { value: '70', label: '¾' },
  { value: '90', label: '90\'' },
];

const formations: { id: Formation; label: string }[] = [
  { id: '4-3-3', label: '4-3-3' },
  { id: '3-4-3', label: '3-4-3' },
  { id: '4-4-2', label: '4-4-2' },
];

export function PlayerSelect({ players, onStart, onCancel }: PlayerSelectProps) {
  const [selectedPlayers, setSelectedPlayers] = useState<Set<string>>(new Set());
  const [formation, setFormation] = useState<Formation>('4-3-3');
  const [opponentName, setOpponentName] = useState('');
  const [availability, setAvailability] = useState<Record<string, Availability>>({});

  const togglePlayer = (playerId: string) => {
    setSelectedPlayers(prev => {
      const next = new Set(prev);
      if (next.has(playerId)) {
        next.delete(playerId);
        setAvailability(a => {
          const copy = { ...a };
          delete copy[playerId];
          return copy;
        });
      } else {
        next.add(playerId);
        setAvailability(a => ({ ...a, [playerId]: '90' }));
      }
      return next;
    });
  };

  const selectAll = () => {
    const all = new Set(players.map(p => p.id));
    setSelectedPlayers(all);
    const newAvail: Record<string, Availability> = {};
    players.forEach(p => { newAvail[p.id] = availability[p.id] || '90'; });
    setAvailability(newAvail);
  };

  const selectNone = () => {
    setSelectedPlayers(new Set());
    setAvailability({});
  };

  const handleStart = () => {
    onStart(Array.from(selectedPlayers), formation, opponentName.trim() || null, availability);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header */}
      <div className="bg-red-600 text-white px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <button
          onClick={onCancel}
          className="p-2 -ml-2 hover:bg-red-700 rounded-lg transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <h1 className="text-lg font-semibold">Nieuwe Wedstrijd</h1>
      </div>

      <div className="flex-1 overflow-auto p-4">
        {/* Opponent name input */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
          <h2 className="text-sm font-medium text-gray-700 mb-3">Tegenstander (optioneel)</h2>
          <input
            type="text"
            value={opponentName}
            onChange={(e) => setOpponentName(e.target.value)}
            placeholder="Tegenstander"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
          />
          {opponentName.trim() && (
            <p className="mt-2 text-sm text-gray-500">
              Wedstrijd: VVIJ Zo 2 - {opponentName.trim()}
            </p>
          )}
        </div>

        {/* Formation picker */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
          <h2 className="text-sm font-medium text-gray-700 mb-3">Formatie</h2>
          <div className="flex gap-2">
            {formations.map(f => (
              <button
                key={f.id}
                onClick={() => setFormation(f.id)}
                className={`flex-1 py-2 px-3 rounded-lg font-medium transition-colors ${
                  formation === f.id
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Player selection */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-sm font-medium text-gray-700">
              Aanwezig ({selectedPlayers.size})
            </h2>
            <div className="flex gap-2">
              <button
                onClick={selectAll}
                className="text-sm text-red-600 hover:text-red-700"
              >
                Alles
              </button>
              <span className="text-gray-300">|</span>
              <button
                onClick={selectNone}
                className="text-sm text-red-600 hover:text-red-700"
              >
                Niets
              </button>
            </div>
          </div>
          <div className="divide-y divide-gray-100 max-h-[50vh] overflow-auto">
            {players.map(player => {
              const isSelected = selectedPlayers.has(player.id);
              return (
                <div key={player.id} className="flex items-center px-4 py-3 gap-3">
                  <label className="flex items-center flex-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => togglePlayer(player.id)}
                      className="w-5 h-5 rounded border-gray-300 text-red-600 focus:ring-red-500"
                    />
                    <span className="ml-3 text-gray-800">{player.name}</span>
                  </label>
                  {isSelected && (
                    <div className="flex gap-1">
                      {availabilityOptions.map(opt => (
                        <button
                          key={opt.value}
                          onClick={() => setAvailability(a => ({ ...a, [player.id]: opt.value }))}
                          className={`w-8 h-7 text-xs font-medium rounded transition-colors ${
                            availability[player.id] === opt.value
                              ? 'bg-red-600 text-white'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4">
        <button
          onClick={handleStart}
          disabled={selectedPlayers.size === 0}
          className="w-full py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Start Wedstrijd ({selectedPlayers.size} spelers)
        </button>
      </div>
    </div>
  );
}
