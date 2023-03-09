import { HttpMock, HttpStatus } from '@reagent/axios-http-mock';
import { HttpClient } from '../http-client';
import { Sprints, SprintsResponse } from './sprints';

describe(Sprints.name, () => {
  const baseUri = 'https://host.example';

  let httpMock: HttpMock;
  let client: HttpClient;
  let subject: Sprints;

  beforeEach(() => {
    httpMock = new HttpMock({ matching: 'partial' });

    client = new HttpClient({
      baseUri,
      email: 'user@host.example',
      token: 'token',
      httpAdapter: httpMock.adapter,
    });

    subject = new Sprints(client);
  });

  describe('all()', () => {
    it('returns a collection of sprints', () => {
      httpMock
        .on('get')
        .to(`${baseUri}/rest/greenhopper/1.0/sprint/picker`)
        .with({
          params: { projectKey: 'FOO', maxResults: 20, maxActiveSprints: 10 },
        })
        .respondWith<SprintsResponse>(HttpStatus.OK, {
          allMatches: [
            {
              id: 1,
              date: '2020-01-01',
              name: 'First',
              boardName: 'Product',
              stateKey: 'Active',
            },
            {
              id: 2,
              date: '2020-01-01',
              name: 'Second',
              boardName: 'Product',
              stateKey: 'Active',
            },
          ],
        });

      expect(subject.where({ projectKey: 'FOO' })).resolves.toMatchObject([
        { id: 1, name: 'First' },
        { id: 2, name: 'Second' },
      ]);
    });

    it('returns an empty collection when a non-success status is returned', () => {
      httpMock
        .on('get')
        .to(`${baseUri}/rest/greenhopper/1.0/sprint/picker`)
        .respondWith(HttpStatus.UNAUTHORIZED);

      expect(subject.where({ projectKey: 'FOO' })).resolves.toEqual([]);
    });
  });
});
