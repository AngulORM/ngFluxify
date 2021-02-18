import {Observable} from "rxjs";

export interface IManagerService<T extends Object> {
  read(id: any): Observable<T>;

  readAll(): Observable<T[]>;

  save(entity: T): Promise<Observable<T>>;

  delete(entity: T): Promise<any>;
}
