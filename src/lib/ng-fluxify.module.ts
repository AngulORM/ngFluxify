import {Injector, ModuleWithProviders, NgModule} from '@angular/core';
import {NgReduxModule} from '@angular-redux/store';

import {EntityDescriptor} from './domain/descriptors';
import {NgReduxService} from './services/ng-redux.service';
import {NgFluxifyConfig, NgFluxifyConfigService} from './services/ng-fluxify-config.service';
import {AbstractEntity} from './domain/entities';

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

  constructor(private injector: Injector, public ngReduxService: NgReduxService) {
    NgFluxifyModule.injector = injector;
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

  public static get entities(): EntityDescriptor<AbstractEntity>[] {
    return NgFluxifyModule.injector.get(NgReduxService).entities;
  }

  public get entities(): EntityDescriptor<AbstractEntity>[] {
    return this.ngReduxService.entities;
  }
}
