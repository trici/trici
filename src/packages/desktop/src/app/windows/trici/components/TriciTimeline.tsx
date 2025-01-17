import { TimelineBar } from '../../shared/components/timeline/TimelineBar';
import { useEffect, useRef } from 'react';
import React from 'react';

interface TriciTimelineProps {
  timeRange: [number, number];
  currentTime: number;
  onTimeRangeChange: (newRange: [number, number]) => void;
  onCurrentTimeChange: (newTime: number) => void;
  minTime: number;
  maxTime: number;
  minZoomDuration: number;
  maxZoomDuration: number;
}

export function TriciTimeline({
  timeRange,
  currentTime,
  onTimeRangeChange,
  onCurrentTimeChange,
  minTime,
  maxTime,
  minZoomDuration,
  maxZoomDuration,
}: TriciTimelineProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const handleWheel = React.useCallback(
    (e: WheelEvent) => {
      if (!e.ctrlKey) return;
      e.preventDefault();

      const [start, end] = timeRange;
      const currentDuration = end - start;
      const zoomingIn = e.deltaY > 0;

      // Calculate new duration
      const newDuration = zoomingIn ? currentDuration * 1.1 : currentDuration / 1.1;

      // Check if new duration is within limits
      if (newDuration < minZoomDuration || newDuration > maxZoomDuration) {
        return;
      }

      // Calculate the ratio of where currentTime is in the current range
      const ratio = (currentTime - start) / currentDuration;

      // Use this ratio to calculate new start and end times
      const newStart = Math.max(minTime, currentTime - ratio * newDuration);
      const newEnd = Math.min(maxTime, newStart + newDuration);

      onTimeRangeChange([newStart, newEnd]);
    },
    [timeRange, minTime, maxTime, minZoomDuration, maxZoomDuration, onTimeRangeChange, currentTime],
  );

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    element.addEventListener('wheel', handleWheel, { passive: false });
    return () => element.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  return (
    <div ref={containerRef} id="timelinebar-container" className="flex h-full items-end pb-3 pr-1">
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
