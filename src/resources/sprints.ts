import { HttpClient } from '../http-client';

type SprintAttributes = {
  id: number;
  name: string;
  stateKey: string;
  boardName: string;
  date: string;
};

type SprintsResponse = {
  suggestions: Array<SprintAttributes>;
  allMatches: Array<SprintAttributes>;
};

class Sprints {
  constructor(protected httpClient: HttpClient) {}

  async where(options: {
    projectKey: string;
  }): Promise<Array<SprintAttributes>> {
    const { status, data } = await this.httpClient.get<SprintsResponse>(
      '/rest/greenhopper/1.0/sprint/picker',
      {
        maxResults: 20,
        maxActiveSprints: 10,
        projectKey: options.projectKey,
      }
    );

    if (status !== 200) {
      return [];
    }

    return [...data.suggestions, ...data.allMatches];
  }
}

export { Sprints, SprintsResponse };
