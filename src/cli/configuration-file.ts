import { join } from 'path';
import { existsSync, writeFileSync, mkdirSync, readFileSync } from 'fs';

type Credentials = {
  email: string;
  token: string;
};

type ConfigurationSchema = {
  credentials: Credentials;
};

class ConfigurationFile {
  constructor(readonly path: string, readonly filename: string) {}

  exists(): boolean {
    return existsSync(join(this.path, this.filename));
  }

  read(): ConfigurationSchema {
    const encoded = readFileSync(join(this.path, this.filename), {
      encoding: 'utf-8',
    });

    return JSON.parse(encoded);
  }

  addCredentials(credentials: Credentials): boolean {
    mkdirSync(this.path, { recursive: true });

    writeFileSync(
      join(this.path, this.filename),
      JSON.stringify({ credentials }, null, 2)
    );

    return true;
  }
}

export { Credentials, ConfigurationSchema, ConfigurationFile };
