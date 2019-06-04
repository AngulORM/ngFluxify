import {EntityManager} from '../api';
import {PropertyDescriptor} from '../descriptors';
import {IEntityService} from '../../services';
import {Observable} from 'rxjs';
import {EntityProperty} from '../../decorators';

// @dynamic
export abstract class AbstractEntity {
  // @ts-ignore
  public static entityManager: EntityManager<this>;
  // @ts-ignore
  public static entityService: IEntityService<this>;

  private static _properties: Map<any, Map<string, PropertyDescriptor>> = new Map<any, Map<string, PropertyDescriptor>>();

  @EntityProperty({type: Number})
  public id: number;

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

  public static addProperty(prototype: any, key: string, descriptor: PropertyDescriptor) {
    if (!AbstractEntity._properties.has(prototype)) {
      AbstractEntity._properties.set(prototype, new Map<string, PropertyDescriptor>());
    }

    AbstractEntity._properties.get(prototype).set(key, descriptor);
  }

  public get sanitized(): any {
    const sanitized = {};

    this.constructor['properties'].forEach((value, key) => {
      sanitized[key] = this[key];
    });

    return sanitized;
  }

  public static read<T extends AbstractEntity = AbstractEntity>(id: number): Observable<T> {
    return this.entityManager.getById(id);
  }

  public static readAll<T extends AbstractEntity = AbstractEntity>(): Observable<T[]> {
    return this.entityManager.getAll();
  }

  public static get count(): Observable<number> {
    return this.entityManager.count;
  }

  public read(): void {
    return this.constructor['read'](this.id);
  }

  public save<T extends AbstractEntity = AbstractEntity>(): Promise<Observable<T>> {
    return this.constructor['entityManager'].save(this);
  }

  public delete(): Promise<number> {
    return this.constructor['entityManager'].delete(this);
  }
}
