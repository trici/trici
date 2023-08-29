import { exec } from 'child_process';
import path from 'path';

const cliPath = path.resolve(__dirname, '../dist/cli.js');

function runCli(args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    exec(`node ${cliPath} ${args.join(' ')}`, (error, stdout, stderr) => {
      if (error) {
        reject(error);
      } else if (stderr) {
        reject(stderr);
      } else {
        resolve(stdout);
      }
    });
  });
}

describe('CLI commands', () => {
  console.log("CWD: " + process.cwd());
  test('start command', async () => {
    const output = await runCli(['start']);
    expect(output.trim()).toEqual('Session started');
  });

  test('stop command', async () => {
    const output = await runCli(['stop']);
    expect(output.trim()).toEqual('Session stopped');
  });

  test('version option', async () => {
    const output = await runCli(['--version']);
    expect(output.trim()).toEqual('1.0.0');
  });
});
