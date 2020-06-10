import {map} from 'rxjs/operators';
import {AssociationDescriptor} from '../domain/descriptors';
import {AbstractEntity} from '../domain/entities';
import {of} from 'rxjs';

/**
 * @Preview
 * @Experimental
 */
export function ManyToOne<T extends AssociationDescriptor>(associationDescriptor: T): PropertyDecorator {
  return function (target: any, propName: string) {
    const getter = function () {
      const foreignKeyValue = Reflect.get(this, associationDescriptor.foreignKey);

      // @ts-ignore
      if (!associationDescriptor.primaryKey || associationDescriptor.primaryKey === 'primary' || associationDescriptor.primaryKey === associationDescriptor.entity.primaryKey[0][0]) {
        if (foreignKeyValue) {
          // @ts-ignore
          return associationDescriptor.entity.read(foreignKeyValue);
        }
      } else {
        return associationDescriptor.entity
          // @ts-ignore
          .readAll()
          .pipe(map((entities: AbstractEntity[]) => entities.find(entity => Reflect.get(entity, associationDescriptor.primaryKey) === foreignKeyValue)));
      }

      return of(null);
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



