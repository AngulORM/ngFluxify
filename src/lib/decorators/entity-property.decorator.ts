import {ParsingStrategy, PropertyDescriptor} from '../descriptors';
import {EntityData, EntityModel, EntityType, getData, getModel} from "./entity.decorator";
import {Type} from "@angular/core";

const types = new Map<any, boolean>();

function createPrimitive(val: any, propertyDescriptor: PropertyDescriptor): any {
  try {
    return propertyDescriptor.type(val);
  } catch {
    return createNonPrimitive(val, propertyDescriptor);
  }
}

function createNonPrimitive(val: any, propertyDescriptor: PropertyDescriptor): any {
  try {
    return new propertyDescriptor.type(val);
  } catch {
    // @ts-ignore
    return propertyDescriptor.type(val);
  }
}

export function EntityProperty<T extends PropertyDescriptor>(propertyDescriptor: T): PropertyDecorator {
  if (!propertyDescriptor.parsingStrategy) {
    propertyDescriptor.parsingStrategy = ParsingStrategy.DEFAULT;
  }

  if (!types.has(propertyDescriptor.type)) {
    let isPrimitive = true;
    try {
      propertyDescriptor.type.prototype.valueOf();
    } catch {
      isPrimitive = false;
    } finally {
      types.set(propertyDescriptor.type, isPrimitive);
    }
  }

  return function <T extends EntityType<Object>>(target: T, propName: string) {
    const entityModel = getModel(target);
    const entityData = getData(target);

    entityModel.addProperty(propName, propertyDescriptor);

    const value = target[propName];
    const enumerable = Reflect.getOwnPropertyDescriptor(target, propName) ? Reflect.getOwnPropertyDescriptor(target, propName).enumerable : false;

    if (Reflect.deleteProperty(target, propName)) {
      Reflect.defineProperty(entityData, propName, {
        configurable: false,
        enumerable: enumerable,
        writable: true,
        value: value
      });

      const getter = function () {
        return getData(this)[propName];
      };

      const create = types.get(propertyDescriptor.type) ? createPrimitive : createNonPrimitive;

      const setter = function (newVal) {
        if (newVal) {
          if (propertyDescriptor.enumerable) {
            if (Array.isArray(newVal)) {
              newVal = newVal.map(el => create(el, propertyDescriptor));
            } else {
              newVal = [];
            }
          } else {
            newVal = create(newVal, propertyDescriptor);
          }
        }

        getData(this)[propName] = newVal;
      };

      Reflect.defineProperty(target, propName, {
        enumerable: enumerable,
        configurable: true,
        get: getter,
        set: setter
      });
    }
  };
}
