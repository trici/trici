import { Button } from '@singhshashi/proactive';
import { SimpleVideoClipPlayer } from '../../shared/components/SimpleVideoClipPlayer';

export function ScreenRecordingPermissionsRequired() {
  const videoClipUrl = `file://${window.bridgeApi.appPath}/resources/clips/TriciScreenRecordingPermissions_final.mp4`;
  console.log('videoClipUrl', videoClipUrl);
  return (
    <div className="flex flex-col items-center justify-between gap-5">
      <div className="">
        <SimpleVideoClipPlayer clipUrl={videoClipUrl} />
      </div>
      <div className="flex w-[500px] flex-col gap-4">
        <div className="">
          <h4 className="text-lg font-bold">Screen Recording Permissions Required</h4>
          <p className="text-sm">
            Trici requires screen recording permissions. Please grant Trici screen recording permissions in System
            Preferences.
          </p>
        </div>

        <div>
          <Button
            variant="primary"
            onClick={() => {
              window.bridgeApi.sendMessage({ handler: 'askForScreenRecordingPermissions', args: {} });
            }}
          >
            Open System Preferences
          </Button>
        </div>
      </div>
    </div>
  );
}
