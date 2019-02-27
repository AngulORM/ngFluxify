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

  constructor(private ngRedux: NgRedux<IAppState>, private injector: Injector) {
    NgFluxifyModule.injector = injector;
    NgFluxifyModule.ngRedux = ngRedux;

    NgFluxifyModule.injector = injector;
    NgFluxifyModule.ngRedux = ngRedux;

    const enhancers = [applyMiddleware(logger)];
    ngRedux.configureStore(RootReducer.getReducer(NgFluxifyModule.entities), {}, [], enhancers);
  }

  public static get entities(): EntityDescriptor[] {
    return Array.from(NgFluxifyModule.entityList.values());
  }

  public static registerEntity(entityDescriptor: EntityDescriptor) {
    NgFluxifyModule.entityList.set(entityDescriptor.name, entityDescriptor);

    if (NgFluxifyModule.ngRedux) {
      this.ngRedux.configureSubStore([entityDescriptor.name], RootReducer.initEntityReducer(entityDescriptor));
    }
  }
}
