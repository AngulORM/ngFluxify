import {EntityDescriptor} from './entity.descriptor';
import {RestReducer} from '../../stores';
import {RestService} from '../../services';

export class RestEntityDescriptor extends EntityDescriptor {
  readonly reducerType: any = RestReducer;
  readonly serviceType: any = RestService;
  route: string;

  constructor(_name: string, _route: string) {
    super(_name);
    this.route = _route;
  }
}
