import {Observable} from 'rxjs';
import {EntityData} from "../../decorators";

export interface IDataService<T extends Object> {
  read(id: any): Promise<any> | Observable<any>;

  readAll(): Promise<any> | Observable<any>;

  create(entity: EntityData<T>): Promise<any>;

  update(entity: EntityData<T>): Promise<any>;

  delete(id: any): Promise<any>;
}
