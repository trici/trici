import { Surface } from '@singhshashi/proactive';
import { TriciTimeline } from './TriciTimeline';
import { useState } from 'react';

const MAX_TIME = Date.now();
const MIN_TIME = MAX_TIME - 24 * 60 * 60 * 1000; // 24 hours ago
const MIN_ZOOM_DURATION = 5 * 60 * 1000; // 5 minutes
const MAX_ZOOM_DURATION = MAX_TIME - MIN_TIME; // 24 hours

export function TriciContainer() {
  const [timeRange, setTimeRange] = useState(() => {
    const now = Date.now();
    const sixtyMinutesAgo = now - 60 * 60 * 1000; // 60 minutes in milliseconds
    return [sixtyMinutesAgo, now] as [number, number];
  });
  const [currentTime, setCurrentTime] = useState(Date.now() - 20 * 60 * 1000);

  return (
    <div className="flex h-full w-full flex-col bg-gray-800 bg-opacity-90 text-white">
      <div className="flex flex-1 items-center justify-center">
        <div className="bg-slate-700">{currentTime}</div>
      </div>
      <div className="h-[50px]">
        <Surface shade="dark" width="100%" height="100%" type="glossy">
          <TriciTimeline
            timeRange={timeRange}
            currentTime={currentTime}
            onTimeRangeChange={setTimeRange}
            onCurrentTimeChange={setCurrentTime}
            minTime={MIN_TIME}
            maxTime={MAX_TIME}
          />
        </Surface>
      </div>
    </div>
  );
}
