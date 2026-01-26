import { useDroppable } from '@dnd-kit/core';
import { PlayerBadge } from './PlayerBadge';
import type { Player } from '../types';

interface FlagPositionProps {
  player: Player | null;
  onDrop?: (playerId: string) => void;
}

export function FlagPosition({ player }: FlagPositionProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: 'flag-position',
    data: { isFlag: true },
  });

  return (
    <div
      ref={setNodeRef}
      className={`
        bg-white rounded-xl shadow-md border-2 transition-all
        ${isOver ? 'border-orange-400 bg-orange-50' : 'border-gray-200'}
        p-2 w-16
      `}
    >
      <div className="flex flex-col items-center gap-1 mb-2">
        <span className="text-lg">🚩</span>
        <span className="text-xs font-medium text-gray-600">Vlag</span>
      </div>

      <div
        className={`
          min-h-[48px] rounded-lg flex items-center justify-center
          ${player ? '' : 'border-2 border-dashed border-gray-300 bg-gray-50'}
          ${isOver && !player ? 'border-orange-400 bg-orange-100' : ''}
        `}
      >
        {player ? (
          <PlayerBadge
            id={player.id}
            name={player.name}
            isOnField={false}
            isFlag={true}
          />
        ) : (
          <span className="text-xs text-gray-400 text-center px-1">
            {isOver ? 'Los' : ''}
          </span>
        )}
      </div>
    </div>
  );
}
