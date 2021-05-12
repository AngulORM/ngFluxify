import {BehaviorSubject, isObservable, Observable, of, throwError} from 'rxjs';
import {NgRedux} from '@angular-redux/store';
import {Injectable} from "@angular/core";
import {Map} from 'immutable';
import {filter, map, mergeMap, switchMap, take} from 'rxjs/operators';

import {
  AbstractReducer,
  ActionsManagerFactory,
  BaseActionsManager,
  ErrorAction,
  IAppState,
  RequestAction,
  ResponseAction
} from '../../stores';
import {EntityDescriptor} from '../../descriptors';
import {MethodNotAllowedError} from '../../errors';
import {NgReduxService} from '../ng-redux.service';
import {IDataService, IManagerService} from "../interfaces";
import {TransactionModel} from "../../models";
import {EntityData, EntityModel, EntityType, getData} from "../../decorators";

@Injectable()
export class ManagerService<T extends Object> implements IManagerService<T> {
  protected lastTransactionId = 0;
  protected lastReadAllTransactionId: number;

  protected entities$: Observable<T[]>;

  constructor(
    protected entityDescriptor: EntityDescriptor<T>,
    protected dataService: IDataService<T>,
    protected ngReduxService: NgReduxService,
    public ngRedux: NgRedux<IAppState>) {
    ngReduxService.registerEntity(entityDescriptor);

    this.entities$ = this.ngRedux.select([this.entityDescriptor.name, 'entities']).pipe(
      map((entities: Map<any, EntityData<T>>) => entities.toArray()),
      map(entities => entities.map(entity => this.entityFromData(entity)))
    );
  }

  get count$(): Observable<number> {
    const subject: BehaviorSubject<number> = new BehaviorSubject(this.entitiesData.toArray().length);
    this.ngRedux
      .select<Map<number, T>>([this.entityDescriptor.name, 'entities'])
      .pipe(map(entities => entities.toArray().length))
      .subscribe(subject);

    return subject.asObservable();
  }

  get entitiesData(): Map<any, EntityData<T>> {
    return this.state.get('entities');
  }

