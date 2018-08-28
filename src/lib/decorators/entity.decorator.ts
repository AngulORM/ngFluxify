import {entitiesList} from '../domain/entities.list';
import {EntityDescriptor} from '../domain/descriptors';
import {EntityManager} from '../domain/api/entity-manager';

export function Entity<T extends EntityDescriptor>(entityDescriptor: T): ClassDecorator {
  return function (constructor: any) {
    entityDescriptor.class.entityManager = new EntityManager<typeof entityDescriptor.class>(entityDescriptor.class);
    entitiesList.push(entityDescriptor);
  };
}
