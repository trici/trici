import { TimelineBar } from '../../shared/components/timeline/TimelineBar';

interface TriciTimelineProps {
  timeRange: [number, number];
  currentTime: number;
  onTimeRangeChange: (newRange: [number, number]) => void;
  onCurrentTimeChange: (newTime: number) => void;
  minTime: number;
  maxTime: number;
}

export function TriciTimeline({
  timeRange,
  currentTime,
  onTimeRangeChange,
  onCurrentTimeChange,
  minTime,
  maxTime,
}: TriciTimelineProps) {
  return (
    <div id="timelinebar-container" className="h-full pr-1">
      <TimelineBar
        timeInterval={timeRange}
        currentTime={currentTime}
        onZoom={onTimeRangeChange}
        onTimeChange={onCurrentTimeChange}
        minTime={minTime}
        maxTime={maxTime}
      />
    </div>
  );
}