  get entities(): EntityType<T>[] {
    return this.entitiesData.toArray().map(data => this.entityFromData(data));
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

  protected entityFromData(data: EntityData<T>): EntityType<T> {
    const entity = new this.entityDescriptor.class();

    Object.keys(data).forEach(key => {
      try {
        getData(entity)[key] = data[key]
      } catch (_) {
      }
    });

    return entity;
  }

  protected entity(id: any): Observable<T> {
    return this.ngRedux.select([this.entityDescriptor.name, 'entities', id]).pipe(
      map((entity: EntityData<T>) => this.entityFromData(entity))
    );
  }

  protected observeTransaction(transactionId: number): Observable<any[] | never> {
    return this.ngRedux.select<TransactionModel>([this.entityDescriptor.name, 'transactions', transactionId]).pipe(
      filter(transaction => transaction && [TransactionModel.finished, TransactionModel.error].indexOf(transaction.state) !== -1),
      mergeMap((transaction: TransactionModel) => {
        if (transaction.state === TransactionModel.error) {
          return throwError(transaction.error);
        }

        return of(transaction.entities);
      })
    );
  }

  /**
   * @param id
   * @throws MethodNotAllowedError
   * @throws Error
   */
  read(id: any): Observable<EntityType<T>> {
    if (!id) {
      throw new Error(`${this.entityDescriptor.class.name.toString()}/GetById: Wrong entity id: ${id}`);
    }

    const subject: BehaviorSubject<EntityType<T>> = new BehaviorSubject(this.entityFromData(this.entitiesData.get(id)));

    if ((!this.entitiesData.has(id) || this.isExpired(id)) && !this.isGettingAll) {
      if (!this.entityDescriptor.canRead) {
        throw new MethodNotAllowedError('This entity does not provide getById');
      }

      const transactionId = this.transactionId;
      this.dispatchRequest(AbstractReducer.ACTION_READ, transactionId, {arguments: [id]});

      const serviceResponse = this.dataService.read(id);
      if (isObservable(serviceResponse)) {
        serviceResponse.subscribe(
          data => this.dispatchResponse(AbstractReducer.ACTION_READ, transactionId, {data: data}),
          error => this.dispatchError(AbstractReducer.ACTION_READ, transactionId, {error: error})
        );
      } else {
        (<Promise<any>>serviceResponse)
          .then(data => this.dispatchResponse(AbstractReducer.ACTION_READ, transactionId, {data: data}))
          .catch(error => this.dispatchError(AbstractReducer.ACTION_READ, transactionId, {error: error}));
      }

      this.observeTransaction(transactionId).pipe(
        switchMap(([entityId]) => this.entity(entityId))
      ).subscribe(subject);
    } else {
      this.entity(id).subscribe(subject);
    }

    return subject.asObservable().pipe(
      filter(element => !!element)
    );
  }

  /**
   * @throws MethodNotAllowedError
   */
  readAll(): Observable<EntityType<T>[]> {
    const subject: BehaviorSubject<EntityType<T>[]> = new BehaviorSubject(this.entities);

    if ((!this.isComplete || this.isExpired()) && !this.isGettingAll) {
      if (!this.entityDescriptor.canReadAll) {
        throw new MethodNotAllowedError('This entity does not provide getAll');
      }

      const transactionId = this.transactionId;
      this.lastReadAllTransactionId = transactionId;
      this.dispatchRequest(AbstractReducer.ACTION_READ_ALL, transactionId, {});

      const serviceResponse = this.dataService.readAll();
      if (isObservable(serviceResponse)) {
        serviceResponse.subscribe(
          data => this.dispatchResponse(AbstractReducer.ACTION_READ_ALL, transactionId, {data: data, isComplete: true}),
          error => this.dispatchError(AbstractReducer.ACTION_READ_ALL, transactionId, {error: error})
        );
      } else {
        (<Promise<any>>serviceResponse)
          .then(data =>
            this.dispatchResponse(AbstractReducer.ACTION_READ_ALL, transactionId, {data: data, isComplete: true})
          )
          .catch(error => this.dispatchError(AbstractReducer.ACTION_READ_ALL, transactionId, {error: error}));
      }

      this.observeTransaction(transactionId).pipe(mergeMap(_ => this.entities$)).subscribe(subject);
    } else {
      this.entities$.subscribe(subject);
    }

    return subject.asObservable();
  }

  /**
   * @param entity
   * @throws MethodNotAllowedError
   */
  save(entity: EntityType<T>): Promise<Observable<EntityType<T>>> {
    const transactionId = this.transactionId;
    if (!!getData(entity).primary && this.entitiesData.has(getData(entity).primary)) {
      if (!this.entityDescriptor.canUpdate) {
        throw new MethodNotAllowedError('This entity does not provide update');
      }

      this.dispatchRequest(AbstractReducer.ACTION_UPDATE, transactionId, {arguments: [getData(entity)]});
      this.dataService.update(getData(entity))
        .then(data => this.dispatchResponse(AbstractReducer.ACTION_UPDATE, transactionId, {data: data}))
        .catch(error => this.dispatchError(AbstractReducer.ACTION_UPDATE, transactionId, {error: error}));
    } else {
      if (!this.entityDescriptor.canCreate) {
        throw new MethodNotAllowedError('This entity does not provide create');
      }

      this.dispatchRequest(AbstractReducer.ACTION_CREATE, transactionId, {arguments: [getData(entity)]});
      this.dataService.create(getData(entity))
        .then(data => this.dispatchResponse(AbstractReducer.ACTION_CREATE, transactionId, {data: data}))
        .catch(error => this.dispatchError(AbstractReducer.ACTION_CREATE, transactionId, {error: error}));
    }

    return new Promise<Observable<EntityType<T>>>((resolve, reject) => {
      this.observeTransaction(transactionId)
        .pipe(take(1))
        .toPromise()
        .then(([entityId]) => {
          const subject: BehaviorSubject<EntityType<T>> = new BehaviorSubject(this.entityFromData(this.entitiesData.get(entityId)));
          this.entity(entityId).subscribe(subject);

          resolve(subject.asObservable());
        })
        .catch(error => reject(error));
    });
  }

  /**
   * @param entity
   * @throws MethodNotAllowedError
   */
  delete(entity: EntityType<T>): Promise<any> {
    if (!this.entityDescriptor.canDelete) {
      throw new MethodNotAllowedError('This entity does not provide delete');
    }

    const transactionId = this.transactionId;
    this.dispatchRequest(AbstractReducer.ACTION_DELETE, transactionId, {arguments: [getData(entity).primary]});
    this.dataService.delete(getData(entity).primary)
      .then(_ => this.dispatchResponse(AbstractReducer.ACTION_DELETE, transactionId, {data: getData(entity).primary}))
      .catch(error => this.dispatchError(AbstractReducer.ACTION_DELETE, transactionId, {error: error}));

    return this.observeTransaction(transactionId).pipe(
      map(([entityId]) => entityId),
      take(1)
    ).toPromise();
  }

  protected call(action: string[], callable: (...args) => Promise<any> | Observable<any>, ...args): Observable<TransactionModel> {
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
    this.ngRedux.select<TransactionModel>([this.entityDescriptor.name, 'transactions', transactionId]).subscribe(subject);

    return subject.asObservable();
  }

  protected callAndSelect<K>(action: string[], selector: any | any[], defaultValue: K, callable: (...args) => Promise<any> | Observable<any>, ...args): Observable<K> {
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
      })).subscribe(subject);

    return subject.asObservable();
  }

  protected callAndThen(action: string[], callable: (...args) => Promise<any> | Observable<any>, ...args): Promise<any> {
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

  protected isExpired(id?: any): boolean {
    return this.entityDescriptor.expirationDetectionStrategy(id);
  }

  protected dispatchRequest(action: string[], transactionId: number, args: { [key: string]: any }) {
    this.ngRedux.dispatch(<RequestAction>{
      type: this.actionManager.getRequestAction(action),
      transactionId: transactionId,
      ...args
    });
  }

  protected dispatchResponse(action: string[], transactionId: number, args: { [key: string]: any }) {
    this.ngRedux.dispatch(<RequestAction>{
      type: this.actionManager.getResponseAction(action),
      transactionId: transactionId,
      ...args
    });
  }

  protected dispatchError(action: string[], transactionId: number, args: { [key: string]: any }) {
    this.ngRedux.dispatch(<RequestAction>{
      type: this.actionManager.getErrorAction(action),
      transactionId: transactionId,
      ...args
    });
  }

  reset() {
    this.ngRedux.dispatch(<RequestAction>{type: this.actionManager.getAction(AbstractReducer.ACTION_RESET)});
  }
}
