import {EntityDescriptor} from '../domain/descriptors';
import {EntityManager} from '../domain/api';
import {AbstractEntity} from '../domain/entities';
import {NgFluxifyModule} from '../ng-fluxify.module';
import {InjectionToken, Injector, resolveForwardRef, Type} from '@angular/core';
import {NgRedux} from '@angular-redux/store';
import {IEntityService} from '../services/IEntity.service';
import {NgReduxService} from '../services/ng-redux.service';
import {AbstractReducer} from "../stores";

export function Entity<T extends EntityDescriptor<K>, K extends AbstractEntity>(entityDescriptor: T) {
  return function (target) {
    if (!target.primaryKey || target.primaryKey.length === 0) {
      throw new Error(`Entity ${entityDescriptor.name} has no primary key`);
    }

    if (!entityDescriptor.serviceType) {
      throw new Error(`Entity ${entityDescriptor.name} has no service`);
    }

    entityDescriptor.class = target;

    let injector: Injector;
    const descriptorToken = new InjectionToken<T>(`${entityDescriptor.name} descriptor token`);
    const serviceToken = new InjectionToken<IEntityService<K>>(`${entityDescriptor.name} service token`);
    const entityManagerToken = new InjectionToken<EntityManager<K>>(`${entityDescriptor.name} entityManager token`);

    Reflect.defineProperty(target, 'entityService', {
      enumerable: false,
      configurable: false,
      get: () => {
        if (!initialized) {
          target.initialize();
        }

        if (!injector) {
          throw new Error('Injector not ready yet');
        }

        return injector.get(serviceToken);
      }
    });

    Reflect.defineProperty(target, 'entityManager', {
      enumerable: false,
      configurable: false,
      get: () => {
        if (!initialized) {
          target.initialize();
        }

        if (!injector) {
          throw new Error('Injector not ready yet');
        }

        return injector.get(entityManagerToken);
      }
    });

    let initialized = false;
    Reflect.set(target, 'initialize', () => {
      if (!initialized) {
        if (!NgFluxifyModule.ready) {
          throw Error('NgFluxify not ready yet');
        }

        injector = Injector.create({
          parent: NgFluxifyModule.injector,
          providers: [
            {provide: descriptorToken, useValue: entityDescriptor},
            {provide: serviceToken, useClass: entityDescriptor.serviceType, deps: [descriptorToken, ...(entityDescriptor.serviceDeps || [])]},
            {provide: entityManagerToken, useClass: EntityManager, deps: [descriptorToken, NgReduxService, NgRedux]},
          ]
        });

        initialized = true;
      }
    });
  };
}

