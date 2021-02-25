import {filter, map, switchMap} from 'rxjs/operators';
import {Observable, of} from "rxjs";
import {Type} from "@angular/core";

import {AssociationDescriptor} from '../domain/descriptors';
import {AbstractEntity} from '../domain/entities';
import {NgFluxifyModule} from "../ng-fluxify.module";

/**
 * @Preview
 * @Experimental
 */
export function ManyToOne<T extends AssociationDescriptor>(associationDescriptor: T): PropertyDecorator {
  return function (target: any, propName: string) {
    const obs$ = new Map<any, Observable<any>>();
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
      if (typeof associationDescriptor.entity === 'function' && !associationDescriptor.entity.prototype) {
        associationDescriptor.entity = (associationDescriptor.entity as (() => Type<AbstractEntity>))();
      }

      if (!this.primary || !obs$.has(this.primary)) {
        obs$.set(
          this.primary,
          (this.primary ? this.read() : of(this))
            .pipe(filter(val => !!val))
            .pipe(map(foreignKeyValue))
            .pipe(filter(foreignKey => !!foreignKey))
            .pipe(switchMap((foreignKey: any): Observable<any> => {
              // @ts-ignore
              return associationDescriptor.entity.read(foreignKey);
            }))
        );
      }

      return obs$.get(this.primary);
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



