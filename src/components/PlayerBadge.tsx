import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import type { TrafficLightStatus } from '../lib/trafficLight';

interface PlayerBadgeProps {
  id: string;
  name: string;
  isDragging?: boolean;
  isOnField?: boolean;
  isFlag?: boolean;
  trafficLight?: TrafficLightStatus;
}

function getDisplayName(name: string): string {
  if (name.length <= 6) return name;

  // Handle special cases
  if (name.includes(' ')) {
    const parts = name.split(' ');
    if (parts[0].length <= 6) return parts[0];
    return parts[0].slice(0, 5) + '.';
  }

  return name.slice(0, 5) + '.';
}

const TRAFFIC_LIGHT_BORDER: Record<string, string> = {
  green: 'border-green-500',
  orange: 'border-amber-500',
  red: 'border-red-600',
  none: 'border-red-600',
};

export function PlayerBadge({ id, name, isDragging, isOnField, isFlag, trafficLight }: PlayerBadgeProps) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id,
    data: { name, isOnField, isFlag },
  });

  const style = transform
    ? {
        transform: CSS.Translate.toString(transform),
        zIndex: 1000,
      }
    : undefined;

  const displayName = getDisplayName(name);

  // Determine badge style based on location
  const getBadgeStyle = () => {
    if (isOnField) {
      const borderClass = trafficLight ? TRAFFIC_LIGHT_BORDER[trafficLight] : 'border-red-600';
      return `bg-white text-gray-800 shadow-md border-2 ${borderClass}`;
    }
    if (isFlag) {
      return 'bg-orange-500 text-white shadow-sm';
    }
    return 'bg-red-600 text-white shadow-sm';
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`
        flex items-center justify-center
        min-w-[44px] h-[44px] px-2
        rounded-full
        font-medium text-sm
        select-none cursor-grab active:cursor-grabbing
        touch-none
        transition-shadow
        ${getBadgeStyle()}
        ${isDragging ? 'opacity-50 shadow-lg scale-105' : ''}
      `}
      title={name}
    >
      {displayName}
    </div>
  );
}

export function PlayerBadgeOverlay({ name, isOnField, isFlag, trafficLight }: { name: string; isOnField?: boolean; isFlag?: boolean; trafficLight?: TrafficLightStatus }) {
  const displayName = getDisplayName(name);

  const getOverlayStyle = () => {
    if (isOnField) {
      const borderClass = trafficLight ? TRAFFIC_LIGHT_BORDER[trafficLight] : 'border-red-600';
      return `bg-white text-gray-800 border-2 ${borderClass}`;
    }
    if (isFlag) {
      return 'bg-orange-500 text-white';
    }
    return 'bg-red-600 text-white';
  };

  return (
    <div
      className={`
        flex items-center justify-center
        min-w-[44px] h-[44px] px-2
        rounded-full
        font-medium text-sm
        shadow-xl scale-110
        ${getOverlayStyle()}
      `}
    >
      {displayName}
    </div>
  );
}
