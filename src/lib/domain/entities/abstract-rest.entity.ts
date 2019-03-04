import {AbstractEntity} from './abstract.entity';
import {EntityManager} from '../api';
import {RestService} from '../../services';

// @dynamic
export abstract class AbstractRestEntity extends AbstractEntity {
  public static entityManager: EntityManager<AbstractRestEntity>;
  public static entityService: RestService<AbstractRestEntity>;
}
