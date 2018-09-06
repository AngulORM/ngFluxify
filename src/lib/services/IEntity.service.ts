import {AbstractEntity} from '../domain/entities';

export interface IEntityService<T extends AbstractEntity> {
  read(id: number): Promise<any>;

  readAll(): Promise<any>;

  create(entity: T): Promise<any>;

  update(entity: T): Promise<any>;

  delete(id: number): Promise<any>;
}
