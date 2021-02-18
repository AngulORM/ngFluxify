import {filter, map, switchMap} from 'rxjs/operators';
import {Observable, of} from "rxjs";
import {Type} from "@angular/core";

import {AssociationDescriptor} from '../descriptors';
import {NgFluxifyModule} from "../ng-fluxify.module";

/**
 * @Preview
 * @Experimental
 */
export function ManyToOne<T extends AssociationDescriptor>(associationDescriptor: T): PropertyDecorator {
  return function (target: any, propName: string) {
    const getter = function () {
      const foreignKeyValue = (entity: any) => entity[associationDescriptor.foreignKey];

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

      return (this.primary ? this.read() : of(this))
        .pipe(filter(val => !!val))
        .pipe(map(foreignKeyValue))
        .pipe(filter(foreignKey => !!foreignKey))
        .pipe(switchMap((foreignKey: any): Observable<any> => {
          // @ts-ignore
          return associationDescriptor.entity.read(foreignKey);
        }))
        .pipe(filter(element => !!element));
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



