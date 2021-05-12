import {Type} from "@angular/core";
import {EntityConstructor, getModel} from "./entity.decorator";

export function InjectManager<T extends Object>(entityType: Type<T>): PropertyDecorator {
  return function (target: Object, propName: string) {
    if (Reflect.deleteProperty(target, propName)) {
      const getter = function () {
        return getModel(entityType as EntityConstructor<T>).injector.get(entityType);
      };

      Reflect.defineProperty(target, propName, {
        configurable: false,
        enumerable: false,
        get: getter
      });
    }
  };
}
