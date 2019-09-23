import {EntityDescriptor, EntityDescriptorAttributes} from './entity.descriptor';
import {DumbReducer} from '../../stores';
import {RestService} from '../../services';
import {AbstractRestEntity} from '../entities';
import {HttpClient} from '@angular/common/http';

export class RestEntityDescriptor<T extends AbstractRestEntity> extends EntityDescriptor<T> {
  readonly reducerType: any = DumbReducer;
  readonly serviceType: any = RestService;
  readonly serviceDeps: any[] = [HttpClient];
  route: string;

  constructor(attributes: RestEntityDescriptorAttributes) {
    super(attributes);
    this.route = attributes.route;
  }
}

export interface RestEntityDescriptorAttributes extends EntityDescriptorAttributes {
  route: string;
}
