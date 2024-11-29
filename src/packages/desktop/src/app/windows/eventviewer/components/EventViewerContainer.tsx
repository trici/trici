import { DataGrid } from '@singhshashi/proactive';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AppEvent, TriciAppEvent } from '@trici/models';
import React, { useState } from 'react';
import { RendererRepository } from 'src/app/dataaccess/RendererRepository';

interface EventViewerContainerState {
  events: AppEvent[];
  day: number;
  from: number;
  to: number;
  type: TriciAppEvent;
}

// const bridgeApi: IBridgeAPIInterface = window.bridgeApi;

const renderRepository = RendererRepository.getInstance();

export function EventViewerContainer() {
  const [state, setState] = useState<EventViewerContainerState>({
    events: [],
    // get the timestamp of the beginning of the day
    day: new Date().setHours(0, 0, 0, 0),
    from: new Date().setHours(0, 0, 0, 0),
    to: new Date().setHours(23, 59, 59, 999),
    type: TriciAppEvent.FRONTMOST_APP_CHANGED,
  });

  const eventViewerQuery = useQuery<AppEvent[]>({
    queryKey: ['eventViewer', state.type],
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

  return (
    <>
      {eventViewerQuery.data && (
        <div className="flex h-full flex-col justify-start gap-2">
          <div className="bg-gray-50 p-2">
            <div className="flex flex-row items-center gap-2">
              <div className="w-[100px] font-medium">Filters:</div>
              <div className="w-[300px]">
                <select
                  className="w-full rounded border border-gray-300 px-2 py-1"
                  value={state.type}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                    setState({
                      ...state,
                      type: e.target.value as TriciAppEvent,
                    });
                  }}
                >
                  {allEventTypes.map((type: TriciAppEvent) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-hidden">
            <DataGrid
              showAddRemoveButtons={false}
              header={() => (
                <div className="flex flex-row gap-4 bg-gray-100 px-4 py-2 font-medium">
                  <div className="w-[200px] truncate">Type</div>
                  <div className="w-[100px] truncate">Timestamp</div>
                  <div className="w-[100px] truncate">Date</div>
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
                    <div className="w-[100px] truncate">{item.timestamp}</div>
                    <div className="w-[100px] truncate">{date}</div>
                    <div className="flex-1 overflow-x-auto">{formattedData}</div>
                  </div>
                );
              }}
              dataGridLabel="Event Viewer"
              maxHeight="90vh"
            />
          </div>
        </div>
      )}
    </>
  );
}
