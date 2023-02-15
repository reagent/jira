import { HttpClient } from './http-client';
import { Issues } from './resources/issues';

const BASE_URI = 'https://ideonapi.atlassian.net';

type JiraClientOptions = {
  email: string;
  token: string;
};

class Jira {
  issues: Issues;

  protected http: HttpClient;

  constructor(options: JiraClientOptions) {
    const { email, token } = options;

    this.http = new HttpClient({
      email,
      token,
      baseUri: BASE_URI,
    });

    this.issues = new Issues(this.http);
  }
}

export { Jira };
