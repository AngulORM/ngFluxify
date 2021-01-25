import {Injector, ModuleWithProviders, NgModule} from '@angular/core';
import {NgReduxModule} from '@angular-redux/store';

import {NgReduxService} from './services/ng-redux.service';
import {NgFluxifyConfig, NgFluxifyConfigService} from './services/ng-fluxify-config.service';
import {DispatchQueue} from "./stores";

// @dynamic
@NgModule({
  imports: [
    NgReduxModule
  ],
  declarations: [],
  providers: [NgReduxService],
  exports: [NgReduxModule]
})
export class NgFluxifyModule {
  static injector: Injector;
  static ngReduxService: NgReduxService;
  static dispatchQueue: DispatchQueue;

  constructor(private injector: Injector, public ngReduxService: NgReduxService) {
    if (!NgFluxifyModule.ready) {
      NgFluxifyModule.injector = injector;
      NgFluxifyModule.ngReduxService = ngReduxService;
      NgFluxifyModule.dispatchQueue = new DispatchQueue();
    }
  }

  public static get ready(): boolean {
    return !!NgFluxifyModule.injector;
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
}
