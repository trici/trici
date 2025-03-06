import { Button } from '@singhshashi/proactive';
import { useCallback } from 'react';

export function UpdateAvailableAlert() {
  const handleInstallUpdate = useCallback(() => {
    window.bridgeApi.sendMessage({ handler: 'installUpdate', args: {} });
  }, []);

  return (
    <div className="flex flex-col items-center justify-center space-y-4">
      <h2 className="text-xl font-semibold">Update Available</h2>
      <p className="text-gray-600">A new version of Trici is available. Would you like to install it now?</p>
      <Button onClick={handleInstallUpdate} variant="primary">
        Install Update
      </Button>
    </div>
  );
}
