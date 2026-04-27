import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UsedAppCategory, IUsedApplication } from '@trici/models';
import { RendererRepository } from '../../../dataaccess/RendererRepository';
import { DataGrid } from '@singhshashi/proactive';

const renderRepository = RendererRepository.getInstance();

export const Applications: React.FC = () => {
  const queryClient = useQueryClient();

  const getDurationUsedInMinutes = (durationUsed: number) => {
    return Math.round(durationUsed / 60);
  };

  const usedApplicationsQuery = useQuery<IUsedApplication[]>({
    queryKey: ['usedApplications'],
    queryFn: () => renderRepository.getUsedApplications(),
  });

  if (usedApplicationsQuery.isLoading) {
    return <div>Loading...</div>;
  }

  if (usedApplicationsQuery.isError) {
    return <div>Error</div>;
  }

  const usedApplications = usedApplicationsQuery.data;

  const definitelyWorkApplications = usedApplications?.filter(app => {
    return app.appCategory === UsedAppCategory.DEFINITELY_WORK;
  });
  console.log('usedApplications:', usedApplications);
  console.log('definitelyWorkApplications', definitelyWorkApplications);
  return (
    <div className="">
      <DataGrid
        header={() => (
          <div className="flex flex-row items-center justify-between ">
            <div className="flex flex-row items-center justify-start">
              <span className="text-sm">Application</span>
            </div>
            <div className="flex flex-row items-center justify-end">
              <span className="text-sm">Duration Used (in min)</span>
            </div>
          </div>
        )}
        items={definitelyWorkApplications ?? []}
        showAddRemoveButtons
        dataGridLabel="Applications"
        dataGridDescription="Select the applications that you use when focusing"
        emptyGridMessage='No applications added. Click on "Add" button to add an application.'
        itemTemplate={(item: any, index: number) => (
          <div className="flex flex-row items-center justify-between px-2 py-1">
            <div className="flex flex-row items-center justify-start">
              {/* <img src={item.iconPath} alt="app" className="mr-2 h-6 w-6" /> */}
              <span>{item.applicationName}</span>
            </div>
            <div className="flex flex-row items-center justify-end">
              <span>{getDurationUsedInMinutes(item.durationUsed)}</span>
            </div>
          </div>
        )}
      />
    </div>
  );
};
