import {Injector, NgModule} from '@angular/core';
import {NgRedux, NgReduxModule} from '@angular-redux/store';
import {IAppState, RootReducer} from './stores';
import {HttpClientModule} from '@angular/common/http';
import {EntityDescriptor} from './domain/descriptors';
import {logger} from 'redux-logger';
import {applyMiddleware} from 'redux';

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

  private static entityList: Map<string, EntityDescriptor> = new Map<string, EntityDescriptor>();
  private static isRootStoreConfigured: boolean;

  constructor(private ngRedux: NgRedux<IAppState>, private injector: Injector) {
    NgFluxifyModule.injector = injector;
    NgFluxifyModule.ngRedux = ngRedux;

    if (NgFluxifyModule.entities.length) {
      NgFluxifyModule.configureStore();
    }
  }

  public static get entities(): EntityDescriptor[] {
    return Array.from(NgFluxifyModule.entityList.values());
  }

  public get entitites(): EntityDescriptor[] {
    return NgFluxifyModule.entities;
  }

  private static configureStore() {
    const enhancers = [applyMiddleware(logger)];
    this.ngRedux.configureStore(RootReducer.getReducer(NgFluxifyModule.entities), {}, [], enhancers);
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
