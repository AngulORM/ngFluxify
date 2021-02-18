import {filter, map} from 'rxjs/operators';
import {combineLatest} from "rxjs";
import {Type} from "@angular/core";
import {AssociationDescriptor} from '../descriptors';
import {NgFluxifyModule} from "../ng-fluxify.module";

/**
 * @Preview
 * @Experimental
 */
export function OneToMany<T extends AssociationDescriptor>(associationDescriptor: T): PropertyDecorator {
  return function (target: any, propName: string) {
    const getter = function () {
      const primaryKeyValue = (entity: any): any => entity[associationDescriptor.primaryKey || 'primary'];
      const foreignKeyValue = (entity: any): any => entity[associationDescriptor.foreignKey];

      if (typeof associationDescriptor.entity === 'string') {
        const entityDescriptor = NgFluxifyModule.ngReduxService.entities.find(descriptor => descriptor.name === associationDescriptor.entity);

        if (!entityDescriptor) {
          throw Error(`Entity ${associationDescriptor.entity} not found`);
        }

        associationDescriptor.entity = entityDescriptor.class;
      }

      // @ts-ignore
      if (typeof associationDescriptor.entity === 'function' && !associationDescriptor.entity.prototype) {
        associationDescriptor.entity = (associationDescriptor.entity as (() => Type<any>))();
      }

      // @ts-ignore
      return combineLatest([this.read().pipe(filter(val => !!val)), associationDescriptor.entity.readAll()])
        .pipe(map((values: [any, any[]]): any[] => {
          const primaryKey = primaryKeyValue(values[0]);
          return values[1].filter(entity => foreignKeyValue(entity) === primaryKey);
        }));
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



