import {InjectionToken, Injector, Type} from '@angular/core';
import {NgRedux} from '@angular-redux/store';
import {EntityDescriptor, PropertyDescriptor} from '../descriptors';
import {NgFluxifyModule} from '../ng-fluxify.module';
import {IDataService, NgReduxService} from '../services';
import {isObject} from "rxjs/internal-compatibility";

export function Entity<T extends EntityDescriptor<K>, K extends Object>(entityDescriptor: T) {
  return function (target) {
    const entityModel = getModel(target);

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
        const injector = Injector.create({
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

        entityModel.injector = injector;
      } else {
        setTimeout(() => {
          initialize();
        }, 1);
      }
    }

    initialize();
  };
}

export type EntityConstructor<T extends Object> = Type<T> & { _entityModel: EntityModel<T> };
export type EntityType<T extends Object> = T & { constructor: EntityConstructor<T>, _entityData: EntityData<T> };

export class EntityModel<T extends Object> {
  private static _models = new Map<any, EntityModel<any>>();

  public static getModel<K extends EntityType<any>>(_entityConstructor: Type<K>): EntityModel<K> {
    if (!this.hasModel(_entityConstructor)) {
      this._models.set(_entityConstructor, new EntityModel(_entityConstructor));
    }

    return this._models.get(_entityConstructor);
  }

  public static hasModel<K>(_entityConstructor: Type<K>): boolean {
    return this._models.has(_entityConstructor);
  }

  private _properties = new Map<string, PropertyDescriptor>();
  private _computedProperties: Map<string, PropertyDescriptor>;
  private _injector: Injector;

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

  public set injector(injector: Injector) {
    if (!this._injector) {
      this._injector = injector;
    }
  }

  public get injector(): Injector {
    return this._injector;
  }

  public addProperty(key: string, descriptor: PropertyDescriptor) {
    this._properties.set(key, Object.seal(descriptor));
  }

  public instanciateData(): EntityData<T> {
    const model = this;

    return {
      get primary(): string {
        const primaryKey: [string, PropertyDescriptor][] = model.primaryKey;
        if (!primaryKey || primaryKey.length === 0) {
          return;
        }

        if (primaryKey.length === 1) {
          return this[primaryKey[0][0]];
        }

        const keys = primaryKey.map(value => JSON.stringify(this[value[0]]));
        return `<${keys.toString()}>`;
      }
    }
  }
}

export interface EntityData<T> {
  primary: any;

  [key: string]: any;
}

export function getModel<T extends Object>(entity: EntityType<T>): EntityModel<T>;
export function getModel<T extends Object>(entity: EntityConstructor<T>): EntityModel<T>;
export function getModel<T extends Object>(entity: EntityType<T> | EntityConstructor<T>): EntityModel<T> {
  // @ts-ignore
  const constructor: EntityConstructor<T> = isObject(entity) ? entity.constructor : entity;

  if (!constructor._entityModel) {
    constructor._entityModel = EntityModel.getModel<T>(constructor);
  }

  return constructor._entityModel;
}

export function getData<T extends EntityType<K>, K extends Object>(entity: T): EntityData<K> {
  if (!entity._entityData) {
    entity._entityData = getModel(entity).instanciateData();
  }

  return entity._entityData;
}
