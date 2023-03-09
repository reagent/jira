import { HttpMock, HttpStatus } from '@reagent/axios-http-mock';
import { faker } from '@faker-js/faker';
import { HttpClient } from '../http-client';
import {
  CreatedIssueAttributes,
  Issues,
  IssueAttributes,
  IssueKey,
  IssueResponse,
} from './issues';
import { NumericString } from './types';

const issueAttributes = (
  overrides: Partial<IssueAttributes> = {}
): IssueAttributes => {
  const key = [
    faker.random.alpha({ count: 2, casing: 'upper' }),
    faker.datatype.number().toString(),
  ].join('-') as IssueKey;

  const id =
    overrides.id || (faker.datatype.number().toString() as NumericString);

  const defaults: IssueAttributes = {
    id,
    key,
    self: `https://host.example/rest/api/3/issue/${id}`,
    fields: {
      status: {
        name: faker.helpers.arrayElement(['Assigned', 'Unassigned']),
      },
      summary: faker.random.words(5),
      assignee: {
        displayName: faker.name.fullName(),
      },
    },
  };

  return { ...defaults, ...overrides };
};

describe(Issues.name, () => {
  const baseUri = 'https://host.example';

  let httpMock: HttpMock;
  let client: HttpClient;
  let subject: Issues;

  beforeEach(() => {
    httpMock = new HttpMock({ matching: 'partial' });

    client = new HttpClient({
      baseUri,
      email: 'user@host.example',
      token: 'token',
      httpAdapter: httpMock.adapter,
    });

    subject = new Issues(client);
  });

  describe('where()', () => {
    it('returns a collection of issues matching the provided search terms', () => {
      httpMock
        .on('get')
        .to(`${baseUri}/rest/api/3/search`)
        .with({ params: { jql: 'issuetype = Epic AND summary ~ "Epic Name"' } })
        .respondWith<IssueResponse>(HttpStatus.OK, {
          total: 1,
          issues: [issueAttributes({ id: '1' })],
        });

      expect(
        subject.where({ issueType: 'Epic', summary: 'Epic Name' })
      ).resolves.toMatchObject([{ id: '1' }]);
    });

    it('allows searching with no conditions', () => {
      httpMock
        .on('get')
        .to(`${baseUri}/rest/api/3/search`)
        .with({ params: {} })
        .respondWith(HttpStatus.OK, { issues: [issueAttributes({ id: '1' })] });

      expect(subject.where()).resolves.toMatchObject([{ id: '1' }]);
    });

    it('returns an empty array when encountering an error', () => {
      httpMock
        .on('get')
        .to(`${baseUri}/rest/api/3/search`)
        .respondWith(HttpStatus.UNAUTHORIZED);

      expect(subject.where()).resolves.toEqual([]);
    });
  });

  describe('assigned()', () => {
    it('fetches issues assigned to the current user, newest first', () => {
      httpMock
        .on('get')
        .to(`${baseUri}/rest/api/3/search`)
        .with({
          params: { jql: 'assignee = currentUser() ORDER BY createdDate DESC' },
        })
        .respondWith<IssueResponse>(HttpStatus.OK, {
          total: 2,
          issues: [issueAttributes({ id: '1' }), issueAttributes({ id: '2' })],
        });

      expect(subject.assigned()).resolves.toMatchObject([
        { id: '1' },
        { id: '2' },
      ]);
    });

    it('filters on status when provided', () => {
      httpMock
        .on('get')
        .to(`${baseUri}/rest/api/3/search`)
        .with({
          params: {
            jql: 'assignee = currentUser() AND status IN ("Assigned","In Progress") ORDER BY createdDate DESC',
          },
        })
        .respondWith<IssueResponse>(HttpStatus.OK, {
          total: 1,
          issues: [issueAttributes({ id: '1' })],
        });

      expect(
        subject.assigned({ status: ['Assigned', 'In Progress'] })
      ).resolves.toMatchObject([{ id: '1' }]);
    });

    it('returns an empty collection when encountering an error', () => {
      httpMock
        .on('get')
        .to(`${baseUri}/rest/api/3/search`)
        .respondWith(HttpStatus.UNAUTHORIZED);

      expect(subject.assigned()).resolves.toEqual([]);
    });
  });

  describe('create()', () => {
    it('creates an issue with the specified attributes', async () => {
      httpMock
        .on('post')
        .to(`${baseUri}/rest/api/3/issue`)
        .with({
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          body: {
            fields: {
              summary: 'Issue Name',
              project: { id: 1 },
              issuetype: { id: 2 },
              description: {
                type: 'doc',
                version: 1,
                content: [
                  {
                    type: 'paragraph',
                    content: [
                      {
                        type: 'text',
                        text: 'Issue Description',
                      },
                    ],
                  },
                ],
              },
            },
          },
        })
        .respondWith<CreatedIssueAttributes>(HttpStatus.CREATED, {
          id: '1',
          key: 'PD-1',
          self: `${baseUri}/rest/api/3/issue/1`,
        });

      const issue = await subject.create({
        projectId: 1,
        issueTypeId: 2,
        summary: 'Issue Name',
        description: 'Issue Description',
      });

      expect(issue).toMatchObject({
        id: '1',
        key: 'PD-1',
        self: `${baseUri}/rest/api/3/issue/1`,
      });
    });
  });
});
