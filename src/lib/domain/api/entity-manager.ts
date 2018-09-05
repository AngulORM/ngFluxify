import {AbstractEntity} from '../entities';
import {Observable} from 'rxjs';
import {AngularRestModule} from '../../angular-rest.module';
import {NgRedux} from '@angular-redux/store';
import {IAppState} from '../../stores';
import {EntityDescriptor} from '../descriptors';
import {Map} from 'immutable';
import {IEntityService} from '../../services';

export class EntityManager<T extends AbstractEntity> {
  constructor(private entityDescriptor: EntityDescriptor) {

  }

  static get ngRedux(): NgRedux<IAppState> {
    if (!AngularRestModule.ngRedux) {
      throw new Error('NgRedux not ready yet');
    }

    return AngularRestModule.ngRedux;
  }

  get state(): any {
    return EntityManager.ngRedux.getState()[this.entityDescriptor.name];
  }

  get entities(): Map<number, T> {
    return this.state.get('entities');
  }

  get service(): IEntityService<T> {
    return this.entityDescriptor.class.entityService;
  }

  getById(id: number): Observable<T> {
    if (!id || id < 0) {
      throw new Error(`${this.entityDescriptor.class.name.toString()}/GetById: Wrong entity id: ${id}`);
    }

    if (!this.entities.has(id) || this.isExpired(id)) {
      this.service.read(id);
    }

    return EntityManager.ngRedux.select([this.entityDescriptor.name, 'entities', id]);
  }

  isExpired(id: number): boolean {
    return false;
  }
}
