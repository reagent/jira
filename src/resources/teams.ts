import { inspect } from 'util';
import { HttpClient } from '../http-client';

type TeamAttributes = {
  id: number;
  title: string;
  resources: Array<{ id: number; personId: number }>;
};

type Team = {
  id: number;
  title: string;
  memberCount: number;
};

type TeamResponse = {
  teams: Array<TeamAttributes>;
};

class Teams {
  constructor(protected http: HttpClient) {}

  async all(): Promise<Array<Team>> {
    const { status, data } = await this.http.post<
      { maxResults: number },
      TeamResponse
    >('/rest/teams/1.0/teams/find', { maxResults: 100 });

    if (status !== 200) {
      return [];
    }

    const teams = data.teams.map((t) => {
      const { id, title, resources } = t;
      return { id, title, memberCount: resources.length };
    });

    return teams;
  }
}

export { Teams, TeamResponse };
