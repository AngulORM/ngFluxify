import {EntityDescriptor} from '../domain/descriptors';
import {EntityManager} from '../domain/api';
import {AngularRestModule} from '../angular-rest.module';

export function Entity<T extends EntityDescriptor>(entityDescriptor: T): ClassDecorator {
  return function (constructor: any) {
    entityDescriptor.class = constructor;
    constructor.entityService = new entityDescriptor.serviceType(entityDescriptor);
    constructor.entityManager = new EntityManager<typeof constructor>(entityDescriptor);

    AngularRestModule.registerEntity(entityDescriptor);
  };
}
