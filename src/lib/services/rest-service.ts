import {AbstractRestEntity} from '../domain/entities';
import {IEntityService} from './IEntity.service';
import {RestEntityDescriptor} from '../domain/descriptors';
import {HttpClient} from '@angular/common/http';
import {AngularRestModule} from '../angular-rest.module';

export class RestService<T extends AbstractRestEntity> implements IEntityService<T> {
  constructor(protected entityDescriptor: RestEntityDescriptor) {

  }

  get httpClient(): HttpClient {
    return AngularRestModule.injector.get(HttpClient);
  }

  public async read(id: number) {
    return this.httpClient.get(`${this.entityDescriptor.route}/${id}`).toPromise();
  }

  public async readAll() {
    return this.httpClient.get(this.entityDescriptor.route).toPromise();
  }

  public async create(entity: T) {
    return this.httpClient.post(this.entityDescriptor.route, entity).toPromise();
  }

  public async update(entity: T) {
    return this.httpClient.put(`${this.entityDescriptor.route}/${entity.id}`, entity).toPromise();
  }

  public async delete(id: number) {
    return this.httpClient.delete(`${this.entityDescriptor.route}/${id}`).toPromise();
  }
}
