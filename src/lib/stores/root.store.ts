import {combineReducers, Reducer, ReducersMapObject} from 'redux';
import {RestReducer} from './rest/rest.reducer';
import {EntityDescriptor} from '../domain/descriptors';

export interface IAppState {
  [key: string]: any;
}

export class RootReducer {
  public static getReducer(entityDescriptors: EntityDescriptor[]): Reducer {
    const reducers: ReducersMapObject = {};

    entityDescriptors.forEach((entityDescriptor: EntityDescriptor) => {
      reducers[entityDescriptor.name] = RootReducer.initEntityReducer(entityDescriptor);
    });

    return combineReducers(reducers);
  }

  public static initEntityReducer(entityDescriptor: EntityDescriptor): Reducer {
    return new RestReducer<typeof entityDescriptor.class>(entityDescriptor.class.entityManager).createReducer();
  }
}
