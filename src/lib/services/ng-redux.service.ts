import {Inject, Injectable} from '@angular/core';
import {NgRedux} from '@angular-redux/store';
import {applyMiddleware} from 'redux';
import {logger} from 'redux-logger';
import {IAppState, RootReducer} from '../stores';
import {EntityDescriptor} from '../domain/descriptors';
import {NgFluxifyConfig, NgFluxifyConfigService} from './ng-fluxify-config.service';
import {AbstractEntity} from '../domain/entities';

// @dynamic
@Injectable()
export class NgReduxService {
  private entityList: Map<string, EntityDescriptor<AbstractEntity>> = new Map<string, EntityDescriptor<AbstractEntity>>();

  private isRootStoreConfigured: boolean;

  constructor(@Inject(NgFluxifyConfigService) private readonly ngFluxifyConfig: NgFluxifyConfig, public ngRedux: NgRedux<IAppState>) {
    this.configureStore();
  }

  public get entities(): EntityDescriptor<AbstractEntity>[] {
    return Array.from(this.entityList.values());
  }

  public get state(): IAppState {
    return this.ngRedux.getState();
  }

  public registerEntity(entityDescriptor: EntityDescriptor<AbstractEntity>) {
    this.entityList.set(entityDescriptor.name, entityDescriptor);

    if (this.isRootStoreConfigured) {
      this.ngRedux.replaceReducer(RootReducer.addReducer(entityDescriptor));
    } else {
      this.configureStore();
    }
  }

  private configureStore() {
    if (this.entities && this.entities.length) {
      const enhancers = [];

      if (this.ngFluxifyConfig && this.ngFluxifyConfig.enableStoreLogger) {
        enhancers.push(applyMiddleware(logger));
      }

      this.ngRedux.configureStore(RootReducer.getReducer(this.entities), {}, [], enhancers);
      this.isRootStoreConfigured = true;
    }
  }
}
