import {AbstractEntity} from '../entities';
import {BehaviorSubject, isObservable, Observable, throwError} from 'rxjs';
import {NgFluxifyModule} from '../../ng-fluxify.module';
import {NgRedux} from '@angular-redux/store';
import {AbstractReducer, IAppState} from '../../stores';
import {EntityDescriptor} from '../descriptors';
import {Map} from 'immutable';
import {IEntityService, NgReduxService} from '../../services';
import {filter, map, mergeMap, take} from 'rxjs/operators';
import {BaseActionsManager} from '../../stores/base.action';
import {ActionsManagerFactory} from '../../stores/action.factory';
import {ErrorAction, RequestAction, ResponseAction} from '../../stores/actions';
import {TransactionState} from './transaction.state';

// @dynamic
export class EntityManager<T extends AbstractEntity> {
  private lastTransactionId = 0;
  private lastReadAllTransactionId: number;

  constructor(public readonly entityDescriptor: EntityDescriptor) {

  }

  static get isReady(): boolean {
    return !!NgFluxifyModule.injector.get<NgReduxService>(NgReduxService, null);
  }

  static get ngRedux(): NgRedux<IAppState> {
    if (!this.isReady) {
      throw new Error('NgReduxService not ready yet');
    }

    if (!NgFluxifyModule.ngRedux) {
      throw new Error('NgRedux not ready yet');
    }

    return NgFluxifyModule.ngRedux;
  }

  private get state(): any {
    return EntityManager.ngRedux.getState()[this.entityDescriptor.name];
  }

  private get entities(): Map<any, T> {
    return this.state.get('entities');
  }

  private get isComplete(): Boolean {
    return this.state.get('isComplete');
  }

