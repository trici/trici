import { useQuery } from '@tanstack/react-query';
import { RendererRepository } from '../../../dataaccess/RendererRepository';
import { useState, useEffect } from 'react';
import { FocusSession, IFocusSession, AppEvent, TriciAppEvent } from '@trici/models';
import { DataGrid, Surface } from '@singhshashi/proactive';
import { TriciPlayer } from './TriciPlayer';

const renderRepository = RendererRepository.getInstance();
const PAGE_SIZE = 10;

export function FocusSessionsView() {
  const [pageIndex, setPageIndex] = useState(0);
  const [selectedSession, setSelectedSession] = useState<IFocusSession | null>(null);

  const focusSessionsQuery = useQuery({
    queryKey: ['focusSessions', pageIndex, PAGE_SIZE],
    queryFn: () => renderRepository.getFocusSessionsPaginated(pageIndex, PAGE_SIZE),
  });

  const sessionEventsQuery = useQuery({
    queryKey: ['sessionEvents', selectedSession?.id],
    queryFn: () =>
      selectedSession
        ? renderRepository.getEvents(selectedSession.startTime, selectedSession.endTime, null)
        : Promise.resolve([]),
    enabled: !!selectedSession,
  });

  // Select the latest session when data is loaded
  useEffect(() => {
    if (focusSessionsQuery.data && focusSessionsQuery.data.length > 0 && !selectedSession) {
      // Find the session with the latest startTime
      const latestSession = focusSessionsQuery.data.reduce((latest, current) =>
        current.startTime > latest.startTime ? current : latest,
      );
      setSelectedSession(latestSession);
    }
  }, [focusSessionsQuery.data]);

  const renderEventItem = (event: AppEvent) => {
    const eventTime = new Date(event.timestamp).toLocaleTimeString();
    return (
      <div className="flex flex-row items-center justify-between px-2 py-1">
        <div className="flex w-1/4 flex-row items-center justify-start">
          <span>{eventTime}</span>
        </div>
        <div className="flex w-1/4 flex-row items-center justify-start">
          <span>{event.type}</span>
        </div>
        <div className="flex w-2/4 flex-row items-center justify-start">
          <span>{event.data ? JSON.stringify(event.data) : '-'}</span>
        </div>
      </div>
    );
  };

  if (focusSessionsQuery.isLoading) {
    return <div className="flex h-full w-full items-center justify-center">Loading...</div>;
  }

  if (focusSessionsQuery.error) {
    return (
      <div className="flex h-full w-full items-center justify-center">Error: {focusSessionsQuery.error.toString()}</div>
    );
  }

  return (
    <Surface shade="light">
      <div className="flex h-full min-h-0 text-black ">
        {/* Left side - Sessions List */}
        <div className="flex w-1/5 min-w-0 flex-shrink-0 flex-col border-r border-gray-400 bg-gray-200 p-4">
          <div className="flex-1 overflow-y-auto">
            {focusSessionsQuery.data?.map(session => (
              <div
                key={session.id}
                className={`mb-4 cursor-pointer rounded-md p-4 transition-colors ${
                  selectedSession?.id === session.id
                    ? 'bg-gradient-to-r from-blue-400 to-blue-400'
                    : 'hover:bg-gray-300'
                }`}
                onClick={() => setSelectedSession(session)}
              >
                <div className="truncate font-semibold">
                  {new Date(session.startTime).toLocaleDateString()} {new Date(session.startTime).toLocaleTimeString()}
                </div>
                <div className="truncate ">
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
        <div className="w-4/5 min-w-0 overflow-y-auto">
          {selectedSession ? (
            <div className="h-full p-4">
              <TriciPlayer selectedSession={selectedSession} />

              {/* Session Events */}
              <div className="mt-8">
                <h3 className="mb-4 text-lg font-semibold">Session Events</h3>
                {sessionEventsQuery.isLoading ? (
                  <div className="text-gray-400">Loading events...</div>
                ) : sessionEventsQuery.error ? (
                  <div className="text-red-400">Error loading events: {sessionEventsQuery.error.toString()}</div>
                ) : (
                  <DataGrid
                    header={() => (
                      <div className="flex flex-row items-center justify-between">
                        <div className="flex w-1/4 flex-row items-center justify-start">
                          <span className="text-sm">Time</span>
                        </div>
                        <div className="flex w-1/4 flex-row items-center justify-start">
                          <span className="text-sm">Event Type</span>
                        </div>
                        <div className="flex w-2/4 flex-row items-center justify-start">
                          <span className="text-sm">Details</span>
                        </div>
                      </div>
                    )}
                    items={sessionEventsQuery.data || []}
                    showAddRemoveButtons={false}
                    dataGridLabel="Session Events"
                    dataGridDescription="Events that occurred during this focus session"
                    emptyGridMessage="No events found for this session"
                    itemTemplate={renderEventItem}
                  />
                )}
              </div>
            </div>
          ) : (
            <div className="flex h-full items-center justify-center text-gray-500">
              Select a session to view details
            </div>
          )}
        </div>
      </div>
    </Surface>
  );
}
