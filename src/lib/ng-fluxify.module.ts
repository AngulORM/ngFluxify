import {InjectionToken, Injector, ModuleWithProviders, NgModule} from '@angular/core';
import {NgRedux, NgReduxModule} from '@angular-redux/store';
import {IAppState, RootReducer} from './stores';
import {HttpClientModule} from '@angular/common/http';
import {EntityDescriptor} from './domain/descriptors';
import {logger} from 'redux-logger';
import {applyMiddleware} from 'redux';

const NgFluxifyConfigService = new InjectionToken<NgFluxifyConfig>('NgFluxifyConfigService');

// @dynamic
@NgModule({
  imports: [
    HttpClientModule,
    NgReduxModule
  ],
  declarations: [],
  exports: []
})
export class NgFluxifyModule {
  static injector: Injector;
  static ngRedux: NgRedux<IAppState>;

  static get ngFluxifyConfigService(): Promise<NgFluxifyConfig> {
    return new Promise<NgFluxifyConfig>(resolve => {
      const interval = setInterval(() => {
        console.log(this.injector.get(NgFluxifyConfigService, false));
        if (this.injector.get(NgFluxifyConfigService, false)) {
          if (interval) {
            clearInterval(interval);
          }
          resolve(this.injector.get(NgFluxifyConfigService, {}));
        }
      }, 5);
    });
  }

  private static entityList: Map<string, EntityDescriptor> = new Map<string, EntityDescriptor>();
  private static isRootStoreConfigured: boolean;

  constructor(public ngRedux: NgRedux<IAppState>, private injector: Injector) {
    NgFluxifyModule.injector = injector;
    NgFluxifyModule.ngRedux = ngRedux;

    if (NgFluxifyModule.entities.length) {
      NgFluxifyModule.configureStore();
    }
  }

  public static initialize(ngFluxifyConfig: NgFluxifyConfig): ModuleWithProviders<NgFluxifyModule> {
    return {
      ngModule: NgFluxifyModule,
      providers: [
        {
          provide: NgFluxifyConfigService,
          useValue: ngFluxifyConfig
        }
      ]
    };
  }

  public static get entities(): EntityDescriptor[] {
    return Array.from(NgFluxifyModule.entityList.values());
  }

  public get entitites(): EntityDescriptor[] {
    return NgFluxifyModule.entities;
  }

  private static configureStore() {
    this.ngFluxifyConfigService.then(ngFluxifyConfig => {
      const enhancers = [];

      if (ngFluxifyConfig.enableStoreLogger) {
        enhancers.push(applyMiddleware(logger));
      }

      this.ngRedux.configureStore(RootReducer.getReducer(NgFluxifyModule.entities), {}, [], []);
    });

    this.ngRedux.configureStore(RootReducer.getReducer(NgFluxifyModule.entities), {}, [], []);
    this.isRootStoreConfigured = true;
  }

  public static registerEntity(entityDescriptor: EntityDescriptor) {
    NgFluxifyModule.entityList.set(entityDescriptor.name, entityDescriptor);

    if (NgFluxifyModule.ngRedux) {
      if (this.isRootStoreConfigured) {
        this.ngRedux.replaceReducer(RootReducer.addReducer(entityDescriptor));
      } else {
        this.configureStore();
      }
    }
  }
}

export interface NgFluxifyConfig {
  enableStoreLogger?: boolean;
}
