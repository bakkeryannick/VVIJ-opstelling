import { useState, useEffect } from 'react';
import type { MatchTimer as MatchTimerType } from '../types';

interface MatchTimerProps {
  timer: MatchTimerType;
  onStart: () => void;
  onPause: () => void;
  onShowStats: () => void;
}

function formatTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

export function MatchTimer({ timer, onStart, onPause, onShowStats }: MatchTimerProps) {
  const [displayTime, setDisplayTime] = useState(0);

  useEffect(() => {
    // Calculate initial display time
    const getElapsed = () => {
      if (!timer.isRunning || !timer.startedAt) {
        return timer.elapsedBeforePause;
      }
      return timer.elapsedBeforePause + Math.floor((Date.now() - timer.startedAt) / 1000);
    };

    setDisplayTime(getElapsed());

    // Update every second if running
    if (timer.isRunning) {
      const interval = setInterval(() => {
        setDisplayTime(getElapsed());
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  const isRunning = timer.isRunning;

  return (
    <div className="flex items-center gap-2">
      {/* Timer display */}
      <div
        className={`
          px-3 py-1.5 rounded-lg font-mono text-lg font-semibold
          ${isRunning ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'}
        `}
      >
        {formatTime(displayTime)}
      </div>

      {/* Play/Pause button */}
      <button
        onClick={isRunning ? onPause : onStart}
        className={`
          p-2 rounded-lg transition-colors
          ${isRunning
            ? 'bg-orange-100 text-orange-600 hover:bg-orange-200'
            : 'bg-green-100 text-green-600 hover:bg-green-200'
          }
        `}
        title={isRunning ? 'Pauze (rust)' : 'Start timer'}
      >
        {isRunning ? (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        )}
      </button>

      {/* Stats button */}
      <button
        onClick={onShowStats}
        className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
        title="Speeltijd overzicht"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
      </button>
    </div>
  );
}
