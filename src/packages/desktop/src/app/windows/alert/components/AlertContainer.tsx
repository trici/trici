import { IAlertContainerProps } from '../typedefs/AlertWindowTypes';
import { ScreenRecordingPermissionsRequired } from './ScreenRecordingPermissionsAlert';
import { ScreenToRecordNeedsToBeSet } from './ScreenToRecordNeedsToBeSet';

export function AlertContainer({ alertType }: IAlertContainerProps) {
  return (
    <div className="h-full w-full">
      <div className="p-[32px] text-center">
        {alertType === 'SCREEN_RECORDING_PERMISSION_REVOKED' && <ScreenRecordingPermissionsRequired />}
        {alertType === 'SCREEN_TO_RECORD_NOT_SET' && <ScreenToRecordNeedsToBeSet sessionStartedAuto={false} />}
        {alertType === 'SCREEN_TO_RECORD_NOT_SET_AUTO_SESSION_START' && (
          <ScreenToRecordNeedsToBeSet sessionStartedAuto={true} />
        )}
        {alertType === 'NONE' && <h2>NO ALERT TYPE</h2>}
        {!alertType && <h2>AlertContainer</h2>}
      </div>
    </div>
  );
}
