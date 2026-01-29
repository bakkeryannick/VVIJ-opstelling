import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import type { MatchState, Formation, FieldPositions, PositionOffset, PlayerPlayTime, MatchTimer } from '../types';
import { mapPlayersToNewFormation, getPositionIds } from '../lib/formations';

const MATCH_ID = 'current';

const DEFAULT_TIMER: MatchTimer = {
  isRunning: false,
  startedAt: null,
  elapsedBeforePause: 0,
};

export function useMatchState() {
  const [matchState, setMatchState] = useState<MatchState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const updateTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Helper to get current match elapsed time in seconds
  const getElapsedSeconds = useCallback((timer: MatchTimer): number => {
    if (!timer.isRunning || !timer.startedAt) {
      return timer.elapsedBeforePause;
    }
    return timer.elapsedBeforePause + Math.floor((Date.now() - timer.startedAt) / 1000);
  }, []);

  // Helper to calculate player's current playing time
  const getPlayerPlayTime = useCallback((
    playerTime: PlayerPlayTime | undefined,
    timer: MatchTimer
  ): number => {
    if (!playerTime) return 0;

    let total = playerTime.visibleTime;

    // If player is on field and timer is running, add current session
    if (playerTime.lastEnteredField !== null && timer.isRunning && timer.startedAt) {
      const sessionStart = Math.max(playerTime.lastEnteredField, timer.startedAt);
      const sessionSeconds = Math.floor((Date.now() - sessionStart) / 1000);
      total += sessionSeconds;
    }

    return total;
  }, []);

  // Helper to calculate player's flag time
  const getPlayerFlagTime = useCallback((
    playerTime: PlayerPlayTime | undefined,
    timer: MatchTimer
  ): number => {
    if (!playerTime) return 0;

    let total = playerTime.flagTime || 0;

    // If player is on flag and timer is running, add current session
    if (playerTime.lastEnteredFlag !== null && timer.isRunning && timer.startedAt) {
      const sessionStart = Math.max(playerTime.lastEnteredFlag, timer.startedAt);
      const sessionSeconds = Math.floor((Date.now() - sessionStart) / 1000);
      total += sessionSeconds;
    }

    return total;
  }, []);

  const fetchMatchState = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('match_state')
        .select('*')
        .eq('id', MATCH_ID)
        .single();

      if (error) throw error;

      // Ensure timer, player_times, flag_player and match_name exist (for backwards compatibility)
      const stateWithTimer: MatchState = {
        ...data,
        timer: data.timer || DEFAULT_TIMER,
        player_times: data.player_times || {},
        flag_player: data.flag_player || null,
        match_name: data.match_name || null,
      };

      setMatchState(stateWithTimer);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fout bij laden wedstrijd');
    } finally {
      setLoading(false);
    }
  }, []);

  const updateMatchState = useCallback(async (updates: Partial<MatchState>) => {
    // Update local state immediately for responsive UI
    setMatchState(prev => prev ? { ...prev, ...updates } : null);

    try {
      const { error } = await supabase
        .from('match_state')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', MATCH_ID);

      if (error) {
        console.error('Supabase update error:', error);
        throw error;
      }
    } catch (err) {
      console.error('updateMatchState error:', err);
      throw new Error(err instanceof Error ? err.message : 'Fout bij opslaan');
    }
  }, []);

  // Timer controls
  const startTimer = useCallback(async () => {
    if (!matchState) {
      console.error('startTimer: matchState is null');
      return;
    }

    const now = Date.now();
    const newTimer: MatchTimer = {
      isRunning: true,
      startedAt: now,
      elapsedBeforePause: matchState.timer?.elapsedBeforePause || 0,
    };

    // Also mark all players currently on field as "entered"
    const newPlayerTimes = { ...(matchState.player_times || {}) };
    const positionIds = getPositionIds(matchState.formation);

    positionIds.forEach(posId => {
      const playerId = (matchState.field_positions as Record<string, string | undefined>)[posId];
      if (playerId && typeof playerId === 'string') {
        if (!newPlayerTimes[playerId]) {
          newPlayerTimes[playerId] = { visibleTime: 0, lastEnteredField: now, flagTime: 0, lastEnteredFlag: null };
        } else if (newPlayerTimes[playerId].lastEnteredField === null) {
          newPlayerTimes[playerId] = {
            ...newPlayerTimes[playerId],
            lastEnteredField: now
          };
        }
      }
    });

    // Also mark flag player as "entered flag" if there is one
    if (matchState.flag_player) {
      const flagPlayerId = matchState.flag_player;
      if (!newPlayerTimes[flagPlayerId]) {
        newPlayerTimes[flagPlayerId] = { visibleTime: 0, lastEnteredField: null, flagTime: 0, lastEnteredFlag: now };
      } else if (newPlayerTimes[flagPlayerId].lastEnteredFlag === null) {
        newPlayerTimes[flagPlayerId] = {
          ...newPlayerTimes[flagPlayerId],
          lastEnteredFlag: now
        };
      }
    }

    try {
      await updateMatchState({ timer: newTimer, player_times: newPlayerTimes });
    } catch (err) {
      console.error('startTimer error:', err);
    }
  }, [matchState, updateMatchState]);

  const pauseTimer = useCallback(async () => {
    if (!matchState || !matchState.timer?.isRunning) return;

    const now = Date.now();
    const elapsed = getElapsedSeconds(matchState.timer);

    // Calculate and save all players' times
    const newPlayerTimes = { ...(matchState.player_times || {}) };
    const positionIds = getPositionIds(matchState.formation);

    positionIds.forEach(posId => {
      const playerId = (matchState.field_positions as Record<string, string | undefined>)[posId];
      if (playerId && typeof playerId === 'string' && newPlayerTimes[playerId]) {
        const pt = newPlayerTimes[playerId];
        if (pt.lastEnteredField !== null && matchState.timer.startedAt) {
          const sessionStart = Math.max(pt.lastEnteredField, matchState.timer.startedAt);
          const sessionSeconds = Math.floor((now - sessionStart) / 1000);
          newPlayerTimes[playerId] = {
            ...newPlayerTimes[playerId],
            visibleTime: pt.visibleTime + sessionSeconds,
            lastEnteredField: null, // Will be set again when timer resumes
          };
        }
      }
    });

    // Also save flag player time
    if (matchState.flag_player && newPlayerTimes[matchState.flag_player]) {
      const pt = newPlayerTimes[matchState.flag_player];
      if (pt.lastEnteredFlag !== null && matchState.timer.startedAt) {
        const sessionStart = Math.max(pt.lastEnteredFlag, matchState.timer.startedAt);
        const sessionSeconds = Math.floor((now - sessionStart) / 1000);
        newPlayerTimes[matchState.flag_player] = {
          ...newPlayerTimes[matchState.flag_player],
          flagTime: (pt.flagTime || 0) + sessionSeconds,
          lastEnteredFlag: null, // Will be set again when timer resumes
        };
      }
    }

    const newTimer: MatchTimer = {
      isRunning: false,
      startedAt: null,
      elapsedBeforePause: elapsed,
    };

    await updateMatchState({ timer: newTimer, player_times: newPlayerTimes });
  }, [matchState, updateMatchState, getElapsedSeconds]);

  const resetTimer = useCallback(async () => {
    if (!matchState) return;

    await updateMatchState({
      timer: DEFAULT_TIMER,
      player_times: {},
    });
  }, [matchState, updateMatchState]);

  // Set timer to a specific time (in seconds)
  const setTimerTime = useCallback(async (seconds: number) => {
    if (!matchState) return;

    const now = Date.now();

    // If timer is running, we set startedAt to now and elapsedBeforePause to the desired time
    // If timer is paused, we just update elapsedBeforePause
    const newTimer: MatchTimer = matchState.timer.isRunning
      ? {
          isRunning: true,
          startedAt: now,
          elapsedBeforePause: seconds,
        }
      : {
          isRunning: false,
          startedAt: null,
          elapsedBeforePause: seconds,
        };

    await updateMatchState({ timer: newTimer });
  }, [matchState, updateMatchState]);

  // Debounced update for position offsets
  const updatePositionOffset = useCallback((positionId: string, offset: PositionOffset) => {
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }

    setMatchState(prev => {
      if (!prev) return null;

      const newOffsets: Record<string, PositionOffset> = {
        ...(prev.field_positions.position_offsets || {}),
        [positionId]: offset,
      };

      const newFieldPositions: FieldPositions = {
        ...prev.field_positions,
        position_offsets: newOffsets,
      };

      return {
        ...prev,
        field_positions: newFieldPositions,
      };
    });

    updateTimeoutRef.current = setTimeout(() => {
      setMatchState(prev => {
        if (prev) {
          supabase
            .from('match_state')
            .update({
              field_positions: prev.field_positions,
              updated_at: new Date().toISOString()
            })
            .eq('id', MATCH_ID)
            .then();
        }
        return prev;
      });
    }, 300);
  }, []);

  const setFormation = useCallback(async (formation: Formation) => {
    if (!matchState) return;

    // Extract player positions only (exclude position_offsets)
    const { position_offsets, ...playerPositions } = matchState.field_positions;

    const newPositions = mapPlayersToNewFormation(
      playerPositions as { [key: string]: string | undefined },
      matchState.formation,
      formation
    );

    // Find players who were on field but don't fit in new formation
    const oldPositionIds = getPositionIds(matchState.formation);
    const newPositionIds = getPositionIds(formation);

    const playersOnOldField: string[] = [];
    oldPositionIds.forEach(posId => {
      const playerId = (playerPositions as { [key: string]: string | undefined })[posId];
      if (playerId && typeof playerId === 'string') {
        playersOnOldField.push(playerId);
      }
    });

    const playersOnNewField: string[] = [];
    newPositionIds.forEach(posId => {
      const playerId = newPositions[posId];
      if (playerId) {
        playersOnNewField.push(playerId);
      }
    });

    // Add displaced players to bench and update their times
    const displacedPlayers = playersOnOldField.filter(
      p => !playersOnNewField.includes(p)
    );
    const newBench = [...matchState.bench_players, ...displacedPlayers];

    // Handle time tracking for displaced players
    const now = Date.now();
    const newPlayerTimes = { ...(matchState.player_times || {}) };

    if (matchState.timer?.isRunning) {
      displacedPlayers.forEach(playerId => {
        const pt = newPlayerTimes[playerId];
        if (pt && pt.lastEnteredField !== null && matchState.timer.startedAt) {
          const sessionStart = Math.max(pt.lastEnteredField, matchState.timer.startedAt);
          const sessionSeconds = Math.floor((now - sessionStart) / 1000);
          newPlayerTimes[playerId] = {
            ...pt,
            visibleTime: pt.visibleTime + sessionSeconds,
            lastEnteredField: null,
          };
        }
      });
    }

    await updateMatchState({
      formation,
      field_positions: newPositions as FieldPositions,
      bench_players: newBench,
      player_times: newPlayerTimes,
    });
  }, [matchState, updateMatchState]);

  const assignPlayerToPosition = useCallback(async (playerId: string, positionId: string) => {
    if (!matchState) return;

    const now = Date.now();
    const newFieldPositions: FieldPositions = { ...matchState.field_positions };
    let newBench = [...matchState.bench_players];
    const newPlayerTimes = { ...(matchState.player_times || {}) };
    let newFlagPlayer = matchState.flag_player;

    // Check if there's already a player in this position
    const fieldPos = newFieldPositions as Record<string, string | undefined>;
    const existingPlayerId = fieldPos[positionId];

    // Check if this player is coming from another position
    const positionIds = getPositionIds(matchState.formation);
    let fromPosition: string | null = null;
    positionIds.forEach(posId => {
      if (fieldPos[posId] === playerId) {
        fromPosition = posId;
      }
    });

    // Check if player is coming from flag position
    const wasFlag = matchState.flag_player === playerId;
    if (wasFlag) {
      newFlagPlayer = null;
      // Stop flag time and start field time
      if (matchState.timer?.isRunning) {
        const pt = newPlayerTimes[playerId];
        if (pt && pt.lastEnteredFlag !== null && matchState.timer.startedAt) {
          const sessionStart = Math.max(pt.lastEnteredFlag, matchState.timer.startedAt);
          const sessionSeconds = Math.floor((now - sessionStart) / 1000);
          newPlayerTimes[playerId] = {
            ...newPlayerTimes[playerId],
            flagTime: (pt.flagTime || 0) + sessionSeconds,
            lastEnteredFlag: null,
            lastEnteredField: now,
          };
        } else {
          newPlayerTimes[playerId] = {
            ...newPlayerTimes[playerId],
            lastEnteredField: now,
          };
        }
      }
    }

    // Remove player from bench if coming from there
    const wasOnBench = newBench.includes(playerId);
    if (wasOnBench) {
      newBench = newBench.filter(p => p !== playerId);

      // Player entering field - start their timer if match timer is running
      if (matchState.timer?.isRunning) {
        if (!newPlayerTimes[playerId]) {
          newPlayerTimes[playerId] = { visibleTime: 0, lastEnteredField: now, flagTime: 0, lastEnteredFlag: null };
        } else {
          newPlayerTimes[playerId] = {
            ...newPlayerTimes[playerId],
            lastEnteredField: now
          };
        }
      }
    }

    // If swapping with another player on field
    if (fromPosition && existingPlayerId && typeof existingPlayerId === 'string') {
      // Swap positions - no time changes needed, both stay on field
      (newFieldPositions as Record<string, string | undefined>)[fromPosition] = existingPlayerId;
      (newFieldPositions as Record<string, string | undefined>)[positionId] = playerId;
    } else if (fromPosition) {
      // Just moving to empty position - no time changes
      delete (newFieldPositions as Record<string, string | undefined>)[fromPosition];
      (newFieldPositions as Record<string, string | undefined>)[positionId] = playerId;
    } else {
      // Coming from bench or flag
      if (existingPlayerId && typeof existingPlayerId === 'string') {
        // Send existing player to bench - stop their timer
        newBench.push(existingPlayerId);

        if (matchState.timer?.isRunning) {
          const pt = newPlayerTimes[existingPlayerId];
          if (pt && pt.lastEnteredField !== null && matchState.timer.startedAt) {
            const sessionStart = Math.max(pt.lastEnteredField, matchState.timer.startedAt);
            const sessionSeconds = Math.floor((now - sessionStart) / 1000);
            newPlayerTimes[existingPlayerId] = {
              ...newPlayerTimes[existingPlayerId],
              visibleTime: pt.visibleTime + sessionSeconds,
              lastEnteredField: null,
            };
          }
        }
      }
      (newFieldPositions as Record<string, string | undefined>)[positionId] = playerId;
    }

    await updateMatchState({
      field_positions: newFieldPositions,
      bench_players: newBench,
      player_times: newPlayerTimes,
      flag_player: newFlagPlayer,
    });
  }, [matchState, updateMatchState]);

  const movePlayerToBench = useCallback(async (playerId: string) => {
    if (!matchState) return;

    const now = Date.now();
    const newFieldPositions: FieldPositions = { ...matchState.field_positions };
    const positionIds = getPositionIds(matchState.formation);
    const fieldPos = newFieldPositions as Record<string, string | undefined>;
    const newPlayerTimes = { ...(matchState.player_times || {}) };

    // Remove from field
    let wasOnField = false;
    positionIds.forEach(posId => {
      if (fieldPos[posId] === playerId) {
        delete fieldPos[posId];
        wasOnField = true;
      }
    });

    // Stop player's timer if they were on field and timer is running
    if (wasOnField && matchState.timer?.isRunning) {
      const pt = newPlayerTimes[playerId];
      if (pt && pt.lastEnteredField !== null && matchState.timer.startedAt) {
        const sessionStart = Math.max(pt.lastEnteredField, matchState.timer.startedAt);
        const sessionSeconds = Math.floor((now - sessionStart) / 1000);
        newPlayerTimes[playerId] = {
          ...newPlayerTimes[playerId],
          visibleTime: pt.visibleTime + sessionSeconds,
          lastEnteredField: null,
        };
      }
    }

    // Check if player is flag player and stop their flag time
    let newFlagPlayer = matchState.flag_player;
    if (matchState.flag_player === playerId) {
      newFlagPlayer = null;
      if (matchState.timer?.isRunning) {
        const pt = newPlayerTimes[playerId];
        if (pt && pt.lastEnteredFlag !== null && matchState.timer.startedAt) {
          const sessionStart = Math.max(pt.lastEnteredFlag, matchState.timer.startedAt);
          const sessionSeconds = Math.floor((now - sessionStart) / 1000);
          newPlayerTimes[playerId] = {
            ...newPlayerTimes[playerId],
            flagTime: (pt.flagTime || 0) + sessionSeconds,
            lastEnteredFlag: null,
          };
        }
      }
    }

    // Add to bench if not already there
    let newBench = [...matchState.bench_players];
    if (!newBench.includes(playerId)) {
      newBench.push(playerId);
    }

    await updateMatchState({
      field_positions: newFieldPositions,
      bench_players: newBench,
      player_times: newPlayerTimes,
      flag_player: newFlagPlayer,
    });
  }, [matchState, updateMatchState]);

  // Assign player to flag position
  const assignPlayerToFlag = useCallback(async (playerId: string) => {
    if (!matchState) return;

    const now = Date.now();
    const newFieldPositions: FieldPositions = { ...matchState.field_positions };
    let newBench = [...matchState.bench_players];
    const newPlayerTimes = { ...(matchState.player_times || {}) };
    const positionIds = getPositionIds(matchState.formation);
    const fieldPos = newFieldPositions as Record<string, string | undefined>;

    // Check where player is coming from
    const wasOnBench = newBench.includes(playerId);
    let wasOnField = false;
    let fromFieldPosition: string | null = null;
    const wasFlag = matchState.flag_player === playerId;

    positionIds.forEach(posId => {
      if (fieldPos[posId] === playerId) {
        wasOnField = true;
        fromFieldPosition = posId;
      }
    });

    // If player is already flag, do nothing
    if (wasFlag) return;

    // Handle the current flag player (send to bench)
    let newFlagPlayer: string | null = playerId;
    if (matchState.flag_player) {
      const oldFlagPlayer = matchState.flag_player;
      newBench.push(oldFlagPlayer);

      // Stop old flag player's flag time
      if (matchState.timer?.isRunning) {
        const pt = newPlayerTimes[oldFlagPlayer];
        if (pt && pt.lastEnteredFlag !== null && matchState.timer.startedAt) {
          const sessionStart = Math.max(pt.lastEnteredFlag, matchState.timer.startedAt);
          const sessionSeconds = Math.floor((now - sessionStart) / 1000);
          newPlayerTimes[oldFlagPlayer] = {
            ...newPlayerTimes[oldFlagPlayer],
            flagTime: (pt.flagTime || 0) + sessionSeconds,
            lastEnteredFlag: null,
          };
        }
      }
    }

    // Remove player from their current location
    if (wasOnBench) {
      newBench = newBench.filter(p => p !== playerId);
    } else if (wasOnField && fromFieldPosition) {
      delete fieldPos[fromFieldPosition];

      // Stop field time for this player
      if (matchState.timer?.isRunning) {
        const pt = newPlayerTimes[playerId];
        if (pt && pt.lastEnteredField !== null && matchState.timer.startedAt) {
          const sessionStart = Math.max(pt.lastEnteredField, matchState.timer.startedAt);
          const sessionSeconds = Math.floor((now - sessionStart) / 1000);
          newPlayerTimes[playerId] = {
            ...newPlayerTimes[playerId],
            visibleTime: (pt.visibleTime || 0) + sessionSeconds,
            lastEnteredField: null,
          };
        }
      }
    }

    // Start flag time for new flag player
    if (matchState.timer?.isRunning) {
      if (!newPlayerTimes[playerId]) {
        newPlayerTimes[playerId] = { visibleTime: 0, lastEnteredField: null, flagTime: 0, lastEnteredFlag: now };
      } else {
        newPlayerTimes[playerId] = {
          ...newPlayerTimes[playerId],
          lastEnteredFlag: now
        };
      }
    }

    await updateMatchState({
      field_positions: newFieldPositions,
      bench_players: newBench,
      flag_player: newFlagPlayer,
      player_times: newPlayerTimes,
    });
  }, [matchState, updateMatchState]);

  // Move flag player to bench
  const movePlayerFromFlag = useCallback(async () => {
    if (!matchState || !matchState.flag_player) return;

    const now = Date.now();
    const playerId = matchState.flag_player;
    const newPlayerTimes = { ...(matchState.player_times || {}) };
    let newBench = [...matchState.bench_players];

    // Stop flag time
    if (matchState.timer?.isRunning) {
      const pt = newPlayerTimes[playerId];
      if (pt && pt.lastEnteredFlag !== null && matchState.timer.startedAt) {
        const sessionStart = Math.max(pt.lastEnteredFlag, matchState.timer.startedAt);
        const sessionSeconds = Math.floor((now - sessionStart) / 1000);
        newPlayerTimes[playerId] = {
          ...newPlayerTimes[playerId],
          flagTime: (pt.flagTime || 0) + sessionSeconds,
          lastEnteredFlag: null,
        };
      }
    }

    // Add to bench
    if (!newBench.includes(playerId)) {
      newBench.push(playerId);
    }

    await updateMatchState({
      bench_players: newBench,
      flag_player: null,
      player_times: newPlayerTimes,
    });
  }, [matchState, updateMatchState]);

  const startNewMatch = useCallback(async (
    presentPlayerIds: string[],
    formation: Formation,
    opponentName: string | null = null
  ) => {
    const matchName = opponentName ? `VVIJ Zo 2 - ${opponentName}` : null;
    await updateMatchState({
      formation,
      field_positions: {},
      bench_players: presentPlayerIds,
      present_players: presentPlayerIds,
      timer: DEFAULT_TIMER,
      player_times: {},
      flag_player: null,
      match_name: matchName,
    });
  }, [updateMatchState]);

  // Clear/end the current match
  const clearMatch = useCallback(async () => {
    await updateMatchState({
      formation: '4-3-3',
      field_positions: {},
      bench_players: [],
      present_players: [],
      timer: DEFAULT_TIMER,
      player_times: {},
      flag_player: null,
      match_name: null,
    });
  }, [updateMatchState]);

  // Add player to present players (goes to bench)
  const addPlayerToMatch = useCallback(async (playerId: string) => {
    if (!matchState) return;

    // Don't add if already present
    if (matchState.present_players.includes(playerId)) return;

    const newPresentPlayers = [...matchState.present_players, playerId];
    const newBench = [...matchState.bench_players, playerId];

    await updateMatchState({
      present_players: newPresentPlayers,
      bench_players: newBench,
    });
  }, [matchState, updateMatchState]);

  // Remove player from match (removes from field/bench/flag and present)
  const removePlayerFromMatch = useCallback(async (playerId: string) => {
    if (!matchState) return;

    const now = Date.now();
    const newFieldPositions: FieldPositions = { ...matchState.field_positions };
    const positionIds = getPositionIds(matchState.formation);
    const fieldPos = newFieldPositions as Record<string, string | undefined>;
    const newPlayerTimes = { ...(matchState.player_times || {}) };

    // Check if player is on field and stop their timer
    let wasOnField = false;
    positionIds.forEach(posId => {
      if (fieldPos[posId] === playerId) {
        delete fieldPos[posId];
        wasOnField = true;
      }
    });

    // Stop player's timer if they were on field and timer is running
    if (wasOnField && matchState.timer?.isRunning) {
      const pt = newPlayerTimes[playerId];
      if (pt && pt.lastEnteredField !== null && matchState.timer.startedAt) {
        const sessionStart = Math.max(pt.lastEnteredField, matchState.timer.startedAt);
        const sessionSeconds = Math.floor((now - sessionStart) / 1000);
        newPlayerTimes[playerId] = {
          ...newPlayerTimes[playerId],
          visibleTime: pt.visibleTime + sessionSeconds,
          lastEnteredField: null,
        };
      }
    }

    // Check if player is flag player and stop their flag time
    let newFlagPlayer = matchState.flag_player;
    if (matchState.flag_player === playerId) {
      newFlagPlayer = null;
      if (matchState.timer?.isRunning) {
        const pt = newPlayerTimes[playerId];
        if (pt && pt.lastEnteredFlag !== null && matchState.timer.startedAt) {
          const sessionStart = Math.max(pt.lastEnteredFlag, matchState.timer.startedAt);
          const sessionSeconds = Math.floor((now - sessionStart) / 1000);
          newPlayerTimes[playerId] = {
            ...newPlayerTimes[playerId],
            flagTime: (pt.flagTime || 0) + sessionSeconds,
            lastEnteredFlag: null,
          };
        }
      }
    }

    // Remove from bench and present players
    const newBench = matchState.bench_players.filter(p => p !== playerId);
    const newPresentPlayers = matchState.present_players.filter(p => p !== playerId);

    await updateMatchState({
      field_positions: newFieldPositions,
      bench_players: newBench,
      present_players: newPresentPlayers,
      player_times: newPlayerTimes,
      flag_player: newFlagPlayer,
    });
  }, [matchState, updateMatchState]);

  useEffect(() => {
    fetchMatchState();

    // Subscribe to realtime changes
    const channel = supabase
      .channel('match-state-changes')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'match_state' },
        (payload) => {
          const newState = payload.new as MatchState;
          // Ensure timer, player_times, flag_player and match_name exist
          setMatchState({
            ...newState,
            timer: newState.timer || DEFAULT_TIMER,
            player_times: newState.player_times || {},
            flag_player: newState.flag_player || null,
            match_name: newState.match_name || null,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, [fetchMatchState]);

  return {
    matchState,
    loading,
    error,
    setFormation,
    assignPlayerToPosition,
    movePlayerToBench,
    startNewMatch,
    clearMatch,
    updatePositionOffset,
    refetch: fetchMatchState,
    // Timer functions
    startTimer,
    pauseTimer,
    resetTimer,
    setTimerTime,
    getElapsedSeconds,
    getPlayerPlayTime,
    getPlayerFlagTime,
    // Player management during match
    addPlayerToMatch,
    removePlayerFromMatch,
    // Flag position
    assignPlayerToFlag,
    movePlayerFromFlag,
  };
}
