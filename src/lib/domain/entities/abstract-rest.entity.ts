import {AbstractEntity} from './abstract.entity';
import {EntityManager} from '../api/entity-manager';
import {RestService} from '../../services';

export abstract class AbstractRestEntity extends AbstractEntity {
  public static entityManager: EntityManager<AbstractRestEntity>;
  public static entityService: RestService<AbstractRestEntity>;
}
