#!/usr/bin/env node

import yargs from 'yargs';
import { resolve } from 'path';
import { homedir } from 'os';
import { prompt } from './cli/prompt';
import { ConfigurationFile } from './cli/configuration-file';
import { Jira } from './jira';
import { terminal } from 'terminal-kit';

namespace Options {
  export type Init = { email: string; uri: string };
  export type IssueTypesAdd = { id: number; label: string };
  export type Tickets = { all: boolean };
  export type TicketsCreate = {
    template: string;
    summary: string;
  };
  export type ProjectsAdd = {
    id: number;
    key: string;
    label: string;
    default: boolean;
  };
  export type StatusesAdd = { status: string };
  export type SprintsAdd = { id: number; label: string; current: boolean };
  export type TeamsAdd = { id: string; label: string; default: boolean };
  export type TemplatesAdd = { label: string };
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
      yargs
        .option('email', { type: 'string', demandOption: true })
        .option('uri', { type: 'string', demandOption: true });
    },
    async (args) => {
      if (configFile.exists()) {
        console.log('Already initialized, skipping ...');
        process.exit(0);
      }

      let token: string | undefined = undefined;

      while (!token) {
        token = await prompt('Enter Jira API Token: ');
      }

      const configuration = configFile.initialize({
        email: args.email,
        uri: args.uri,
        token,
      });

      if (!configuration.write()) {
        console.error('Failed to add credentials to file');
        process.exit(1);
      }
    }
  )
  .command('issuetypes', 'See a list of issue types', () => {
    const { issueTypes } = configFile.read();

    if (issueTypes.length === 0) {
      console.log('No issue types added');
    } else {
      console.log('Issue Types:');

      issueTypes.forEach((issueType) => {
        console.log(` * "${issueType.label}" (id: ${issueType.id})`);
      });

      console.log();
    }
  })
  .command<Options.IssueTypesAdd>(
    'issuetypes:add <label>',
    'Add an issue type',
    (yargs) => {
      yargs
        .option('id', { type: 'number', demandOption: true })
        .positional('label', { type: 'string', demandOption: true });
    },
    (args) => {
      const configuration = configFile.read();

      configuration.addIssueType({ id: args.id, label: args.label });

      configuration.write();
    }
  )
  .command('projects', 'See a list of configured projects', () => {
    const { projects } = configFile.read();

    if (projects.length === 0) {
      console.log('No projects added');
    } else {
      console.log('Projects:');

      projects.forEach((project) => {
        let output = ` * "${project.label}" (id: ${project.id}, key: ${project.key})`;

        if (project.default) {
          output += ' <- default';
        }

        console.log(output);
      });

      console.log();
    }
  })
  .command<Options.ProjectsAdd>(
    'projects:add <label>',
    'Add a project',
    (yargs) => {
      yargs
        .option('id', { type: 'number', alias: 'i', demandOption: true })
        .option('key', { type: 'string', demandOption: true })
        .option('default', { type: 'boolean', default: false })
        .positional('label', { type: 'string', demandOption: true });
    },
    (args) => {
      const configuration = configFile.read();

      configuration.addProject({
        id: args.id,
        key: args.key,
        label: args.label,
        default: args.default,
      });

      configuration.write();
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
  .command('sprints', 'Get a current list of configured sprints', () => {
    const { sprints } = configFile.read();

    if (sprints.length === 0) {
      console.log('No sprints added');
    } else {
      console.log('Sprints:');

      sprints.forEach(({ label, id, current }) => {
        let output = ` * "${label}" (id: ${id})`;

        if (current) {
          output += ' <- current';
        }

        console.log(output);
      });

      console.log();
    }
  })
  .command<Options.SprintsAdd>(
    'sprints:add <label>',
    'Add a sprint',
    (yargs) => {
      yargs
        .option('id', { type: 'number', alias: 'i', demandOption: true })
        .option('current', { type: 'boolean', default: false })
        .positional('label', { type: 'string', demandOption: true });
    },
    (args) => {
      const configuration = configFile.read();

      configuration.addSprint({
        id: args.id,
        label: args.label,
        current: args.current,
      });

      configuration.write();
    }
  )
  .command('teams', 'View a list of your configured teams', () => {
    const { teams } = configFile.read();

    if (teams.length === 0) {
      console.log('No teams added');
    } else {
      console.log('Teams:');

      teams.forEach((team) => {
        let output = ` * "${team.label}" (id: ${team.id})`;

        if (team.default) {
          output += ' <- default';
        }

        console.log(output);
      });

      console.log();
    }
  })
  .command<Options.TeamsAdd>(
    'teams:add <label>',
    'Add a team',
    (yargs) => {
      yargs
        .option('id', { type: 'string', alias: 'i', demandOption: true })
        .option('default', { type: 'boolean', default: false })
        .positional('label', { type: 'string', demandOption: true });
    },
    (args) => {
      const configuration = configFile.read();

      configuration.addTeam({
        id: args.id,
        label: args.label,
        default: args.default,
      });

      configuration.write();
    }
  )
  .command<Options.TemplatesAdd>(
    'templates:add <label>',
    'Add template for creating tickets',
    (yargs) => {
      yargs.positional('label', { type: 'string', demandOption: 'true' });
    },
    async (args) => {
      const configuration = configFile.read();

      let response: string | undefined = undefined;

      let issueTypeId: number | undefined = undefined;
      let projectId: number | undefined = undefined;

      while (!issueTypeId) {
        response = await prompt('Issue Type Id: ');

        if (response) {
          issueTypeId = Number(response);
        }
      }

      while (!projectId) {
        response = await prompt('Project Id: ');

        if (response) {
          projectId = Number(response);
        }
      }

      response = await prompt('Parent Id: ');
      const parentId = response ? Number(response) : undefined;

      response = await prompt('Sprint Id: ');
      const sprintId = response ? Number(response) : undefined;

      response = await prompt('Team Id: ');
      const teamId = response ? Number(response) : undefined;

      response = await prompt('Label: ');
      const labels = response ? [response] : [];

      configuration.addTemplate(args.label, {
        parentId,
        sprintId,
        teamId,
        issueTypeId,
        projectId,
        labels,
      });

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
      const activeOnly = !args.all;

      if (activeOnly && configuration.statuses.length === 0) {
        console.error('No active statuses found, add one with `statuses:add`');
        process.exit(1);
      }

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
  .command<Options.TicketsCreate>(
    'tickets:create <summary>',
    'Create a ticket with the configured options',
    (yargs) => {
      yargs
        .option('template', { type: 'string', demandOption: true })
        .positional('summary', { type: 'string', demandOption: true });
    },
    async (args) => {
      const configuration = configFile.read();
      const template = configuration.templates[args.template];

      if (!template) {
        console.error(`Template "${args.template}" not found`);
        const templateLabels = Object.keys(configuration.templates);

        if (templateLabels.length > 0) {
          console.error();
          console.error('Available templates: ');
          templateLabels.forEach((l) => console.error(` * ${l}`));
          console.error();
        }

        process.exit(1);
      }

      const client = new Jira(configuration);

      const issue = await client.issues.create({
        ...template,
        summary: args.summary,
        description: 'Placeholder',
      });

      console.log(issue.url);
    }
  )
  .demandCommand(1, 'Subcommand not specified')
  .strict()
  .help().argv;
