import {EntityDescriptor} from '../domain/descriptors';
import {EntityManager} from '../domain/api';
import {IEntityService, NgReduxService} from '../services';
import {AbstractEntity} from '../domain/entities';
import {NgFluxifyModule} from '../ng-fluxify.module';
import {InjectionToken, Injector} from '@angular/core';
import {NgRedux} from '@angular-redux/store';

export function Entity<T extends EntityDescriptor<K>, K extends AbstractEntity>(entityDescriptor: T): ClassDecorator {
  return function (constructor: any) {
    if (!constructor.primaryKey) {
      throw new Error(`Entity ${entityDescriptor.name} has no primary key`);
    }

    if (!entityDescriptor.serviceType) {
      throw new Error(`Entity ${entityDescriptor.name} has no service`);
    }

    entityDescriptor.class = constructor;
    const descriptorToken = new InjectionToken<T>(`${entityDescriptor.name} descriptor token`);
    const serviceToken = new InjectionToken<IEntityService<K>>(`${entityDescriptor.name} service token`);
    const entityManagerToken = new InjectionToken<EntityManager<K>>(`${entityDescriptor.name} entityManager token`);

    const injector = Injector.create({
      parent: NgFluxifyModule.injector,
      providers: [
        {provide: descriptorToken, useValue: entityDescriptor},
        {provide: serviceToken, useClass: entityDescriptor.serviceType, deps: [descriptorToken, ...(entityDescriptor.serviceDeps || [])]},
        {provide: entityManagerToken, useClass: EntityManager, deps: [descriptorToken, NgReduxService, NgRedux]},
      ]
    });

    Reflect.defineProperty(constructor, 'entityService', {
      enumerable: false,
      configurable: false,
      get: () => {
        return injector.get(serviceToken);
      }
    });

    Reflect.defineProperty(constructor, 'entityManager', {
      enumerable: false,
      configurable: false,
      get: () => {
        return injector.get(entityManagerToken);
      }
    });
  };
}
