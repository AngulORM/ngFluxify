import {BehaviorSubject, isObservable, Observable, of, throwError} from 'rxjs';
import {NgRedux} from '@angular-redux/store';
import {Injectable} from "@angular/core";

import {Map} from 'immutable';
import {filter, map, mergeMap, take} from 'rxjs/operators';
import {
  AbstractReducer,
  ActionsManagerFactory,
  BaseActionsManager,
  ErrorAction,
  IAppState, RequestAction,
  ResponseAction
} from '../../stores';
import {EntityDescriptor} from '../../descriptors';
import {MethodNotAllowedError} from '../../errors';
import {NgReduxService} from '../ng-redux.service';
import {IDataService, IManagerService} from "../interfaces";
import {TransactionModel} from "../../models";
import {EntityModel} from "../../decorators";
@Injectable()
export class ManagerService<T, K extends IDataService<T>> implements IManagerService<T> {
  protected lastTransactionId = 0;
  protected lastReadAllTransactionId: number;

  constructor(
    protected entityDescriptor: EntityDescriptor<T>,
    protected dataService: K,
    protected ngReduxService: NgReduxService,
    public ngRedux: NgRedux<IAppState>) {
    ngReduxService.registerEntity(entityDescriptor);
  }

  get count$(): Observable<number> {
    const subject: BehaviorSubject<number> = new BehaviorSubject(this.entities.toArray().length);
    this.ngRedux
      .select<Map<number, T>>([this.entityDescriptor.name, 'entities'])
      .pipe(map(entities => entities.toArray().length))
      .subscribe(subject);

    return subject.asObservable();
  }

  get entities(): Map<any, T> {
    return this.state.get('entities');
  }

  get isComplete(): boolean {
    return this.state.get('isComplete');
  }

  protected get transactions(): Map<number, TransactionModel> {
    return this.state.get('transactions');
  }

  protected get state(): any {
    return this.ngRedux.getState()[this.entityDescriptor.name];
  }

  protected get actionManager(): BaseActionsManager {
    return ActionsManagerFactory.getActionsManager(this.entityDescriptor.name);
  }

  protected get transactionId(): number {
    return ++this.lastTransactionId;
  }

  protected get isGettingAll(): boolean {
    return this.lastReadAllTransactionId && this.transactions.get(this.lastReadAllTransactionId) && this.transactions.get(this.lastReadAllTransactionId).state === TransactionModel.started;
  }

  protected get entityModel(): EntityModel<T> {
    return EntityModel.getModel(this.entityDescriptor.class);
  }

  /**
   * @param id
   * @throws MethodNotAllowedError
   * @throws Error
   */
  read(id: any): Observable<T> {
    if (!id) {
      throw new Error(`${this.entityDescriptor.class.name.toString()}/GetById: Wrong entity id: ${id}`);
    }

    const subject: BehaviorSubject<T> = new BehaviorSubject(this.entities.get(id));

    if ((!this.entities.has(id) || this.isExpired(id)) && !this.isGettingAll) {
      if (!this.entityDescriptor.canRead) {
        throw new MethodNotAllowedError('This entity does not provide getById');
      }

      const transactionId = this.transactionId;
      this.ngRedux.dispatch(<RequestAction>{
        type: this.actionManager.getRequestAction(AbstractReducer.ACTION_READ),
        transactionId: transactionId,
        arguments: [id]
      });

      const serviceResponse = this.dataService.read(id);
      if (isObservable(serviceResponse)) {
        serviceResponse.subscribe(
          data => {
            this.ngRedux.dispatch(<ResponseAction>{
              type: this.actionManager.getResponseAction(AbstractReducer.ACTION_READ),
              transactionId: transactionId,
              data: data
            });
          },
          error => this.ngRedux.dispatch(<ErrorAction>{
            type: this.actionManager.getErrorAction(AbstractReducer.ACTION_READ),
            transactionId: transactionId,
            error: error
          }));
      } else {
        (<Promise<any>>serviceResponse)
          .then(data => {
            this.ngRedux.dispatch(<ResponseAction>{
              type: this.actionManager.getResponseAction(AbstractReducer.ACTION_READ),
              transactionId: transactionId,
              data: data
            });
          })
          .catch(error => this.ngRedux.dispatch(<ErrorAction>{
            type: this.actionManager.getErrorAction(AbstractReducer.ACTION_READ),
            transactionId: transactionId,
            error: error
          }));
      }

      this.ngRedux.select<TransactionModel>([this.entityDescriptor.name, 'transactions', transactionId])
        .pipe(filter(transaction => transaction && [TransactionModel.finished, TransactionModel.error].indexOf(transaction.state) !== -1))
        .pipe<T>(mergeMap((transaction: TransactionModel) => {
          if (transaction.state === TransactionModel.error) {
            return throwError(transaction.error);
          }
          return this.ngRedux.select<T>([this.entityDescriptor.name, 'entities', transaction.entities[0]]);
        }))
        .subscribe(subject);
    } else {
      this.ngRedux.select([this.entityDescriptor.name, 'entities', id]).subscribe(subject);
    }

    return subject.asObservable().pipe(filter(element => !!element));
  }

