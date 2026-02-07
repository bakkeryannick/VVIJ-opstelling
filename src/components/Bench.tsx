import { useState, useEffect } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { PlayerBadge } from './PlayerBadge';
import type { Player, Availability, MatchTimer as MatchTimerType, PlayerPlayTime } from '../types';
import { getTrafficLight, calcPlayerPlayTime, formatMinutes, type TrafficLightStatus } from '../lib/trafficLight';

const TRAFFIC_DOT_COLOR: Record<TrafficLightStatus, string> = {
  green: 'bg-green-500',
  orange: 'bg-amber-500',
  red: 'bg-red-500',
  none: '',
};

interface BenchProps {
  players: Player[];
  benchPlayerIds: string[];
  playerAvailability?: Record<string, Availability>;
  playerTimes?: Record<string, PlayerPlayTime>;
  timer?: MatchTimerType;
  onManageClick?: () => void;
}

export function Bench({ players, benchPlayerIds, playerAvailability, playerTimes, timer, onManageClick }: BenchProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: 'bench',
    data: { isBench: true },
  });

  const [, setTick] = useState(0);

  // Re-render every second when timer is running for live traffic light updates
  useEffect(() => {
    if (!timer?.isRunning) return;
    const interval = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, [timer?.isRunning]);

  const benchPlayers = benchPlayerIds
    .map(id => players.find(p => p.id === id))
    .filter((p): p is Player => p !== undefined);

  const timerData = timer ?? { isRunning: false, startedAt: null, elapsedBeforePause: 0 };
  const hasTimerData = timer && (timer.elapsedBeforePause > 0 || timer.isRunning);

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

      <div className="flex flex-wrap gap-2">
        {benchPlayers.length === 0 ? (
          <p className="text-gray-400 text-sm py-2">
            Alle spelers staan op het veld
          </p>
        ) : (
          benchPlayers.map(player => {
            const avail = playerAvailability?.[player.id];
            const playedSec = calcPlayerPlayTime(playerTimes?.[player.id], timerData);
            const tl = getTrafficLight(playedSec, avail);
            const showTimeInfo = hasTimerData && avail;

            return (
              <div key={player.id} className="flex flex-col items-center gap-0.5">
                <PlayerBadge id={player.id} name={player.name} />
                {showTimeInfo ? (
                  <div className="flex items-center gap-1">
                    {tl !== 'none' && (
                      <span className={`w-2 h-2 rounded-full ${TRAFFIC_DOT_COLOR[tl]}`} />
                    )}
                    <span className="text-[10px] font-medium text-gray-500">
                      {formatMinutes(playedSec)}/{avail}'
                    </span>
                  </div>
                ) : avail && avail !== '90' ? (
                  <span className="text-[10px] font-medium text-gray-500">
                    {avail}'
                  </span>
                ) : null}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
