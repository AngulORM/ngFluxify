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
import {ErrorAction, RequestAction, ResponseAction} from '../../stores/actions';

export class EntityManager<T extends AbstractEntity> {
  private lastTransactionId = 0;

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

  private get transactionId(): number {
    return ++this.lastTransactionId;
  }

  getById(id: number): Observable<T> {
    if (!id || id < 0) {
      throw new Error(`${this.entityDescriptor.class.name.toString()}/GetById: Wrong entity id: ${id}`);
    }

    if (!this.entities.has(id) || this.isExpired(id)) {
      const transactionId = this.transactionId;
      EntityManager.ngRedux.dispatch(<RequestAction>{type: this.actionManager.getRequestAction(AbstractReducer.ACTION_READ), transactionId: transactionId});
      this.service.read(id)
        .then(data => EntityManager.ngRedux.dispatch(<ResponseAction>{type: this.actionManager.getResponseAction(AbstractReducer.ACTION_READ), transactionId: transactionId, data: data}))
        .catch(error => EntityManager.ngRedux.dispatch(<ErrorAction>{type: this.actionManager.getErrorAction(AbstractReducer.ACTION_READ), transactionId: transactionId, error: error}));
    }

    return EntityManager.ngRedux.select([this.entityDescriptor.name, 'entities', id]);
  }

  getAll(): Observable<T[]> {
    if (!this.isComplete) {
      const transactionId = this.transactionId;
      EntityManager.ngRedux.dispatch(<RequestAction>{type: this.actionManager.getRequestAction(AbstractReducer.ACTION_READ), transactionId: transactionId});
      this.service.readAll()
        .then(data => EntityManager.ngRedux.dispatch(<ResponseAction>{type: this.actionManager.getResponseAction(AbstractReducer.ACTION_READ), transactionId: transactionId, data: data}))
        .catch(error => EntityManager.ngRedux.dispatch(<ErrorAction>{type: this.actionManager.getErrorAction(AbstractReducer.ACTION_READ), transactionId: transactionId, error: error}));
    }

    return EntityManager.ngRedux.select([this.entityDescriptor.name, 'entities']).pipe(map((entities: Map<number, T>): T[] => entities.toArray()));
  }

  save(entity: T): Observable<T> {
    const transactionId = this.transactionId;
    if (entity.id !== -1) {
      EntityManager.ngRedux.dispatch(<RequestAction>{type: this.actionManager.getRequestAction(AbstractReducer.ACTION_UPDATE), transactionId: transactionId});
      this.service.update(entity)
        .then(data => EntityManager.ngRedux.dispatch(<ResponseAction>{type: this.actionManager.getResponseAction(AbstractReducer.ACTION_UPDATE), transactionId: transactionId, data: data}))
        .catch(error => EntityManager.ngRedux.dispatch(<ErrorAction>{type: this.actionManager.getErrorAction(AbstractReducer.ACTION_UPDATE), transactionId: transactionId, error: error}));
    } else {
      EntityManager.ngRedux.dispatch(<RequestAction>{type: this.actionManager.getRequestAction(AbstractReducer.ACTION_CREATE), transactionId: transactionId});
      this.service.create(entity)
        .then(data => EntityManager.ngRedux.dispatch(<ResponseAction>{type: this.actionManager.getResponseAction(AbstractReducer.ACTION_CREATE), transactionId: transactionId, data: data}))
        .catch(error => EntityManager.ngRedux.dispatch(<ErrorAction>{type: this.actionManager.getErrorAction(AbstractReducer.ACTION_CREATE), transactionId: transactionId, error: error}));
    }

    return EntityManager.ngRedux.select([this.entityDescriptor.name, 'entities', entity.id]);
  }

  isExpired(id: number): boolean {
    return false;
  }
}
