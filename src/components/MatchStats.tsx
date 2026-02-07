import { useState, useEffect } from 'react';
import type { MatchState, Player, MatchTimer, PlayerPlayTime, Availability } from '../types';
import { getPositionIds } from '../lib/formations';
import { getTrafficLight, type TrafficLightStatus } from '../lib/trafficLight';

const TRAFFIC_COLORS: Record<TrafficLightStatus, string> = {
  green: 'bg-green-500',
  orange: 'bg-amber-500',
  red: 'bg-red-500',
  none: 'bg-red-500',
};

interface MatchStatsProps {
  matchState: MatchState;
  players: Player[];
  getPlayerPlayTime: (playerTime: PlayerPlayTime | undefined, timer: MatchTimer) => number;
  getPlayerFlagTime: (playerTime: PlayerPlayTime | undefined, timer: MatchTimer) => number;
  onClose: () => void;
  onResetTimer: () => void;
}

function formatTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

interface PlayerStat {
  player: Player;
  playTime: number;
  flagTime: number;
  isOnField: boolean;
  isFlag: boolean;
  availability?: Availability;
  trafficLight: TrafficLightStatus;
}

export function MatchStats({
  matchState,
  players,
  getPlayerPlayTime,
  getPlayerFlagTime,
  onClose,
  onResetTimer,
}: MatchStatsProps) {
  const [stats, setStats] = useState<PlayerStat[]>([]);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Get which players are currently on field
  const getPlayersOnField = (): Set<string> => {
    const onField = new Set<string>();
    const positionIds = getPositionIds(matchState.formation);
    positionIds.forEach(posId => {
      const playerId = (matchState.field_positions as Record<string, string | undefined>)[posId];
      if (playerId && typeof playerId === 'string') {
        onField.add(playerId);
      }
    });
    return onField;
  };

  useEffect(() => {
    const calculateStats = () => {
      const onField = getPlayersOnField();
      const presentPlayers = players.filter(p => matchState.present_players.includes(p.id));

      const playerStats: PlayerStat[] = presentPlayers.map(player => {
        const playTime = getPlayerPlayTime(matchState.player_times[player.id], matchState.timer);
        const avail = matchState.player_availability?.[player.id];
        return {
          player,
          playTime,
          flagTime: getPlayerFlagTime(matchState.player_times[player.id], matchState.timer),
          isOnField: onField.has(player.id),
          isFlag: matchState.flag_player === player.id,
          availability: avail,
          trafficLight: getTrafficLight(playTime, avail),
        };
      });

      // Sort by play time descending
      playerStats.sort((a, b) => b.playTime - a.playTime);
      setStats(playerStats);
    };

    calculateStats();

    // Update every second if timer is running
    if (matchState.timer.isRunning) {
      const interval = setInterval(calculateStats, 1000);
      return () => clearInterval(interval);
    }
  }, [matchState, players, getPlayerPlayTime, getPlayerFlagTime]);

  // Calculate match total time
  const getMatchTime = (): number => {
    if (!matchState.timer.isRunning || !matchState.timer.startedAt) {
      return matchState.timer.elapsedBeforePause;
    }
    return matchState.timer.elapsedBeforePause +
      Math.floor((Date.now() - matchState.timer.startedAt) / 1000);
  };

  const matchTime = getMatchTime();
  const maxPlayTime = Math.max(...stats.map(s => s.playTime), 1);

  const handleReset = () => {
    onResetTimer();
    setShowResetConfirm(false);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-red-600 text-white px-4 py-3 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="p-2 -ml-2 hover:bg-red-700 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-lg font-semibold">Speeltijd Overzicht</h1>
          </div>
          <div className="text-lg font-mono font-semibold">
            {formatTime(matchTime)}
          </div>
        </div>
        {matchState.match_name && (
          <div className="text-center mt-1 text-red-100 text-sm">
            {matchState.match_name}
          </div>
        )}
      </div>

      <div className="p-4">
        {/* Summary */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
          <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
            <span>Wedstrijdtijd</span>
            <span className="font-mono font-semibold text-gray-900">
              {formatTime(matchTime)}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>Spelers aanwezig</span>
            <span className="font-semibold text-gray-900">{stats.length}</span>
          </div>
        </div>

        {/* Player list */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <h2 className="text-sm font-medium text-gray-700">Speeltijd per speler</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {stats.map(({ player, playTime, flagTime, isOnField, isFlag, availability, trafficLight }) => {
              const percentage = matchTime > 0 ? (playTime / matchTime) * 100 : 0;
              const barWidth = maxPlayTime > 0 ? (playTime / maxPlayTime) * 100 : 0;
              const desiredSec = availability ? parseInt(availability) * 60 : undefined;

              return (
                <div key={player.id} className="px-4 py-3">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      {trafficLight !== 'none' && (
                        <span className={`w-2.5 h-2.5 rounded-full ${TRAFFIC_COLORS[trafficLight]}`} />
                      )}
                      <span className="font-medium text-gray-800">{player.name}</span>
                      {isOnField && (
                        <span className="px-1.5 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                          op veld
                        </span>
                      )}
                      {isFlag && (
                        <span className="px-1.5 py-0.5 bg-orange-100 text-orange-700 text-xs rounded-full">
                          🚩 vlag
                        </span>
                      )}
                    </div>
                    <span className="font-mono font-semibold text-gray-900">
                      {formatTime(playTime)}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden relative">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${TRAFFIC_COLORS[trafficLight]}`}
                      style={{ width: `${barWidth}%` }}
                    />
                    {/* Desired time marker */}
                    {desiredSec && maxPlayTime > 0 && (
                      <div
                        className="absolute top-0 h-full w-0.5 bg-gray-400"
                        style={{ left: `${Math.min((desiredSec / maxPlayTime) * 100, 100)}%` }}
                      />
                    )}
                  </div>
                  {/* Played vs desired details */}
                  <div className="flex items-center justify-between mt-1.5 text-xs text-gray-500">
                    <span>
                      Gespeeld: <span className="font-mono font-medium text-gray-700">{formatTime(playTime)}</span>
                      <span className="text-gray-400 mx-1">({Math.round(percentage)}%)</span>
                    </span>
                    {desiredSec ? (
                      <span>
                        Gewenst: <span className="font-mono font-medium text-gray-700">{availability}'</span>
                      </span>
                    ) : null}
                  </div>
                  {/* Flag time indicator */}
                  {flagTime > 0 && (
                    <div className="flex items-center justify-between mt-1 text-xs text-orange-600">
                      <span className="flex items-center gap-1">
                        <span>🚩</span>
                        <span>Vlag-tijd</span>
                      </span>
                      <span className="font-mono">{formatTime(flagTime)}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Reset button */}
        <div className="mt-6">
          {showResetConfirm ? (
            <div className="bg-white rounded-lg shadow-sm p-4">
              <p className="text-gray-700 mb-4">
                Weet je zeker dat je de timer en alle speeltijden wilt resetten?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="flex-1 py-2 px-4 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Annuleren
                </button>
                <button
                  onClick={handleReset}
                  className="flex-1 py-2 px-4 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors"
                >
                  Reset
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowResetConfirm(true)}
              className="w-full py-3 bg-white text-red-600 font-medium rounded-lg hover:bg-red-50 border border-red-200 transition-colors"
            >
              Reset timer & speeltijden
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
