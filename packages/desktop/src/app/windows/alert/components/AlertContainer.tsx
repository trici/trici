import { createStyles } from '@mantine/core';
import { IAlertContainerProps } from '../typedefs/AlertWindowTypes';
import { ScreenRecordingPermissionsRequired } from './ScreenRecordingPermissionsAlert';

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
      {!alertType && <h2>AlertContainer</h2>}
    </div>
  );
}
