#!/usr/bin/env node

import yargs from 'yargs';
import { resolve } from 'path';
import { homedir } from 'os';

import * as p from '@clack/prompts';
import { terminal } from 'terminal-kit';

import { ConfigurationFile } from './cli/configuration-file';
import { Jira } from './jira';
import { NewIssueAttributes } from './resources/issues';

type ValidationFunc = (input: string) => string | void;

namespace Options {
  export type Tickets = { all: boolean };
  export type TicketsCreate = { summary: string };
  export type StatusesAdd = { status: string };
}

const notBlank = (message: string): ValidationFunc => {
  return (input) => {
    if (input.trim().length === 0) {
      return message;
    }
  };
};

const configFile = new ConfigurationFile(
  resolve(homedir(), '.config', 'jira'),
  'config.json'
);

yargs
  .scriptName('jira')

  .command('init', 'Initialize configuration', async () => {
    if (configFile.exists()) {
      console.log('Already initialized, skipping ...');
      process.exit(0);
    }

    const input = await p.group(
      {
        uri: () =>
          p.text({
            message: 'Base URI',
            placeholder: 'https://<companyname>.atlassian.net',
            validate: notBlank('URI is required'),
          }),
        email: () =>
          p.text({
            message: 'Email',
            validate: notBlank('Email is required'),
          }),
        token: () =>
          p.password({
            message: 'Enter Jira API Token',
            validate: notBlank('API token is required'),
          }),
      },
      {
        onCancel: () => {
          p.cancel('Aborted.');
          process.exit(1);
        },
      }
    );

    const configuration = configFile.initialize({
      email: input.email,
      uri: input.uri,
      token: input.token,
    });

    if (!configuration.write()) {
      console.error('Failed to add credentials to file');
      process.exit(1);
    }
  })
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
      const { statuses, credentials } = configFile.read();
      const client = new Jira(credentials);

      const activeOnly = !args.all;

      if (activeOnly && statuses.length === 0) {
        console.error('No active statuses found, add one with `statuses:add`');
        process.exit(1);
      }

      const tickets = await client.issues.assigned({ statuses });

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
  .command<Options.TicketsCreate>(
    'tickets:create <summary>',
    'Create a ticket with the configured options',
    (yargs) =>
      yargs.positional('summary', { type: 'string', demandOption: true }),
    async (args) => {
      const { credentials } = configFile.read();
      const client = new Jira(credentials);

      const input = await p.group(
        {
          // Assign project
          projectId: async ({ results: _ }) => {
            const projects = await client.projects.where({ prefix: 'PD' });

            return p.select({
              message: 'Project',
              options: projects.map((p) => ({
                value: p.id,
                label: `${p.name} (key: ${p.key})`,
              })),
            });
          },

          // Optionally assign epic
          epic: async () => {
            const assignToEpic = await p.confirm({
              message: 'Assign to Epic?',
            });

            if (!assignToEpic) {
              return;
            }

            return await p.group(
              {
                term: () =>
                  p.text({
                    message: 'Start of Epic name',
                    validate: notBlank('required'),
                  }),
                id: async ({ results }) => {
                  const epics = await client.issues.where({
                    issueType: 'Epic',
                    summary: results.term!,
                  });

                  return p.select({
                    message: 'Epic',
                    options: epics.map((e) => ({
                      value: e.id,
                      label: e.summary,
                    })),
                  });
                },
              },
              {
                onCancel: () => {
                  p.cancel('Aborted.');
                  process.exit(1);
                },
              }
            );
          },

          // Assign issue type
          issueTypeId: async ({ results }) => {
            const project = await client.projects.find(
              results.projectId! as string // bug with `p.select`, it gets typed as `unknown`
            );

            return p.select({
              message: 'Issue Type',
              options: project!.issueTypes.map(({ id, name }) => ({
                value: id,
                label: name,
              })),
            });
          },

          // Assign team
          teamId: async ({ results: _ }) => {
            const teams = await client.teams.all();

            return p.select({
              message: 'Team',
              options: teams.map(({ id, title }) => ({
                value: id,
                label: title,
              })),
            });
          },

          // Optionally assign sprint
          sprintId: async ({ results: _ }) => {
            const sprints = await client.sprints.where({ projectKey: 'PD' });

            const options = sprints.map(({ id, name }) => ({
              value: id,
              label: name,
            }));
            options.push({ value: -1, label: 'None' });

            return p.select({
              message: 'Sprint',
              options,
            });
          },

          // Optionally assign labels
          labels: async () => {
            const raw = await p.text({
              message: 'Optional labels (comma separated)',
              placeholder: 'tech-debt, observability',
            });

            if (!raw) {
              return;
            }

            return raw.toString().split(/\s*,\s*/);
          },
        },
        {
          onCancel: () => {
            p.cancel('Aborted.');
            process.exit(1);
          },
        }
      );

      const { projectId, epic, issueTypeId, teamId, sprintId, labels } = input;

      const attributes: NewIssueAttributes = {
        summary: args.summary,
        description: 'Placeholder',
        projectId: Number(projectId),
        issueTypeId: Number(issueTypeId),
        teamId: Number(teamId),
      };

      if (epic) {
        attributes.parentId = Number(epic.id);
      }

      if (Number(sprintId) > 0) {
        attributes.sprintId = Number(sprintId);
      }

      if (Array.isArray(labels)) {
        attributes.labels = labels;
      }

      const issue = await client.issues.create(attributes);

      console.log(issue.url);
    }
  )
  .demandCommand(1, 'Subcommand not specified')
  .strict()
  .help().argv;
