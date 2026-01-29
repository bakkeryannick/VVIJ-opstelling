import { useRef, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  TouchSensor,
  MouseSensor,
  useSensor,
  useSensors,
  pointerWithin,
} from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { Field } from './Field';
import { Bench } from './Bench';
import { FlagPosition } from './FlagPosition';
import { FormationPicker } from './FormationPicker';
import { ExportButton } from './ExportButton';
import { PlayerBadgeOverlay } from './PlayerBadge';
import { MatchTimer } from './MatchTimer';
import { PlayerManager } from './PlayerManager';
import type { Formation, MatchState, Player } from '../types';

interface FieldScreenProps {
  matchState: MatchState;
  players: Player[];
  allPlayers: Player[];
  onFormationChange: (formation: Formation) => void;
  onAssignPlayer: (playerId: string, positionId: string) => void;
  onMoveToBench: (playerId: string) => void;
  onAssignToFlag: (playerId: string) => void;
  onNewMatch: () => void;
  onHome: () => void;
  onManagePlayers: () => void;
  onStartTimer: () => void;
  onPauseTimer: () => void;
  onSetTime: (seconds: number) => void;
  onShowStats: () => void;
  onAddPlayerToMatch: (playerId: string) => Promise<void>;
  onRemovePlayerFromMatch: (playerId: string) => Promise<void>;
  onCreatePlayer: (name: string) => Promise<Player>;
}

export function FieldScreen({
  matchState,
  players,
  allPlayers,
  onFormationChange,
  onAssignPlayer,
  onMoveToBench,
  onAssignToFlag,
  onNewMatch,
  onHome,
  onManagePlayers,
  onStartTimer,
  onPauseTimer,
  onSetTime,
  onShowStats,
  onAddPlayerToMatch,
  onRemovePlayerFromMatch,
  onCreatePlayer,
}: FieldScreenProps) {
  const fieldRef = useRef<HTMLDivElement>(null);
  const [activePlayer, setActivePlayer] = useState<{
    id: string;
    name: string;
    isOnField?: boolean;
    isFlag?: boolean;
  } | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [showPlayerManager, setShowPlayerManager] = useState(false);

  const mouseSensor = useSensor(MouseSensor, {
    activationConstraint: {
      distance: 5,
    },
  });

  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: {
      delay: 100,
      tolerance: 8,
    },
  });

  const sensors = useSensors(touchSensor, mouseSensor);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const data = active.data.current as { name: string; isOnField?: boolean; isFlag?: boolean };
    setActivePlayer({
      id: active.id as string,
      name: data.name,
      isOnField: data.isOnField,
      isFlag: data.isFlag,
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActivePlayer(null);

    if (!over) return;

    const playerId = active.id as string;
    const overData = over.data.current as {
      positionId?: string;
      isBench?: boolean;
      isFlag?: boolean;
    };

    if (overData.isBench) {
      onMoveToBench(playerId);
    } else if (overData.isFlag) {
      onAssignToFlag(playerId);
    } else if (overData.positionId) {
      onAssignPlayer(playerId, overData.positionId);
    }
  };

  const presentPlayers = players.filter(p =>
    matchState.present_players.includes(p.id)
  );

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-20">
        {/* Match name */}
        {matchState.match_name && (
          <div className="text-center mb-2">
            <span className="text-sm font-semibold text-gray-800">{matchState.match_name}</span>
          </div>
        )}
        {/* Top row: Logo + Formation + Menu */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <button
              onClick={onHome}
              className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center hover:bg-red-700 transition-colors"
              title="Startscherm"
            >
              <span className="text-white text-xs font-bold">VVIJ</span>
            </button>
            <FormationPicker
              current={matchState.formation}
              onChange={onFormationChange}
            />
          </div>

          <div className="flex items-center gap-1">
            <ExportButton targetRef={fieldRef} />
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Bottom row: Timer */}
        <div className="flex justify-center">
          <MatchTimer
            timer={matchState.timer}
            onStart={onStartTimer}
            onPause={onPauseTimer}
            onShowStats={onShowStats}
            onSetTime={onSetTime}
          />
        </div>

        {/* Menu dropdown */}
        {showMenu && (
          <>
            <div
              className="fixed inset-0 z-30"
              onClick={() => setShowMenu(false)}
            />
            <div className="absolute right-4 top-14 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-40 min-w-[180px]">
              <button
                onClick={() => {
                  setShowMenu(false);
                  onNewMatch();
                }}
                className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50 flex items-center gap-3"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Nieuwe wedstrijd
              </button>
              <button
                onClick={() => {
                  setShowMenu(false);
                  onManagePlayers();
                }}
                className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50 flex items-center gap-3"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Spelers beheren
              </button>
            </div>
          </>
        )}
      </div>

      {/* Main content */}
      <DndContext
        sensors={sensors}
        collisionDetection={pointerWithin}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex-1 flex flex-col p-4 gap-4 overflow-hidden">
          {/* Field with flag position on the left */}
          <div className="flex-1 flex items-center justify-center gap-2">
            {/* Flag position - left side */}
            <div className="flex-shrink-0 self-center">
              <FlagPosition
                player={matchState.flag_player
                  ? presentPlayers.find(p => p.id === matchState.flag_player) || null
                  : null
                }
              />
            </div>

            {/* Field */}
            <div className="flex-1 max-w-md">
              <Field
                ref={fieldRef}
                formation={matchState.formation}
                fieldPositions={matchState.field_positions}
                players={presentPlayers}
              />
            </div>
          </div>
        </div>

        {/* Bench - fixed at bottom */}
        <div className="sticky bottom-0">
          <Bench
            players={presentPlayers}
            benchPlayerIds={matchState.bench_players}
            onManageClick={() => setShowPlayerManager(true)}
          />
        </div>

        {/* Drag overlay */}
        <DragOverlay>
          {activePlayer ? (
            <PlayerBadgeOverlay
              name={activePlayer.name}
              isOnField={activePlayer.isOnField}
              isFlag={activePlayer.isFlag}
            />
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Player Manager Modal */}
      <PlayerManager
        isOpen={showPlayerManager}
        onClose={() => setShowPlayerManager(false)}
        players={allPlayers}
        matchState={matchState}
        onAddPlayer={onAddPlayerToMatch}
        onRemovePlayer={onRemovePlayerFromMatch}
        onCreatePlayer={onCreatePlayer}
      />
    </div>
  );
}
