import {EntityManager} from '../api';
import {PropertyDescriptor} from '../descriptors';
import {IEntityService} from '../../services';
import {Observable} from 'rxjs';
import {isObject} from 'rxjs/internal-compatibility';

// @dynamic
export abstract class AbstractEntity {
  public static entityManager: EntityManager<AbstractEntity>;
  public static entityService: IEntityService<AbstractEntity>;

  private static _properties: Map<any, Map<string, PropertyDescriptor>> = new Map<any, Map<string, PropertyDescriptor>>();

  public static get properties(): Map<string, PropertyDescriptor> {
    let thisProperties = AbstractEntity._properties.get(this);
    if (!thisProperties) {
      thisProperties = new Map<string, PropertyDescriptor>();
    }

    if (this !== AbstractEntity) {
      const parentProperties = Object.getPrototypeOf(this).properties;
      return new Map(function* () {
        yield* parentProperties;
        // @ts-ignore
        yield* thisProperties;
      }());
    }

    return thisProperties;
  }

  public static get primaryKey(): [string, PropertyDescriptor] {
    return Array.from(this.properties.entries()).find(property => property[1].primary);
  }

  public static addProperty(prototype: any, key: string, descriptor: PropertyDescriptor) {
    if (!AbstractEntity._properties.has(prototype)) {
      AbstractEntity._properties.set(prototype, new Map<string, PropertyDescriptor>());
    }

    AbstractEntity._properties.get(prototype).set(key, descriptor);
  }

  public get primary(): any {
    const primaryKey: [string, PropertyDescriptor] = this.constructor['primaryKey'];
    if (!primaryKey) {
      return;
    }

    return this[primaryKey[0]];
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
      sanitized[value.label ? value.label : key] = sanitizeValue(this[key]);
    });

    return sanitized;
  }

  public static read<T extends AbstractEntity = AbstractEntity>(id: any): Observable<T> {
    return <Observable<T>>this.entityManager.getById(id);
  }

  public static readAll<T extends AbstractEntity = AbstractEntity>(): Observable<T[]> {
    return <Observable<T[]>>this.entityManager.getAll();
  }

  public static get count(): Observable<number> {
    return this.entityManager.count;
  }

  public read(): void {
    return this.constructor['read'](this.primary);
  }

  public save<T extends AbstractEntity = AbstractEntity>(): Promise<Observable<T>> {
    return this.constructor['entityManager'].save(this);
  }

  public delete(): Promise<number> {
    return this.constructor['entityManager'].delete(this);
  }
}
