import { ApiProvider } from './api-provider';
import { AbstractHandler } from '../../services/handlers/abstract.handler';

export class ApiMethod {
  public name: string;
  public method: string;
  public api: ApiProvider;
  public handler: AbstractHandler;
  public url: string;

  /**
   * Populate url and data with corresponding values
   * @param route
   * @param values
   * @returns {string}
   */
  public static populate(route: ApiMethod, values: Map<string, string> = null): string {
    if (!values) {
      values = new Map();
    }

    let result = route.url;
    values.set('url', route.api.baseUrl);
    values.forEach(function (value, key, map) {
      result = result.replace('{{' + key + '}}', value);
    });

    return result;
  }
}
