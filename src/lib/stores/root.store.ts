import { combineReducers } from 'redux';
import { RestReducer } from './rest/rest.reducer';
import { entities } from '../domain/rest-entities';
import { RestEntity } from '../domain/api/rest-entity';
import { RestEntityManager } from '../domain/api/rest-entity-manager';

export interface IAppState {
    [key: string]: any;
}

export class RootReducer {
  public static getReducer() {

    const reducers = {};

    entities.forEach((re: RestEntity) => {
        reducers[re.class.name] = new RestReducer<typeof re.class>(new RestEntityManager<typeof re.class>(re.class)).createReducer();
    });

    return combineReducers(reducers);
  }
}
