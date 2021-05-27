import {filter, map, switchMap} from 'rxjs/operators';
import {Observable, of, ReplaySubject} from "rxjs";
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

      if (this.primary === null || this.primary === undefined || !obs$.has(this.primary)) {
        const subject = new ReplaySubject(1);

        (this.primary !== null && this.primary !== undefined ? this.read() : of(this)).pipe(
          filter(val => !!val),
          map(foreignKeyValue),
          filter(foreignKey => foreignKey !== null && foreignKey !== undefined),
          switchMap((foreignKey: any): Observable<any> => {
            // @ts-ignore
            return associationDescriptor.entity.read(foreignKey);
          })
        ).subscribe(subject);

        obs$.set(this.primary, subject.asObservable());
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



