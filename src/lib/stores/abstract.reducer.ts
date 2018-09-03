import {Map} from 'immutable';
import {AnyAction, Reducer} from 'redux';
import {AbstractEntity} from '../domain/entities';
import {BaseActionsManager} from './base.action';

const INITIAL_STATE: Map<string, any> = Map({
  state: '',
  entities: Map<number, AbstractEntity>()
});

export abstract class AbstractReducer<T extends AbstractEntity> {
  private state: Map<string, any> = INITIAL_STATE;

  constructor(private actionsManager: BaseActionsManager) {

  }

  public createReducer(): Reducer<any> {
    return (state: Map<string, any> = this.state, action: AnyAction): Map<string, any> => {
      if ((<string>action.type).match(this.actionsManager.getActionScheme())) {

      }

      return state;
    };
  }
}
