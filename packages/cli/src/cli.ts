#!/usr/bin/env node
import { Command } from 'commander';
import { getVersion } from '@trici/utils';

const startCommand = () => {
  console.log('Session started');
};

const stopCommand = () => {
  console.log('Session stopped');
};

const program = new Command();

program
  .command('start')
  .description('Start the session')
  .action(startCommand);

program
  .command('stop')
  .description('Stop the session')
  .action(stopCommand);

program.version(getVersion());

export function run(args: string[]) {
  program.parse(args);
}

if (require.main === module) {
  run(process.argv);
}
