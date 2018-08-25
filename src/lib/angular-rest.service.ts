import { Injectable } from '@angular/core';
import { RestEntity } from './domain/api/rest-entity';
import { NgRedux } from '../../node_modules/@angular-redux/store';
import { IAppState } from './stores/root.store';
import { RestEntityManager } from './domain/api/rest-entity-manager';
import { AbstractEntity } from './domain/entities/abstract.entity';

@Injectable({
  providedIn: 'root'
})
export class AngularRestService {
  protected path: string;
  protected resource: RestEntity;

  constructor(private ngRedux: NgRedux<IAppState>) {}

  getManager(entityName: any): RestEntityManager<AbstractEntity> {
    console.log(entityName.name);
    return this.ngRedux.getState()[entityName.name].get('manager');
  }
}
