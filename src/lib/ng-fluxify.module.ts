import {Injector, ModuleWithProviders, NgModule} from '@angular/core';
import {NgRedux, NgReduxModule} from '@angular-redux/store';

import {EntityDescriptor} from './domain/descriptors';
import {IAppState} from './stores/root.store';
import {NgReduxService} from './services/ng-redux.service';
import {NgFluxifyConfig, NgFluxifyConfigService} from './services/ng-fluxify-config.service';

// @dynamic
@NgModule({
  imports: [
    NgReduxModule
  ],
  declarations: [],
  providers: [NgReduxService],
  exports: []
})
export class NgFluxifyModule {
  static injector: Injector;
  static ngRedux: NgRedux<IAppState>;

  constructor(public ngRedux: NgRedux<IAppState>, private injector: Injector) {
    NgFluxifyModule.injector = injector;
    NgFluxifyModule.ngRedux = ngRedux;
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
    return NgReduxService.entities;
  }

  public get entities(): EntityDescriptor[] {
    return NgFluxifyModule.entities;
  }
}
