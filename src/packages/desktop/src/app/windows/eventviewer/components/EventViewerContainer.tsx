import { DataGrid } from '@singhshashi/proactive';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AppEvent, TriciAppEvent } from '@trici/models';
import React, { useState, useEffect } from 'react';
import { RendererRepository } from 'src/app/dataaccess/RendererRepository';
import { ScatterChart, Scatter, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface EventViewerContainerState {
  events: AppEvent[];
  day: number;
  from: number;
  to: number;
  type: TriciAppEvent | null;
}

// const bridgeApi: IBridgeAPIInterface = window.bridgeApi;

const renderRepository = RendererRepository.getInstance();

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

  if (eventViewerQuery.isLoading) {
    return <div>Loading...</div>;
  }
  if (eventViewerQuery.error) {
    return <div>Error: {eventViewerQuery.error.toString()}</div>;
  }

  const allEventTypes = Object.values(TriciAppEvent);
  console.log('eventViewerQuery', eventViewerQuery);

  const formatJsonData = (data: any) => {
    try {
      const parsed = typeof data === 'string' ? JSON.parse(data) : data;
      return JSON.stringify(parsed, null, 2);
    } catch (e) {
      return JSON.stringify(data);
    }
  };

  const events = eventViewerQuery.data || [];
  const eventTypes = [...new Set(events.map(event => event.type))];
  const typeToYPosition = Object.fromEntries(
    eventTypes.map((type, index) => [type, index + 1])
  );

  const prepareChartData = (events: AppEvent[]) => {
    return events.map(event => ({
      timestamp: event.timestamp,
      type: event.type,
      y: typeToYPosition[event.type]
    }));
  };

  const eventColors = Object.fromEntries(
    Object.values(TriciAppEvent).map((type, index) => [
      type,
      [`#1f77b4`, `#ff7f0e`, `#2ca02c`, `#d62728`, `#9467bd`, `#8c564b`][index % 6]
    ])
  );

  return (
    <>
      {eventViewerQuery.data && (
        <div className="flex h-full flex-col justify-start gap-2">
          <div className="bg-gray-50 p-2">
            <div className="flex flex-row items-center gap-2 text-sm">
              <div className="w-[100px] font-medium">Filters:</div>
              <div className="w-[300px]">
                <label htmlFor="eventTypeFilter" className="block text-sm text-gray-700 mb-1">Event Type</label>
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
                <label htmlFor="timeRangeFilter" className="block text-sm text-gray-700 mb-1">Time Range</label>
                <select
                  id="timeRangeFilter"
                  aria-label="Time Range Filter"
                  className="w-full rounded border border-gray-300 px-2 py-1"
                  defaultValue="1h"
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                    const now = new Date().getTime();
                    const value = e.target.value;
                    let timeInMillis;

                    switch(value) {
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
                      to: now
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

          {/* Add Chart Section */}
          <div className="h-[300px] w-full bg-white p-4">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart
                margin={{
                  top: 10,
                  right: 30,
                  left: 100, // Increased left margin for event type labels
                  bottom: 0,
                }}
              >
                <XAxis
                  dataKey="timestamp"
                  type="number"
                  domain={['dataMin', 'dataMax']}
                  tickFormatter={(unixTime) => new Date(unixTime).toLocaleTimeString()}
                  name="Time"
                />
                <YAxis
                  type="number"
                  dataKey="y"
                  name="Event Type"
                  ticks={Object.values(typeToYPosition)}
                  tickFormatter={(value) => {
                    const type = Object.entries(typeToYPosition).find(([_, y]) => y === value)?.[0] || '';
                    return type;
                  }}
                />
                <Tooltip
                  cursor={{ strokeDasharray: '3 3' }}
                  content={({ payload }) => {
                    if (payload && payload.length > 0) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white p-2 shadow rounded border">
                          <p className="text-sm">Type: {data.type}</p>
                          <p className="text-sm">
                            Time: {new Date(data.timestamp).toLocaleString()}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                {eventTypes.map(eventType => (
                  <Scatter
                    key={eventType}
                    name={eventType}
                    data={prepareChartData(events).filter(event => event.type === eventType)}
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
              items={eventViewerQuery.data}
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
      )}
    </>
  );
}
