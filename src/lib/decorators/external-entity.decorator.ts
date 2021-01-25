import {Type} from "@angular/core";
import {combineLatest, Observable, of} from "rxjs";
import {filter, map, switchMap} from "rxjs/operators";
import {NgFluxifyModule} from "../ng-fluxify.module";
import {AbstractEntity} from "../domain/entities";
import {ParsingStrategy, PropertyDescriptor} from '../domain/descriptors';
import {AbstractReducer, ActionsManagerFactory} from "../stores";

/**
 * @Preview
 * @Experimental
 */
export function ExternalEntity<T extends PropertyDescriptor>(propertyDescriptor: T): PropertyDecorator {
  return function (target: any, propName: string) {
    const obs$ = new Map<any, Observable<AbstractEntity>>();

    propertyDescriptor.parsingStrategy = ParsingStrategy.IGNORE_SET_TO_DATASOURCE;

    target.constructor.addProperty(target.constructor, propName, propertyDescriptor);

    let externalClass: Type<AbstractEntity>;

    function getExternalClass() {
      if (typeof propertyDescriptor.type === 'string') {
        const entityDescriptor = NgFluxifyModule.ngReduxService.entities.find(descriptor => descriptor.name === propertyDescriptor.type);

        if (!entityDescriptor) {
          throw Error(`Entity ${propertyDescriptor.type} not found`);
        }

        externalClass = entityDescriptor.class;
      } else if (typeof propertyDescriptor.type === 'function' && !propertyDescriptor.type.prototype) {
        externalClass = (propertyDescriptor.type as (() => Type<AbstractEntity>))();
      } else {
        externalClass = propertyDescriptor.type;
      }
    }

    if (Reflect.deleteProperty(target, propName)) {
      Reflect.defineProperty(target, `_${propName}`, {
        configurable: false,
        enumerable: propertyDescriptor.enumerable,
        writable: true,
        value: propertyDescriptor.enumerable ? [] : null
      });

      const getter = function () {
        if (!externalClass) {
          getExternalClass();
        }

        return (this.primary ? this.read() : of(this))
          .pipe(filter(val => !!val))
          .pipe(map(val => val[`_${propName}`]))
          .pipe(switchMap((foreignKey: any | any[]): Observable<AbstractEntity | AbstractEntity[]> => {
            if (Array.isArray(foreignKey)) {
              return combineLatest(
                foreignKey.map(key => {
                  if (!obs$.has(key)) {
                    // @ts-ignore
                    obs$.set(key, externalClass.read(key));
                  }

                  return obs$.get(key);
                })
              );
            } else if (!foreignKey) {
              return of(null);
            } else {
              if (!obs$.has(foreignKey)) {
                // @ts-ignore
                obs$.set(foreignKey, externalClass.read(foreignKey));
              }

              return obs$.get(foreignKey);
            }
          }));
      };

      const setter = function (newVal) {
        if (!externalClass) {
          getExternalClass();
        }

        if (newVal) {
          // @ts-ignore
          const actionManager = ActionsManagerFactory.getActionsManager(externalClass.entityManager.entityDescriptor.name);
          const action = actionManager.getResponseAction(AbstractReducer.ACTION_READ);
          NgFluxifyModule.dispatchQueue.enQueue({
            type: action,
            transactionId: null,
            data: newVal
          });

          if (propertyDescriptor.enumerable) {
            if (Array.isArray(newVal)) {
              this[`_${propName}`] = newVal.map(el => guessPrimaryKey(el, externalClass));
            } else {
              this[`_${propName}`] = [];
            }
          } else {
            this[`_${propName}`] = guessPrimaryKey(newVal, externalClass);
          }
        }
      };

      Reflect.defineProperty(target, propName, {
        enumerable: false,
        configurable: true,
        get: getter,
        set: setter
      });
    }
  };
}

function guessPrimaryKey(data: any, externalClass: any): any {
  const primaryKey: [string, PropertyDescriptor][] = externalClass['primaryKey'];
  if (!primaryKey || primaryKey.length === 0) {
    return;
  }

  if (primaryKey.length === 1) {
    return data[primaryKey[0][0]];
  }

  const keys = primaryKey.map(value => JSON.stringify(data[value[0]]));
  return `<${keys.toString()}>`;
}
