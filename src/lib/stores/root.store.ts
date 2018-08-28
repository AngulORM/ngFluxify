import {combineReducers, ReducersMapObject} from 'redux';
import {RestReducer} from './rest/rest.reducer';
import {entitiesList} from '../domain/entities.list';
import {EntityManager} from '../domain/api/entity-manager';
import {EntityDescriptor} from "../domain/descriptors/entity.descriptor";

export interface IAppState {
    [key: string]: any;
}

export class RootReducer {
    public static getReducer() {
        const reducers: ReducersMapObject = {};

        entitiesList.forEach((re: EntityDescriptor) => {
            reducers[re.class.name] = new RestReducer<typeof re.class>(new EntityManager<typeof re.class>(re.class)).createReducer();
        });

        return combineReducers(reducers);
    }
}
