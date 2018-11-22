import {EntityManager} from '../api';
import {PropertyDescriptor} from '../descriptors';
import {IEntityService} from '../../services';
import {Observable} from 'rxjs';
import {EntityProperty} from '../../decorators';

export abstract class AbstractEntity {
  public static entityManager: EntityManager<AbstractEntity>;
  public static entityService: IEntityService<AbstractEntity>;
  public static properties: Map<string, PropertyDescriptor> = new Map<string, PropertyDescriptor>();

  @EntityProperty(new PropertyDescriptor(Number))
  public id = -1;

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
}
