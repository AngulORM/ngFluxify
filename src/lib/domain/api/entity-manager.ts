import {AbstractEntity} from '../entities';
import {Observable, throwError} from 'rxjs';
import {AngularRestModule} from '../../angular-rest.module';
import {NgRedux} from '@angular-redux/store';
import {AbstractReducer, IAppState} from '../../stores';
import {EntityDescriptor} from '../descriptors';
import {Map} from 'immutable';
import {IEntityService} from '../../services';
import {filter, map, mergeMap, take} from 'rxjs/operators';
import {BaseActionsManager} from '../../stores/base.action';
import {ActionsManagerFactory} from '../../stores/action.factory';
import {ErrorAction, RequestAction, ResponseAction} from '../../stores/actions';
import {TransactionState} from './transaction.state';

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

      return EntityManager.ngRedux.select<TransactionState>([this.entityDescriptor.name, 'transactions', transactionId])
        .pipe(filter(transaction => [TransactionState.finished, TransactionState.error].indexOf(transaction.state) !== -1))
        .pipe<T>(mergeMap((transaction: TransactionState) => {
          if (transaction.state === TransactionState.error) {
            throwError(transaction.error);
          }
          return EntityManager.ngRedux.select<T>([this.entityDescriptor.name, 'entities', transaction.entities[0]]);
        }));
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

      return EntityManager.ngRedux.select<TransactionState>([this.entityDescriptor.name, 'transactions', transactionId])
        .pipe(filter(transaction => [TransactionState.finished, TransactionState.error].indexOf(transaction.state) !== -1))
        .pipe<T[]>(mergeMap((transaction: TransactionState) => {
          if (transaction.state === TransactionState.error) {
            throwError(transaction.error);
          }
          return EntityManager.ngRedux.select<Map<number, T>>([this.entityDescriptor.name, 'entities']).pipe(map(entities => entities.toArray()));
        }));
    }

    return EntityManager.ngRedux.select([this.entityDescriptor.name, 'entities']).pipe(map((entities: Map<number, T>): T[] => entities.toArray()));
  }

  save(entity: T): Promise<Observable<T>> {
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

    return new Promise<Observable<T>>((resolve, reject) => {
      EntityManager.ngRedux
        .select<TransactionState>([this.entityDescriptor.name, 'transactions', transactionId])
        .pipe(filter(transaction => [TransactionState.finished, TransactionState.error].indexOf(transaction.state) !== -1))
        .pipe(map((transaction: TransactionState) => {
          if (transaction.state === TransactionState.error || transaction.entities.length < 1) {
            throwError(transaction.error);
          }
          return transaction;
        }))
        .pipe(take(1))
        .toPromise()
        .then(transaction => resolve(EntityManager.ngRedux.select<T>([this.entityDescriptor.name, 'entities', transaction.entities[0]])))
        .catch(error => reject(error));
    });
  }

  get count(): Observable<number> {
    return EntityManager.ngRedux.select<Map<number, T>>([this.entityDescriptor.name, 'entities']).pipe(map(entities => entities.toArray().length));
  }

  delete(entity: T): Promise<number> {
    const transactionId = this.transactionId;
    EntityManager.ngRedux.dispatch(<RequestAction>{type: this.actionManager.getRequestAction(AbstractReducer.ACTION_DELETE), transactionId: transactionId});
    this.service.delete(entity.id)
      .then(data => EntityManager.ngRedux.dispatch(<ResponseAction>{type: this.actionManager.getResponseAction(AbstractReducer.ACTION_DELETE), transactionId: transactionId, data: entity.id}))
      .catch(error => EntityManager.ngRedux.dispatch(<ErrorAction>{type: this.actionManager.getErrorAction(AbstractReducer.ACTION_DELETE), transactionId: transactionId, error: error}));

    return EntityManager.ngRedux.select<TransactionState>([this.entityDescriptor.name, 'transactions', transactionId])
      .pipe(filter(transaction => [TransactionState.finished, TransactionState.error].indexOf(transaction.state) !== -1))
      .pipe<number>(map((transaction: TransactionState): number => {
        if (transaction.state === TransactionState.error) {
          throwError(transaction.error);
        }
        return transaction.entities[0];
      }))
      .pipe<number>(take(1))
      .toPromise<number>();
  }

  isExpired(id: number): boolean {
    return false;
  }
}
