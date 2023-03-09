import Axios, { AxiosResponse, AxiosInstance, AxiosAdapter } from 'axios';

type Params = Record<string, string | number | undefined>;

type HttpClientOptions = {
  email: string;
  token: string;
  baseUri: string;
  httpAdapter?: AxiosAdapter;
};

class HttpClient {
  protected client: AxiosInstance;

  constructor(options: HttpClientOptions) {
    const { baseUri: baseURL, email: username, token: password } = options;

    this.client = Axios.create({
      baseURL,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      auth: { username, password },
      validateStatus: () => true, // don't throw
      adapter: options.httpAdapter,
    });
  }

  get<R = any>(path: string, params?: Params): Promise<AxiosResponse<R>> {
    return this.client.get<R>(path, { params });
  }

  post<B extends object = object, R = any>(
    path: string,
    body: B
  ): Promise<AxiosResponse<R>> {
    return this.client.post<R>(path, body);
  }
}

export { HttpClient };
