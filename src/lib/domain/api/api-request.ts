import { ApiUrl } from '../helpers/url-parser.helper';

export class ApiRequest {
  public uniqueId: number;
  public url: ApiUrl;
  public params: any;
  public method: string;
}
