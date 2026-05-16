import { useQuery } from '@tanstack/react-query';
import { RendererRepository } from '../../../dataaccess/RendererRepository';
import { useState, useEffect, useRef } from 'react';
import { IFocusSession } from '@trici/models';
import { Surface } from '@singhshashi/proactive';
import { TriciPlayer, TriciPlayerHandle } from './TriciPlayer';
import { SessionTimeline } from './SessionTimeline';

const renderRepository = RendererRepository.getInstance();
const PAGE_SIZE = 10;

// Debug modal component
function SessionDebugModal({ session, onClose }: { session: IFocusSession; onClose: () => void }) {
  // Format JSON with indentation
  const formattedSession = JSON.stringify(session, null, 2);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="max-h-[80vh] w-[80vw] overflow-auto rounded-lg bg-white p-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 pb-2">
          <h2 className="text-lg font-semibold">Focus Session Debug Info</h2>
          <button
            onClick={onClose}
            className="rounded-full bg-gray-200 p-1.5 text-gray-700 hover:bg-gray-300 hover:text-black"
          >
            ✕
          </button>
        </div>
        <pre className="mt-4 max-h-[60vh] overflow-auto rounded border border-gray-200 bg-white p-4 text-xs text-black">
          {formattedSession}
        </pre>
      </div>
    </div>
  );
}

