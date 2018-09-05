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

  public abstract create(): void;

  public abstract read(): void;

  public abstract save(): void;

  public abstract remove(): void;
}
