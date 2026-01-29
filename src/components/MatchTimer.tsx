import { useState, useEffect, useRef } from 'react';
import type { MatchTimer as MatchTimerType } from '../types';

interface MatchTimerProps {
  timer: MatchTimerType;
  onStart: () => void;
  onPause: () => void;
  onShowStats: () => void;
  onSetTime: (seconds: number) => void;
}

function formatTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function parseTime(timeString: string): number | null {
  // Try to parse MM:SS format
  const match = timeString.match(/^(\d{1,2}):(\d{2})$/);
  if (match) {
    const minutes = parseInt(match[1], 10);
    const seconds = parseInt(match[2], 10);
    if (seconds < 60) {
      return minutes * 60 + seconds;
    }
  }
  // Try to parse as just minutes
  const minutesOnly = timeString.match(/^(\d{1,3})$/);
  if (minutesOnly) {
    return parseInt(minutesOnly[1], 10) * 60;
  }
  return null;
}

export function MatchTimer({ timer, onStart, onPause, onShowStats, onSetTime }: MatchTimerProps) {
  const [displayTime, setDisplayTime] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

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

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleTimerClick = () => {
    setEditValue(formatTime(displayTime));
    setIsEditing(true);
  };

  const handleConfirmEdit = () => {
    const newSeconds = parseTime(editValue);
    if (newSeconds !== null) {
      onSetTime(newSeconds);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleConfirmEdit();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
    }
  };

  const handleBlur = () => {
    handleConfirmEdit();
  };

  const isRunning = timer.isRunning;

  return (
    <div className="flex items-center gap-2">
      {/* Timer display / input */}
      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          className="w-20 px-3 py-1.5 rounded-lg font-mono text-lg font-semibold text-center bg-white border-2 border-red-500 focus:outline-none"
          placeholder="MM:SS"
        />
      ) : (
        <button
          onClick={handleTimerClick}
          className={`
            px-3 py-1.5 rounded-lg font-mono text-lg font-semibold cursor-pointer
            transition-colors hover:ring-2 hover:ring-red-300
            ${isRunning ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'}
          `}
          title="Klik om tijd aan te passen"
        >
          {formatTime(displayTime)}
        </button>
      )}

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
