import type { Availability, PlayerPlayTime, MatchTimer } from '../types';

export type TrafficLightStatus = 'green' | 'orange' | 'red' | 'none';

const AVAILABILITY_SECONDS: Record<Availability, number> = {
  '25': 25 * 60,
  '45': 45 * 60,
  '70': 70 * 60,
  '90': 90 * 60,
};

export function getTrafficLight(
  playedSeconds: number,
  availability: Availability | undefined,
): TrafficLightStatus {
  if (!availability) return 'none';
  const desired = AVAILABILITY_SECONDS[availability];
  const ratio = playedSeconds / desired;
  if (ratio >= 1) return 'red';
  if (ratio >= 0.5) return 'orange';
  return 'green';
}

export function calcPlayerPlayTime(
  playerTime: PlayerPlayTime | undefined,
  timer: MatchTimer,
): number {
  if (!playerTime) return 0;
  let total = playerTime.visibleTime;
  if (playerTime.lastEnteredField !== null && timer.isRunning && timer.startedAt) {
    const sessionStart = Math.max(playerTime.lastEnteredField, timer.startedAt);
    const sessionSeconds = Math.floor((Date.now() - sessionStart) / 1000);
    total += sessionSeconds;
  }
  return total;
}

export function availabilityToMinutes(availability: Availability): number {
  return parseInt(availability);
}

export function formatMinutes(seconds: number): string {
  return `${Math.floor(seconds / 60)}'`;
}