export function FocusSessionsView() {
  const [pageIndex, setPageIndex] = useState(0);
  const [selectedSession, setSelectedSession] = useState<IFocusSession | null>(null);
  const [currentPlaybackTime, setCurrentPlaybackTime] = useState<number>(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<TriciPlayerHandle>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [showDebugModal, setShowDebugModal] = useState(false);

  // Check if this is a dev build
  const isDevBuild = window.bridgeApi?.triciConfig?.builtFor === 'dev';

  const focusSessionsQuery = useQuery({
    queryKey: ['focusSessions', pageIndex, PAGE_SIZE],
    queryFn: () => renderRepository.getFocusSessionsPaginated(pageIndex, PAGE_SIZE),
  });

  // Select the latest session when data is loaded
  useEffect(() => {
    if (focusSessionsQuery.data && focusSessionsQuery.data.length > 0 && !selectedSession) {
      const latestSession = focusSessionsQuery.data.reduce((latest, current) =>
        current.startTime > latest.startTime ? current : latest,
      );
      setSelectedSession(latestSession);
    }
  }, [focusSessionsQuery.data]);

  // Check if scrolling is possible
  const checkScrollability = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 10); // 10px buffer for rounding errors
    }
  };

  // Add scroll event listener to update button visibility
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', checkScrollability);
      // Initial check
      checkScrollability();

      return () => {
        scrollContainer.removeEventListener('scroll', checkScrollability);
      };
    }
  }, [focusSessionsQuery.data]);

  // Also check scrollability when window resizes or data changes
  useEffect(() => {
    window.addEventListener('resize', checkScrollability);
    checkScrollability();

    return () => {
      window.removeEventListener('resize', checkScrollability);
    };
  }, [focusSessionsQuery.data]);

  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 200;
      const newScrollPosition =
        scrollContainerRef.current.scrollLeft + (direction === 'left' ? -scrollAmount : scrollAmount);
      scrollContainerRef.current.scrollTo({
        left: newScrollPosition,
        behavior: 'smooth',
      });
    }
  };

  const formatSessionTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return `${date.toLocaleDateString(undefined, { weekday: 'short' })} - ${date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}`;
  };

  // Format session duration in minutes or hours and minutes
  const formatSessionDuration = (session: IFocusSession) => {
    // Calculate duration in milliseconds
    const durationMs = session.endTime ? session.endTime - session.startTime : Date.now() - session.startTime; // Use current time for ongoing sessions

    // Convert to minutes
    const durationMinutes = Math.max(1, Math.round(durationMs / (1000 * 60))); // Ensure at least 1 minute

    if (durationMinutes < 60) {
      return `${durationMinutes} m`;
    } else {
      const hours = Math.floor(durationMinutes / 60);
      const minutes = durationMinutes % 60;
      return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
    }
  };

  // Handle timeline click to seek video
  const handleTimelineClick = (timestamp: number) => {
    if (playerRef.current) {
      playerRef.current.seekToTimestamp(timestamp);
    }
  };

  // Handle time updates from the video player
  const handleTimeUpdate = (currentTime: number) => {
    // Only update if the time is valid
    if (currentTime && selectedSession && currentTime >= selectedSession.startTime) {
      setCurrentPlaybackTime(currentTime);
    }
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
      <div className="flex h-full w-full overflow-hidden text-black">
        {/* Side sessions list - 15% of width */}
        <div className="relative w-[8%] overflow-y-auto border-r border-gray-200 bg-gray-100 p-2">
          <div className="flex h-full flex-col gap-4 pb-1" ref={scrollContainerRef} onScroll={checkScrollability}>
            {(focusSessionsQuery.data || []).map(session => (
              <div
                key={session.id}
                className={`flex-shrink-0 cursor-pointer transition-transform hover:scale-105 ${
                  selectedSession?.id === session.id ? 'scale-105' : ''
                }`}
                onClick={() => setSelectedSession(session)}
              >
                <div className="p-1">
                  <div
                    className={`mx-auto flex h-12 w-12 items-center justify-center rounded-lg border-2 ${
                      selectedSession?.id === session.id ? 'border-blue-500' : 'border-gray-300'
                    } bg-gray-200 text-xs font-medium`}
                  >
                    {formatSessionDuration(session)}
                  </div>
                </div>
                <div className="mt-1 text-center text-xs">{formatSessionTime(session.startTime)}</div>
              </div>
            ))}
          </div>

          {canScrollLeft && (
            <button
              onClick={() => handleScroll('left')}
              className="absolute left-1/2 top-2 z-10 -translate-x-1/2 rounded-full bg-gray-700 p-2 text-white shadow-lg hover:bg-gray-600"
            >
              ↑
            </button>
          )}

          {canScrollRight && (
            <button
              onClick={() => handleScroll('right')}
              className="absolute bottom-2 left-1/2 z-10 -translate-x-1/2 rounded-full bg-gray-700 p-2 text-white shadow-lg hover:bg-gray-600"
            >
              ↓
            </button>
          )}
        </div>

        {/* Main content area - 85% of width */}
        <div className="flex h-full w-[92%] flex-col p-4">
          {selectedSession ? (
            <>
              {/* Container for video and timeline with consistent width */}
              <div className="flex h-full w-full flex-col items-center">
                <div className="flex w-full max-w-[85%] flex-col">
                  {/* Debug button - only in dev builds */}
                  {isDevBuild && (
                    <div className="mb-2 flex justify-end">
                      <button
                        onClick={() => setShowDebugModal(true)}
                        className="rounded border border-gray-300 bg-gray-100 px-2 py-1 text-xs text-gray-700 hover:bg-gray-200"
                        title="View session debug information"
                      >
                        Debug Session
                      </button>
                    </div>
                  )}

                  {/* Video player */}
                  <div className="mb-4">
                    <TriciPlayer ref={playerRef} selectedSession={selectedSession} onTimeUpdate={handleTimeUpdate} />
                  </div>

                  {/* Timeline */}
                  <div className="mt-2">
                    <SessionTimeline
                      selectedSession={selectedSession}
                      currentTime={currentPlaybackTime}
                      onTimelineClick={handleTimelineClick}
                    />
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex h-full items-center justify-center text-gray-500">
              Select a session to view details
            </div>
          )}
        </div>
      </div>

      {/* Debug modal */}
      {showDebugModal && selectedSession && (
        <SessionDebugModal session={selectedSession} onClose={() => setShowDebugModal(false)} />
      )}
    </Surface>
  );
}
