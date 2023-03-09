import { HttpClient } from '../http-client';

type TeamAttributes = {
  id: number;
  title: string;
};

type TeamResponse = {
  teams: Array<TeamAttributes>;
};

class Teams {
  constructor(protected http: HttpClient) {}

  async all(): Promise<Array<TeamAttributes>> {
    const { status, data } = await this.http.post<
      { maxResults: number },
      TeamResponse
    >('/rest/teams/1.0/teams/find', { maxResults: 100 });

    if (status !== 200) {
      return [];
    }

    return data.teams;
  }
}

export { Teams, TeamResponse };
