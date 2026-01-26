import { useDroppable } from '@dnd-kit/core';
import { PlayerBadge } from './PlayerBadge';

interface FieldPositionProps {
  id: string;
  label: string;
  x: number;
  y: number;
  offsetX?: number;
  offsetY?: number;
  playerId?: string;
  playerName?: string;
}

export function FieldPosition({
  id,
  label,
  x,
  y,
  offsetX = 0,
  offsetY = 0,
  playerId,
  playerName,
}: FieldPositionProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: `position-${id}`,
    data: { positionId: id, label },
  });

  // Apply offset within bounds (max 20% movement)
  const clampedOffsetX = Math.max(-20, Math.min(20, offsetX));
  const clampedOffsetY = Math.max(-20, Math.min(20, offsetY));

  const finalX = x + clampedOffsetX * 0.15;
  const finalY = y + clampedOffsetY * 0.15;

  return (
    <div
      ref={setNodeRef}
      className={`
        absolute
        flex flex-col items-center justify-center
        -translate-x-1/2 -translate-y-1/2
        transition-all duration-150
        ${isOver ? 'scale-110' : ''}
      `}
      style={{
        left: `${finalX}%`,
        top: `${finalY}%`,
      }}
    >
      {playerId && playerName ? (
        <PlayerBadge id={playerId} name={playerName} isOnField />
      ) : (
        <div
          className={`
            w-[44px] h-[44px]
            rounded-full
            border-2 border-dashed
            flex items-center justify-center
            text-xs font-medium
            transition-colors
            ${
              isOver
                ? 'border-red-600 bg-red-100 text-red-600'
                : 'border-white/60 text-white/80 bg-white/10'
            }
          `}
        >
          {label}
        </div>
      )}
    </div>
  );
}
