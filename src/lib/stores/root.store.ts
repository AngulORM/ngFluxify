import {combineReducers, ReducersMapObject} from 'redux';
import {RestReducer} from './rest/rest.reducer';
import {entities} from '../domain/rest-entities';
import {RestEntityManager} from '../domain/api/rest-entity-manager';
import {EntityDescriptor} from "../domain/api/entity.descriptor";

export interface IAppState {
    [key: string]: any;
}

export class RootReducer {
    public static getReducer() {
        const reducers: ReducersMapObject = {};

        entities.forEach((re: EntityDescriptor) => {
            reducers[re.class.name] = new RestReducer<typeof re.class>(new RestEntityManager<typeof re.class>(re.class)).createReducer();
        });

        return combineReducers(reducers);
    }
}
