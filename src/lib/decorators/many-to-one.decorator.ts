import {filter, map, switchMap} from 'rxjs/operators';
import {Observable, of} from "rxjs";
import {Type} from "@angular/core";
import {isFunction} from "util";

import {AssociationDescriptor} from '../domain/descriptors';
import {AbstractEntity} from '../domain/entities';
import {NgFluxifyModule} from "../ng-fluxify.module";

/**
 * @Preview
 * @Experimental
 */
export function ManyToOne<T extends AssociationDescriptor>(associationDescriptor: T): PropertyDecorator {
  return function (target: any, propName: string) {
    const obs$ = new Map<any, Observable<AbstractEntity>>();

    const getter = function () {
      const foreignKeyValue = (entity: AbstractEntity) => entity[associationDescriptor.foreignKey];

      if (typeof associationDescriptor.entity === 'string') {
        const entityDescriptor = NgFluxifyModule.ngReduxService.entities.find(descriptor => descriptor.name === associationDescriptor.entity);

        if (!entityDescriptor) {
          throw Error(`Entity ${associationDescriptor.entity} not found`);
        }

        associationDescriptor.entity = entityDescriptor.class;
      }

      // @ts-ignore
      if (isFunction(associationDescriptor.entity) && !associationDescriptor.entity.prototype) {
        associationDescriptor.entity = (associationDescriptor.entity as (() => Type<AbstractEntity>))();
      }

      return (this.primary ? this.read() : of(this))
        .pipe(filter(val => !!val))
        .pipe(map(foreignKeyValue))
        .pipe(filter(foreignKey => !!foreignKey))
        .pipe(switchMap((foreignKey: any): Observable<AbstractEntity> => {
          if (!obs$.has(foreignKey)) {
            // @ts-ignore
            obs$.set(foreignKey, associationDescriptor.entity.read(foreignKey));
          }

          return obs$.get(foreignKey);
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



