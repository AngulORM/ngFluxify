import {AnyAction} from 'redux';
import {AbstractReducer} from '../abstract.reducer';
import {AbstractEntity} from '../../domain/entities';
import {EntityDescriptor, ParsingStrategy, PropertyDescriptor} from '../../domain/descriptors';
import {NgFluxifyConfig} from '../../services/ng-fluxify-config.service';

export class DumbReducer<T extends AbstractEntity> extends AbstractReducer<T> {
  private proxyAvailables: boolean;

  constructor(entityDescriptor: EntityDescriptor<T>, ngFluxifyConfig: NgFluxifyConfig) {
    super(entityDescriptor, ngFluxifyConfig);

    try {
      const proxyTest = new Proxy({}, {});
      this.proxyAvailables = (proxyTest instanceof Object);
    } catch (_) {
      this.proxyAvailables = false;
    }
  }

  protected create(action: AnyAction): T | T[] {
    if (Array.isArray(action.data)) {
      return action.data.map(element => this.instanciateEntity(element));
    } else {
      return this.instanciateEntity(action.data);
    }
  }

  protected read(action: AnyAction): T | T[] {
    if (Array.isArray(action.data)) {
      this.setCompleted = true;
      return action.data.map(element => this.instanciateEntity(element));
    } else {
      return this.instanciateEntity(action.data);
    }
  }

  protected update(action: AnyAction): T | T[] {
    if (Array.isArray(action.data)) {
      return action.data.map(element => this.instanciateEntity(element));
    } else {
      return this.instanciateEntity(action.data);
    }
  }

  protected delete(action: AnyAction): any | any[] {
    return action.data;
  }

  private instanciateEntity(jsonObject: any): T {
    if (!jsonObject) {
      return null;
    }

    const entity: T = new this.entityDescriptor.class();

    if (this.proxyAvailables && this.ngFluxifyConfig.enableJITEntityParsing) {
      const primaryKey: [string, PropertyDescriptor][] = this.entityDescriptor.class.primaryKey;
      primaryKey.forEach(key => {
        this.parseProperty(entity, jsonObject, key[1], key[0]);
      });

      let isParsed: boolean;
      const handler = {
        get: (target: T, key: PropertyKey) => {
          if (!isParsed && primaryKey.every(pKey => pKey[0] !== key)) {
            this.parse(entity, jsonObject);
            isParsed = true;
          }

          return target[key];
        },
        set: (target: T, p: PropertyKey, value: any): boolean => {
          if (!isParsed) {
            this.parse(entity, jsonObject);
            isParsed = true;
          }

          try {
            target[p] = value;
            return true;
          } catch {
            return false;
          }
        }
      };
      return new Proxy(entity, handler);
    }

    this.parse(entity, jsonObject);
    return entity;
  }

  private parse(entity: T, jsonObject: any) {
    const properties: Map<string, PropertyDescriptor> = this.entityDescriptor.class.properties;

    properties.forEach((value, key) => {
      this.parseProperty(entity, jsonObject, value, key);
    });
  }

  private parseProperty(entity: T, jsonObject: any, value: PropertyDescriptor, key: string) {
    if (value.parsingStrategy === ParsingStrategy.IGNORE_DATASOURCE || value.parsingStrategy === ParsingStrategy.IGNORE_GET_FROM_DATASOURCE) {
      return;
    }

    const label = value.label || key;
    if (label in jsonObject) {
      entity[key] = jsonObject[label];
    }
  }
}
