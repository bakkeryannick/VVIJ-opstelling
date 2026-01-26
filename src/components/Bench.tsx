import { useDroppable } from '@dnd-kit/core';
import { PlayerBadge } from './PlayerBadge';
import type { Player } from '../types';

interface BenchProps {
  players: Player[];
  benchPlayerIds: string[];
  onManageClick?: () => void;
}

export function Bench({ players, benchPlayerIds, onManageClick }: BenchProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: 'bench',
    data: { isBench: true },
  });

  const benchPlayers = benchPlayerIds
    .map(id => players.find(p => p.id === id))
    .filter((p): p is Player => p !== undefined);

  return (
    <div
      ref={setNodeRef}
      className={`
        bg-white rounded-t-2xl shadow-lg
        p-4 pb-6
        transition-colors
        ${isOver ? 'bg-red-50' : ''}
      `}
    >
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-medium text-gray-600">
          Bank ({benchPlayers.length})
        </h2>
        <div className="flex items-center gap-2">
          {isOver && (
            <span className="text-xs text-red-600 font-medium">
              Laat los om naar bank te sturen
            </span>
          )}
          {onManageClick && !isOver && (
            <button
              onClick={onManageClick}
              className="flex items-center gap-1.5 px-2 py-1 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Wijzig
            </button>
          )}
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 -mx-2 px-2">
        {benchPlayers.length === 0 ? (
          <p className="text-gray-400 text-sm py-2">
            Alle spelers staan op het veld
          </p>
        ) : (
          benchPlayers.map(player => (
            <div key={player.id} className="flex-shrink-0">
              <PlayerBadge id={player.id} name={player.name} />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
