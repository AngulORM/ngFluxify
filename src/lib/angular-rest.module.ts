import { NgModule, ModuleWithProviders, Injector } from '@angular/core';
import { AngularRestComponent } from './angular-rest.component';
import { NgRedux, NgReduxModule } from '@angular-redux/store';
import { IAppState, RootReducer } from './stores/root.store';
import { NgReduxRouterModule } from '@angular-redux/router';
import { HttpClientModule } from '@angular/common/http';

@NgModule({
  imports: [
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

  constructor(private ngRedux: NgRedux<IAppState>, private injector: Injector) {
    AngularRestModule.injector = injector;
    AngularRestModule.ngRedux = ngRedux;

    const enhancers = [];
    ngRedux.configureStore(RootReducer.getReducer(), {}, [], enhancers);
  }
}
