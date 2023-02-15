#!/usr/bin/env node

import yargs from 'yargs';
import { resolve } from 'path';
import { homedir } from 'os';
import { prompt } from './cli/prompt';
import { ConfigurationFile } from './cli/configuration-file';

namespace Options {
  export type Init = { email: string };
}

yargs
  .scriptName('jira')
  .command<Options.Init>(
    'init',
    'Initialize configuration',
    (yargs) => {
      yargs.option('email', { type: 'string', demandOption: true });
    },
    async (args) => {
      const path = resolve(homedir(), '.config', 'jira');
      const filename = 'config.json';

      const configFile = new ConfigurationFile(path, filename);

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
  .help().argv;
