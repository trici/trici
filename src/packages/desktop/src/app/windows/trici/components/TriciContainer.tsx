import { TimelineView } from './TimelineView';
import { FocusSessionsView } from './FocusSessionsView';
import { useState } from 'react';
import { cn } from '../../../common/Utils';

type ViewType = 'timeline' | 'focus-sessions';

const viewOptions: { id: ViewType; label: string }[] = [
  { id: 'timeline', label: 'Timeline' },
  { id: 'focus-sessions', label: 'Focus Sessions' },
];

export function TriciContainer() {
  const [currentView, setCurrentView] = useState<ViewType>('focus-sessions');

  return (
    <div className="flex h-full w-full flex-col bg-gray-800 bg-opacity-90 text-white">
      <div className="flex border-b border-gray-700">
        {viewOptions.map(option => (
          <button
            key={option.id}
            onClick={() => setCurrentView(option.id)}
            className={cn(
              'px-4 py-2 text-sm font-medium transition-colors',
              'hover:bg-gray-700/50',
              'focus:outline-none',
              currentView === option.id ? 'border-b-2 border-blue-500 text-blue-400' : 'text-gray-400',
            )}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="flex-1">{currentView === 'timeline' ? <TimelineView /> : <FocusSessionsView />}</div>
    </div>
  );
}
