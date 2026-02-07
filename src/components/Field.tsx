import { forwardRef } from 'react';
import { FieldPosition } from './FieldPosition';
import type { Formation, FieldPositions, Player, PositionId } from '../types';
import type { TrafficLightStatus } from '../lib/trafficLight';
import { getFormationPositions } from '../lib/formations';

interface FieldProps {
  formation: Formation;
  fieldPositions: FieldPositions;
  players: Player[];
  trafficLights?: Record<string, TrafficLightStatus>;
}

export const Field = forwardRef<HTMLDivElement, FieldProps>(
  ({ formation, fieldPositions, players, trafficLights }, ref) => {
    const positions = getFormationPositions(formation);
    const offsets = fieldPositions.position_offsets || {};

    const getPlayerForPosition = (positionId: PositionId): Player | undefined => {
      const playerId = fieldPositions[positionId];
      if (!playerId) return undefined;
      return players.find(p => p.id === playerId);
    };

    return (
      <div
        ref={ref}
        className="relative w-full bg-green-600 rounded-lg overflow-hidden shadow-inner"
        style={{ aspectRatio: '3 / 4' }}
      >
        {/* Field markings */}
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 100 133"
          preserveAspectRatio="none"
        >
          {/* Field outline */}
          <rect
            x="2"
            y="2"
            width="96"
            height="129"
            fill="none"
            stroke="white"
            strokeWidth="0.5"
            strokeOpacity="0.6"
          />

          {/* Center line */}
          <line
            x1="2"
            y1="66.5"
            x2="98"
            y2="66.5"
            stroke="white"
            strokeWidth="0.5"
            strokeOpacity="0.6"
          />

          {/* Center circle */}
          <circle
            cx="50"
            cy="66.5"
            r="12"
            fill="none"
            stroke="white"
            strokeWidth="0.5"
            strokeOpacity="0.6"
          />

          {/* Center spot */}
          <circle cx="50" cy="66.5" r="0.8" fill="white" fillOpacity="0.6" />

          {/* Top penalty area (opponent) */}
          <rect
            x="20"
            y="2"
            width="60"
            height="18"
            fill="none"
            stroke="white"
            strokeWidth="0.5"
            strokeOpacity="0.6"
          />

          {/* Top goal area */}
          <rect
            x="32"
            y="2"
            width="36"
            height="7"
            fill="none"
            stroke="white"
            strokeWidth="0.5"
            strokeOpacity="0.6"
          />

          {/* Top penalty spot */}
          <circle cx="50" cy="14" r="0.6" fill="white" fillOpacity="0.6" />

          {/* Top goal */}
          <rect
            x="38"
            y="0"
            width="24"
            height="2"
            fill="white"
            fillOpacity="0.3"
          />

          {/* Bottom penalty area (our team) */}
          <rect
            x="20"
            y="113"
            width="60"
            height="18"
            fill="none"
            stroke="white"
            strokeWidth="0.5"
            strokeOpacity="0.6"
          />

          {/* Bottom goal area */}
          <rect
            x="32"
            y="124"
            width="36"
            height="7"
            fill="none"
            stroke="white"
            strokeWidth="0.5"
            strokeOpacity="0.6"
          />

          {/* Bottom penalty spot */}
          <circle cx="50" cy="119" r="0.6" fill="white" fillOpacity="0.6" />

          {/* Bottom goal */}
          <rect
            x="38"
            y="131"
            width="24"
            height="2"
            fill="white"
            fillOpacity="0.3"
          />

          {/* Corner arcs */}
          <path
            d="M 2 5 A 3 3 0 0 0 5 2"
            fill="none"
            stroke="white"
            strokeWidth="0.5"
            strokeOpacity="0.6"
          />
          <path
            d="M 95 2 A 3 3 0 0 0 98 5"
            fill="none"
            stroke="white"
            strokeWidth="0.5"
            strokeOpacity="0.6"
          />
          <path
            d="M 2 128 A 3 3 0 0 1 5 131"
            fill="none"
            stroke="white"
            strokeWidth="0.5"
            strokeOpacity="0.6"
          />
          <path
            d="M 95 131 A 3 3 0 0 1 98 128"
            fill="none"
            stroke="white"
            strokeWidth="0.5"
            strokeOpacity="0.6"
          />
        </svg>

        {/* Player positions */}
        {positions.map(pos => {
          const player = getPlayerForPosition(pos.id);
          const offset = offsets[pos.id] || { x: 0, y: 0 };

          return (
            <FieldPosition
              key={pos.id}
              id={pos.id}
              label={pos.label}
              x={pos.x}
              y={pos.y}
              offsetX={offset.x}
              offsetY={offset.y}
              playerId={player?.id}
              playerName={player?.name}
              trafficLight={player ? trafficLights?.[player.id] : undefined}
            />
          );
        })}
      </div>
    );
  }
);

Field.displayName = 'Field';
