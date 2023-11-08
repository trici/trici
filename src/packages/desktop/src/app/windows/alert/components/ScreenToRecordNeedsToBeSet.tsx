import { SettingsKey } from '../../settings/typedefs/SettingsWindowTypes';
import { Button } from '@singhshashi/proactive';

export function ScreenToRecordNeedsToBeSet({ sessionStartedAuto }: { sessionStartedAuto: boolean }) {
  const message = sessionStartedAuto
    ? `Trici could not auto start the Focus Session!`
    : `Trici could not start the Focus Session!`;
  return (
    <div className="flex flex-col items-center justify-between gap-5">
      <div className="">
        <img src="https://via.placeholder.com/400x300" />
      </div>
      <div className="flex w-[500px] flex-col gap-4">
        <h4 className="text-lg font-bold">{message}</h4>
        <p>Multiple displays detected! Please specify which display to record in the Settings</p>
        <div>
          <Button
            variant="primary"
            // color="white"
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
    </div>
  );
}
