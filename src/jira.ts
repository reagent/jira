import { Configuration } from './cli/configuration-file';
import { HttpClient } from './http-client';
import { Issues } from './resources/issues';

class Jira {
  issues: Issues;

  protected http: HttpClient;

  constructor(configuration: Configuration) {
    const { credentials } = configuration;

    this.http = new HttpClient({
      email: credentials.email,
      token: credentials.token,
      baseUri: credentials.uri,
    });

    this.issues = new Issues({
      httpClient: this.http,
      configuration,
    });
  }
}

export { Jira };
