import {AbstractEntity} from '../entities';
import {Observable} from 'rxjs';
import {AngularRestModule} from '../../angular-rest.module';
import {NgRedux} from '@angular-redux/store';
import {AbstractReducer, IAppState} from '../../stores';
import {EntityDescriptor} from '../descriptors';
import {Map} from 'immutable';
import {IEntityService} from '../../services';
import {map} from 'rxjs/operators';
import {BaseActionsManager} from '../../stores/base.action';
import {ActionsManagerFactory} from '../../stores/action.factory';

export class EntityManager<T extends AbstractEntity> {
  constructor(private entityDescriptor: EntityDescriptor) {

  }

  static get ngRedux(): NgRedux<IAppState> {
    if (!AngularRestModule.ngRedux) {
      throw new Error('NgRedux not ready yet');
    }

    return AngularRestModule.ngRedux;
  }

  private get state(): any {
    return EntityManager.ngRedux.getState()[this.entityDescriptor.name];
  }

  private get entities(): Map<number, T> {
    return this.state.get('entities');
  }

  private get isComplete(): Boolean {
    return this.state.get('isComplete');
  }

  private get service(): IEntityService<T> {
    return this.entityDescriptor.class.entityService;
  }

  private get actionManager(): BaseActionsManager {
    return ActionsManagerFactory.getActionsManager(this.entityDescriptor.name);
  }

  getById(id: number): Observable<T> {
    if (!id || id < 0) {
      throw new Error(`${this.entityDescriptor.class.name.toString()}/GetById: Wrong entity id: ${id}`);
    }

    if (!this.entities.has(id) || this.isExpired(id)) {
      EntityManager.ngRedux.dispatch({type: this.actionManager.getRequestAction(AbstractReducer.ACTION_READ)});
      this.service.read(id)
        .then(data => EntityManager.ngRedux.dispatch({type: this.actionManager.getResponseAction(AbstractReducer.ACTION_READ), data: data}))
        .catch(error => EntityManager.ngRedux.dispatch({type: this.actionManager.getErrorAction(AbstractReducer.ACTION_READ), error: error}));
    }

    return EntityManager.ngRedux.select([this.entityDescriptor.name, 'entities', id]);
  }

  getAll(): Observable<T[]> {
    if (!this.isComplete) {
      EntityManager.ngRedux.dispatch({type: this.actionManager.getRequestAction(AbstractReducer.ACTION_READ)});
      this.service.readAll()
        .then(data => EntityManager.ngRedux.dispatch({type: this.actionManager.getResponseAction(AbstractReducer.ACTION_READ), data: data}))
        .catch(error => EntityManager.ngRedux.dispatch({type: this.actionManager.getErrorAction(AbstractReducer.ACTION_READ), error: error}));
    }

    return EntityManager.ngRedux.select([this.entityDescriptor.name, 'entities']).pipe(map((entities: Map<number, T>): T[] => entities.toArray()));
  }

  save(entity: T): Observable<T> {
    if (entity.id !== -1) {
      EntityManager.ngRedux.dispatch({type: this.actionManager.getRequestAction(AbstractReducer.ACTION_UPDATE)});
      this.service.update(entity)
        .then(data => EntityManager.ngRedux.dispatch({type: this.actionManager.getResponseAction(AbstractReducer.ACTION_UPDATE), data: data}))
        .catch(error => EntityManager.ngRedux.dispatch({type: this.actionManager.getErrorAction(AbstractReducer.ACTION_UPDATE), error: error}));
    } else {
      EntityManager.ngRedux.dispatch({type: this.actionManager.getRequestAction(AbstractReducer.ACTION_CREATE)});
      this.service.create(entity)
        .then(data => EntityManager.ngRedux.dispatch({type: this.actionManager.getResponseAction(AbstractReducer.ACTION_CREATE), data: data}))
        .catch(error => EntityManager.ngRedux.dispatch({type: this.actionManager.getErrorAction(AbstractReducer.ACTION_CREATE), error: error}));
    }

    return EntityManager.ngRedux.select([this.entityDescriptor.name, 'entities', entity.id]);
  }

  isExpired(id: number): boolean {
    return false;
  }
}
