import { Configuration } from './cli/configuration-file';
import { HttpClient } from './http-client';
import { Issues } from './resources/issues';

const BASE_URI = 'https://ideonapi.atlassian.net';

class Jira {
  issues: Issues;

  protected http: HttpClient;

  constructor(configuration: Configuration) {
    const { credentials } = configuration;

    this.http = new HttpClient({
      email: credentials.email,
      token: credentials.token,
      baseUri: BASE_URI,
    });

    this.issues = new Issues({
      httpClient: this.http,
      configuration,
    });
  }
}

export { Jira };
