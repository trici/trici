import { DataGrid } from '@singhshashi/proactive';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AppEvent, TriciAppEvent } from '@trici/models';
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { RendererRepository } from 'src/app/dataaccess/RendererRepository';
import { ScatterChart, Scatter, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceArea } from 'recharts';

interface EventViewerContainerState {
  events: AppEvent[];
  day: number;
  from: number;
  to: number;
  type: TriciAppEvent | null;
}

interface AppRegion {
  appName: string;
  startTime: number;
  endTime: number;
}

// const bridgeApi: IBridgeAPIInterface = window.bridgeApi;

const renderRepository = RendererRepository.getInstance();

// Helper functions
const formatJsonData = (data: any) => {
  try {
    const parsed = typeof data === 'string' ? JSON.parse(data) : data;
    return JSON.stringify(parsed, null, 2);
  } catch (e) {
    return JSON.stringify(data);
  }
};

const getTimeRangeValue = (from: number, to: number): string => {
  const diff = to - from;
  const minutes = diff / (60 * 1000);

  if (minutes === 15) return '15m';
  if (minutes === 30) return '30m';
  if (minutes === 60) return '1h';
  if (minutes === 120) return '2h';
  if (minutes === 360) return '6h';
  if (minutes === 720) return '12h';
  return '1h'; // default
};

const getAppColor = (appName: string) => {
  let hash = 0;
  for (let i = 0; i < appName.length; i++) {
    hash = appName.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash % 360);
  return `hsla(${hue}, 70%, 50%, 0.2)`;
};

const abbreviateEventName = (eventName: string): string => {
  // Normalize to lower case and replace underscores with dashes
  const normalized = eventName.replace(/_/g, '-').toLowerCase();
  // Split on dashes, take first letter of each word, join with dashes
  return normalized
    .split('-')
    .filter(Boolean)
    .map(word => word[0])
    .join('-');
};

// Helper to generate X axis ticks including start and end
const getXAxisTicks = (from: number, to: number, count: number = 6) => {
  if (to <= from) return [from, to];
  const step = (to - from) / (count - 1);
  const ticks = [];
  for (let i = 0; i < count; i++) {
    ticks.push(Math.round(from + i * step));
  }
  // Ensure exact start and end
  ticks[0] = from;
  ticks[ticks.length - 1] = to;
  return ticks;
};

