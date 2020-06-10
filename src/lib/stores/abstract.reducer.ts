import {Map} from 'immutable';
import {AnyAction, Reducer} from 'redux';

import {AbstractEntity} from '../domain/entities';
import {BaseActionsManager} from './base.action';
import {ActionsManagerFactory} from './action.factory';
import {ErrorAction, RequestAction, ResponseAction} from './actions';
import {TransactionState} from '../domain/api/transaction.state'; // Do not change, solve circular dependencies
import {isObject} from 'rxjs/internal-compatibility';
import {EntityDescriptor} from '../domain/descriptors';
import {NgFluxifyConfig} from '../services/ng-fluxify-config.service';

const INITIAL_STATE: Map<string, any> = Map({
  state: '',
  entities: Map<any, AbstractEntity>(),
  isComplete: false,
  transactions: Map<number, TransactionState>()
});

// @dynamic
export abstract class AbstractReducer<T extends AbstractEntity> {
  static readonly ACTION_CREATE = ['CREATE'];
  static readonly ACTION_READ = ['READ'];
  static readonly ACTION_READ_ALL = ['READ', 'ALL'];
  static readonly ACTION_UPDATE = ['UPDATE'];
  static readonly ACTION_DELETE = ['DELETE'];
  static readonly ACTION_RESET = ['RESET'];

  private state: Map<string, any>;
  protected readonly actionsManager: BaseActionsManager;
  protected setCompleted = false;

  constructor(protected entityDescriptor: EntityDescriptor<T>, protected ngFluxifyConfig: NgFluxifyConfig) {
    this.actionsManager = ActionsManagerFactory.getActionsManager(entityDescriptor.name);
    this.actionsManager.addActionSet(AbstractReducer.ACTION_CREATE);
    this.actionsManager.addActionSet(AbstractReducer.ACTION_READ);
    this.actionsManager.addActionSet(AbstractReducer.ACTION_READ_ALL);
    this.actionsManager.addActionSet(AbstractReducer.ACTION_UPDATE);
    this.actionsManager.addActionSet(AbstractReducer.ACTION_DELETE);

    this.actionsManager.addAction(AbstractReducer.ACTION_RESET);

    this.state = this.initialize(INITIAL_STATE);
  }

  public createReducer(): Reducer<any> {
    return (state: Map<string, any> = this.state, action: AnyAction): Map<string, any> => {
      if ((<string>action.type).match(this.actionsManager.getActionScheme())) {
        if (this.ngFluxifyConfig.enableDynamicStateMutability) {
          state = this.mutableState(state);
        }

        state = state.set('state', action.type);
        this.setCompleted = false;

        switch (action.type) {
          case this.actionsManager.getRequestAction(AbstractReducer.ACTION_CREATE):
          case this.actionsManager.getRequestAction(AbstractReducer.ACTION_READ):
          case this.actionsManager.getRequestAction(AbstractReducer.ACTION_READ_ALL):
          case this.actionsManager.getRequestAction(AbstractReducer.ACTION_UPDATE):
          case this.actionsManager.getRequestAction(AbstractReducer.ACTION_DELETE):
            state = this.startTransaction(<RequestAction>action, state);
            break;
          case this.actionsManager.getErrorAction(AbstractReducer.ACTION_CREATE):
          case this.actionsManager.getErrorAction(AbstractReducer.ACTION_READ):
          case this.actionsManager.getErrorAction(AbstractReducer.ACTION_READ_ALL):
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
          case this.actionsManager.getResponseAction(AbstractReducer.ACTION_READ_ALL):
            if (action.type === this.actionsManager.getResponseAction(AbstractReducer.ACTION_READ_ALL)) {
              state = this.clearEntities(state);
            }

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
          case this.actionsManager.getAction(AbstractReducer.ACTION_RESET):
            state = this.initialize(INITIAL_STATE);
            break;
          default:
            state = this.handleCustomActions(state, action);
            break;
        }

        if (this.setCompleted) {
          state = state.set('isComplete', true);
        }
      }

      if (this.ngFluxifyConfig.enableDynamicStateMutability) {
        state = this.immutableState(state);
      }
      return state;
    };
  }

  protected startTransaction(action: RequestAction, state: Map<string, any>): Map<string, any> {
    return state.setIn(['transactions', action.transactionId], {state: TransactionState.started, action: action.type, arguments: action.arguments});
  }

  protected finishTransaction(action: ResponseAction, state: Map<string, any>, entities: T | T[] | any | any[]): Map<string, any> {
    const entitiesId = [];
    if (Array.isArray(entities)) {
      for (const entity of entities) {
        entitiesId.push(isObject(entity) ? (<T>entity).primary : entity);
      }
    } else {
      entitiesId.push(isObject(entities) ? (<T>entities).primary : entities);
    }

    return state.setIn(['transactions', action.transactionId], {state: TransactionState.finished, action: action.type, entities: entitiesId});
  }

  protected errorTransaction(action: ErrorAction, state: Map<string, any>): Map<string, any> {
    return state.setIn(['transactions', action.transactionId], {state: TransactionState.error, action: action.type, error: action.error});
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
    if (!entity) {
      return state;
    }

    return state.setIn(['entities', entity.primary], entity);
  }

  protected removeEntities(state: Map<string, any>, ids: any | any[]): Map<string, any> {
    if (Array.isArray(ids)) {
      ids.forEach((id: any): void => {
        state = this.removeEntity(state, id);
      });
    } else {
      state = this.removeEntity(state, ids);
    }

    return state;
  }

  protected removeEntity(state: Map<string, any>, id: any): Map<string, any> {
    return state.removeIn(['entities', id]);
  }

  protected clearEntities(state: Map<string, any>): Map<string, any> {
    return state.set('entities', Map<any, AbstractEntity>());
  }

  protected handleCustomActions(state: Map<string, any>, action: AnyAction): Map<string, any> {
    return state;
  }

  protected abstract create(action: AnyAction): T | T[];

  protected abstract read(action: AnyAction): T | T[];

  protected abstract update(action: AnyAction): T | T[];

  protected abstract delete(action: AnyAction): any | any[];

  protected initialize(state: Map<string, any>): Map<string, any> {
    return state;
  }

  private mutableState(state: Map<string, any>): Map<string, any> {
    state = state.asMutable();
    state.forEach((value, key) => {
      if (Map.isMap(value)) {
        state.set(key, value.asMutable());
      }
    });

    return state;
  }

  private immutableState(state: Map<string, any>): Map<string, any> {
    state.forEach((value, key) => {
      if (Map.isMap(value)) {
        state.set(key, Map(value));
      }
    });

    return state.asImmutable();
  }
}
