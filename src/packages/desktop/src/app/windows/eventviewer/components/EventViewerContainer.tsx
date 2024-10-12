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
  return (
    <>
      {eventViewerQuery.data && (
        <div className="flex flex-col justify-start gap-2">
          <div className="">
            <div className="flex flex-row justify-normal gap-2">
              <div className="w-[225px] px-1 py-1">Filters:</div>
              <div className="w-[300px] px-1 py-1">
                <select
                  className="w-full border-gray-200"
                  value={state.type}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                    setState({
                      ...state,
                      type: e.target.value as TriciAppEvent,
                    });
                  }}
                >
                  {allEventTypes.map((type: TriciAppEvent) => {
                    return (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>
          </div>
          <div className="">
            <DataGrid
              showAddRemoveButtons={false}
              header={() => (
                <div className="flex flex-row justify-normal gap-2">
                  <div className="w-[225px] px-1 py-1">Type</div>
                  <div className="w-[120px] px-1 py-1">Timestamp</div>
                  <div className="w-[120px] px-1 py-1">Date</div>
                  <div className="px-1 py-1">Data</div>
                </div>
              )}
              items={eventViewerQuery.data}
              itemTemplate={(item: AppEvent) => {
                const date = new Date(item.timestamp).toLocaleDateString();
                let payload;
                if (item.data.length > 0) {
                  payload = item.data.map((p: any) => {
                    return <div>{JSON.stringify(p)}</div>;
                  });
                }
                return (
                  <div className="flex flex-row justify-normal gap-2">
                    <div className="w-[225px] px-1 py-1">{item.type}</div>
                    <div className="w-[120px] px-1 py-1">{item.timestamp}</div>
                    <div className="w-[120px] px-1 py-1">{date}</div>
                    <div className="px-1 py-1">{payload}</div>
                  </div>
                );
              }}
              dataGridLabel="Event Viewer"
            />
          </div>
        </div>
      )}
    </>
  );
}
