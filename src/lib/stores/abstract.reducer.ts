import {Map} from 'immutable';
import {AnyAction, Reducer} from 'redux';
import {AbstractEntity} from '../domain/entities';
import {BaseActionsManager} from './base.action';

const INITIAL_STATE: Map<string, any> = Map({
  state: '',
  entities: Map<number, AbstractEntity>()
});

export abstract class AbstractReducer<T extends AbstractEntity> {
  private static readonly ACTION_CREATE = ['CREATE'];
  private static readonly ACTION_READ = ['READ'];
  private static readonly ACTION_UPDATE = ['UPDATE'];
  private static readonly ACTION_DELETE = ['DELETE'];

  private state: Map<string, any> = INITIAL_STATE;
  protected readonly actionsManager: BaseActionsManager;

  constructor(identifier: string) {
    this.actionsManager = new BaseActionsManager(identifier);
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
            // Set loading
            break;
          case this.actionsManager.getErrorAction(AbstractReducer.ACTION_CREATE):
          case this.actionsManager.getErrorAction(AbstractReducer.ACTION_READ):
          case this.actionsManager.getErrorAction(AbstractReducer.ACTION_UPDATE):
          case this.actionsManager.getErrorAction(AbstractReducer.ACTION_DELETE):
            // Set error
            break;
          case this.actionsManager.getResponseAction(AbstractReducer.ACTION_CREATE):
            state = this.setEntities(state, this.create());
            break;
          case this.actionsManager.getResponseAction(AbstractReducer.ACTION_READ):
            state = this.setEntities(state, this.read());
            break;
          case this.actionsManager.getResponseAction(AbstractReducer.ACTION_UPDATE):
            state = this.setEntities(state, this.update());
            break;
          case this.actionsManager.getResponseAction(AbstractReducer.ACTION_DELETE):
            state = this.removeEntities(state, this.delete());
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

  protected abstract create(): T | T[];

  protected abstract read(): T | T[];

  protected abstract update(): T | T[];

  protected abstract delete(): number | number[];
}
