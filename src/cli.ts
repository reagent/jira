#!/usr/bin/env node

import yargs from 'yargs';
import { resolve } from 'path';
import { homedir } from 'os';
import { prompt } from './cli/prompt';
import { ConfigurationFile } from './cli/configuration-file';
import { Jira } from './jira';
import { terminal } from 'terminal-kit';

namespace Options {
  export type Init = { email: string };
  export type Tickets = { all: boolean };
}

const configFile = new ConfigurationFile(
  resolve(homedir(), '.config', 'jira'),
  'config.json'
);

yargs
  .scriptName('jira')

  .command<Options.Init>(
    'init',
    'Initialize configuration',
    (yargs) => {
      yargs.option('email', { type: 'string', demandOption: true });
    },
    async (args) => {
      if (configFile.exists()) {
        console.log('Already initialized, skipping ...');
        process.exit(0);
      }

      let token: string | null = null;

      while (!token) {
        token = await prompt('Enter Jira API Token: ');
      }

      if (!configFile.addCredentials({ email: args.email, token })) {
        console.error('Failed to add credentials to file');
        process.exit(1);
      }
    }
  )
  .command<Options.Tickets>(
    'tickets',
    'Get a current list of your active tickets',
    (yargs) => {
      yargs.option('all', { type: 'boolean', default: false });
    },
    async (args) => {
      const { credentials } = configFile.read();
      const activeOnly = !args.all;

      const client = new Jira(credentials);
      const tickets = await client.issues.assigned({ activeOnly });

      const cells: string[][] = [['Key', 'Summary', 'Status', 'URL']];

      tickets.forEach(({ key, summary, status, url }) =>
        cells.push([key, summary, status, url])
      );

      terminal.table(cells);
    }
  )
  .command(
    'tickets:watching',
    "Get a list of tickets you're watching",
    async () => {
      const { credentials } = configFile.read();

      const client = new Jira(credentials);
      const tickets = await client.issues.watching();

      const cells: string[][] = [['Key', 'Summary', 'Status', 'URL']];

      tickets.forEach(({ key, summary, status, url }) =>
        cells.push([key, summary, status, url])
      );

      terminal.table(cells);
    }
  )
  .demandCommand(1, 'Subcommand not specified')
  .strict()
  .help().argv;
