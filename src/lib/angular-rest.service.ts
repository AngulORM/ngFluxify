import {Injectable} from '@angular/core';
import {NgRedux} from '@angular-redux/store';
import {IAppState} from './stores/root.store';
import {EntityManager} from './domain/api/entity-manager';
import {AbstractEntity} from './domain/entities/abstract.entity';

@Injectable({
  providedIn: 'root'
})
export class AngularRestService {
  constructor(private ngRedux: NgRedux<IAppState>) {}

    getManager(entityName: any): EntityManager<AbstractEntity> {
    return this.ngRedux.getState()[entityName.name].get('manager');
  }
}
