import {combineReducers, Reducer, ReducersMapObject} from 'redux';
import {EntityDescriptor} from '../domain/descriptors';
import {AbstractReducer} from './abstract.reducer';
import {AbstractEntity} from '../domain/entities';
import {NgFluxifyConfig} from '../services/ng-fluxify-config.service';

export interface IAppState {
  [key: string]: any;
}

// @dynamic
export class RootReducer {
  private static reducers: ReducersMapObject = {};

  public static getReducer(entityDescriptors: EntityDescriptor<AbstractEntity>[], ngFluxifyConfig: NgFluxifyConfig): Reducer {
    if (!entityDescriptors || !entityDescriptors.length) {
      throw new Error('At least one entity descriptor is required');
    }

    entityDescriptors.forEach((entityDescriptor: EntityDescriptor<AbstractEntity>) => {
      RootReducer.reducers[entityDescriptor.name] = RootReducer.initEntityReducer(entityDescriptor, ngFluxifyConfig);
    });

    return combineReducers(RootReducer.reducers);
  }

  public static initEntityReducer(entityDescriptor: EntityDescriptor<AbstractEntity>, ngFluxifyConfig: NgFluxifyConfig): Reducer {
    const reducer: AbstractReducer<typeof entityDescriptor.class> = new entityDescriptor.reducerType(entityDescriptor, ngFluxifyConfig);
    return reducer.createReducer();
  }

  public static addReducer(entityDescriptor: EntityDescriptor<AbstractEntity>, ngFluxifyConfig: NgFluxifyConfig): Reducer {
    RootReducer.reducers[entityDescriptor.name] = RootReducer.initEntityReducer(entityDescriptor, ngFluxifyConfig);
    return combineReducers(RootReducer.reducers);
  }
}
