import {Injector, ModuleWithProviders, NgModule} from '@angular/core';
import {NgRedux, NgReduxModule} from '@angular-redux/store';
import {HttpClientModule} from '@angular/common/http';
import {EntityDescriptor} from './domain/descriptors';
import {IAppState} from './stores';
import {NgFluxifyConfig, NgFluxifyConfigService, NgReduxService} from './services';

// @dynamic
@NgModule({
  imports: [
    HttpClientModule,
    NgReduxModule
  ],
  declarations: [],
  providers: [NgReduxService],
  exports: []
})
export class NgFluxifyModule {
  static injector: Injector;
  static ngRedux: NgRedux<IAppState>;

  private static entityList: Map<string, EntityDescriptor> = new Map<string, EntityDescriptor>();

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
    return Array.from(NgFluxifyModule.entityList.values());
  }

  public get entities(): EntityDescriptor[] {
    return NgFluxifyModule.entities;
  }

  public static registerEntity(entityDescriptor: EntityDescriptor) {
    NgFluxifyModule.entityList.set(entityDescriptor.name, entityDescriptor);

    if (this.injector && this.injector.get<NgReduxService>(NgReduxService, null)) {
      this.injector.get<NgReduxService>(NgReduxService).registerEntity(entityDescriptor);
    }
  }
}
