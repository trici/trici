import { useQuery } from '@tanstack/react-query';
import { RendererRepository } from '../../../dataaccess/RendererRepository';
import { useState, useEffect, useRef } from 'react';
import { IFocusSession } from '@trici/models';
import { Surface } from '@singhshashi/proactive';
import { TriciPlayer, TriciPlayerHandle } from './TriciPlayer';
import { SessionTimeline } from './SessionTimeline';

const renderRepository = RendererRepository.getInstance();
const PAGE_SIZE = 10;

export function FocusSessionsView() {
  const [pageIndex, setPageIndex] = useState(0);
  const [selectedSession, setSelectedSession] = useState<IFocusSession | null>(null);
  const [currentPlaybackTime, setCurrentPlaybackTime] = useState<number>(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<TriciPlayerHandle>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

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

  // Handle timeline click to seek video
  const handleTimelineClick = (timestamp: number) => {
    if (playerRef.current) {
      playerRef.current.seekToTimestamp(timestamp);
    }
  };

  // Add more detailed logging to the handleTimeUpdate function
  // Handle time updates from the video player
  const handleTimeUpdate = (currentTime: number) => {
    // Only update if the time is valid
    if (currentTime && selectedSession && currentTime >= selectedSession.startTime) {
      setCurrentPlaybackTime(currentTime);
    } else {
      console.warn('Invalid current time received:', currentTime);
    }
  };

  // Add code to log session details for debugging
  useEffect(() => {
    if (selectedSession) {
      const sessionDuration = selectedSession.endTime - selectedSession.startTime;
      console.log('Selected session details:', {
        id: selectedSession.id,
        startTime: new Date(selectedSession.startTime).toLocaleTimeString(),
        endTime: new Date(selectedSession.endTime).toLocaleTimeString(),
        duration: `${(sessionDuration / 1000).toFixed(2)} seconds`,
        durationFormatted: new Date(sessionDuration).toISOString().substr(11, 8),
      });
    }
  }, [selectedSession]);

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
      <div className="flex h-screen w-full flex-col overflow-hidden text-black">
        {/* Main content area - 90% of height */}
        <div className="flex h-[90%] w-full flex-col p-2">
          {selectedSession ? (
            <>
              {/* Container for video and timeline with consistent width */}
              <div className="flex h-full w-full flex-col items-center">
                <div className="flex w-full max-w-[85%] flex-col">
                  {/* Video player - 80% of the main content */}
                  <div className="h-[80%] w-full">
                    <TriciPlayer ref={playerRef} selectedSession={selectedSession} onTimeUpdate={handleTimeUpdate} />
                  </div>

                  {/* Spacer between video and timeline */}
                  <div className="h-6"></div>

                  {/* Timeline - 20% of the main content */}
                  <div className="h-[20%] w-full">
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

        {/* Bottom sessions scroll area - 10% of height */}
        <div className="relative h-[10%] w-full border-t border-gray-200 bg-gray-100 p-2">
          {canScrollLeft && (
            <button
              onClick={() => handleScroll('left')}
              className="absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-gray-700 p-2 text-white shadow-lg hover:bg-gray-600"
            >
              ←
            </button>
          )}

          <div
            ref={scrollContainerRef}
            className="flex h-full gap-4 overflow-x-auto px-8 pb-1"
            style={{ scrollBehavior: 'smooth' }}
            onScroll={checkScrollability}
          >
            {[...(focusSessionsQuery.data || [])].reverse().map(session => (
              <div
                key={session.id}
                className={`flex-shrink-0 cursor-pointer transition-transform hover:scale-105 ${
                  selectedSession?.id === session.id ? 'scale-105' : ''
                }`}
                onClick={() => setSelectedSession(session)}
              >
                <div className="p-1">
                  <div
                    className={`h-10 w-10 rounded-lg border-2 ${
                      selectedSession?.id === session.id ? 'border-blue-500' : 'border-gray-300'
                    } bg-gray-200`}
                  >
                    {/* Placeholder for future preview image */}
                  </div>
                </div>
                <div className="mt-1 text-center text-xs">{formatSessionTime(session.startTime)}</div>
              </div>
            ))}
          </div>

          {canScrollRight && (
            <button
              onClick={() => handleScroll('right')}
              className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-gray-700 p-2 text-white shadow-lg hover:bg-gray-600"
            >
              →
            </button>
          )}
        </div>
      </div>
    </Surface>
  );
}
