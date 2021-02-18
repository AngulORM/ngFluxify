import {HttpClient} from '@angular/common/http';
import {Injectable} from "@angular/core";
import {IDataService} from '../interfaces';
import {RestEntityDescriptor} from '../../descriptors';
import {EntityModel} from "../../decorators";

@Injectable()
export class RestService<T> implements IDataService<T> {
  constructor(protected entityDescriptor: RestEntityDescriptor<T>, protected httpClient: HttpClient) {

  }

  public async read(id: any): Promise<any> {
    return this.httpClient.get(`${this.entityDescriptor.route}/${id}`).toPromise();
  }

  public async readAll() {
    return this.httpClient.get(this.entityDescriptor.route).toPromise();
  }

  public async create(entity: T) {
    return this.httpClient.post(this.entityDescriptor.route, this.entityModel.data(entity).sanitized).toPromise();
  }

  public async update(entity: T) {
    return this.httpClient.put(`${this.entityDescriptor.route}/${this.entityModel.primary(entity)}`, this.entityModel.data(entity).sanitized).toPromise();
  }

  public async delete(id: any): Promise<any> {
    return this.httpClient.delete(`${this.entityDescriptor.route}/${id}`).toPromise();
  }

  protected get entityModel(): EntityModel<T> {
    return EntityModel.getModel<T>(this.entityDescriptor.class);
  }
}
