import {Type} from "@angular/core";
import {combineLatest, interval, Observable, of} from "rxjs";
import {debounce, filter, map, switchMap} from "rxjs/operators";
import {NgFluxifyModule} from "../ng-fluxify.module";
import {ParsingStrategy, PropertyDescriptor} from '../descriptors';
import {AbstractReducer, ActionsManagerFactory} from "../stores";
import {EntityData, EntityModel} from "./entity.decorator";

/**
 * @Preview
 * @Experimental
 */
export function ExternalEntity<T extends PropertyDescriptor>(propertyDescriptor: T): PropertyDecorator {
  propertyDescriptor.parsingStrategy = ParsingStrategy.IGNORE_SET_TO_DATASOURCE;

  return function (target: any, propName: string) {
    if (!target.constructor["_model"]) {
      target.constructor["_model"] = EntityModel.getModel(target.constructor);
    }
    if (!target["_data"]) {
      target["_data"] = target["_model"].instanciateData();
    }

    const entityModel: EntityModel<any> = target.constructor["_model"];
    const entityData: EntityData<any> = target["_data"];

    entityModel.addProperty(propName, propertyDescriptor);

    let externalClass: Type<any>;

    function getExternalClass() {
      if (typeof propertyDescriptor.type === 'string') {
        const entityDescriptor = NgFluxifyModule.ngReduxService.entities.find(descriptor => descriptor.name === propertyDescriptor.type);

        if (!entityDescriptor) {
          throw Error(`Entity ${propertyDescriptor.type} not found`);
        }

        externalClass = entityDescriptor.class;
      } else if (typeof propertyDescriptor.type === 'function' && !propertyDescriptor.type.prototype) {
        externalClass = (propertyDescriptor.type as (() => Type<any>))();
      } else {
        externalClass = propertyDescriptor.type;
      }
    }

    if (Reflect.deleteProperty(target, propName)) {
      Reflect.defineProperty(entityData, propName, {
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
          .pipe(debounce(val => val[`_${propName}_promise`] || interval(0)))
          .pipe(map(val => val[`_${propName}`]))
          .pipe(switchMap((foreignKey: any | any[]): Observable<any | any[]> => {
            if (Array.isArray(foreignKey)) {
              if (foreignKey.length === 0) {
                return of([]);
              }

              return combineLatest(
                foreignKey.map(key => {
                  // @ts-ignore
                  return externalClass.read(key);
                })
              );
            } else if (!foreignKey) {
              return of(null);
            } else {
              // @ts-ignore
              return externalClass.read(foreignKey);
            }
          })
        );
      };

      const setter = function (newVal) {
        if (!externalClass) {
          getExternalClass();
        }

        if (newVal) {
          // @ts-ignore
          const actionManager = ActionsManagerFactory.getActionsManager(externalClass.entityManager.entityDescriptor.name);
          const action = actionManager.getResponseAction(AbstractReducer.ACTION_READ);
          this[`_${propName}_promise`] = NgFluxifyModule.dispatchQueue.enQueue({
            type: action,
            transactionId: null,
            data: newVal
          });

          if (propertyDescriptor.enumerable) {
            if (Array.isArray(newVal)) {
              entityData[propName] = newVal.map(el => guessPrimaryKey(el, externalClass));
            } else {
              entityData[propName] = [];
            }
          } else {
            entityData[propName] = guessPrimaryKey(newVal, externalClass);
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
  const primaryKey: [string, PropertyDescriptor][] = EntityModel.getModel(externalClass).primaryKey;
  if (!primaryKey || primaryKey.length === 0) {
    return;
  }

  if (primaryKey.length === 1) {
    return data[primaryKey[0][0]];
  }

  const keys = primaryKey.map(value => JSON.stringify(data[value[0]]));
  return `<${keys.toString()}>`;
}
