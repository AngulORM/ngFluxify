import {AbstractRestEntity} from '../domain/entities';
import {IEntityService} from './IEntity.service';
import {RestEntityDescriptor} from '../domain/descriptors';
import {HttpClient} from '@angular/common/http';

export class RestService<T extends AbstractRestEntity> implements IEntityService<T> {
  constructor(protected entityDescriptor: RestEntityDescriptor<T>, protected httpClient: HttpClient) {

  }

  public async read(id: any): Promise<any> {
    return this.httpClient.get(`${this.entityDescriptor.route}/${id}`).toPromise();
  }

  public async readAll() {
    return this.httpClient.get(this.entityDescriptor.route).toPromise();
  }

  public async create(entity: T) {
    return this.httpClient.post(this.entityDescriptor.route, entity.sanitized).toPromise();
  }

  public async update(entity: T) {
    return this.httpClient.put(`${this.entityDescriptor.route}/${entity.primary}`, entity.sanitized).toPromise();
  }

  public async delete(id: any): Promise<any> {
    return this.httpClient.delete(`${this.entityDescriptor.route}/${id}`).toPromise();
  }
}