  /**
   * @throws MethodNotAllowedError
   */
  readAll(): Observable<T[]> {
    const subject: BehaviorSubject<T[]> = new BehaviorSubject(this.entities.toArray());

    if ((!this.isComplete || this.isExpired()) && !this.isGettingAll) {
      if (!this.entityDescriptor.canReadAll) {
        throw new MethodNotAllowedError('This entity does not provide getAll');
      }

      const transactionId = this.transactionId;
      this.lastReadAllTransactionId = transactionId;
      this.ngRedux.dispatch(<RequestAction>{
        type: this.actionManager.getRequestAction(AbstractReducer.ACTION_READ_ALL),
        transactionId: transactionId
      });

      const serviceResponse = this.dataService.readAll();
      if (isObservable(serviceResponse)) {
        serviceResponse.subscribe(
          data => {
            this.ngRedux.dispatch(<ResponseAction>{
              type: this.actionManager.getResponseAction(AbstractReducer.ACTION_READ_ALL),
              transactionId: transactionId,
              data: data,
              isComplete: true
            });
          },
          error => this.ngRedux.dispatch(<ErrorAction>{
            type: this.actionManager.getErrorAction(AbstractReducer.ACTION_READ_ALL),
            transactionId: transactionId,
            error: error
          }));
      } else {
        (<Promise<any>>serviceResponse)
          .then(data => {
            this.ngRedux.dispatch(<ResponseAction>{
              type: this.actionManager.getResponseAction(AbstractReducer.ACTION_READ_ALL),
              transactionId: transactionId,
              data: data,
              isComplete: true
            });
          })
          .catch(error => this.ngRedux.dispatch(<ErrorAction>{
            type: this.actionManager.getErrorAction(AbstractReducer.ACTION_READ_ALL),
            transactionId: transactionId,
            error: error
          }));
      }

      this.ngRedux.select<TransactionModel>([this.entityDescriptor.name, 'transactions', transactionId])
        .pipe(filter(transaction => transaction && [TransactionModel.finished, TransactionModel.error].indexOf(transaction.state) !== -1))
        .pipe<T[]>(mergeMap((transaction: TransactionModel) => {
          if (transaction.state === TransactionModel.error) {

            return throwError(transaction.error);
          }
          return this.ngRedux.select<Map<any, T>>([this.entityDescriptor.name, 'entities'])
            .pipe(map(entities => entities.toArray()));
        })).subscribe(subject);
    } else {
      this.ngRedux.select([this.entityDescriptor.name, 'entities'])
        .pipe(map((entities: Map<any, T>): T[] => entities.toArray()))
        .subscribe(subject);
    }

    return subject.asObservable();
  }

