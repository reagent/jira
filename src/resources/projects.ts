import { HttpClient } from '../http-client';

type IssueTypeAttributes = {
  id: string;
  name: string;
  description: string;
};

type ProjectAttributes = {
  id: string;
  key: string;
  name: string;
};

type ProjectAttributesWithIssueTypes = ProjectAttributes & {
  issueTypes: Array<IssueTypeAttributes>;
};

type ProjectSearchResponse = {
  values: Array<ProjectAttributes>;
};

class Projects {
  constructor(protected http: HttpClient) {}

  async find(idOrKey: string): Promise<ProjectAttributesWithIssueTypes | null> {
    const { status, data } =
      await this.http.get<ProjectAttributesWithIssueTypes>(
        `/rest/api/2/project/${idOrKey}`
      );

    if (status !== 200) {
      return null;
    }

    return data;
  }

  async all(): Promise<Array<ProjectAttributes>> {
    return this.where({ prefix: '' });
  }

  async where(options: { prefix: string }): Promise<Array<ProjectAttributes>> {
    const { status, data } = await this.http.get<ProjectSearchResponse>(
      '/rest/api/3/project/search',
      {
        query: options.prefix,
        typeKey: 'software',
      }
    );

    if (status !== 200) {
      return [];
    }

    return data.values;
  }
}

export { Projects };
