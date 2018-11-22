import {PropertyDescriptor} from '../domain/descriptors';

export function EntityProperty<T extends PropertyDescriptor>(propertyDescriptor: T): PropertyDecorator {
  return function (target: any, propName: string) {
    target.constructor.properties.set(propName, propertyDescriptor);

    Object.defineProperty(target, propName, {
      configurable: true,
      enumerable: true,
      writable: true
    });
  };
}
