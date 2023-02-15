import Axios, { AxiosResponse, AxiosInstance } from 'axios';

type Params = Record<string, string>;

type HttpClientOptions = {
  email: string;
  token: string;
  baseUri: string;
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
    });
  }

  get<T = any>(path: string, params?: Params): Promise<AxiosResponse<T>> {
    return this.client.get(path, { params });
  }
}

export { HttpClient };
