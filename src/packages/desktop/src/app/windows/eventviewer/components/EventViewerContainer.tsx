import { DataGrid } from '@singhshashi/proactive';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AppEvent, TriciAppEvent } from '@trici/models';
import React, { useState, useEffect, useMemo } from 'react';
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

export function EventViewerContainer() {
  const [state, setState] = useState<EventViewerContainerState>({
    events: [],
    // get the timestamp of the beginning of the day
    day: new Date().setHours(0, 0, 0, 0),
    from: new Date().getTime() - 60 * 60 * 1000, // 1 hour ago
    to: new Date().getTime(), // current time
    type: null,
  });

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

  if (eventViewerQuery.isLoading) {
    return <div>Loading...</div>;
  }

  if (eventViewerQuery.error) {
    return <div>Error: {eventViewerQuery.error.toString()}</div>;
  }

  const allEventTypes = Object.values(TriciAppEvent);
  console.log('eventViewerQuery', eventViewerQuery);

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

      {/* Chart Section */}
      <div className="h-[300px] w-full bg-white p-4">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart
            margin={{
              top: 30, // Increased top margin for app names
              right: 30,
              left: 100,
              bottom: 0,
            }}
          >
            <XAxis
              dataKey="timestamp"
              type="number"
              domain={['dataMin', 'dataMax']}
              tickFormatter={unixTime => new Date(unixTime).toLocaleTimeString()}
              name="Time"
            />
            <YAxis
              type="number"
              dataKey="y"
              name="Event Type"
              domain={[0, Math.max(...Object.values(typeToYPosition)) + 1]} // Ensure proper Y-axis range
              ticks={Object.values(typeToYPosition)}
              tickFormatter={value => {
                const type = Object.entries(typeToYPosition).find(([_, y]) => y === value)?.[0] || '';
                return type;
              }}
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
                label={{
                  value: region.appName,
                  position: 'insideTopRight',
                  fill: '#000',
                  fontSize: 12,
                }}
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
