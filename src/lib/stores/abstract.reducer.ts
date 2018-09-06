import {Map} from 'immutable';
import {AnyAction, Reducer} from 'redux';
import {AbstractEntity} from '../domain/entities';
import {BaseActionsManager} from './base.action';
import {ActionsManagerFactory} from './action.factory';

const INITIAL_STATE: Map<string, any> = Map({
  state: '',
  entities: Map<number, AbstractEntity>(),
  isComplete: false
});

export abstract class AbstractReducer<T extends AbstractEntity> {
  static readonly ACTION_CREATE = ['CREATE'];
  static readonly ACTION_READ = ['READ'];
  static readonly ACTION_UPDATE = ['UPDATE'];
  static readonly ACTION_DELETE = ['DELETE'];

  private state: Map<string, any> = INITIAL_STATE;
  protected readonly actionsManager: BaseActionsManager;

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

        switch (action.type) {
          case this.actionsManager.getRequestAction(AbstractReducer.ACTION_CREATE):
          case this.actionsManager.getRequestAction(AbstractReducer.ACTION_READ):
          case this.actionsManager.getRequestAction(AbstractReducer.ACTION_UPDATE):
          case this.actionsManager.getRequestAction(AbstractReducer.ACTION_DELETE):
            // Todo: Set loading
            console.log(action);
            break;
          case this.actionsManager.getErrorAction(AbstractReducer.ACTION_CREATE):
          case this.actionsManager.getErrorAction(AbstractReducer.ACTION_READ):
          case this.actionsManager.getErrorAction(AbstractReducer.ACTION_UPDATE):
          case this.actionsManager.getErrorAction(AbstractReducer.ACTION_DELETE):
            // Todo: Set error
            console.log(action);
            break;
          case this.actionsManager.getResponseAction(AbstractReducer.ACTION_CREATE):
            state = this.setEntities(state, this.create(action));
            break;
          case this.actionsManager.getResponseAction(AbstractReducer.ACTION_READ):
            state = this.setEntities(state, this.read(action));
            break;
          case this.actionsManager.getResponseAction(AbstractReducer.ACTION_UPDATE):
            state = this.setEntities(state, this.update(action));
            break;
          case this.actionsManager.getResponseAction(AbstractReducer.ACTION_DELETE):
            state = this.removeEntities(state, this.delete(action));
            break;
          default:
            state = this.handleCustomActions(state, action);
            break;
        }
      }

      return state;
    };
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
