import {Map} from 'immutable';
import {AnyAction, Reducer} from 'redux';
import {AbstractEntity} from '../domain/entities';
import {BaseActionsManager} from './base.action';
import {ActionsManagerFactory} from './action.factory';
import {ErrorAction, RequestAction, ResponseAction} from './actions';
import {TransactionState} from '../domain/api';
import {isNumber} from 'util';

const INITIAL_STATE: Map<string, any> = Map({
  state: '',
  entities: Map<number, AbstractEntity>(),
  isComplete: false,
  transactions: Map<number, TransactionState>()
});

// @dynamic
export abstract class AbstractReducer<T extends AbstractEntity> {
  static readonly ACTION_CREATE = ['CREATE'];
  static readonly ACTION_READ = ['READ'];
  static readonly ACTION_UPDATE = ['UPDATE'];
  static readonly ACTION_DELETE = ['DELETE'];

  private state: Map<string, any> = INITIAL_STATE;
  protected readonly actionsManager: BaseActionsManager;
  protected setCompleted = false;

  constructor(identifier: string) {
    this.actionsManager = ActionsManagerFactory.getActionsManager(identifier);
    this.actionsManager.addActionSet(AbstractReducer.ACTION_CREATE);
    this.actionsManager.addActionSet(AbstractReducer.ACTION_READ);
    this.actionsManager.addActionSet(AbstractReducer.ACTION_UPDATE);
    this.actionsManager.addActionSet(AbstractReducer.ACTION_DELETE);
  }

  public createReducer(): Reducer<any> {
    return (state: Map<string, any> = this.state, action: AnyAction): Map<string, any> => {
      if ((<string>action.type).match(this.actionsManager.getActionScheme())) {
        state = state.set('state', action.type);
        this.setCompleted = false;

        switch (action.type) {
          case this.actionsManager.getRequestAction(AbstractReducer.ACTION_CREATE):
          case this.actionsManager.getRequestAction(AbstractReducer.ACTION_READ):
          case this.actionsManager.getRequestAction(AbstractReducer.ACTION_UPDATE):
          case this.actionsManager.getRequestAction(AbstractReducer.ACTION_DELETE):
            state = this.startTransaction(<RequestAction>action, state);
            break;
          case this.actionsManager.getErrorAction(AbstractReducer.ACTION_CREATE):
          case this.actionsManager.getErrorAction(AbstractReducer.ACTION_READ):
          case this.actionsManager.getErrorAction(AbstractReducer.ACTION_UPDATE):
          case this.actionsManager.getErrorAction(AbstractReducer.ACTION_DELETE):
            state = this.errorTransaction(<ErrorAction>action, state);
            break;
          case this.actionsManager.getResponseAction(AbstractReducer.ACTION_CREATE):
            const entitiesCreated = this.create(action);
            state = this.setEntities(state, entitiesCreated);
            state = this.finishTransaction(<ResponseAction>action, state, entitiesCreated);
            break;
          case this.actionsManager.getResponseAction(AbstractReducer.ACTION_READ):
            const entitiesRead = this.read(action);
            state = this.setEntities(state, entitiesRead);
            state = this.finishTransaction(<ResponseAction>action, state, entitiesRead);
            break;
          case this.actionsManager.getResponseAction(AbstractReducer.ACTION_UPDATE):
            const entitiesUpdated = this.update(action);
            state = this.setEntities(state, entitiesUpdated);
            state = this.finishTransaction(<ResponseAction>action, state, entitiesUpdated);
            break;
          case this.actionsManager.getResponseAction(AbstractReducer.ACTION_DELETE):
            const entitiesDeleted = this.delete(action);
            state = this.removeEntities(state, entitiesDeleted);
            state = this.finishTransaction(<ResponseAction>action, state, entitiesDeleted);
            break;
          default:
            state = this.handleCustomActions(state, action);
            break;
        }

        if (this.setCompleted) {
          state = state.set('isComplete', true);
        }
      }

      return state;
    };
  }

  protected startTransaction(action: RequestAction, state: Map<string, any>): Map<string, any> {
    return state.set('transactions', (<Map<number, TransactionState>>state.get('transactions')).set(
      action.transactionId,
      {state: TransactionState.started}
    ));
  }

  protected finishTransaction(action: ResponseAction, state: Map<string, any>, entities: T | T[] | number | number[]): Map<string, any> {
    const entitiesId = [];
    if (Array.isArray(entities)) {
      for (const entity of entities) {
        entitiesId.push(isNumber(entity) ? entity : (<T>entity).id);
      }
    } else {
      entitiesId.push(isNumber(entities) ? entities : (<T>entities).id);
    }

    return state.set('transactions', (<Map<number, TransactionState>>state.get('transactions')).set(
      action.transactionId,
      {state: TransactionState.finished, entities: entitiesId}
    ));
  }

  protected errorTransaction(action: ErrorAction, state: Map<string, any>): Map<string, any> {
    return state.set('transactions', (<Map<number, TransactionState>>state.get('transactions')).set(
      action.transactionId,
      {state: TransactionState.error, error: action.error}
    ));
  }

  protected setEntities(state: Map<string, any>, data: T | T[]): Map<string, any> {
    if (Array.isArray(data)) {
      data.forEach((entity: T): void => {
        state = this.setEntity(state, entity);
      });
    } else {
      state = this.setEntity(state, data);
    }

    return state;
  }

  protected setEntity(state: Map<string, any>, entity: T): Map<string, any> {
    return state.set('entities', (<Map<number, T>>state.get('entities')).set(entity.id, entity));
  }

  protected removeEntities(state: Map<string, any>, ids: number | number[]): Map<string, any> {
    if (Array.isArray(ids)) {
      ids.forEach((id: number): void => {
        state = this.removeEntity(state, id);
      });
    } else {
      state = this.removeEntity(state, ids);
    }

    return state;
  }

  protected removeEntity(state: Map<string, any>, id: number): Map<string, any> {
    return state.set('entities', (<Map<number, T>>state.get('entities')).remove(id));
  }

  protected handleCustomActions(state: Map<string, any>, action: AnyAction): Map<string, any> {
    return state;
  }

  protected abstract create(action: AnyAction): T | T[];

  protected abstract read(action: AnyAction): T | T[];

  protected abstract update(action: AnyAction): T | T[];

  protected abstract delete(action: AnyAction): number | number[];
}
