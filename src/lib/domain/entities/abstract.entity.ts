import {Observable} from 'rxjs';
import {isObject} from 'rxjs/internal-compatibility';
import {EntityManager} from '../api';
import {ParsingStrategy, PropertyDescriptor} from '../descriptors';
import {IEntityService} from '../../services/IEntity.service';

// @dynamic
export abstract class AbstractEntity {
  public static entityManager: EntityManager<AbstractEntity>;
  public static entityService: IEntityService<AbstractEntity>;

  private static _properties: Map<any, Map<string, PropertyDescriptor>> = new Map<any, Map<string, PropertyDescriptor>>();
  private static _computedProperties: Map<any, Map<string, PropertyDescriptor>> = new Map<any, Map<string, PropertyDescriptor>>();

  public static get properties(): Map<string, PropertyDescriptor> {
    if (!AbstractEntity._computedProperties.has(this)) {
      let thisProperties = AbstractEntity._properties.get(this);
      if (!thisProperties) {
        thisProperties = new Map<string, PropertyDescriptor>();
      }

      if (this !== AbstractEntity) {
        const parentProperties = Object.getPrototypeOf(this).properties;
        thisProperties = new Map(function* () {
          yield* parentProperties;
          // @ts-ignore
          yield* thisProperties;
        }());
      }

      AbstractEntity._computedProperties.set(this, thisProperties);
    }

    return AbstractEntity._computedProperties.get(this);
  }

  public static get primaryKey(): [string, PropertyDescriptor][] {
    return Array.from(this.properties.entries()).filter(property => property[1].primary);
  }

  public static addProperty(prototype: any, key: string, descriptor: PropertyDescriptor) {
    if (!AbstractEntity._properties.has(prototype)) {
      AbstractEntity._properties.set(prototype, new Map<string, PropertyDescriptor>());
    }

    AbstractEntity._properties.get(prototype).set(key, descriptor);
  }

  public get primary(): any {
    const primaryKey: [string, PropertyDescriptor][] = this.constructor['primaryKey'];
    if (!primaryKey || primaryKey.length === 0) {
      return;
    }

    if (primaryKey.length === 1) {
      return this[primaryKey[0][0]];
    }

    const keys = primaryKey.map(value => JSON.stringify(this[value[0]]));
    return `<${keys.toString()}>`;
  }

  public get sanitized(): any {
    const sanitizeValue = val => {
      if (val) {
        if (Array.isArray(val)) {
          return val.map(el => sanitizeValue(el));
        } else if (isObject(val) && 'sanitized' in val) {
          return val.sanitized;
        }
      }

      return val;
    };

    const sanitized = {};
    this.constructor['properties'].forEach((value: PropertyDescriptor, key: string) => {
      if (value.parsingStrategy === ParsingStrategy.IGNORE_DATASOURCE || value.parsingStrategy === ParsingStrategy.IGNORE_SET_TO_DATASOURCE) {
        return;
      }

      sanitized[value.label ? value.label : key] = sanitizeValue(this[`_${key}`]);
    });

    return sanitized;
  }

  static onPreRead(id: any) {
  }

  static onPostRead(id: any) {
  }

  static onPreReadAll() {
  }

  static onPostReadAll() {
  }

  static onPreSave(id: any) {
  }

  static onPostSave(id: any) {
  }

  static onPreDelete(id: any) {
  }

  static onPostDelete(id: any) {
  }

  public static read<T extends AbstractEntity>(id: any): Observable<T> {
    return <Observable<T>>this.entityManager.getById(id);
  }

  public static readAll<T extends AbstractEntity>(): Observable<T[]> {
    return <Observable<T[]>>this.entityManager.getAll();
  }

  public static get count(): Observable<number> {
    return this.entityManager.count;
  }

  public read<T extends AbstractEntity>(): Observable<T> {
    return this.constructor['read'](this.primary);
  }

  public save<T extends AbstractEntity>(): Promise<Observable<T>> {
    return <Promise<Observable<T>>>this.constructor['entityManager'].save(this);
  }

  public delete(): Promise<number> {
    return <Promise<number>>this.constructor['entityManager'].delete(this);
  }
}

export const trackByPrimary = (_, item: AbstractEntity) => item ? item.primary : null;
