import {Inject, Injectable, Injector} from '@angular/core';
import {NgRedux} from '@angular-redux/store';
import {applyMiddleware} from 'redux';
import {logger} from 'redux-logger';
import {IAppState, RootReducer} from '../stores';
import {EntityDescriptor} from '../domain/descriptors';
import {NgFluxifyConfig, NgFluxifyConfigService} from './ng-fluxify-config.service';

// @dynamic
@Injectable()
export class NgReduxService {
  private static injector: Injector;
  private static entityList: Map<string, EntityDescriptor> = new Map<string, EntityDescriptor>();

  private isRootStoreConfigured: boolean;

  constructor(@Inject(NgFluxifyConfigService) private readonly ngFluxifyConfig: NgFluxifyConfig, private ngRedux: NgRedux<IAppState>, private injector: Injector) {
    NgReduxService.injector = injector;

    this.configureStore();
  }

  public static get entities(): EntityDescriptor[] {
    return Array.from(NgReduxService.entityList.values());
  }

  public static registerEntity(entityDescriptor: EntityDescriptor) {
    NgReduxService.entityList.set(entityDescriptor.name, entityDescriptor);

    if (this.injector && this.injector.get<NgReduxService>(NgReduxService, null)) {
      this.injector.get<NgReduxService>(NgReduxService).registerEntity(entityDescriptor);
    }
  }

  public registerEntity(entityDescriptor: EntityDescriptor) {
    if (this.isRootStoreConfigured) {
      this.ngRedux.replaceReducer(RootReducer.addReducer(entityDescriptor));
    } else {
      this.configureStore();
    }
  }

  private configureStore() {
    if (NgReduxService.entities && NgReduxService.entities.length) {
      const enhancers = [];

      if (this.ngFluxifyConfig && this.ngFluxifyConfig.enableStoreLogger) {
        enhancers.push(applyMiddleware(logger));
      }

      this.ngRedux.configureStore(RootReducer.getReducer(NgReduxService.entities), {}, [], enhancers);
      this.isRootStoreConfigured = true;
    }
  }
}
