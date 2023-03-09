import { HttpClient } from '../http-client';
import { URL } from 'url';
import { NumericString } from './types';
import { QueryBuilder } from '../query-builder';

const urlFrom = (options: { resourceUri: string; key: string }): string => {
  const url = new URL(options.resourceUri);
  url.pathname = `/browse/${options.key}`;

  return url.toString();
};

type IssueKey = `${Uppercase<string>}-${number}`;
type AssigneeAttributes = { displayName: string };

type IssueAttributes = {
  id: NumericString;
  key: IssueKey;
  self: string;
  fields: {
    summary: string;
    status: { name: string };
    assignee: AssigneeAttributes | null;
  };
};

type IssueResponse = {
  total: number;
  issues: Array<IssueAttributes>;
};

class CreatedIssue {
  id: string;
  key: string;
  self: string;

  constructor(attributes: CreatedIssueAttributes) {
    ({ id: this.id, key: this.key, self: this.self } = attributes);
  }

  get url(): string {
    return urlFrom({ resourceUri: this.self, key: this.key });
  }
}

type CreatedIssueAttributes = {
  id: string;
  key: string;
  self: string;
};

type NewIssueAttributes = {
  projectId: number;
  issueTypeId: number;
  summary: string;
  description: string;
  parentId?: number;
  teamId?: number;
  sprintId?: number;
  labels?: string[];
};

type Description = {
  type: 'doc';
  version: 1;
  content: [
    {
      type: 'paragraph';
      content: [
        {
          type: 'text';
          text: string;
        }
      ];
    }
  ];
};

type IssueCreateBody = {
  fields: {
    project: { id: number };
    issuetype: { id: number };
    parent?: { id: string };
    customfield_10001?: string; // team
    customfield_10010?: number; // sprint
    labels?: string[];
    summary: string;
    description: Description;
  };
};

class Issue {
  id: NumericString;
  key: IssueKey;
  summary: string;
  self: string;
  status: string;
  assignee: string | null;

  constructor(attrs: IssueAttributes) {
    const {
      id,
      key,
      self,
      fields: { status, summary, assignee },
    } = attrs;

    this.id = id;
    this.key = key;
    this.self = self;
    this.summary = summary;
    this.status = status.name;
    this.assignee = assignee?.displayName || null;
  }

  get url(): string {
    return urlFrom({ resourceUri: this.self, key: this.key });
  }
}

type SearchConditions = {
  issueType?: 'Epic';
  summary?: string;
};

class Issues {
  constructor(protected httpClient: HttpClient) {}

  async where(conditions?: SearchConditions): Promise<Array<Issue>> {
    const query = new QueryBuilder();

    if (conditions?.issueType) {
      query.where('issuetype', conditions.issueType);
    }

    if (conditions?.summary) {
      query.like('summary', conditions.summary);
    }

    const jql = query.toString();
    const params = jql.length ? { jql } : {};

    const { status, data } = await this.httpClient.get<IssueResponse>(
      '/rest/api/3/search',
      params
    );

    if (status !== 200) {
      return [];
    }

    return data.issues.map((i) => new Issue(i));
  }

  async assigned(options?: { status: string[] }): Promise<Array<Issue>> {
    const query = new QueryBuilder()
      .where('assignee', 'currentUser()')
      .order('createdDate', 'DESC');

    if (options?.status) {
      query.in('status', options.status);
    }

    const { status, data } = await this.httpClient.get<IssueResponse>(
      '/rest/api/3/search',
      { jql: query.toString() }
    );

    if (status !== 200) {
      return [];
    }

    return data.issues.map((i) => new Issue(i));
  }

  async watching(): Promise<Array<Issue>> {
    const query = new QueryBuilder()
      .where('watcher', 'currentUser()')
      .order('createdDate', 'DESC');

    const { data } = await this.httpClient.get<IssueResponse>(
      '/rest/api/3/search',
      { jql: query.toString() }
    );

    return data.issues.map((i) => new Issue(i));
  }

  async create(fields: NewIssueAttributes): Promise<CreatedIssue> {
    const {
      projectId,
      issueTypeId,
      teamId,
      sprintId,
      parentId,
      summary,
      labels,
    } = fields;

    const description: Description = {
      type: 'doc',
      version: 1,
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: fields.description,
            },
          ],
        },
      ],
    };

    const payload: IssueCreateBody = {
      fields: {
        summary,

        project: { id: projectId },
        issuetype: { id: issueTypeId }, // chore
        customfield_10001: teamId?.toString(),
        customfield_10010: sprintId,
        description: description,
        labels,
      },
    };

    if (parentId) {
      payload.fields.parent = { id: parentId.toString() };
    }

    const { data } = await this.httpClient.post<
      IssueCreateBody,
      CreatedIssueAttributes
    >('/rest/api/3/issue', payload);

    return new CreatedIssue(data);
  }
}

export {
  Issues,
  IssueKey,
  NumericString,
  IssueResponse,
  NewIssueAttributes,
  CreatedIssueAttributes,
  IssueAttributes,
};