  /**
   * @param entity
   * @throws MethodNotAllowedError
   */
  save(entity: T): Promise<Observable<T>> {
    const transactionId = this.transactionId;
    if (!!this.entityModel.primary(entity) && this.entities.has(this.entityModel.primary(entity))) {
      if (!this.entityDescriptor.canUpdate) {
        throw new MethodNotAllowedError('This entity does not provide update');
      }

      this.ngRedux.dispatch(<RequestAction>{
        type: this.actionManager.getRequestAction(AbstractReducer.ACTION_UPDATE),
        transactionId: transactionId,
        arguments: [entity]
      });
      this.dataService.update(entity)
        .then(data => {
          this.ngRedux.dispatch(<ResponseAction>{
            type: this.actionManager.getResponseAction(AbstractReducer.ACTION_UPDATE),
            transactionId: transactionId,
            data: data
          });
        })
        .catch(error => this.ngRedux.dispatch(<ErrorAction>{
          type: this.actionManager.getErrorAction(AbstractReducer.ACTION_UPDATE),
          transactionId: transactionId,
          error: error
        }));
    } else {
      if (!this.entityDescriptor.canCreate) {
        throw new MethodNotAllowedError('This entity does not provide create');
      }

      this.ngRedux.dispatch(<RequestAction>{
        type: this.actionManager.getRequestAction(AbstractReducer.ACTION_CREATE),
        transactionId: transactionId,
        arguments: [entity]
      });
      this.dataService.create(entity)
        .then(data => {
          this.ngRedux.dispatch(<ResponseAction>{
            type: this.actionManager.getResponseAction(AbstractReducer.ACTION_CREATE),
            transactionId: transactionId,
            data: data
          });
        })
        .catch(error => this.ngRedux.dispatch(<ErrorAction>{
          type: this.actionManager.getErrorAction(AbstractReducer.ACTION_CREATE),
          transactionId: transactionId,
          error: error
        }));
    }

    return new Promise<Observable<T>>((resolve, reject) => {
      this.ngRedux
        .select<TransactionModel>([this.entityDescriptor.name, 'transactions', transactionId])
        .pipe(filter(transaction => transaction && [TransactionModel.finished, TransactionModel.error].indexOf(transaction.state) !== -1))
        .pipe(mergeMap((transaction: TransactionModel) => {
          if (transaction.state === TransactionModel.error || transaction.entities.length < 1) {
            return throwError(transaction.error);
          }
          return of(transaction);
        }))
        .pipe(take(1))
        .toPromise()
        .then(transaction => {
          const subject: BehaviorSubject<T> = new BehaviorSubject(this.entities.get(transaction.entities[0]));
          this.ngRedux.select<T>([this.entityDescriptor.name, 'entities', transaction.entities[0]]).subscribe(
            next => subject.next(next),
            error => subject.error(error),
            () => subject.complete()
          );

          resolve(subject.asObservable());
        })
        .catch(error => reject(error));
    });
  }

  /**
   * @param entity
   * @throws MethodNotAllowedError
   */
  delete(entity: T): Promise<any> {
    if (!this.entityDescriptor.canDelete) {
      throw new MethodNotAllowedError('This entity does not provide delete');
    }

    const transactionId = this.transactionId;
    this.ngRedux.dispatch(<RequestAction>{
      type: this.actionManager.getRequestAction(AbstractReducer.ACTION_DELETE),
      transactionId: transactionId,
      arguments: [this.entityModel.primary(entity)]
    });
    this.dataService.delete(this.entityModel.primary(entity))
      .then(_ => {
        this.ngRedux.dispatch(<ResponseAction>{
          type: this.actionManager.getResponseAction(AbstractReducer.ACTION_DELETE),
          transactionId: transactionId,
          data: this.entityModel.primary(entity)
        });
      })
      .catch(error => this.ngRedux.dispatch(<ErrorAction>{
        type: this.actionManager.getErrorAction(AbstractReducer.ACTION_DELETE),
        transactionId: transactionId,
        error: error
      }));

    return this.ngRedux.select<TransactionModel>([this.entityDescriptor.name, 'transactions', transactionId])
      .pipe(filter(transaction => transaction && [TransactionModel.finished, TransactionModel.error].indexOf(transaction.state) !== -1))
      .pipe<any>(mergeMap((transaction: TransactionModel): any => {
        if (transaction.state === TransactionModel.error) {
          return throwError(transaction.error);
        }
        return of(transaction.entities[0]);
      }))
      .pipe<any>(take(1))
      .toPromise<any>();
  }

