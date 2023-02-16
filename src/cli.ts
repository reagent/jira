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
  export type StatusesAdd = { status: string };
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

      const configuration = configFile.initialize({ email: args.email, token });

      if (!configuration.write()) {
        console.error('Failed to add credentials to file');
        process.exit(1);
      }
    }
  )
  .command('statuses', "See statuses considered 'active'", () => {
    const { statuses } = configFile.read();

    if (statuses.length === 0) {
      console.log('No actve statuses');
    } else {
      console.log('Active statuses:');

      statuses.forEach((s) => console.log(` * ${s}`));
    }
  })
  .command<Options.StatusesAdd>(
    'statuses:add <status>',
    "Add an 'active' status",
    (yargs) => {
      yargs.positional('status', { type: 'string', demandOption: true });
    },
    (args) => {
      const configuration = configFile.read();
      configuration.addStatus(args.status);
      configuration.write();
    }
  )
  .command<Options.Tickets>(
    'tickets',
    'Get a current list of your active tickets',
    (yargs) => {
      yargs.option('all', { type: 'boolean', default: false });
    },
    async (args) => {
      const configuration = configFile.read();

      if (configuration.statuses.length === 0) {
        console.error('No active statuses found, add one with `statuses:add`');
        process.exit(1);
      }

      const activeOnly = !args.all;

      const client = new Jira(configuration);
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
      const configuration = configFile.read();

      const client = new Jira(configuration);
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
