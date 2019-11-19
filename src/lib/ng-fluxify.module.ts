import {Injector, ModuleWithProviders, NgModule} from '@angular/core';
import {NgReduxModule} from '@angular-redux/store';

import {NgReduxService} from './services/ng-redux.service';
import {NgFluxifyConfig, NgFluxifyConfigService} from './services/ng-fluxify-config.service';

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

  private static provider: ModuleWithProviders<NgFluxifyModule>;

  constructor(private injector: Injector, public ngReduxService: NgReduxService) {
    if (!NgFluxifyModule.ready) {
      NgFluxifyModule.injector = injector;
      NgFluxifyModule.ngReduxService = ngReduxService;
    }
  }

  public static get ready(): boolean {
    return !!NgFluxifyModule.injector;
  }

  public static initialize(ngFluxifyConfig: NgFluxifyConfig): ModuleWithProviders<NgFluxifyModule> {
    if (!NgFluxifyModule.provider) {
      NgFluxifyModule.provider = {
        ngModule: NgFluxifyModule,
        providers: [
          {
            provide: NgFluxifyConfigService,
            useValue: ngFluxifyConfig
          }
        ]
      };
    }

    return NgFluxifyModule.provider;
  }
}
