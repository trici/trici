import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AppEvent, IFocusSession, TriciAppEvent } from '@trici/models';
import { RendererRepository } from '../../../dataaccess/RendererRepository';

interface SessionTimelineProps {
  selectedSession: IFocusSession;
  currentTime?: number; // Current playback time in milliseconds
  onTimelineClick?: (time: number) => void; // Callback when timeline is clicked
}

interface IdleTimePoint {
  idleTime: number;
  timestamp: number;
}

// Interface for app usage region
interface AppRegion {
  appName: string;
  startTime: number;
  endTime: number;
}

export function SessionTimeline({ selectedSession, currentTime = 0, onTimelineClick }: SessionTimelineProps) {
  const timelineRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [timelineWidth, setTimelineWidth] = useState(0);
  const [hoveredEvent, setHoveredEvent] = useState<AppEvent | null>(null);
  const [pinnedEvent, setPinnedEvent] = useState<AppEvent | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [showEventMarkers, setShowEventMarkers] = useState(false);
  const [appRegions, setAppRegions] = useState<AppRegion[]>([]);
  const [showAppRegions, setShowAppRegions] = useState(true);
  const [hoveredAppRegion, setHoveredAppRegion] = useState<AppRegion | null>(null);
  const [eventFilters, setEventFilters] = useState<Record<string, boolean>>({});
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const filterDropdownRef = useRef<HTMLDivElement>(null);
  const renderRepository = RendererRepository.getInstance();

  // Fetch events for the selected session
  const sessionEventsQuery = useQuery({
    queryKey: ['sessionEvents', selectedSession?.id],
    queryFn: () =>
      selectedSession
        ? renderRepository.getEventsForSession(selectedSession.startTime, selectedSession.endTime)
        : Promise.resolve([]),
    enabled: !!selectedSession,
  });

  // Fetch idle time profile for the selected session
  const idleTimeProfileQuery = useQuery({
    queryKey: ['idleTimeProfile', selectedSession?.startTime],
    queryFn: () =>
      selectedSession ? renderRepository.getIdleTimeProfile(selectedSession.startTime) : Promise.resolve([]),
    enabled: !!selectedSession,
  });

  // Process app change events into regions
  useEffect(() => {
    if (sessionEventsQuery.data && selectedSession) {
      console.log('sessionEventsQuery.data', sessionEventsQuery.data);
      // Filter out frontmost app changed events
      const appChangeEvents = sessionEventsQuery.data.filter(
        event => event.type === TriciAppEvent.FRONTMOST_APP_CHANGED,
      );

      console.log('appChangeEvents', appChangeEvents);

      // Create regions from the events
      const regions: AppRegion[] = [];

      // First, try to get the initial frontmost app from session metadata
      let initialAppName: string | undefined;

      // Check if sessionStartMetadata exists and contains frontmost app info
      if (selectedSession.sessionStartMetadata && typeof selectedSession.sessionStartMetadata === 'object') {
        const metadata = selectedSession.sessionStartMetadata;

        // If no frontmostApp, check the appData field
        if ('appData' in metadata && metadata.appData && typeof metadata.appData === 'object') {
          const appData = metadata.appData as Record<string, unknown>;
          if ('appName' in appData && typeof appData.appName === 'string') {
            initialAppName = appData.appName;
          }
        }
      }

      let lastAppChange = initialAppName
        ? {
            appName: initialAppName,
            timestamp: selectedSession.startTime,
          }
        : null;

      if (appChangeEvents.length > 0) {
        // Process each app change event
        for (let i = 0; i < appChangeEvents.length; i++) {
          const currentEvent = appChangeEvents[i];
          const eventData = currentEvent.data[0];
          console.log('currentEvent', currentEvent);
          // Make sure we have valid data
          if (!eventData || typeof eventData !== 'object') continue;

          // Try to extract frontmost app data with proper type checking
          let appName: string | undefined;

          if (typeof eventData === 'object') {
            console.log('eventData', eventData);
            // Check if data has frontmostApp property
            if ('frontmostApp' in eventData && eventData.frontmostApp && typeof eventData.frontmostApp === 'object') {
              const frontmostApp = eventData.frontmostApp as Record<string, unknown>;
              if ('appName' in frontmostApp && typeof frontmostApp.appName === 'string') {
                appName = frontmostApp.appName;
              }
            }
          }

          console.log('appName', appName);

          if (!appName) continue;

          // Create region from last change to current change
          if (lastAppChange) {
            regions.push({
              appName: lastAppChange.appName,
              startTime: lastAppChange.timestamp,
              endTime: currentEvent.timestamp,
            });
          }

          // Update last app change
          lastAppChange = {
            appName,
            timestamp: currentEvent.timestamp,
          };
        }

        // Add the final region from the last app change to the end of the session
        if (lastAppChange) {
          regions.push({
            appName: lastAppChange.appName,
            startTime: lastAppChange.timestamp,
            endTime: selectedSession.endTime,
          });
        }
      }
      // If there are no app change events but we have initial app info,
      // create a single region for the entire session
      else if (initialAppName) {
        regions.push({
          appName: initialAppName,
          startTime: selectedSession.startTime,
          endTime: selectedSession.endTime,
        });
      }

      console.log('appRegions', regions);
      setAppRegions(regions);
    }
  }, [sessionEventsQuery.data, selectedSession]);

  // Update timeline width on resize
  useEffect(() => {
    const updateTimelineWidth = () => {
      if (timelineRef.current) {
        setTimelineWidth(timelineRef.current.clientWidth);
      }
    };

    updateTimelineWidth();
    window.addEventListener('resize', updateTimelineWidth);

    return () => {
      window.removeEventListener('resize', updateTimelineWidth);
    };
  }, []);

  // Add click outside handler to close pinned tooltip
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (tooltipRef.current && !tooltipRef.current.contains(event.target as Node) && pinnedEvent) {
        setPinnedEvent(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [pinnedEvent]);

  // Calculate session duration
  const sessionDuration = selectedSession ? selectedSession.endTime - selectedSession.startTime : 0;

  // Convert timestamp to position on timeline
  const getPositionFromTimestamp = (timestamp: number) => {
    if (!selectedSession || sessionDuration === 0) return 0;

    const relativeTime = timestamp - selectedSession.startTime;
    const position = (relativeTime / sessionDuration) * 100;

    return Math.max(0, Math.min(100, position)); // Clamp between 0-100%
  };

  // Handle timeline click
  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current || !onTimelineClick || sessionDuration === 0) return;

    const rect = timelineRef.current.getBoundingClientRect();
    const clickPosition = e.clientX - rect.left;
    const percentage = clickPosition / rect.width;
    const clickTime = selectedSession.startTime + percentage * sessionDuration;

    onTimelineClick(clickTime);
  };

  // Handle mouse enter on event marker
  const handleEventMouseEnter = (event: AppEvent, e: React.MouseEvent<HTMLDivElement>) => {
    if (!pinnedEvent) {
      setHoveredEvent(event);
      setTooltipPosition({ x: e.clientX, y: e.clientY });
    }
  };

  // Handle mouse leave on event marker
  const handleEventMouseLeave = () => {
    if (!pinnedEvent) {
      setHoveredEvent(null);
    }
  };

  // Handle event marker click to pin/unpin tooltip
  const handleEventClick = (event: AppEvent, e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation(); // Prevent timeline click from firing

    if (pinnedEvent && pinnedEvent.id === event.id) {
      setPinnedEvent(null);
    } else {
      setPinnedEvent(event);
      setHoveredEvent(null);
      setTooltipPosition({ x: e.clientX, y: e.clientY });
    }
  };

  // Close pinned tooltip
  const handleCloseTooltip = () => {
    setPinnedEvent(null);
  };

  // Generate a consistent color for an app based on its identifier
  const getAppColor = (appName: string) => {
    // List of pleasant colors for the app regions
    const colors = [
      'bg-blue-400',
      'bg-green-400',
      'bg-purple-400',
      'bg-yellow-400',
      'bg-red-400',
      'bg-indigo-400',
      'bg-pink-400',
      'bg-teal-400',
      'bg-orange-400',
      'bg-cyan-400',
      'bg-lime-400',
      'bg-emerald-400',
    ];

    // Generate a simple hash from the app identifier
    let hash = 0;
    for (let i = 0; i < appName.length; i++) {
      hash = appName.charCodeAt(i) + ((hash << 5) - hash);
    }

    // Get a color from the array based on the hash
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  };

  // Handle mouse enter on app region
  const handleAppRegionMouseEnter = (region: AppRegion) => {
    setHoveredAppRegion(region);
  };

  // Handle mouse leave on app region
  const handleAppRegionMouseLeave = () => {
    setHoveredAppRegion(null);
  };

  // Group events by type for color coding
  const getEventColor = (eventType: string) => {
    const colorMap: Record<string, string> = {
      // Focus session events
      [TriciAppEvent.FOCUS_SESSION_STARTED]: 'bg-green-600',
      [TriciAppEvent.FOCUS_SESSION_ENDED]: 'bg-red-600',

      // User state events
      [TriciAppEvent.USER_IDLE]: 'bg-yellow-500',
      [TriciAppEvent.USER_ACTIVE]: 'bg-green-500',
      [TriciAppEvent.USER_INACTIVE]: 'bg-gray-500',
      [TriciAppEvent.USER_GOING_INACTIVE]: 'bg-yellow-600',
      [TriciAppEvent.USER_HYPER_ACTIVE]: 'bg-purple-600',
      [TriciAppEvent.USER_BECOMING_HYPER_ACTIVE]: 'bg-purple-400',
      [TriciAppEvent.USER_CAME_BACK]: 'bg-blue-500',
      [TriciAppEvent.USER_WENT_AWAY]: 'bg-blue-700',

      // App events
      [TriciAppEvent.FRONTMOST_APP_CHANGED]: 'bg-indigo-500',
      [TriciAppEvent.SCREEN_RECORDING_PERMISSION_GRANTED]: 'bg-teal-500',

      // Work state events
      [TriciAppEvent.USER_STARTED_WORKING]: 'bg-emerald-600',
      [TriciAppEvent.USER_STOPPED_WORKING]: 'bg-rose-600',
      [TriciAppEvent.USER_MAY_BE_WORKING]: 'bg-emerald-300',

      // Sleep events
      [TriciAppEvent.APP_SLEEP_STARTED]: 'bg-blue-300',
      [TriciAppEvent.APP_SLEEP_ENDED]: 'bg-blue-400',

      // Default for unknown events
      [TriciAppEvent.NOT_SET]: 'bg-gray-400',
    };

    return colorMap[eventType] || 'bg-gray-500';
  };

  // Format event type for display
  const formatEventType = (eventType: string): string => {
    // Convert from kebab-case to readable format
    return eventType
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Format time for tooltip
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  // Format event data for display
  const formatEventData = (event: AppEvent) => {
    if (!event.data) return 'No data';

    try {
      if (typeof event.data === 'string') {
        return event.data;
      } else {
        return JSON.stringify(event.data, null, 2);
      }
    } catch (e) {
      return 'Error parsing data';
    }
  };

  // Normalize idle time values for visualization
  const normalizeIdleTime = (idleTime: number) => {
    // Assuming idle time is in milliseconds
    // Higher values mean less activity, so we invert the scale
    // 0 = completely idle, 1 = very active

    // Max idle time threshold (e.g., 5 seconds = 5000ms)
    const maxIdleTime = 5000;

    // Normalize and invert
    const normalizedValue = 1 - Math.min(idleTime / maxIdleTime, 1);

    return normalizedValue;
  };

  // Get color for idle time heatmap
  const getIdleTimeColor = (idleTime: number) => {
    // Use a single color for all activity levels
    return 'bg-blue-500';
  };

  // Get height for idle time visualization
  const getIdleTimeHeight = (idleTime: number) => {
    const activity = normalizeIdleTime(idleTime);

    // Height as percentage of container height
    // More active = taller bar, less active = shorter bar
    const heightPercent = 5 + activity * 95; // Min 5%, max 100%

    return `${heightPercent}%`;
  };

  // Estimate data size to adjust tooltip height
  const getDataSize = (event: AppEvent): 'small' | 'medium' | 'large' => {
    if (!event.data) return 'small';

    const dataStr = typeof event.data === 'string' ? event.data : JSON.stringify(event.data);
    const length = dataStr.length;

    if (length < 100) return 'small';
    if (length < 500) return 'medium';
    return 'large';
  };

  // Get tooltip max height based on data size
  const getTooltipMaxHeight = (event: AppEvent): string => {
    const size = getDataSize(event);
    switch (size) {
      case 'small':
        return 'max-h-32';
      case 'medium':
        return 'max-h-64';
      case 'large':
        return 'max-h-96';
    }
  };

  // Initialize event filters when event data is loaded
  useEffect(() => {
    if (sessionEventsQuery.data) {
      // Get unique event types
      const eventTypes = Array.from(new Set(sessionEventsQuery.data.map(event => event.type)));

      // Set initial filters - all enabled by default
      const initialFilters: Record<string, boolean> = {};
      eventTypes.forEach(type => {
        // By default only show FRONTMOST_APP_CHANGED
        initialFilters[type] = type === TriciAppEvent.FRONTMOST_APP_CHANGED;
      });

      setEventFilters(initialFilters);
    }
  }, [sessionEventsQuery.data]);

  // Add click outside handler to close filter dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        filterDropdownRef.current &&
        !filterDropdownRef.current.contains(event.target as Node) &&
        showFilterDropdown
      ) {
        setShowFilterDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showFilterDropdown]);

  // Toggle specific event filter
  const toggleEventFilter = (eventType: string) => {
    setEventFilters(prev => ({
      ...prev,
      [eventType]: !prev[eventType],
    }));
  };

  // Toggle all event filters on or off
  const toggleAllEventFilters = (value: boolean) => {
    const updatedFilters: Record<string, boolean> = {};
    Object.keys(eventFilters).forEach(key => {
      updatedFilters[key] = value;
    });
    setEventFilters(updatedFilters);
  };

  // Get filtered events
  const getFilteredEvents = () => {
    if (!sessionEventsQuery.data) return [];

    return sessionEventsQuery.data.filter(event => eventFilters[event.type]);
  };

  // Get count of active filters
  const getActiveFilterCount = () => {
    return Object.values(eventFilters).filter(value => value).length;
  };

  if (sessionEventsQuery.isLoading || idleTimeProfileQuery.isLoading) {
    return <div className="flex h-full w-full items-center justify-center">Loading...</div>;
  }

  if (sessionEventsQuery.error) {
    return <div className="text-red-500">Error loading events: {sessionEventsQuery.error.toString()}</div>;
  }

  if (idleTimeProfileQuery.error) {
    return <div className="text-red-500">Error loading idle time profile: {idleTimeProfileQuery.error.toString()}</div>;
  }

  // Determine which event to show in tooltip
  const displayEvent = pinnedEvent || hoveredEvent;
  const filteredEvents = getFilteredEvents();

  return (
    <div className="flex h-full w-full flex-col">
      <div className="mb-2 flex items-center justify-between rounded-md bg-gray-100 p-2 shadow-sm">
        <h3 className="text-sm font-medium text-gray-700">Session Timeline</h3>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAppRegions(!showAppRegions)}
            className="flex items-center rounded-md border border-gray-200 bg-white px-2 py-1 text-xs text-gray-600 hover:bg-gray-50"
            title={showAppRegions ? 'Hide app regions' : 'Show app regions'}
          >
            <span className="mr-1">{showAppRegions ? 'Hide' : 'Show'} apps</span>
            <div className={`h-2 w-2 rounded-full ${showAppRegions ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
          </button>

          <div className="relative">
            <button
              onClick={() => setShowEventMarkers(!showEventMarkers)}
              className="flex items-center rounded-md border border-gray-200 bg-white px-2 py-1 text-xs text-gray-600 hover:bg-gray-50"
              title={showEventMarkers ? 'Hide event markers' : 'Show event markers'}
            >
              <span className="mr-1">
                {showEventMarkers ? 'Hide' : 'Show'} events
                {showEventMarkers && getActiveFilterCount() > 0 && (
                  <span className="ml-1 rounded-full bg-blue-100 px-1 text-xs text-blue-800">
                    {getActiveFilterCount()}
                  </span>
                )}
              </span>
              <div className={`h-2 w-2 rounded-full ${showEventMarkers ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
            </button>

            {/* Filter button only visible when events are shown */}
            {showEventMarkers && (
              <button
                onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                className="ml-1 flex items-center rounded-md border border-gray-200 bg-white px-2 py-1 text-xs text-gray-600 hover:bg-gray-50"
                title="Filter events"
              >
                <span className="mr-1">Filter</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-3 w-3"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            )}

            {/* Event filter dropdown */}
            {showFilterDropdown && showEventMarkers && (
              <div
                ref={filterDropdownRef}
                className="absolute bottom-full right-0 z-50 mb-1 w-56 divide-y divide-gray-100 rounded-md border border-gray-200 bg-white shadow-lg"
              >
                <div className="p-2">
                  <div className="mb-2 flex items-center justify-between border-b border-gray-100 pb-1">
                    <h4 className="text-xs font-medium text-gray-700">Filter Events</h4>
                    <div className="flex gap-1">
                      <button
                        onClick={() => toggleAllEventFilters(true)}
                        className="rounded text-xs text-blue-600 hover:text-blue-800"
                      >
                        All
                      </button>
                      <span className="text-gray-300">|</span>
                      <button
                        onClick={() => toggleAllEventFilters(false)}
                        className="rounded text-xs text-blue-600 hover:text-blue-800"
                      >
                        None
                      </button>
                    </div>
                  </div>

                  <div className="max-h-60 overflow-y-auto">
                    {Object.keys(eventFilters).map(eventType => (
                      <div key={eventType} className="flex items-center py-1">
                        <input
                          type="checkbox"
                          id={`filter-${eventType}`}
                          checked={eventFilters[eventType]}
                          onChange={() => toggleEventFilter(eventType)}
                          className="h-3 w-3 rounded border-gray-300 text-blue-600"
                        />
                        <label htmlFor={`filter-${eventType}`} className="ml-2 flex items-center text-xs text-gray-700">
                          <div className={`mr-1 h-2 w-2 rounded-full ${getEventColor(eventType)}`} />
                          {formatEventType(eventType)}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div
        ref={timelineRef}
        className="relative h-10 cursor-pointer overflow-hidden rounded-lg bg-gray-200 shadow-inner"
        onClick={handleTimelineClick}
      >
        {/* App regions visualization */}
        {showAppRegions && appRegions.length > 0 && (
          <div className="absolute left-0 top-0 z-10 h-full w-full">
            {appRegions.map((region, index) => {
              const startPosition = getPositionFromTimestamp(region.startTime);
              const endPosition = getPositionFromTimestamp(region.endTime);
              const width = endPosition - startPosition;

              return (
                <div
                  key={`app-region-${index}`}
                  className={`absolute top-0 h-full ${getAppColor(region.appName)} opacity-60 transition-opacity hover:opacity-80`}
                  style={{
                    left: `${startPosition}%`,
                    width: `${Math.max(0.5, width)}%`,
                    borderLeft: index > 0 ? '1px solid rgba(255,255,255,0.7)' : 'none',
                  }}
                  title={`${region.appName} (${formatTime(region.startTime)} - ${formatTime(region.endTime)})`}
                  onMouseEnter={() => handleAppRegionMouseEnter(region)}
                  onMouseLeave={handleAppRegionMouseLeave}
                >
                  {width > 5 && (
                    <div className="absolute left-1 top-1 max-w-full overflow-hidden text-ellipsis whitespace-nowrap text-xs font-medium text-gray-800">
                      {region.appName}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Idle time profile visualization */}
        <div className="absolute bottom-0 left-0 h-5 w-full">
          {idleTimeProfileQuery.data && idleTimeProfileQuery.data.length > 0 && (
            <div className="relative h-full w-full">
              {idleTimeProfileQuery.data.map((point, index) => {
                const position = getPositionFromTimestamp(point.timestamp);
                const width =
                  index < idleTimeProfileQuery.data.length - 1
                    ? getPositionFromTimestamp(idleTimeProfileQuery.data[index + 1].timestamp) - position
                    : 100 - position;

                return (
                  <div
                    key={index}
                    className={`absolute bottom-0 ${getIdleTimeColor(point.idleTime)} opacity-70`}
                    style={{
                      left: `${position}%`,
                      width: `${Math.max(0.1, width)}%`,
                      height: getIdleTimeHeight(point.idleTime),
                    }}
                  />
                );
              })}
            </div>
          )}
        </div>

        {/* Current time indicator */}
        {currentTime ? (
          <div
            className="absolute top-0 z-30 h-full w-1 cursor-move bg-gray-400"
            style={{ left: `${getPositionFromTimestamp(currentTime)}%` }}
            title={`Current position: ${formatTime(currentTime)} (${(
              ((currentTime - selectedSession.startTime) / (selectedSession.endTime - selectedSession.startTime)) *
              100
            ).toFixed(1)}%)`}
          ></div>
        ) : (
          <div className="absolute left-0 top-0 text-xs text-gray-500">Waiting for playback...</div>
        )}

        {/* Video progress bar */}
        {currentTime && (
          <div
            className="absolute bottom-0 left-0 h-1 bg-blue-400 opacity-30"
            style={{
              width: `${getPositionFromTimestamp(currentTime)}%`,
              zIndex: 5,
            }}
          />
        )}

        {/* Event markers - now using filtered events */}
        {showEventMarkers &&
          filteredEvents.map((event, index) => (
            <div
              key={`${event.id || index}`}
              className={`absolute top-0 h-full w-1 ${getEventColor(event.type)} z-20 opacity-70 transition-all hover:w-1.5 hover:opacity-100 ${
                pinnedEvent && pinnedEvent.id === event.id ? 'w-2 opacity-100 ring-2 ring-white' : ''
              }`}
              style={{ left: `${getPositionFromTimestamp(event.timestamp)}%` }}
              onMouseEnter={e => handleEventMouseEnter(event, e)}
              onMouseLeave={handleEventMouseLeave}
              onClick={e => handleEventClick(event, e)}
            />
          ))}

        {/* Time labels */}
        <div className="absolute bottom-1 left-1 rounded bg-gray-100 px-1 text-xs font-medium text-gray-700">
          {formatTime(selectedSession.startTime)}
        </div>
        <div className="absolute bottom-1 right-1 rounded bg-gray-100 px-1 text-xs font-medium text-gray-700">
          {formatTime(selectedSession.endTime)}
        </div>
      </div>

      {/* Hovered app region tooltip */}
      {hoveredAppRegion && !displayEvent && (
        <div className="mt-1 text-xs text-gray-600">
          <span className="font-medium">{hoveredAppRegion.appName}</span>
          <span className="mx-1">•</span>
          <span>
            {formatTime(hoveredAppRegion.startTime)} - {formatTime(hoveredAppRegion.endTime)}
          </span>
          <span className="mx-1">•</span>
          <span>
            Duration: {Math.round((hoveredAppRegion.endTime - hoveredAppRegion.startTime) / 1000 / 60)} minutes
          </span>
        </div>
      )}

      {/* Event tooltip */}
      {showEventMarkers && displayEvent && (
        <div
          ref={tooltipRef}
          className={`fixed z-50 rounded bg-gray-800 p-3 text-white shadow-lg ${
            pinnedEvent ? 'min-w-[300px] max-w-xl' : 'max-w-md'
          }`}
          style={{
            left: `${tooltipPosition.x + 10}px`,
            top: `${tooltipPosition.y - 10}px`,
            transform: 'translateY(-100%)',
          }}
        >
          <div className="flex items-center justify-between">
            <div className="mb-1 font-bold">{displayEvent.type}</div>
            {pinnedEvent && (
              <button
                onClick={handleCloseTooltip}
                className="ml-2 rounded-full bg-gray-700 p-1 text-xs text-gray-300 hover:bg-gray-600 hover:text-white"
              >
                ✕
              </button>
            )}
          </div>
          <div className="mb-2 text-xs text-gray-300">{formatTime(displayEvent.timestamp)}</div>
          {displayEvent.data && (
            <div className="mt-1">
              <div className="text-xs font-semibold text-gray-300">
                Data: {!pinnedEvent && <span className="ml-2 italic text-gray-400">(Click event to pin)</span>}
              </div>
              <pre
                className={`mt-1 overflow-auto rounded bg-gray-700 p-2 text-xs ${getTooltipMaxHeight(displayEvent)}`}
              >
                {formatEventData(displayEvent)}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* Activity legend with event legend if events are shown */}
      <div className="mt-2 flex flex-wrap gap-3">
        {/* App regions legend - only show if app regions are visible */}
        {showAppRegions && appRegions.length > 0 && (
          <div className="flex flex-wrap gap-2 rounded-md border border-gray-200 bg-white px-3 py-1 shadow-sm">
            <span className="mr-1 text-xs font-medium text-gray-700">Apps:</span>
            {appRegions
              .filter(
                (region, index, self) =>
                  // Unique apps only
                  index === self.findIndex(r => r.appName === region.appName),
              )
              .map(region => (
                <div key={region.appName} className="flex items-center">
                  <div className={`h-3 w-3 rounded-full ${getAppColor(region.appName)} mr-1`} />
                  <span className="text-xs">{region.appName}</span>
                </div>
              ))}
          </div>
        )}

        {/* Event legend - now showing only filtered event types */}
        {showEventMarkers && filteredEvents.length > 0 && (
          <div className="flex flex-wrap gap-2 rounded-md border border-gray-200 bg-white px-3 py-1 shadow-sm">
            {Array.from(new Set(filteredEvents.map(event => event.type))).map(eventType => (
              <div key={eventType} className="flex items-center">
                <div className={`h-3 w-3 rounded-full ${getEventColor(eventType)} mr-1`} />
                <span className="text-xs">{formatEventType(eventType)}</span>
              </div>
            ))}
          </div>
        )}

        {/* Activity legend */}
        <div className="flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-1 shadow-sm">
          <span className="text-xs font-medium text-gray-700">Activity:</span>
          <div className="flex items-center">
            <div className="mr-1 h-5 w-2 bg-blue-500" />
            <span className="text-xs">Height shows activity level</span>
          </div>
        </div>
      </div>
    </div>
  );
}
