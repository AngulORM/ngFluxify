import {combineReducers, Reducer, ReducersMapObject} from 'redux';
import {EntityDescriptor} from '../descriptors';
import {AbstractReducer} from './abstract.reducer';
import {NgFluxifyConfig} from "../services";

export interface IAppState {
  [key: string]: any;
}

// @dynamic
export class RootReducer {
  private static reducers: ReducersMapObject = {};

  public static getReducer(entityDescriptors: EntityDescriptor<any>[], ngFluxifyConfig: NgFluxifyConfig): Reducer {
    if (!entityDescriptors || !entityDescriptors.length) {
      throw new Error('At least one entity descriptor is required');
    }

    entityDescriptors.forEach((entityDescriptor: EntityDescriptor<any>) => {
      RootReducer.reducers[entityDescriptor.name] = RootReducer.initEntityReducer(entityDescriptor, ngFluxifyConfig);
    });

    return combineReducers(RootReducer.reducers);
  }

  public static initEntityReducer(entityDescriptor: EntityDescriptor<any>, ngFluxifyConfig: NgFluxifyConfig): Reducer {
    const reducer: AbstractReducer<typeof entityDescriptor.class> = new entityDescriptor.reducerType(entityDescriptor, ngFluxifyConfig);
    return reducer.createReducer();
  }

  public static addReducer(entityDescriptor: EntityDescriptor<any>, ngFluxifyConfig: NgFluxifyConfig): Reducer {
    RootReducer.reducers[entityDescriptor.name] = RootReducer.initEntityReducer(entityDescriptor, ngFluxifyConfig);
    return combineReducers(RootReducer.reducers);
  }
}
