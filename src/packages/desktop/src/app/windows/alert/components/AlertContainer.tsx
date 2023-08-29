import { createStyles } from '@mantine/core';
import { IAlertContainerProps } from '../typedefs/AlertWindowTypes';
import { ScreenRecordingPermissionsRequired } from './ScreenRecordingPermissionsAlert';
import { ScreenToRecordNeedsToBeSet } from './ScreenToRecordNeedsToBeSet';

export function AlertContainer({ alertType }: IAlertContainerProps) {
  const useStyles = createStyles((theme: Theme) => ({
    root: {
      marginTop: 32,
      marginLeft: 32,
      marginRight: 32,
      marginBottom: 32,
    },
  }));

  const { classes } = useStyles();
  return (
    <div className={classes.root}>
      {alertType === 'SCREEN_RECORDING_PERMISSION_REVOKED' && <ScreenRecordingPermissionsRequired />}
      {alertType === 'SCREEN_TO_RECORD_NOT_SET' && <ScreenToRecordNeedsToBeSet sessionStartedAuto={false} />}
      {alertType === 'SCREEN_TO_RECORD_NOT_SET_AUTO_SESSION_START' && (
        <ScreenToRecordNeedsToBeSet sessionStartedAuto={true} />
      )}
      {!alertType && <h2>AlertContainer</h2>}
    </div>
  );
}
