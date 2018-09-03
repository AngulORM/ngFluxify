import {EntityDescriptor} from '../domain/descriptors';
import {EntityManager} from '../domain/api/entity-manager';
import {AngularRestModule} from '../angular-rest.module';

export function Entity<T extends EntityDescriptor>(entityDescriptor: T): ClassDecorator {
  return function (constructor: any) {
    constructor.entityManager = new EntityManager<typeof constructor>(constructor);
    entityDescriptor.class = constructor;

    AngularRestModule.registerEntity(entityDescriptor);
  };
}
