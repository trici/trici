import { Button, createStyles } from '@mantine/core';
import { SimpleVideoClipPlayer } from '../../shared/components/SimpleVideoClipPlayer';

export function ScreenRecordingPermissionsRequired() {
  const useStyles = createStyles((theme: Theme) => ({
    root: {
      marginTop: 32,
      marginLeft: 32,
      marginRight: 32,
      marginBottom: 32,
    },
    illustrationContainer: {
      margin: 'auto',
      width: 400,
    },
    messageContainer: {
      marginTop: 32,
      textAlign: 'center',
    },
    messageSubtext: {
      fontSize: '0.9rem',
    },
  }));

  const { classes } = useStyles();
  const videoClipUrl = `file://${window.bridgeApi.appPath}/resources/clips/TriciScreenRecordingPermissions_final.mp4`;
  console.log('videoClipUrl', videoClipUrl);
  return (
    <div className={classes.root}>
      <div className={classes.illustrationContainer}>
        <SimpleVideoClipPlayer clipUrl={videoClipUrl} />
      </div>
      <div className={classes.messageContainer}>
        <h4>Screen Recording Permissions Required</h4>
        <p>
          Trici requires screen recording permissions. Please grant Trici screen recording permissions in System
          Preferences.
        </p>
        <Button
          variant="filled"
          color="white"
          onClick={() => {
            console.log('Opening System Preferences');
            window.bridgeApi.sendMessage({ handler: 'openSystemPreferencesAndCloseAlert', args: {} });
          }}
        >
          Open System Preferences
        </Button>
      </div>
    </div>
  );
}
