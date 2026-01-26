import type { Formation, FormationConfig, PositionId } from '../types';

// Positions are defined as percentages from top-left
// X: 0 = left, 100 = right
// Y: 0 = top (opponent goal), 100 = bottom (our goal)

export const formations: Record<Formation, FormationConfig> = {
  '4-3-3': {
    positions: [
      // Goalkeeper
      { id: 'GK', label: 'GK', x: 50, y: 92 },
      // Defenders (4)
      { id: 'LB', label: 'LB', x: 15, y: 75 },
      { id: 'LCV', label: 'LCV', x: 35, y: 78 },
      { id: 'RCV', label: 'RCV', x: 65, y: 78 },
      { id: 'RB', label: 'RB', x: 85, y: 75 },
      // Midfielders (3)
      { id: 'LM', label: 'LM', x: 25, y: 55 },
      { id: 'CM', label: 'CM', x: 50, y: 58 },
      { id: 'RM', label: 'RM', x: 75, y: 55 },
      // Forwards (3)
      { id: 'LW', label: 'LW', x: 20, y: 30 },
      { id: 'SP', label: 'SP', x: 50, y: 25 },
      { id: 'RW', label: 'RW', x: 80, y: 30 },
    ],
  },
  '3-4-3': {
    positions: [
      // Goalkeeper
      { id: 'GK', label: 'GK', x: 50, y: 92 },
      // Defenders (3)
      { id: 'LCV', label: 'LCV', x: 25, y: 78 },
      { id: 'CV', label: 'CV', x: 50, y: 80 },
      { id: 'RCV', label: 'RCV', x: 75, y: 78 },
      // Midfielders (4)
      { id: 'LM', label: 'LM', x: 12, y: 55 },
      { id: 'LCM', label: 'LCM', x: 38, y: 58 },
      { id: 'RCM', label: 'RCM', x: 62, y: 58 },
      { id: 'RM', label: 'RM', x: 88, y: 55 },
      // Forwards (3)
      { id: 'LW', label: 'LW', x: 20, y: 30 },
      { id: 'SP', label: 'SP', x: 50, y: 25 },
      { id: 'RW', label: 'RW', x: 80, y: 30 },
    ],
  },
  '4-4-2': {
    positions: [
      // Goalkeeper
      { id: 'GK', label: 'GK', x: 50, y: 92 },
      // Defenders (4)
      { id: 'LB', label: 'LB', x: 15, y: 75 },
      { id: 'LCV', label: 'LCV', x: 35, y: 78 },
      { id: 'RCV', label: 'RCV', x: 65, y: 78 },
      { id: 'RB', label: 'RB', x: 85, y: 75 },
      // Midfielders (4)
      { id: 'LM', label: 'LM', x: 12, y: 55 },
      { id: 'LCM', label: 'LCM', x: 38, y: 58 },
      { id: 'RCM', label: 'RCM', x: 62, y: 58 },
      { id: 'RM', label: 'RM', x: 88, y: 55 },
      // Forwards (2)
      { id: 'LS', label: 'LS', x: 35, y: 28 },
      { id: 'RS', label: 'RS', x: 65, y: 28 },
    ],
  },
};

export const getFormationPositions = (formation: Formation) => {
  return formations[formation].positions;
};

export const getPositionIds = (formation: Formation): PositionId[] => {
  return formations[formation].positions.map(p => p.id);
};

export const mapPlayersToNewFormation = (
  currentPositions: { [key: string]: string | undefined },
  oldFormation: Formation,
  newFormation: Formation
): { [key: string]: string | undefined } => {
  const oldPositionIds = getPositionIds(oldFormation);
  const newPositionIds = getPositionIds(newFormation);
  const newPositions: { [key: string]: string | undefined } = {};

  // Get all players currently on field
  const playersOnField: string[] = [];
  oldPositionIds.forEach(posId => {
    const playerId = currentPositions[posId];
    if (playerId) {
      playersOnField.push(playerId);
    }
  });

  // Assign players to new positions in order
  newPositionIds.forEach((posId, index) => {
    if (index < playersOnField.length) {
      newPositions[posId] = playersOnField[index];
    }
  });

  return newPositions;
};
