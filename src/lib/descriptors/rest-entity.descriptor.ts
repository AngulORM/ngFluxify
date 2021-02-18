import {HttpClient} from '@angular/common/http';
import {Injectable} from "@angular/core";
import {isFunction} from 'rxjs/internal-compatibility';

import {EntityDescriptor, EntityDescriptorAttributes} from './entity.descriptor';
import {DumbReducer} from '../stores';
import {RestService} from '../services';

@Injectable()
export class RestEntityDescriptor<T> extends EntityDescriptor<T> {
  readonly reducerType = DumbReducer;
  readonly serviceType = RestService;
  readonly serviceDeps = [HttpClient];

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
