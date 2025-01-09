#!/usr/bin/env node
import { Command } from 'commander';
import { getVersion } from '@trici/utils';
import { createIpcClient } from '@trici/utils';
import { CLIMessageType } from '@trici/models';
// import loggingService from '@trici/logger';

// const logger = loggingService.getLogger();

const ipcClient = createIpcClient(false);

const startCommand = async () => {
  // send a message to the primary instance to start a Focus Session
  try {
    const response = await ipcClient.connectAndSendMessage({ type: CLIMessageType.START_FOCUS_SESSION, data: {} });
    console.log(response.message);
    //
    process.exit(0);
  } catch (e) {
    if (e instanceof Error && e.message.indexOf('ENOENT') >= 0) {
      console.log('No primary instance found');
    } else {
      console.log('Error: ', e);
    }
  }
};

const stopCommand = async () => {
  // send a messge to the primary instance to stop the Focus Session
  try {
    const response = await ipcClient.connectAndSendMessage({ type: CLIMessageType.STOP_FOCUS_SESSION, data: {} });
    console.log(response.message);
    process.exit(0);
  } catch (e) {
    if (e instanceof Error && e.message.indexOf('ENOENT') >= 0) {
      console.log('No primary instance found');
    } else {
      console.log('Error: ', e);
    }
  }
};

const statusCommand = async () => {
  // send a messge to the primary instance to get the status
  try {
    const response = await ipcClient.connectAndSendMessage({ type: CLIMessageType.GET_STATUS, data: {} });
    console.log(response.message);
    process.exit(0);
  } catch (e) {
    if (e instanceof Error && e.message.indexOf('ENOENT') >= 0) {
      console.log('No primary instance found');
    } else {
      console.log('Error: ', e);
    }
  }
};

const program = new Command();

program.name('trici').usage('<command> [options]');
program.version(getVersion());

program.command('start').description('Start the session').action(startCommand);

program.command('stop').description('Stop the session').action(stopCommand);

program.command('status').description('Get todays status').action(statusCommand);

// program
// .name('trici')
// .usage('<command> [options]');
// program.version(getVersion());

export function run(args: string[]) {
  program.parse(args);
}

if (require.main === module) {
  run(process.argv);
}