  private get transactions(): Map<number, TransactionState> {
    return this.state.get('transactions');
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

  get count(): Observable<number> {
    const subject: BehaviorSubject<number> = new BehaviorSubject(this.entities.toArray().length);
    EntityManager.ngRedux.select<Map<number, T>>([this.entityDescriptor.name, 'entities']).pipe(map(entities => entities.toArray().length)).subscribe(
      next => subject.next(next),
      error => subject.error(error),
      () => subject.complete()
    );

    return subject.asObservable();
  }

  getById(id: any): Observable<T> {
    if (!id) {
      throw new Error(`${this.entityDescriptor.class.name.toString()}/GetById: Wrong entity id: ${id}`);
    }

    const subject: BehaviorSubject<T> = new BehaviorSubject(this.entities.get(id));

    if ((!this.entities.has(id) || this.isExpired(id)) && (!this.lastReadAllTransactionId || !this.transactions.get(this.lastReadAllTransactionId) || this.transactions.get(this.lastReadAllTransactionId).state !== TransactionState.started)) {
      const transactionId = this.transactionId;
      EntityManager.ngRedux.dispatch(<RequestAction>{
        type: this.actionManager.getRequestAction(AbstractReducer.ACTION_READ),
        transactionId: transactionId
      });

      const serviceResponse = this.service.read(id);
      if (isObservable(serviceResponse)) {
        serviceResponse.subscribe(
          data => EntityManager.ngRedux.dispatch(<ResponseAction>{
            type: this.actionManager.getResponseAction(AbstractReducer.ACTION_READ),
            transactionId: transactionId,
            data: data
          }),
          error => EntityManager.ngRedux.dispatch(<ErrorAction>{
            type: this.actionManager.getErrorAction(AbstractReducer.ACTION_READ),
            transactionId: transactionId,
            error: error
          }));
      } else {
        (<Promise<any>>serviceResponse)
          .then(data => EntityManager.ngRedux.dispatch(<ResponseAction>{
            type: this.actionManager.getResponseAction(AbstractReducer.ACTION_READ),
            transactionId: transactionId,
            data: data
          }))
          .catch(error => EntityManager.ngRedux.dispatch(<ErrorAction>{
            type: this.actionManager.getErrorAction(AbstractReducer.ACTION_READ),
            transactionId: transactionId,
            error: error
          }));
      }

      EntityManager.ngRedux.select<TransactionState>([this.entityDescriptor.name, 'transactions', transactionId])
        .pipe(filter(transaction => [TransactionState.finished, TransactionState.error].indexOf(transaction.state) !== -1))
        .pipe<T>(mergeMap((transaction: TransactionState) => {
          if (transaction.state === TransactionState.error) {
            throwError(transaction.error);
          }
          return EntityManager.ngRedux.select<T>([this.entityDescriptor.name, 'entities', transaction.entities[0]]);
        }))
        .subscribe(
          next => subject.next(next),
          error => subject.error(error),
          () => subject.complete()
        );
    } else {
      EntityManager.ngRedux.select([this.entityDescriptor.name, 'entities', id]).subscribe(
        (next: T) => subject.next(next),
        error => subject.error(error),
        () => subject.complete()
      );
    }

    return subject.asObservable().pipe(filter(element => !!element));
  }

  getAll(): Observable<T[]> {
    const subject: BehaviorSubject<T[]> = new BehaviorSubject(this.entities.toArray());

    if (!this.isComplete) {
      const transactionId = this.transactionId;
      this.lastReadAllTransactionId = transactionId;
      EntityManager.ngRedux.dispatch(<RequestAction>{
        type: this.actionManager.getRequestAction(AbstractReducer.ACTION_READ),
        transactionId: transactionId
      });

      const serviceResponse = this.service.readAll();
      if (isObservable(serviceResponse)) {
        serviceResponse.subscribe(
          data => EntityManager.ngRedux.dispatch(<ResponseAction>{
            type: this.actionManager.getResponseAction(AbstractReducer.ACTION_READ),
            transactionId: transactionId,
            data: data
          }),
          error => EntityManager.ngRedux.dispatch(<ErrorAction>{
            type: this.actionManager.getErrorAction(AbstractReducer.ACTION_READ),
            transactionId: transactionId,
            error: error
          }));
      } else {
        (<Promise<any>>serviceResponse)
          .then(data => EntityManager.ngRedux.dispatch(<ResponseAction>{
            type: this.actionManager.getResponseAction(AbstractReducer.ACTION_READ),
            transactionId: transactionId,
            data: data
          }))
          .catch(error => EntityManager.ngRedux.dispatch(<ErrorAction>{
            type: this.actionManager.getErrorAction(AbstractReducer.ACTION_READ),
            transactionId: transactionId,
            error: error
          }));
      }

      EntityManager.ngRedux.select<TransactionState>([this.entityDescriptor.name, 'transactions', transactionId])
        .pipe(filter(transaction => [TransactionState.finished, TransactionState.error].indexOf(transaction.state) !== -1))
        .pipe<T[]>(mergeMap((transaction: TransactionState) => {
          if (transaction.state === TransactionState.error) {

            throwError(transaction.error);
          }
          return EntityManager.ngRedux.select<Map<any, T>>([this.entityDescriptor.name, 'entities'])
            .pipe(map(entities => entities.toArray()));
        })).subscribe(
        next => subject.next(next),
        error => subject.error(error),
        () => subject.complete()
      );
    } else {
      EntityManager.ngRedux.select([this.entityDescriptor.name, 'entities'])
        .pipe(map((entities: Map<any, T>): T[] => entities.toArray()))
        .subscribe(
          next => subject.next(next),
          error => subject.error(error),
          () => subject.complete()
        );
    }

    return subject.asObservable();
  }

  save(entity: T): Promise<Observable<T>> {
    const transactionId = this.transactionId;
    if (!!entity.primary) {
      EntityManager.ngRedux.dispatch(<RequestAction>{
        type: this.actionManager.getRequestAction(AbstractReducer.ACTION_UPDATE),
        transactionId: transactionId
      });
      this.service.update(entity)
        .then(data => EntityManager.ngRedux.dispatch(<ResponseAction>{
          type: this.actionManager.getResponseAction(AbstractReducer.ACTION_UPDATE),
          transactionId: transactionId,
          data: data
        }))
        .catch(error => EntityManager.ngRedux.dispatch(<ErrorAction>{
          type: this.actionManager.getErrorAction(AbstractReducer.ACTION_UPDATE),
          transactionId: transactionId,
          error: error
        }));
    } else {
      EntityManager.ngRedux.dispatch(<RequestAction>{
        type: this.actionManager.getRequestAction(AbstractReducer.ACTION_CREATE),
        transactionId: transactionId
      });
      this.service.create(entity)
        .then(data => EntityManager.ngRedux.dispatch(<ResponseAction>{
          type: this.actionManager.getResponseAction(AbstractReducer.ACTION_CREATE),
          transactionId: transactionId,
          data: data
        }))
        .catch(error => EntityManager.ngRedux.dispatch(<ErrorAction>{
          type: this.actionManager.getErrorAction(AbstractReducer.ACTION_CREATE),
          transactionId: transactionId,
          error: error
        }));
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
        .then(transaction => {
          const subject: BehaviorSubject<T> = new BehaviorSubject(this.entities.get(transaction.entities[0]));
          EntityManager.ngRedux.select<T>([this.entityDescriptor.name, 'entities', transaction.entities[0]]).subscribe(
            next => subject.next(next),
            error => subject.error(error),
            () => subject.complete()
          );

          resolve(subject.asObservable());
        })
        .catch(error => reject(error));
    });
  }

