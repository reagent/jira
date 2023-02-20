import { dirname, join } from 'path';
import { existsSync, writeFileSync, mkdirSync, readFileSync } from 'fs';

type Statuses = Array<string>;
type Sprint = { id: number; label: string; current: boolean };
type Team = { id: string; label: string; default: boolean };

type Credentials = {
  email: string;
  token: string;
};

type ConfigurationSchema = {
  credentials: Credentials;
  statuses?: Statuses;
  sprints?: Array<Sprint>;
  teams?: Array<Team>;
};

class Configuration {
  protected path: string;
  protected configuration: ConfigurationSchema;

  constructor(options: { path: string; configuration: ConfigurationSchema }) {
    this.path = options.path;
    this.configuration = options.configuration || {};
  }

  get credentials(): Credentials {
    return this.configuration.credentials;
  }

  get statuses(): Statuses {
    return this.configuration.statuses || [];
  }

  get sprints(): Array<Sprint> {
    return this.configuration.sprints || [];
  }

  get teams(): Array<Team> {
    return this.configuration.teams || [];
  }

  addStatus(status: string): void {
    this.configuration.statuses ||= [];
    this.configuration.statuses.push(status);
  }

  addSprint(sprint: Sprint): void {
    this.configuration.sprints ||= [];

    if (sprint.current) {
      this.configuration.sprints.forEach((sprint) => (sprint.current = false));
    }

    const existing = this.configuration.sprints.find(
      ({ id }) => id === sprint.id
    );

    if (existing) {
      existing.id = sprint.id;
      existing.current = sprint.current;

      return;
    }

    this.configuration.sprints.push(sprint);
  }

  addTeam(team: Team): void {
    this.configuration.teams ||= [];

    if (team.default) {
      this.configuration.teams.forEach((team) => (team.default = false));
    }

    const existing = this.configuration.teams.find(({ id }) => id === team.id);

    if (existing) {
      existing.label = team.label;
      existing.default = team.default;

      return;
    }

    this.configuration.teams.push(team);
  }

  write(): boolean {
    mkdirSync(dirname(this.path), { recursive: true });
    writeFileSync(this.path, JSON.stringify(this.configuration, null, 2));

    return true;
  }
}

class ConfigurationFile {
  constructor(readonly path: string, readonly filename: string) {}

  get fullPath(): string {
    return join(this.path, this.filename);
  }

  exists(): boolean {
    return existsSync(this.fullPath);
  }

  initialize(credentials: Credentials): Configuration {
    return new Configuration({
      path: this.fullPath,
      configuration: { credentials },
    });
  }

  read(): Configuration {
    const encoded = readFileSync(this.fullPath, {
      encoding: 'utf-8',
    });

    return new Configuration({
      path: this.fullPath,
      configuration: JSON.parse(encoded),
    });
  }
}

export { Credentials, ConfigurationSchema, ConfigurationFile, Configuration };
