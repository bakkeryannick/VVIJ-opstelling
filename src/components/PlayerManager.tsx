import { useState } from 'react';
import type { Player, MatchState } from '../types';
import { getPositionIds } from '../lib/formations';

interface PlayerManagerProps {
  isOpen: boolean;
  onClose: () => void;
  players: Player[];
  matchState: MatchState;
  onAddPlayer: (playerId: string) => Promise<void>;
  onRemovePlayer: (playerId: string) => Promise<void>;
  onCreatePlayer: (name: string) => Promise<Player>;
}

export function PlayerManager({
  isOpen,
  onClose,
  players,
  matchState,
  onAddPlayer,
  onRemovePlayer,
  onCreatePlayer,
}: PlayerManagerProps) {
  const [newPlayerName, setNewPlayerName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);

  if (!isOpen) return null;

  // Check if player is on field
  const isPlayerOnField = (playerId: string): boolean => {
    const positionIds = getPositionIds(matchState.formation);
    const fieldPos = matchState.field_positions as Record<string, string | undefined>;
    return positionIds.some(posId => fieldPos[posId] === playerId);
  };

  // Check if player is present (on field or bench)
  const isPlayerPresent = (playerId: string): boolean => {
    return matchState.present_players.includes(playerId);
  };

  const handleTogglePlayer = async (player: Player) => {
    setError(null);

    if (isPlayerPresent(player.id)) {
      // Player is present - check if on field
      if (isPlayerOnField(player.id)) {
        // Show confirmation for players on field
        setConfirmRemove(player.id);
        return;
      }
      // Remove from match
      try {
        await onRemovePlayer(player.id);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Kon speler niet verwijderen');
      }
    } else {
      // Add to match
      try {
        await onAddPlayer(player.id);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Kon speler niet toevoegen');
      }
    }
  };

  const handleConfirmRemove = async () => {
    if (!confirmRemove) return;
    setError(null);

    try {
      await onRemovePlayer(confirmRemove);
      setConfirmRemove(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kon speler niet verwijderen');
    }
  };

  const handleCreatePlayer = async () => {
    if (!newPlayerName.trim()) return;

    setIsCreating(true);
    setError(null);

    try {
      const newPlayer = await onCreatePlayer(newPlayerName.trim());
      // Also add to match
      await onAddPlayer(newPlayer.id);
      setNewPlayerName('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kon speler niet aanmaken');
    } finally {
      setIsCreating(false);
    }
  };

  const presentCount = matchState.present_players.length;
  const confirmPlayer = confirmRemove ? players.find(p => p.id === confirmRemove) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-white rounded-t-2xl max-h-[85vh] flex flex-col animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">Spelers Beheren</h2>
            <p className="text-sm text-gray-500">{presentCount} aanwezig</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div className="px-4 py-2 bg-red-50 text-red-600 text-sm">
            {error}
          </div>
        )}

        {/* Confirmation dialog */}
        {confirmPlayer && (
          <div className="px-4 py-3 bg-orange-50 border-b border-orange-100">
            <p className="text-sm text-orange-800 mb-2">
              <strong>{confirmPlayer.name}</strong> staat op het veld.
              Weet je zeker dat je deze speler afwezig wilt maken?
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmRemove(null)}
                className="flex-1 py-1.5 px-3 text-sm bg-white text-gray-700 rounded-lg border border-gray-200 hover:bg-gray-50"
              >
                Annuleren
              </button>
              <button
                onClick={handleConfirmRemove}
                className="flex-1 py-1.5 px-3 text-sm bg-orange-600 text-white rounded-lg hover:bg-orange-700"
              >
                Ja, verwijderen
              </button>
            </div>
          </div>
        )}

        {/* Add new player */}
        <div className="px-4 py-3 border-b border-gray-100">
          <div className="flex gap-2">
            <input
              type="text"
              value={newPlayerName}
              onChange={(e) => setNewPlayerName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreatePlayer()}
              placeholder="Nieuwe speler toevoegen..."
              className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
            />
            <button
              onClick={handleCreatePlayer}
              disabled={!newPlayerName.trim() || isCreating}
              className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isCreating ? '...' : 'Toevoegen'}
            </button>
          </div>
        </div>

        {/* Player list */}
        <div className="flex-1 overflow-auto">
          <div className="divide-y divide-gray-100">
            {players.map(player => {
              const isPresent = isPlayerPresent(player.id);
              const onField = isPlayerOnField(player.id);

              return (
                <button
                  key={player.id}
                  onClick={() => handleTogglePlayer(player)}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 active:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-gray-800">{player.name}</span>
                    {onField && (
                      <span className="px-1.5 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                        op veld
                      </span>
                    )}
                  </div>
                  <div
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                      isPresent
                        ? 'bg-red-600 border-red-600'
                        : 'border-gray-300'
                    }`}
                  >
                    {isPresent && (
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer hint */}
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            Tik op een speler om aan te passen wie aanwezig is
          </p>
        </div>
      </div>

      <style>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
