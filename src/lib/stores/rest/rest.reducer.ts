import {Map} from 'immutable';
import {Reducer} from 'redux';
import {AbstractReducer} from '../abstract.reducer';
import {RestActions} from './rest.actions';
import {AbstractEntity} from '../../domain/entities';
import {EntityManager} from '../../domain/api/entity-manager';


const REST_INITIAL_STATE: Map<string, any> = Map({
  state: '',
  manager: null
});

export class RestReducer<T extends AbstractEntity> extends AbstractReducer {
  private state: Map<string, any> = REST_INITIAL_STATE;

    constructor(modelManager: EntityManager<T>) {
    super(modelManager.actionsManager);
    this.state = this.state.set('manager', modelManager);
  }

  createReducer(): Reducer<any> {
    return (state: Map<string, any> = this.state, action: any): Map<string, any> => {
      if ((<string>action.type).match(this.actionsManager.getActionScheme())) {
        const oldState: string = state.get('state');
          const manager: EntityManager<T> = state.get('manager');

        switch (action.type) {
          case this.actionsManager.getHTTPRequestAction(RestActions.CREATE):
          case this.actionsManager.getHTTPRequestAction(RestActions.READ):
          case this.actionsManager.getHTTPRequestAction(RestActions.READ_ALL):
          case this.actionsManager.getHTTPRequestAction(RestActions.UPDATE):
          case this.actionsManager.getHTTPRequestAction(RestActions.DELETE):
            manager.setLoading(action.request, action.request.uniqueId);
            state = state.set('state', action.type);
            break;
          case this.actionsManager.getHTTPErrorAction(RestActions.CREATE):
          case this.actionsManager.getHTTPErrorAction(RestActions.READ):
          case this.actionsManager.getHTTPErrorAction(RestActions.READ_ALL):
          case this.actionsManager.getHTTPErrorAction(RestActions.UPDATE):
          case this.actionsManager.getHTTPErrorAction(RestActions.DELETE):
            manager.removeLoading(action.request.uniqueId, action.response);
            state = state.set('state', action.type);
            break;
          case this.actionsManager.getHTTPResponseAction(RestActions.CREATE):
          case this.actionsManager.getHTTPResponseAction(RestActions.READ):
          case this.actionsManager.getHTTPResponseAction(RestActions.UPDATE):
            manager.removeLoading(action.request.uniqueId, action.response);
            manager.set(action.response.data, true);
            state = state.set('state', action.type);
            break;
          case this.actionsManager.getHTTPResponseAction(RestActions.READ_ALL):
            manager.removeLoading(action.request.uniqueId, action.response);
            manager.set(action.response.data);
            state = state.set('state', action.type);
            break;
          case this.actionsManager.getHTTPResponseAction(RestActions.DELETE):
            manager.removeLoading(action.request.uniqueId, action.response);
            const id = Number(action.request.url.pathname.split('/').pop());
            if (isNaN(id) && action.response.data) {
              Object.getOwnPropertyNames(action.response.data).forEach((key: string): void => {
                if (action.response.data[key] === true) {
                  manager.remove(Number(key), false);
                }
              });
            } else {
              manager.remove(id, false);
            }
            state = state.set('state', action.type);
            break;
          default:
            break;
        }

        state.set('manager', manager);
      }

      return state;
    };
  }

  protected setActions(): void {
    Object.keys(RestActions).forEach((key): void => {
      this.actionsManager.addHTTPAction(RestActions[key]);
    });
  }
}
