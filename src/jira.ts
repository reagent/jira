import { Configuration } from './cli/configuration-file';
import { HttpClient } from './http-client';
import { Issues } from './resources/issues';
import { Projects } from './resources/projects';
import { Sprints } from './resources/sprints';
import { Teams } from './resources/teams';

class Jira {
  projects: Projects;
  issues: Issues;
  sprints: Sprints;
  teams: Teams;

  protected http: HttpClient;

  constructor(configuration: Configuration) {
    const { credentials } = configuration;

    this.http = new HttpClient({
      email: credentials.email,
      token: credentials.token,
      baseUri: credentials.uri,
    });

    this.projects = new Projects(this.http);
    this.issues = new Issues(this.http);

    this.sprints = new Sprints(this.http);
    this.teams = new Teams(this.http);
  }
}

export { Jira };
