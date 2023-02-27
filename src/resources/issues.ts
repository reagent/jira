import { HttpClient } from '../http-client';
import { URL } from 'url';
import { Configuration } from '../cli/configuration-file';

type IssueKey = `${Uppercase<string>}-${number}`;
type NumericString = `${number}`;

const urlFrom = (options: { resourceUri: string; key: string }): string => {
  const url = new URL(options.resourceUri);
  url.pathname = `/browse/${options.key}`;

  return url.toString();
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
    summary: string;
    description: Description;
  };
};

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

type SortDirection = 'ASC' | 'DESC';
type ConditionClause = string;
type OrderClause = { field: string; direction: SortDirection };

class Query {
  protected conditions: ConditionClause[];
  protected orderCondition: OrderClause | undefined;

  static in(field: string, values: Array<string>): ConditionClause {
    const escapedValues = values.map((v) => `"${v}"`); // TODO: embedded double quotes
    return `${field} IN (${escapedValues.join(', ')})`;
  }

  constructor() {
    this.conditions = [];
    this.orderCondition = undefined;
  }

  where(condition: string): this {
    this.conditions.push(condition);
    return this;
  }

  order(field: string, direction: SortDirection = 'ASC'): this {
    this.orderCondition = { field, direction };
    return this;
  }

  toString(): string {
    let jql = this.conditions.join(' AND ');

    if (this.orderCondition) {
      const { field, direction } = this.orderCondition;
      jql = `${jql} ORDER BY ${field} ${direction}`;
    }

    return jql;
  }
}

class Issues {
  protected readonly httpClient: HttpClient;
  protected readonly configuration: Configuration;

  constructor(options: {
    httpClient: HttpClient;
    configuration: Configuration;
  }) {
    this.httpClient = options.httpClient;
    this.configuration = options.configuration;
  }

  async assigned(options?: { activeOnly: boolean }): Promise<Array<Issue>> {
    const { activeOnly = true } = options || {};

    const query = new Query()
      .where('assignee = currentUser()')
      .order('createdDate', 'DESC');

    if (activeOnly) {
      query.where(Query.in('status', this.configuration.statuses));
    }

    const { data } = await this.httpClient.get<IssueResponse>(
      '/rest/api/3/search',
      { jql: query.toString() }
    );

    return data.issues.map((i) => new Issue(i));
  }

  async watching(): Promise<Array<Issue>> {
    const query = new Query()
      .where('watcher = currentUser()')
      .order('createdDate', 'DESC');

    const { data } = await this.httpClient.get<IssueResponse>(
      '/rest/api/3/search',
      { jql: query.toString() }
    );

    return data.issues.map((i) => new Issue(i));
  }

  async create(fields: NewIssueAttributes): Promise<any> {
    const { projectId, issueTypeId, teamId, sprintId, parentId, summary } =
      fields;

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
      },
    };

    if (parentId) {
      payload.fields.parent = { id: parentId.toString() };
    }

    const { data } = await this.httpClient.post<
      IssueCreateBody,
      CreatedIssueAttributes
    >('rest/api/3/issue', payload);

    return new CreatedIssue(data);
  }
}

export { Issues, NumericString };
