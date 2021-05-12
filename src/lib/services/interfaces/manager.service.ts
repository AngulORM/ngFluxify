import {Observable} from "rxjs";
import {EntityType} from "../../decorators";

export interface IManagerService<T extends Object> {
  read(id: any): Observable<EntityType<T>>;

  readAll(): Observable<EntityType<T>[]>;

  save(entity: T): Promise<Observable<EntityType<T>>>;

  delete(entity: T): Promise<any>;
}
