export interface Player {
  id: string;
  name: string;
  created_at: string;
}

export type Formation = '4-3-3' | '3-4-3' | '4-4-2';

export type PositionId =
  // Goalkeeper
  | 'GK'
  // Defenders
  | 'LB' | 'LCV' | 'CV' | 'RCV' | 'RB'
  // Midfielders
  | 'LM' | 'LCM' | 'CM' | 'RCM' | 'RM'
  // Forwards
  | 'LW' | 'LS' | 'SP' | 'RS' | 'RW';

export interface PositionOffset {
  x: number;
  y: number;
}

export type FieldPositions = {
  [K in PositionId]?: string;
} & {
  position_offsets?: Record<string, PositionOffset>;
};

export interface PlayerPlayTime {
  visibleTime: number;      // Gespeelde tijd in seconden (zichtbaar)
  lastEnteredField: number | null;  // Timestamp wanneer speler het veld inging
  flagTime: number;         // Vlag-tijd in seconden
  lastEnteredFlag: number | null;   // Timestamp wanneer speler vlaggenist werd
}

export interface MatchTimer {
  isRunning: boolean;
  startedAt: number | null;    // Timestamp wanneer timer gestart
  elapsedBeforePause: number;  // Tijd in seconden voor pauze
}

export interface MatchState {
  id: string;
  formation: Formation;
  field_positions: FieldPositions;
  bench_players: string[];
  present_players: string[];
  updated_at: string;
  // Timer state
  timer: MatchTimer;
  // Playing time per player (playerId -> PlayTime)
  player_times: Record<string, PlayerPlayTime>;
  // Vlaggenist (flag person)
  flag_player: string | null;
}

export interface FormationConfig {
  positions: {
    id: PositionId;
    label: string;
    x: number;
    y: number;
  }[];
}

export type AppView = 'pin' | 'home' | 'select-players' | 'field' | 'manage-players' | 'match-stats';
