import { HttpClient } from '../http-client';
import { URL } from 'url';

type IssueKey = `${Uppercase<string>}-${number}`;
type NumericString = `${number}`;

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
    const url = new URL(this.self);
    url.pathname = `/browse/${this.key}`;

    return url.toString();
  }
}

type IssueResponse = {
  total: number;
  issues: Array<IssueAttributes>;
};

type SortDirection = 'ASC' | 'DESC';
type ConditionClause = string;
type OrderClause = { field: string; direction: SortDirection };

class Query {
  protected conditions: ConditionClause[];
  protected orderCondition: OrderClause | undefined;

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
  constructor(protected readonly httpClient: HttpClient) {}

  async assigned(options?: { activeOnly: boolean }): Promise<Array<Issue>> {
    const { activeOnly = true } = options || {};

    const query = new Query()
      .where('assignee = currentUser()')
      .order('createdDate', 'DESC');

    if (activeOnly) {
      query.where('status = "In Progress"');
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
}

export { Issues };
