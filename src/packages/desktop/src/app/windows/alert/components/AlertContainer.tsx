import { IAlertContainerProps } from '../typedefs/AlertWindowTypes';
import { ScreenRecordingPermissionsRequired } from './ScreenRecordingPermissionsAlert';
import { UpdateAvailableAlert } from './UpdateAvailableAlert';

export function AlertContainer({ alertType }: IAlertContainerProps) {
  return (
    <div className="h-full w-full">
      <div className="p-[32px] text-center">
        {alertType === 'SCREEN_RECORDING_PERMISSION_REVOKED' && <ScreenRecordingPermissionsRequired />}
        {alertType === 'UPDATE_AVAILABLE' && <UpdateAvailableAlert />}
        {alertType === 'NONE' && <h2>NO ALERT TYPE</h2>}
        {!alertType && <h2>AlertContainer</h2>}
      </div>
    </div>
  );
}
