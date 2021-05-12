import {HttpClient} from '@angular/common/http';
import {Injectable} from "@angular/core";
import {IDataService} from '../interfaces';
import {ParsingStrategy, PropertyDescriptor, RestEntityDescriptor} from '../../descriptors';
import {EntityData, EntityModel} from "../../decorators";

@Injectable()
export class RestService<T extends Object> implements IDataService<T> {
  constructor(protected entityDescriptor: RestEntityDescriptor<T>, protected httpClient: HttpClient) {

  }

  public async read(id: any): Promise<any> {
    return this.httpClient.get(`${this.entityDescriptor.route}/${id}`).toPromise();
  }

  public async readAll() {
    return this.httpClient.get(this.entityDescriptor.route).toPromise();
  }

  public async create(entity: EntityData<T>) {
    return this.httpClient.post(this.entityDescriptor.route, this.sanitize(entity)).toPromise();
  }

  public async update(entity: EntityData<T>) {
    return this.httpClient.put(`${this.entityDescriptor.route}/${entity.primary}`, this.sanitize(entity)).toPromise();
  }

  public async delete(id: any): Promise<any> {
    return this.httpClient.delete(`${this.entityDescriptor.route}/${id}`).toPromise();
  }

  protected get entityModel(): EntityModel<T> {
    return EntityModel.getModel<T>(this.entityDescriptor.class);
  }

  protected sanitize(data: EntityData<T>): any {
    const sanitized = {};
    this.entityModel.properties.forEach((value: PropertyDescriptor, key: string) => {
      if (value.parsingStrategy === ParsingStrategy.IGNORE_DATASOURCE || value.parsingStrategy === ParsingStrategy.IGNORE_SET_TO_DATASOURCE) {
        return;
      }

      sanitized[value.label ? value.label : key] = data[key]
    });

    return sanitized;
  }
}