export function EventViewerContainer() {
  const [state, setState] = useState<EventViewerContainerState>({
    events: [],
    // get the timestamp of the beginning of the day
    day: new Date().setHours(0, 0, 0, 0),
    from: new Date().getTime() - 60 * 60 * 1000, // 1 hour ago
    to: new Date().getTime(), // current time
    type: null,
  });

  // For region hover tooltip
  const [hoveredRegion, setHoveredRegion] = useState<null | {
    appName: string;
    startTime: number;
    endTime: number;
    mouseX: number;
    mouseY: number;
  }>(null);
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    console.log('EventViewer state changed:', state);
  }, [state]);

  const eventViewerQuery = useQuery<AppEvent[]>({
    queryKey: ['eventViewer', state.type, state.from, state.to],
    queryFn: () => renderRepository.getEvents(state.from, state.to, state.type),
  });

  // Process events into regions and scatter data
  const { appRegions, nonFrontmostAppEvents, eventTypes, typeToYPosition } = useMemo(() => {
    const events = eventViewerQuery.data || [];
    const regions: AppRegion[] = [];
    const frontmostAppEvents = events.filter(event => event.type === TriciAppEvent.FRONTMOST_APP_CHANGED);
    const nonFrontmostAppEvents = events.filter(event => event.type !== TriciAppEvent.FRONTMOST_APP_CHANGED);
    const eventTypes = [...new Set(nonFrontmostAppEvents.map(event => event.type))];
    const typeToYPosition = Object.fromEntries(eventTypes.map((type, index) => [type, index * 2 + 1])); // Multiply by 2 to create more space between events

    if (frontmostAppEvents.length > 0) {
      let lastAppChange: { appName: string; timestamp: number } | null = null;

      frontmostAppEvents.forEach((event, index) => {
        const eventData = event.data[0];
        console.log('Processing frontmost app event:', eventData); // Debug log

        if (!eventData || typeof eventData !== 'object') {
          console.log('Invalid event data:', eventData);
          return;
        }

        let appName: string | undefined;

        // Try to get app name from different possible data structures
        if (typeof eventData === 'object') {
          if ('frontmostApp' in eventData && eventData.frontmostApp && typeof eventData.frontmostApp === 'object') {
            appName = eventData.frontmostApp.appName;
          } else if ('appName' in eventData && typeof eventData.appName === 'string') {
            appName = eventData.appName;
          }
        }

        console.log('Extracted app name:', appName); // Debug log

        if (!appName) {
          console.log('Could not extract app name from event:', event);
          return;
        }

        if (lastAppChange) {
          regions.push({
            appName: lastAppChange.appName,
            startTime: lastAppChange.timestamp,
            endTime: event.timestamp,
          });
        }

        lastAppChange = {
          appName,
          timestamp: event.timestamp,
        };

        // For the last event, create a region until state.to
        if (index === frontmostAppEvents.length - 1) {
          regions.push({
            appName,
            startTime: event.timestamp,
            endTime: state.to,
          });
        }
      });
    }

    console.log('Generated regions:', regions); // Debug log

    return { appRegions: regions, nonFrontmostAppEvents, eventTypes, typeToYPosition };
  }, [eventViewerQuery.data, state.to]);

  const eventColors = useMemo(
    () =>
      Object.fromEntries(
        Object.values(TriciAppEvent).map((type, index) => [
          type,
          [`#1f77b4`, `#ff7f0e`, `#2ca02c`, `#d62728`, `#9467bd`, `#8c564b`][index % 6],
        ]),
      ),
    [],
  );

  const prepareChartData = (events: AppEvent[]) => {
    return events.map(event => ({
      timestamp: event.timestamp,
      type: event.type,
      y: typeToYPosition[event.type],
    }));
  };

  // Build a legend for app regions
  const appRegionLegend = useMemo(() => {
    // Unique app names in regions
    const uniqueApps = Array.from(new Set(appRegions.map(r => r.appName)));
    return uniqueApps.map(appName => (
      <div key={appName} className="mr-4 flex items-center gap-2">
        <span
          style={{
            background: getAppColor(appName),
            width: 16,
            height: 16,
            display: 'inline-block',
            borderRadius: 3,
            border: '1px solid #ccc',
          }}
        />
        <span className="text-xs text-gray-700">{appName}</span>
      </div>
    ));
  }, [appRegions]);

  // Build a legend for event types
  const eventTypeLegend = useMemo(() => {
    return eventTypes.map(eventType => (
      <div key={eventType} className="mr-4 flex items-center gap-2">
        <span
          style={{
            background: eventColors[eventType],
            width: 16,
            height: 16,
            display: 'inline-block',
            borderRadius: 3,
            border: '1px solid #ccc',
          }}
        />
        <span className="text-xs text-gray-700">{eventType}</span>
        <span className="text-xs text-gray-400">({abbreviateEventName(eventType)})</span>
      </div>
    ));
  }, [eventTypes, eventColors]);

  if (eventViewerQuery.isLoading) {
    return <div>Loading...</div>;
  }

  if (eventViewerQuery.error) {
    return <div>Error: {eventViewerQuery.error.toString()}</div>;
  }

  const allEventTypes = Object.values(TriciAppEvent);
  console.log('eventViewerQuery', eventViewerQuery);

  // Check if there is any data in the selected range
  const hasAnyData = (eventViewerQuery.data ?? []).length > 0;

  return (
    <div className="flex h-full flex-col justify-start gap-2">
      <div className="bg-gray-50 p-2">
        <div className="flex flex-row items-center gap-2 text-sm">
          <div className="w-[100px] font-medium">Filters:</div>
          <div className="w-[300px]">
            <label htmlFor="eventTypeFilter" className="mb-1 block text-sm text-gray-700">
              Event Type
            </label>
            <select
              id="eventTypeFilter"
              aria-label="Event Type Filter"
              className="w-full rounded border border-gray-300 px-2 py-1"
              value={state.type || 'ALL'}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                setState({
                  ...state,
                  type: e.target.value === 'ALL' ? null : (e.target.value as TriciAppEvent),
                });
              }}
            >
              <option value="ALL">ALL</option>
              {allEventTypes.map((type: TriciAppEvent) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
          <div className="w-[300px]">
            <label htmlFor="timeRangeFilter" className="mb-1 block text-sm text-gray-700">
              Time Range
            </label>
            <select
              id="timeRangeFilter"
              aria-label="Time Range Filter"
              className="w-full rounded border border-gray-300 px-2 py-1"
              value={getTimeRangeValue(state.from, state.to)}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                const now = new Date().getTime();
                const value = e.target.value;
                let timeInMillis;

                switch (value) {
                  case '15m':
                    timeInMillis = 15 * 60 * 1000;
                    break;
                  case '30m':
                    timeInMillis = 30 * 60 * 1000;
                    break;
                  case '1h':
                    timeInMillis = 60 * 60 * 1000;
                    break;
                  case '2h':
                    timeInMillis = 2 * 60 * 60 * 1000;
                    break;
                  case '6h':
                    timeInMillis = 6 * 60 * 60 * 1000;
                    break;
                  case '12h':
                    timeInMillis = 12 * 60 * 60 * 1000;
                    break;
                  default:
                    timeInMillis = 60 * 60 * 1000; // default to 1 hour
                }

                setState({
                  ...state,
                  from: now - timeInMillis,
                  to: now,
                });
              }}
            >
              <option value="15m">Last 15 mins</option>
              <option value="30m">Last 30 mins</option>
              <option value="1h">Last 1 hour</option>
              <option value="2h">Last 2 hours</option>
              <option value="6h">Last 6 hours</option>
              <option value="12h">Last 12 hours</option>
            </select>
          </div>
        </div>
      </div>

      {/* App Region Legend */}
      {appRegions.length > 0 && (
        <div className="flex flex-row items-center gap-4 border-b border-gray-100 bg-white px-4 py-1">
          <span className="text-xs font-medium text-gray-500">App Regions:</span>
          {appRegionLegend}
        </div>
      )}

      {/* Event Type Legend */}
      {eventTypes.length > 0 && (
        <div className="flex flex-row items-center gap-4 border-b border-gray-100 bg-white px-4 py-1">
          <span className="text-xs font-medium text-gray-500">Event Types:</span>
          {eventTypeLegend}
        </div>
      )}

      {/* Chart Section */}
      <div className="relative h-[300px] w-full bg-white p-4" ref={chartRef}>
        {hasAnyData ? (
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart
              margin={{
                top: 30,
                right: 30,
                left: 100,
                bottom: 20,
              }}
              onMouseMove={e => {
                if (!e) return;
                const activeLabel = typeof e.activeLabel === 'number' ? e.activeLabel : undefined;
                const mouseX = typeof e.chartX === 'number' ? e.chartX : 0;
                const mouseY = typeof e.chartY === 'number' ? e.chartY : 0;
                if (activeLabel !== undefined && appRegions.length > 0) {
                  // Find region under mouse
                  const region = appRegions.find(r => activeLabel >= r.startTime && activeLabel <= r.endTime);
                  if (region) {
                    setHoveredRegion({ ...region, mouseX, mouseY });
                  } else {
                    setHoveredRegion(null);
                  }
                } else {
                  setHoveredRegion(null);
                }
              }}
              onMouseLeave={() => setHoveredRegion(null)}
            >
              <XAxis
                dataKey="timestamp"
                type="number"
                domain={[state.from, state.to]}
                tickFormatter={unixTime => new Date(unixTime).toLocaleTimeString()}
                name="Time"
                scale="time"
                ticks={getXAxisTicks(state.from, state.to, 6)}
              />
              <YAxis
                type="number"
                dataKey="y"
                name="Event Type"
                domain={[0, Math.max(...Object.values(typeToYPosition)) + 1]}
                ticks={Object.values(typeToYPosition)}
                tickFormatter={value => {
                  const type = Object.entries(typeToYPosition).find(([_, y]) => y === value)?.[0] || '';
                  return abbreviateEventName(type);
                }}
                width={80}
              />
              <Tooltip
                cursor={{ strokeDasharray: '3 3' }}
                content={({ payload }) => {
                  if (payload && payload.length > 0) {
                    const data = payload[0].payload;
                    if (data.type) {
                      return (
                        <div className="rounded border bg-white p-2 shadow">
                          <p className="text-sm">Type: {data.type}</p>
                          <p className="text-sm">Time: {new Date(data.timestamp).toLocaleString()}</p>
                        </div>
                      );
                    }
                  }
                  return null;
                }}
              />
              {/* Render app regions */}
              {appRegions.map((region, index) => (
                <ReferenceArea
                  key={`${region.appName}-${index}`}
                  x1={region.startTime}
                  x2={region.endTime}
                  y1={0}
                  y2={Math.max(...Object.values(typeToYPosition)) + 1}
                  fill={getAppColor(region.appName)}
                  fillOpacity={0.3}
                />
              ))}
              {/* Render other events as scatter points */}
              {eventTypes.map(eventType => (
                <Scatter
                  key={eventType}
                  name={eventType}
                  data={prepareChartData(nonFrontmostAppEvents).filter(event => event.type === eventType)}
                  fill={eventColors[eventType]}
                />
              ))}
            </ScatterChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full w-full items-center justify-center text-lg text-gray-400">
            No data for this period
          </div>
        )}
        {/* Custom region tooltip */}
        {hoveredRegion && (
          <div
            className="pointer-events-none absolute z-50 rounded border border-gray-300 bg-white px-3 py-2 text-xs text-gray-800 shadow"
            style={{
              left: hoveredRegion.mouseX + 10,
              top: hoveredRegion.mouseY - 10,
              minWidth: 120,
            }}
          >
            <div className="font-semibold">{hoveredRegion.appName}</div>
            <div>
              {new Date(hoveredRegion.startTime).toLocaleTimeString()} -{' '}
              {new Date(hoveredRegion.endTime).toLocaleTimeString()}
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-hidden">
        <DataGrid
          showAddRemoveButtons={false}
          header={() => (
            <div className="flex flex-row gap-4 bg-gray-100 px-4 py-2 font-medium">
              <div className="w-[200px] truncate">Type</div>
              <div className="w-[100px] truncate">Timestamp</div>
              {/* <div className="w-[100px] truncate">Date</div> */}
              <div className="flex-1">Data</div>
            </div>
          )}
          items={eventViewerQuery.data ?? []}
          itemTemplate={(item: AppEvent) => {
            const date = new Date(item.timestamp).toLocaleDateString();
            const formattedData = item.data.map((p: any, index: number) => (
              <pre key={index} className="whitespace-pre-wrap font-mono text-xs">
                {formatJsonData(p)}
              </pre>
            ));

            return (
              <div className="flex flex-row gap-4 border-b border-gray-100 px-4 py-2 text-sm hover:bg-gray-50">
                <div className="w-[200px] truncate">{item.type}</div>
                <div className="w-[150px] truncate">{item.timestamp}</div>
                {/* <div className="w-[100px] truncate">{date}</div> */}
                <div className="flex-1 overflow-x-auto">{formattedData}</div>
              </div>
            );
          }}
          dataGridLabel=""
          maxHeight="50vh"
        />
      </div>
    </div>
  );
}
