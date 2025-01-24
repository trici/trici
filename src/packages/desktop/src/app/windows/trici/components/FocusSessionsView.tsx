import { useQuery } from '@tanstack/react-query';
import { RendererRepository } from '../../../dataaccess/RendererRepository';
import { useState } from 'react';
import { FocusSession, IFocusSession } from '@trici/models';

const renderRepository = RendererRepository.getInstance();
const PAGE_SIZE = 10;

export function FocusSessionsView() {
  const [pageIndex, setPageIndex] = useState(0);
  const [selectedSession, setSelectedSession] = useState<IFocusSession | null>(null);

  const focusSessionsQuery = useQuery({
    queryKey: ['focusSessions', pageIndex, PAGE_SIZE],
    queryFn: () => renderRepository.getFocusSessionsPaginated(pageIndex, PAGE_SIZE),
  });

  if (focusSessionsQuery.isLoading) {
    return <div className="flex h-full w-full items-center justify-center">Loading...</div>;
  }

  if (focusSessionsQuery.error) {
    return (
      <div className="flex h-full w-full items-center justify-center">Error: {focusSessionsQuery.error.toString()}</div>
    );
  }

  return (
    <div className="flex h-full min-h-0 bg-slate-300">
      {/* Left side - Sessions List */}
      <div className="flex w-1/4 min-w-0 flex-shrink-0 flex-col border-r border-gray-400 p-4">
        <div className="flex-1 overflow-y-auto">
          {focusSessionsQuery.data?.map(session => (
            <div
              key={session.id}
              className={`mb-4 cursor-pointer rounded-lg p-4 transition-colors ${
                selectedSession?.id === session.id ? 'bg-gray-600' : 'bg-gray-700 hover:bg-gray-600'
              }`}
              onClick={() => setSelectedSession(session)}
            >
              <div className="truncate font-semibold">
                {new Date(session.startTime).toLocaleDateString()} {new Date(session.startTime).toLocaleTimeString()}
              </div>
              <div className="truncate text-gray-300">
                Duration: {((session.endTime - session.startTime) / 60000).toFixed(1)} minutes
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 flex justify-between">
          <button
            onClick={() => setPageIndex(prev => Math.max(0, prev - 1))}
            disabled={pageIndex === 0}
            className="rounded bg-gray-700 px-4 py-2 disabled:opacity-50"
          >
            Previous
          </button>
          <button
            onClick={() => setPageIndex(prev => prev + 1)}
            disabled={!focusSessionsQuery.data || focusSessionsQuery.data.length < PAGE_SIZE}
            className="rounded bg-gray-700 px-4 py-2 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>

      {/* Right side - Session Details */}
      <div className="w-3/4 min-w-0 ">
        {selectedSession ? (
          <div className="h-full p-4">
            <h2 className="mb-4 text-xl font-bold">Session Details</h2>
            <div className="mb-4">
              <div className="font-semibold">Start Time:</div>
              <div>{new Date(selectedSession.startTime).toLocaleString()}</div>
            </div>
            <div className="mb-4">
              <div className="font-semibold">End Time:</div>
              <div>{new Date(selectedSession.endTime).toLocaleString()}</div>
            </div>
            <div className="mb-4">
              <div className="font-semibold">Duration:</div>
              <div>{((selectedSession.endTime - selectedSession.startTime) / 60000).toFixed(1)} minutes</div>
            </div>
            {/* Add placeholder for future content */}
            <div className="mt-8 text-gray-400">
              <p>Additional session data (videos, images, etc.) will be displayed here.</p>
            </div>
          </div>
        ) : (
          <div className="flex h-full items-center justify-center text-gray-500">Select a session to view details</div>
        )}
      </div>
    </div>
  );
}
