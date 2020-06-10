import {map} from 'rxjs/operators';
import {AssociationDescriptor} from '../domain/descriptors';
import {AbstractEntity} from '../domain/entities';

/**
 * @Preview
 * @Experimental
 */
export function OneToMany<T extends AssociationDescriptor>(associationDescriptor: T): PropertyDecorator {
  return function (target: any, propName: string) {
    const getter = function () {
      const primaryKeyValue = Reflect.get(this, associationDescriptor.primaryKey || 'primary');

      return associationDescriptor.entity
        // @ts-ignore
        .readAll()
        .pipe(map((entities: AbstractEntity[]) => entities.filter(entity => Reflect.get(entity, associationDescriptor.foreignKey) === primaryKeyValue)));
    };

    if (Reflect.deleteProperty(target, propName)) {
      Reflect.defineProperty(target, propName, {
        enumerable: false,
        configurable: false,
        get: getter
      });
    }
  };
}