  delete(entity: T): Promise<any> {
    const transactionId = this.transactionId;
    EntityManager.ngRedux.dispatch(<RequestAction>{
      type: this.actionManager.getRequestAction(AbstractReducer.ACTION_DELETE),
      transactionId: transactionId
    });
    this.service.delete(entity.primary)
      .then(data => EntityManager.ngRedux.dispatch(<ResponseAction>{
        type: this.actionManager.getResponseAction(AbstractReducer.ACTION_DELETE),
        transactionId: transactionId,
        data: entity.primary
      }))
      .catch(error => EntityManager.ngRedux.dispatch(<ErrorAction>{
        type: this.actionManager.getErrorAction(AbstractReducer.ACTION_DELETE),
        transactionId: transactionId,
        error: error
      }));

    return EntityManager.ngRedux.select<TransactionState>([this.entityDescriptor.name, 'transactions', transactionId])
      .pipe(filter(transaction => [TransactionState.finished, TransactionState.error].indexOf(transaction.state) !== -1))
      .pipe<any>(map((transaction: TransactionState): any => {
        if (transaction.state === TransactionState.error) {
          throwError(transaction.error);
        }
        return transaction.entities[0];
      }))
      .pipe<any>(take(1))
      .toPromise<any>();
  }

  call(action: string[], callable: (...args) => Promise<any> | Observable<any>, ...args): Observable<TransactionState> {
    const transactionId = this.transactionId;
    EntityManager.ngRedux.dispatch(<RequestAction>{
      type: this.actionManager.getRequestAction(action),
      transactionId: transactionId
    });

    const serviceResponse = callable.call(this.service, ...args);
    if (isObservable(serviceResponse)) {
      serviceResponse.subscribe(
        data => EntityManager.ngRedux.dispatch(<ResponseAction>{
          type: this.actionManager.getResponseAction(action),
          transactionId: transactionId,
          data: data
        }),
        error => EntityManager.ngRedux.dispatch(<ErrorAction>{
          type: this.actionManager.getErrorAction(action),
          transactionId: transactionId,
          error: error
        }));
    } else {
      (<Promise<any>>serviceResponse)
        .then(data => EntityManager.ngRedux.dispatch(<ResponseAction>{
          type: this.actionManager.getResponseAction(action),
          transactionId: transactionId,
          data: data
        }))
        .catch(error => EntityManager.ngRedux.dispatch(<ErrorAction>{
          type: this.actionManager.getErrorAction(action),
          transactionId: transactionId,
          error: error
        }));
    }

    const subject: BehaviorSubject<TransactionState> = new BehaviorSubject(this.state.get('transactions').get(transactionId));
    EntityManager.ngRedux.select<TransactionState>([this.entityDescriptor.name, 'transactions', transactionId]).subscribe(
      next => subject.next(next),
      error => subject.error(error),
      () => subject.complete()
    );

    return subject.asObservable();
  }

  isExpired(id: any): boolean {
    return false;
  }
}
