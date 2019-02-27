import {EntityManager} from '../api';
import {PropertyDescriptor} from '../descriptors';
import {IEntityService} from '../../services';
import {Observable} from 'rxjs';
import {EntityProperty} from '../../decorators';

export abstract class AbstractEntity {
  public static entityManager: EntityManager<AbstractEntity>;
  public static entityService: IEntityService<AbstractEntity>;
  @EntityProperty({type: Number})
  public id;

  private static _properties: Map<any, Map<string, PropertyDescriptor>> = new Map<any, Map<string, PropertyDescriptor>>();

  public static get properties(): Map<string, PropertyDescriptor> {
    let thisProperties = AbstractEntity._properties.get(this);
    if (!thisProperties) {
      thisProperties = new Map<string, PropertyDescriptor>();
    }

    if (this !== AbstractEntity) {
      const parentProperties = Object.getPrototypeOf(this).properties;
      // @ts-ignore
      return new Map(function* () {
        yield* parentProperties;
        yield* thisProperties;
      }());
    }

    return thisProperties;
  }

  public get sanitized(): any {
    const sanitized = {};

    this.constructor['properties'].forEach((value, key) => {
      sanitized[key] = this[key];
    });

    return sanitized;
  }

  public static read(id: number): Observable<AbstractEntity> {
    return this.entityManager.getById(id);
  }

  public static readAll(): Observable<AbstractEntity[]> {
    return this.entityManager.getAll();
  }

  public static get count(): Observable<number> {
    return this.entityManager.count;
  }

  public read(): void {
    return this.constructor['read'](this.id);
  }

  public save(): Promise<Observable<AbstractEntity>> {
    return this.constructor['entityManager'].save(this);
  }

  public delete(): Promise<number> {
    return this.constructor['entityManager'].delete(this);
  }

  public static addProperty(prototype: any, key: string, descriptor: PropertyDescriptor) {
    if (!AbstractEntity._properties.has(prototype)) {
      AbstractEntity._properties.set(prototype, new Map<string, PropertyDescriptor>());
    }

    AbstractEntity._properties.get(prototype).set(key, descriptor);
  }
}
