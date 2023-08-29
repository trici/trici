import { Button, createStyles } from '@mantine/core';
import { SettingsKey } from '../../settings/typedefs/SettingsWindowTypes';

export function ScreenToRecordNeedsToBeSet({ sessionStartedAuto }: { sessionStartedAuto: boolean }) {
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

  const message = sessionStartedAuto
    ? `Trici could not auto start the Focus Session!`
    : `Trici could not start the Focus Session!`;
  return (
    <div className={classes.root}>
      <div className={classes.illustrationContainer}>
        <img src="https://via.placeholder.com/400x300" />
      </div>
      <div className={classes.messageContainer}>
        <h4>{message}</h4>
        <p>Multiple displays detected! Please specify which display to record in the Settings</p>
        <Button
          variant="filled"
          color="white"
          onClick={() => {
            console.log('Opening Settings');
            window.bridgeApi.sendMessage({
              handler: 'openSettingsAndCloseAlert',
              args: { section: SettingsKey.SCREEN_TO_RECORD },
            });
          }}
        >
          Open Settings
        </Button>
      </div>
    </div>
  );
}
