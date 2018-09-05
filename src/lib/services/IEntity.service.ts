import {AbstractEntity} from '../domain/entities';

export interface IEntityService<T extends AbstractEntity> {
  read(id: number);
}
