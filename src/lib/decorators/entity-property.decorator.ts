import {ParsingStrategy, PropertyDescriptor} from '../domain/descriptors';

export function EntityProperty<T extends PropertyDescriptor>(propertyDescriptor: T): PropertyDecorator {
  return function (target: any, propName: string) {
    if (!propertyDescriptor.parsingStrategy) {
      propertyDescriptor.parsingStrategy = ParsingStrategy.DEFAULT;
    }

    target.constructor.addProperty(target.constructor, propName, propertyDescriptor);

    const value = Reflect.get(target, propName);
    const enumerable = Reflect.getOwnPropertyDescriptor(target, propName) ? Reflect.getOwnPropertyDescriptor(target, propName).enumerable : false;

    if (Reflect.deleteProperty(target, propName)) {
      Reflect.defineProperty(target, `_${propName}`, {
        configurable: false,
        enumerable: enumerable,
        writable: true,
        value: value
      });

      const getter = function () {
        return Reflect.get(this, `_${propName}`);
      };

      const setter = function (newVal) {
        const create = (val) => {
          try {
            propertyDescriptor.type.prototype.valueOf();
            return propertyDescriptor.type(val);
          } catch {
            try {
              return new propertyDescriptor.type(val);
            } catch (e) {
              // @ts-ignore
              return propertyDescriptor.type(val);
            }
          }
        };

        if (newVal) {
          if (propertyDescriptor.enumerable) {
            if (Array.isArray(newVal)) {
              newVal = newVal.map(el => create(el));
            } else {
              newVal = [];
            }
          } else {
            newVal = create(newVal);
          }
        }

        Reflect.set(this, `_${propName}`, newVal);
      };

      Reflect.defineProperty(target, propName, {
        enumerable: enumerable,
        configurable: false,
        get: getter,
        set: setter
      });
    }
  };
}
