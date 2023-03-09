import { HttpMock, HttpStatus } from '@reagent/axios-http-mock';
import { HttpClient } from '../http-client';
import { Projects } from './projects';

describe(Projects.name, () => {
  const baseUri = 'https://host.example';

  let httpMock: HttpMock;
  let client: HttpClient;
  let subject: Projects;

  beforeEach(() => {
    httpMock = new HttpMock({ matching: 'partial' });

    client = new HttpClient({
      baseUri,
      email: 'user@host.example',
      token: 'token',
      httpAdapter: httpMock.adapter,
    });

    subject = new Projects(client);
  });

  describe('find()', () => {
    it('returns a representation of the project', async () => {
      httpMock
        .on('get')
        .to(`${baseUri}/rest/api/2/project/PD`)
        .respondWith(HttpStatus.OK, { id: '1' });

      const project = await subject.find('PD');

      expect(project).toEqual({
        id: '1',
      });
    });

    it('returns `null` when the project cannot be found', async () => {
      httpMock
        .on('get')
        .to(`${baseUri}/rest/api/2/project/PD`)
        .respondWith(HttpStatus.NOT_FOUND);

      const subject = new Projects(client);
      expect(subject.find('PD')).resolves.toBeNull();
    });
  });

  describe('where()', () => {
    const uri = `${baseUri}/rest/api/3/project/search`;

    it('returns matching projects', async () => {
      httpMock
        .on('get')
        .to(uri)
        .with({ params: { query: 'PD', typeKey: 'software' } })
        .respondWith(HttpStatus.OK, { values: [{ id: '1' }, { id: '2' }] });

      const projects = await subject.where({ prefix: 'PD' });

      expect(projects).toMatchObject([{ id: '1' }, { id: '2' }]);
    });

    it('emtpy', () => {
      httpMock.on('get').to(uri).respondWith(HttpStatus.OK, { values: [] });
      expect(subject.where({ prefix: 'PD' })).resolves.toEqual([]);
    });

    it('empty on non-success', () => {
      httpMock.on('get').to(uri).respondWith(HttpStatus.UNPROCESSABLE_ENTITY);
      expect(subject.where({ prefix: 'PD' })).resolves.toEqual([]);
    });
  });
});
