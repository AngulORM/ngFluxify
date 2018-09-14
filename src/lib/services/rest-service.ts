import {AbstractRestEntity} from '../domain/entities';
import {IEntityService} from './IEntity.service';

export class RestService<T extends AbstractRestEntity> implements IEntityService<T> {
  public async read(id: number) {
    console.log(id);
  }

  public async readAll() {

  }

  public async create() {

  }

  public async update() {

  }

  public async delete() {

  }
}
