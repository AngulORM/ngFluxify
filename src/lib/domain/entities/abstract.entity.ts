// import { RestService } from '../../services';
// import { ApiRequest, ApiResponse, RestModelManager } from '../api';

export abstract class AbstractEntity {
  id = -1;
//   service: RestService<AbstractModel>;
//   manager: RestModelManager<AbstractModel>;
  protected abstract readonly entityIdentifier: string;

  create(): void {
    // this.service.create(this);
  }

  save(params: Map<string, any> = null): Promise<number> {
    return null;
  }

  read(): Promise<null> {
    return null;
  }

  patch(values: Map<string, any>): Promise<null> {
    return null;
  }

  delete(params: Map<string, any> = null): Promise<null> {
    return null;
  }
}
