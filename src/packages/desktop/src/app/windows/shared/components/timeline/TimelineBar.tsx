import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

interface TimelineBarProps {
  timeInterval: [number, number];
  currentTime: number;
  onZoom: (newDomain: [number, number]) => void;
  onTimeChange: (newTime: number) => void;
  minTime?: number;
  maxTime?: number;
}

const MIN_ZOOM_DURATION = 5 * 60 * 1000; // 5 minutes
const MAX_ZOOM_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export const TimelineBar: React.FC<TimelineBarProps> = ({
  timeInterval,
  currentTime,
  onZoom,
  onTimeChange,
  minTime = Date.now() - 24 * 60 * 60 * 1000,
  maxTime = Date.now(),
}) => {
  const timelineRef = useRef<SVGSVGElement>(null);
  const scaleRef = useRef<d3.ScaleTime<number, number, never> | null>(null);
  const [isScaleReady, setIsScaleReady] = useState(false);
  const isDraggingRef = useRef(false);

  useEffect(() => {
    console.log('useEffect');
    const svg = d3.select(timelineRef.current);
    const [startTime, endTime] = timeInterval;

    // Create the time scale
    const scale = d3
      .scaleTime()
      .domain([startTime, endTime]) // Time interval
      .range([0, 100]); // Range as percentage (0% to 100%)

    console.log(scale);

    scaleRef.current = scale;
    setIsScaleReady(true);

    // Initialize zoom behavior
    const zoomBehavior = d3
      .zoom()
      .scaleExtent([0.5, 24]) // Min and max zoom levels
      .translateExtent([
        [0, 0],
        [100, 0],
      ]) // Restrict translation
      .on('zoom', handleZoom);

    svg.call(zoomBehavior as any);

    return () => {
      svg.on('.zoom', null); // Clean up zoom handlers
    };
  }, [timeInterval]);

  const handleZoom = (event: any) => {
    const newDomain = event.transform.rescaleX(scaleRef.current).domain();
    if (onZoom) {
      onZoom(newDomain);
    }
  };

  // Calculate marker position
  const calculateMarkerPosition = () => {
    const scale = scaleRef.current;
    console.log(scale);
    console.log(currentTime);
    console.log(scale ? scale(currentTime) : 0);
    return scale ? scale(currentTime) : 0;
  };

  const markerPosition = isScaleReady ? calculateMarkerPosition() : 0;

  const handleMarkerMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingRef.current = true;
    document.addEventListener('mousemove', handleMarkerDrag);
    document.addEventListener('mouseup', handleMarkerMouseUp);
  };

  const handleMarkerDrag = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isDraggingRef.current || !timelineRef.current || !scaleRef.current) return;

    const svg = timelineRef.current;
    const rect = svg.getBoundingClientRect();

    // Constrain the clientX to the SVG bounds
    const x = Math.max(rect.left, Math.min(rect.right, e.clientX));
    // Constrain percentage between 0 and 100
    const percentage = Math.max(0, Math.min(100, ((x - rect.left) / rect.width) * 100));

    // Convert percentage back to time
    const time = scaleRef.current.invert(percentage);
    onTimeChange(time.getTime());
  };

  const handleMarkerMouseUp = (e: MouseEvent) => {
    e.preventDefault();
    isDraggingRef.current = false;
    document.removeEventListener('mousemove', handleMarkerDrag);
    document.removeEventListener('mouseup', handleMarkerMouseUp);
  };

  const handleWheel = (e: WheelEvent) => {
    console.log('handleWheel');
    if (!e.ctrlKey) return;
    e.preventDefault();

    const [start, end] = timeInterval;
    const duration = end - start;
    const center = start + duration / 2;

    // Zoom factor: negative deltaY means zoom in
    const factor = e.deltaY > 0 ? 1.1 : 0.9;

    // Calculate new duration
    const newDuration = Math.min(Math.max(duration * factor, MIN_ZOOM_DURATION), MAX_ZOOM_DURATION);

    // Calculate new start and end times
    const newStart = Math.max(minTime, center - newDuration / 2);
    const newEnd = Math.min(maxTime, newStart + newDuration);

    onZoom([newStart, newEnd]);
  };

  useEffect(() => {
    const element = timelineRef.current;
    if (!element) return;

    element.addEventListener('wheel', handleWheel, { passive: false });
    return () => element.removeEventListener('wheel', handleWheel);
  }, [timeInterval]);

  return (
    <div className="relative w-full">
      <div className="pr-1">
        <svg ref={timelineRef} className="h-1 w-full bg-gray-200">
          {/* Timeline background */}
        </svg>
        <div
          className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 transform cursor-pointer rounded-full bg-gray-200 shadow-md"
          style={{
            left: `${Math.max(1.5, Math.min(99.5, markerPosition))}%`,
          }}
          onMouseDown={handleMarkerMouseDown}
        />
      </div>
    </div>
  );
};
