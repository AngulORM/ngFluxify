import {EntityManager} from '../api/entity-manager';
import {IEntityService} from '../../services';
import {Observable} from 'rxjs';

export abstract class AbstractEntity {
  public static entityManager: EntityManager<AbstractEntity>;
  public static entityService: IEntityService<AbstractEntity>;

  public id = -1;

  public static read(id: number): Observable<AbstractEntity> {
    return this.entityManager.getById(id);
  }

  public static readAll(): Observable<AbstractEntity[]> {
    return this.entityManager.getAll();
  }

  public read(): void {

  }

  public save(): Observable<AbstractEntity> {
    return this.constructor.entityManager.save(this);
  }

  public remove(): void {

  }
}
