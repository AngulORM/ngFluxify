import {combineReducers, Reducer, ReducersMapObject} from 'redux';
import {EntityDescriptor} from '../domain/descriptors';
import {AbstractReducer} from './abstract.reducer';

export interface IAppState {
  [key: string]: any;
}

export class RootReducer {
  public static getReducer(entityDescriptors: EntityDescriptor[]): Reducer {
    if (!entityDescriptors || !entityDescriptors.length) {
      throw new Error('At least one entity descriptor is required');
    }

    const reducers: ReducersMapObject = {};

    entityDescriptors.forEach((entityDescriptor: EntityDescriptor) => {
      reducers[entityDescriptor.name] = RootReducer.initEntityReducer(entityDescriptor);
    });

    return combineReducers(reducers);
  }

  public static initEntityReducer(entityDescriptor: EntityDescriptor): Reducer {
    const reducer: AbstractReducer<typeof entityDescriptor.class> = new entityDescriptor.reducerType(entityDescriptor);
    return reducer.createReducer();
  }
}
