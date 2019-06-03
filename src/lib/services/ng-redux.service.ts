import {Inject, Injectable} from '@angular/core';
import {NgRedux} from '@angular-redux/store';
import {applyMiddleware} from 'redux';
import {logger} from 'redux-logger';
import {NgFluxifyModule} from '../ng-fluxify.module';
import {IAppState, RootReducer} from '../stores';
import {EntityDescriptor} from '../domain/descriptors';
import {NgFluxifyConfig, NgFluxifyConfigService} from './ng-fluxify-config.service';

@Injectable()
export class NgReduxService {
  private isRootStoreConfigured: boolean;

  constructor(@Inject(NgFluxifyConfigService) private readonly ngFluxifyConfig: NgFluxifyConfig, private ngRedux: NgRedux<IAppState>) {
    this.configureStore();
  }

  public registerEntity(entityDescriptor: EntityDescriptor) {
    if (this.isRootStoreConfigured) {
      this.ngRedux.replaceReducer(RootReducer.addReducer(entityDescriptor));
    } else {
      this.configureStore();
    }
  }

  private configureStore() {
    if (NgFluxifyModule.entities && NgFluxifyModule.entities.length) {
      const enhancers = [];

      if (this.ngFluxifyConfig && this.ngFluxifyConfig.enableStoreLogger) {
        enhancers.push(applyMiddleware(logger));
      }

      this.ngRedux.configureStore(RootReducer.getReducer(NgFluxifyModule.entities), {}, [], enhancers);
      this.isRootStoreConfigured = true;
    }
  }
}
