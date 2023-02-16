import { dirname, join } from 'path';
import { existsSync, writeFileSync, mkdirSync, readFileSync } from 'fs';

type Statuses = Array<string>;

type Credentials = {
  email: string;
  token: string;
};

type ConfigurationSchema = {
  credentials: Credentials;
  statuses?: Statuses;
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

  addStatus(status: string): void {
    this.configuration.statuses ||= [];
    this.configuration.statuses.push(status);
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
