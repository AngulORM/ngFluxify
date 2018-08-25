export class UrlParserHelper {
    static parse(url: string): ApiUrl {
      const urlModel = new ApiUrl();

      const parser = document.createElement('a');
      parser.href = url;

      urlModel.url = parser.href;
      urlModel.protocol = parser.protocol;
      urlModel.host = parser.host;
      urlModel.hostname = parser.hostname;
      urlModel.port = Number(parser.port ? parser.port : 80);
      urlModel.pathname = parser.pathname;
      urlModel.search = parser.search.length > 3 ? parser.search.substring(1).split('&').map(function (element: string) {
        return element.split('=');
      }) : [];
      urlModel.hash = parser.hash;

      return urlModel;
    }
  }

  export class ApiUrl {
    url: string;
    protocol: string;
    host: string;
    hostname: string;
    port: number;
    pathname: string;
    search: string[][];
    hash: string;
  }
