import {EntityDescriptor} from './entity.descriptor';
import {RestReducer} from '../../stores/rest/rest.reducer';

export class RestEntityDescriptor extends EntityDescriptor {
  readonly reducerType: any = RestReducer;
  route: string;

  constructor(_name: string, _route: string) {
    super(_name);
    this.route = _route;
  }
}
