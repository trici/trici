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

function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
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
    <div ref={containerRef} id="timelinebar-container" className="flex h-full flex-col">
      <div className="flex-grow items-end pb-1 pr-1">
        <TimelineBar
          timeInterval={timeRange}
          currentTime={currentTime}
          onZoom={onTimeRangeChange}
          onTimeChange={onCurrentTimeChange}
          minTime={minTime}
          maxTime={maxTime}
        />
      </div>
      <div className="flex justify-between px-1 pb-2 text-xs">
        <span>{formatTime(timeRange[0])}</span>
        <span>{formatTime(timeRange[1])}</span>
      </div>
    </div>
  );
}
