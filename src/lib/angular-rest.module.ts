import {Injector, NgModule} from '@angular/core';
import {AngularRestComponent} from './angular-rest.component';
import {NgRedux, NgReduxModule} from '@angular-redux/store';
import {IAppState, RootReducer} from './stores';
import {NgReduxRouterModule} from '@angular-redux/router';
import {HttpClientModule} from '@angular/common/http';
import {EntityDescriptor} from './domain/descriptors';
import {BrowserModule} from '@angular/platform-browser';

@NgModule({
  imports: [
    BrowserModule,
    HttpClientModule,
    NgReduxModule,
    NgReduxRouterModule,
  ],
  declarations: [AngularRestComponent],
  exports: [AngularRestComponent]
})
export class AngularRestModule {
  static injector: Injector;
  static ngRedux: NgRedux<IAppState>;

  private static entityList: Map<string, EntityDescriptor> = new Map<string, EntityDescriptor>();

  constructor(private ngRedux: NgRedux<IAppState>, private injector: Injector) {
    AngularRestModule.injector = injector;
    AngularRestModule.ngRedux = ngRedux;

    AngularRestModule.injector = injector;
    AngularRestModule.ngRedux = ngRedux;

    const enhancers = [];
    ngRedux.configureStore(RootReducer.getReducer(AngularRestModule.entities), {}, [], enhancers);
  }

  public static get entities(): EntityDescriptor[] {
    return Array.from(AngularRestModule.entityList.values());
  }

  public static registerEntity(entityDescriptor: EntityDescriptor) {
    AngularRestModule.entityList.set(entityDescriptor.name, entityDescriptor);

    if (AngularRestModule.ngRedux) {
      this.ngRedux.configureSubStore([entityDescriptor.name], RootReducer.initEntityReducer(entityDescriptor));
    }
  }
}
