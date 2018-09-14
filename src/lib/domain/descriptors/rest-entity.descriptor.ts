import {EntityDescriptor} from './entity.descriptor';
import {DumbReducer} from '../../stores';
import {RestService} from '../../services';

export class RestEntityDescriptor extends EntityDescriptor {
  readonly reducerType: any = DumbReducer;
  readonly serviceType: any = RestService;
  route: string;

  constructor(_name: string, _route: string) {
    super(_name);
    this.route = _route;
  }
}