  call(action: string[], callable: (...args) => Promise<any> | Observable<any>, ...args): Observable<TransactionModel> {
    const transactionId = this.transactionId;
    this.ngRedux.dispatch(<RequestAction>{
      type: this.actionManager.getRequestAction(action),
      transactionId: transactionId,
      arguments: args
    });

    const serviceResponse = callable.call(this.dataService, ...args);
    if (isObservable(serviceResponse)) {
      serviceResponse.subscribe(
        data => this.ngRedux.dispatch(<ResponseAction>{
          type: this.actionManager.getResponseAction(action),
          transactionId: transactionId,
          data: data
        }),
        error => this.ngRedux.dispatch(<ErrorAction>{
          type: this.actionManager.getErrorAction(action),
          transactionId: transactionId,
          error: error
        }));
    } else {
      (<Promise<any>>serviceResponse)
        .then(data => this.ngRedux.dispatch(<ResponseAction>{
          type: this.actionManager.getResponseAction(action),
          transactionId: transactionId,
          data: data
        }))
        .catch(error => this.ngRedux.dispatch(<ErrorAction>{
          type: this.actionManager.getErrorAction(action),
          transactionId: transactionId,
          error: error
        }));
    }

    const subject: BehaviorSubject<TransactionModel> = new BehaviorSubject(this.state.get('transactions').get(transactionId));
    this.ngRedux.select<TransactionModel>([this.entityDescriptor.name, 'transactions', transactionId]).subscribe(
      next => subject.next(next),
      error => subject.error(error),
      () => subject.complete()
    );

    return subject.asObservable();
  }

  callAndSelect<K>(action: string[], selector: any | any[], defaultValue: K, callable: (...args) => Promise<any> | Observable<any>, ...args): Observable<K> {
    if (!Array.isArray(selector)) {
      selector = [selector];
    }

    const subject = new BehaviorSubject<K>(this.state.getIn(selector, defaultValue));

    this.call(action, callable, ...args)
      .pipe(filter(transaction => transaction && [TransactionModel.finished, TransactionModel.error].indexOf(transaction.state) !== -1))
      .pipe<K>(mergeMap((transaction: TransactionModel) => {
        if (transaction.state === TransactionModel.error) {
          return throwError(transaction.error);
        }
        return this.ngRedux.select<K>([this.entityDescriptor.name, ...selector]);
      })).subscribe(
      next => subject.next(next),
      error => subject.error(error),
      () => subject.complete()
    );

    return subject.asObservable();
  }

  callAndThen(action: string[], callable: (...args) => Promise<any> | Observable<any>, ...args): Promise<any> {
    return this.call(action, callable, ...args)
      .pipe(filter(transaction => {
        return transaction && [TransactionModel.finished, TransactionModel.error].indexOf(transaction.state) !== -1;
      }))
      .pipe(take(1))
      .pipe(mergeMap((transaction: TransactionModel) => {
        if (transaction.state === TransactionModel.error) {
          return throwError(transaction.error);
        }

        return of(null);
      }))
      .toPromise();
  }

  reset() {
    this.ngRedux.dispatch(<RequestAction>{type: this.actionManager.getAction(AbstractReducer.ACTION_RESET)});
  }

  isExpired(id?: any): boolean {
    return this.entityDescriptor.expirationDetectionStrategy(id);
  }
}
