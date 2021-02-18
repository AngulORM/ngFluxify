import {InjectionToken, Injector, Type} from '@angular/core';
import {NgRedux} from '@angular-redux/store';
import {isObject} from "rxjs/internal-compatibility";
import {EntityDescriptor, ParsingStrategy, PropertyDescriptor} from '../descriptors';
import {NgFluxifyModule} from '../ng-fluxify.module';
import {IDataService, NgReduxService} from '../services';

export function Entity<T extends EntityDescriptor<K>, K>(entityDescriptor: T) {
  return function (target) {
    const entityModel = EntityModel.getModel(target);

    if (!entityModel.primaryKey || entityModel.primaryKey.length === 0) {
      throw new Error(`Entity ${entityDescriptor.name} has no primary key`);
    }

    if (!entityDescriptor.serviceType) {
      throw new Error(`Entity ${entityDescriptor.name} has no service`);
    }

    entityDescriptor.class = target;

    const descriptorToken = new InjectionToken<T>(`${entityDescriptor.name} descriptor token`);
    const serviceToken = new InjectionToken<IDataService<K>>(`${entityDescriptor.name} service token`);

    const initialize = () => {
      if (NgFluxifyModule.ready) {
        // @ts-ignore
        NgFluxifyModule.injector.hydrate('descriptorToken', entityDescriptor);

        Injector.create({
          parent: NgFluxifyModule.injector,
          providers: [
            {provide: descriptorToken, useValue: entityDescriptor},
            {
              provide: serviceToken,
              useClass: entityDescriptor.serviceType,
              deps: [descriptorToken, ...(entityDescriptor.serviceDeps || [])]
            },
            {
              provide: target,
              useClass: entityDescriptor.managerType,
              deps: [descriptorToken, serviceToken, NgReduxService, NgRedux]
            },
          ]

        });
      } else {
        setTimeout(() => {
          initialize();
        }, 50);
      }
    }

    initialize();
  };
}

export class EntityModel<T> {
  private static _models = new Map<any, EntityModel<any>>();

  public static getModel<K>(_entityConstructor: Type<K>): EntityModel<K> {
    if (!this.hasModel(_entityConstructor)) {
      this._models.set(_entityConstructor, new EntityModel(_entityConstructor));
    }

    return this._models.get(_entityConstructor);
  }

  public static hasModel<K>(_entityConstructor: Type<K>): boolean {
    return this._models.has(_entityConstructor);
  }

  private _entitiesData = new Map<any, EntityData<T>>();
  private _properties = new Map<string, PropertyDescriptor>();
  private _computedProperties: Map<string, PropertyDescriptor>;

  constructor(private _entityConstructor: Type<T>) {
  }

  public get properties(): Map<string, PropertyDescriptor> {
    if (!this._computedProperties) {
      const parent = Object.getPrototypeOf(this._entityConstructor);
      if (EntityModel.hasModel(parent)) {
        const thisProperties = this._properties;
        const parentProperties = EntityModel.getModel(parent).properties;

        this._computedProperties = new Map([...parentProperties, ...thisProperties]);
      } else {
        this._computedProperties = this._properties;
      }
    }

    return this._computedProperties;
  }

  public get primaryKey(): [string, PropertyDescriptor][] {
    return Array.from(this.properties.entries()).filter(property => property[1].primary);
  }

  public addProperty(key: string, descriptor: PropertyDescriptor) {
    this._properties.set(key, descriptor);
  }

  public primary(entity: T): any {
    const primaryKey: [string, PropertyDescriptor][] = this.primaryKey;
    if (!primaryKey || primaryKey.length === 0) {
      return;
    }

    if (primaryKey.length === 1) {
      return entity[primaryKey[0][0]];
    }

    const keys = primaryKey.map(value => JSON.stringify(entity[value[0]]));
    return `<${keys.toString()}>`;
  }

  public data(entity: T): EntityData<T> {
    if (!this._entitiesData.has(entity)) {
      this._entitiesData.set(entity, new EntityData<T>(this));
    }

    return this._entitiesData.get(entity);
  }
}

export class EntityData<T> {
  constructor(private _entityModel: EntityModel<T>) {
  }

  public get sanitized(): any {
    const sanitizeValue = val => {
      if (val) {
        if (Array.isArray(val)) {
          return val.map(el => sanitizeValue(el));
        } else if (isObject(val) && EntityModel.hasModel(val.constructor)) {
          return EntityModel.getModel(val.constructor).data(val).sanitized;
        }
      }

      return val;
    };

    const sanitized = {};
    this._entityModel.properties.forEach((value: PropertyDescriptor, key: string) => {
      if (value.parsingStrategy === ParsingStrategy.IGNORE_DATASOURCE || value.parsingStrategy === ParsingStrategy.IGNORE_SET_TO_DATASOURCE) {
        return;
      }

      sanitized[value.label ? value.label : key] = sanitizeValue(this[key]);
    });

    return sanitized;
  }
}
