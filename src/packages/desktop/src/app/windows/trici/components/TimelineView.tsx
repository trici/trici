import { Surface } from '@singhshashi/proactive';
import { TriciTimeline } from './TriciTimeline';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { RendererRepository } from '../../../dataaccess/RendererRepository';
import { AppEvent } from '@trici/models';

const MAX_TIME = Date.now();
const MIN_TIME = MAX_TIME - 24 * 60 * 60 * 1000; // 24 hours ago
const MIN_ZOOM_DURATION = 5 * 60 * 1000; // 5 minutes
const MAX_ZOOM_DURATION = MAX_TIME - MIN_TIME; // 24 hours

const renderRepository = RendererRepository.getInstance();

export function TimelineView() {
  const [timeRange, setTimeRange] = useState(() => {
    const now = Date.now();
    const sixtyMinutesAgo = now - 6 * 60 * 60 * 1000; // 6 hours in milliseconds
    return [sixtyMinutesAgo, now] as [number, number];
  });
  const [currentTime, setCurrentTime] = useState(Date.now() - 20 * 60 * 1000);

  // Query for events in the current time range
  const eventsQuery = useQuery<AppEvent[]>({
    queryKey: ['events', timeRange[0], timeRange[1]],
    queryFn: () => renderRepository.getEvents(timeRange[0], timeRange[1], null),
  });

  // Query for focus sessions in the current time range
  const focusSessionsQuery = useQuery({
    queryKey: ['focusSessions', timeRange[0], timeRange[1]],
    queryFn: () => renderRepository.getFocusSessionsForDuration(timeRange[0], timeRange[1]),
  });

  if (eventsQuery.isLoading || focusSessionsQuery.isLoading) {
    return <div className="flex h-full w-full items-center justify-center">Loading...</div>;
  }

  if (eventsQuery.error || focusSessionsQuery.error) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        Error: {(eventsQuery.error || focusSessionsQuery.error)?.toString()}
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div id="timeline-view" className="flex flex-1 items-center justify-center">
        <div className="bg-slate-700">
          {currentTime}
          <div>Events: {eventsQuery.data?.length}</div>
          <div>Focus Sessions: {focusSessionsQuery.data?.length}</div>
        </div>
      </div>
      <div className="h-[80px]">
        <Surface shade="dark" width="100%" height="100%" type="glossy">
          <TriciTimeline
            timeRange={timeRange}
            currentTime={currentTime}
            onTimeRangeChange={setTimeRange}
            onCurrentTimeChange={setCurrentTime}
            minTime={MIN_TIME}
            maxTime={MAX_TIME}
            minZoomDuration={MIN_ZOOM_DURATION}
            maxZoomDuration={MAX_ZOOM_DURATION}
          />
        </Surface>
      </div>
    </div>
  );
}
