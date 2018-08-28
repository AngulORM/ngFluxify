import {entitiesList} from '../domain/entities.list';
import {EntityDescriptor} from '../domain/descriptors';

export function Entity<T extends EntityDescriptor>(entityDescriptor: T): ClassDecorator {
  return function (constructor: any) {
    console.log(constructor);
        entitiesList.push(entityDescriptor);
    };
}
