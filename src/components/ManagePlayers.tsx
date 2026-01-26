import { useState } from 'react';
import type { Player } from '../types';

interface ManagePlayersProps {
  players: Player[];
  onAddPlayer: (name: string) => Promise<void>;
  onRemovePlayer: (id: string) => Promise<void>;
  onBack: () => void;
}

export function ManagePlayers({
  players,
  onAddPlayer,
  onRemovePlayer,
  onBack,
}: ManagePlayersProps) {
  const [newPlayerName, setNewPlayerName] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const handleAddPlayer = async () => {
    if (!newPlayerName.trim()) return;

    setIsAdding(true);
    setError(null);

    try {
      await onAddPlayer(newPlayerName.trim());
      setNewPlayerName('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kon speler niet toevoegen');
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemovePlayer = async (id: string) => {
    try {
      await onRemovePlayer(id);
      setConfirmDelete(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kon speler niet verwijderen');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-red-600 text-white px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <button
          onClick={onBack}
          className="p-2 -ml-2 hover:bg-red-700 rounded-lg transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-lg font-semibold">Spelers Beheren</h1>
      </div>

      <div className="p-4">
        {/* Add player form */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
          <h2 className="text-sm font-medium text-gray-700 mb-3">Nieuwe speler toevoegen</h2>
          <div className="flex gap-2">
            <input
              type="text"
              value={newPlayerName}
              onChange={(e) => setNewPlayerName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddPlayer()}
              placeholder="Naam"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
            />
            <button
              onClick={handleAddPlayer}
              disabled={!newPlayerName.trim() || isAdding}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isAdding ? '...' : 'Toevoegen'}
            </button>
          </div>
          {error && (
            <p className="mt-2 text-sm text-red-600">{error}</p>
          )}
        </div>

        {/* Player list */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-4 py-3 border-b border-gray-100">
            <h2 className="text-sm font-medium text-gray-700">
              Spelerslijst ({players.length})
            </h2>
          </div>
          <div className="divide-y divide-gray-100">
            {players.map(player => (
              <div
                key={player.id}
                className="flex items-center justify-between px-4 py-3"
              >
                <span className="text-gray-800">{player.name}</span>
                {confirmDelete === player.id ? (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleRemovePlayer(player.id)}
                      className="px-3 py-1 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
                    >
                      Verwijder
                    </button>
                    <button
                      onClick={() => setConfirmDelete(null)}
                      className="px-3 py-1 bg-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      Annuleer
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmDelete(player.id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
