import {EntityDescriptor, EntityDescriptorAttributes} from './entity.descriptor';
import {HttpClient} from '@angular/common/http';
import {isFunction} from 'rxjs/internal-compatibility';

import {DumbReducer} from '../../stores';
import {AbstractRestEntity} from '../entities';
import {RestService} from '../../services/rest-service';

export class RestEntityDescriptor<T extends AbstractRestEntity> extends EntityDescriptor<T> {
  readonly reducerType: any = DumbReducer;
  readonly serviceType: any = RestService;
  readonly serviceDeps: any[] = [HttpClient];
  constructor(attributes: RestEntityDescriptorAttributes) {
    super(attributes);
    this._route = attributes.route;
  }

  private _route: string | (() => string);

  get route(): string {
    if (isFunction(this._route)) {
      return this._route();
    }

    return this._route;
  }
}

export interface RestEntityDescriptorAttributes extends EntityDescriptorAttributes {
  route: string | (() => string);
}
