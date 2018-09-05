import {AbstractRestEntity} from '../domain/entities';
import {IEntityService} from './IEntity.service';

export class RestService<T extends AbstractRestEntity> implements IEntityService<T> {
  read(id: number) {
    console.log(id);
  }
}
