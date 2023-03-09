import { HttpMock, HttpStatus } from '@reagent/axios-http-mock';
import { HttpClient } from '../http-client';
import { TeamResponse, Teams } from './teams';

describe(Teams.name, () => {
  const baseUri = 'https://host.example';

  let httpMock: HttpMock;
  let client: HttpClient;
  let subject: Teams;

  beforeEach(() => {
    httpMock = new HttpMock({ matching: 'partial' });

    client = new HttpClient({
      baseUri,
      email: 'user@host.example',
      token: 'token',
      httpAdapter: httpMock.adapter,
    });

    subject = new Teams(client);
  });

  describe('all()', () => {
    it('returns a collection of teams when successful', () => {
      httpMock
        .on('post')
        .to(`${baseUri}/rest/teams/1.0/teams/find`)
        .with({ body: { maxResults: 100 } })
        .respondWith<TeamResponse>(HttpStatus.OK, {
          teams: [{ id: 1, title: 'Team Name' }],
        });

      expect(subject.all()).resolves.toMatchObject([
        { id: 1, title: 'Team Name' },
      ]);
    });

    it('returns an empty collection when encountering a non-success HTTP status', () => {
      httpMock
        .on('post')
        .to(`${baseUri}/rest/teams/1.0/teams/find`)
        .respondWith(HttpStatus.UNAUTHORIZED);

      expect(subject.all()).resolves.toEqual([]);
    });
  });
});
