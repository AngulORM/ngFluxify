import {EntityDescriptor, EntityDescriptorAttributes} from './entity.descriptor';
import {DumbReducer} from '../../stores';
import {RestService} from '../../services';

export class RestEntityDescriptor extends EntityDescriptor {
  readonly reducerType: any = DumbReducer;
  readonly serviceType: any = RestService;
  route: string;

  constructor(attributes: RestEntityDescriptorAttributes) {
    super(attributes);
    this.route = attributes.route;
  }
}

export interface RestEntityDescriptorAttributes extends EntityDescriptorAttributes {
  route: string;
}
